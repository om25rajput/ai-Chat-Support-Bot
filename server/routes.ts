import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ragService } from "./services/rag";
import { generateCustomerSupportResponse } from "./services/gemini";
import { knowledgeBaseService } from "./services/knowledgeBase";
import { chatQuerySchema, faqSelectSchema, type ChatResponse } from "@shared/schema";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  const RATE_LIMIT = 25;
  const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

  // Middleware to check rate limits
  async function checkRateLimit(sessionId: string): Promise<{ allowed: boolean; remaining: number }> {
    let session = await storage.getChatSession(sessionId);
    
    if (!session) {
      session = await storage.createChatSession({ sessionId });
    }
    
    // Reset count if 24 hours have passed
    const now = new Date();
    const timeDiff = now.getTime() - (session.lastActivity?.getTime() || 0);
    
    if (timeDiff > RATE_LIMIT_WINDOW) {
      session = await storage.updateChatSession(sessionId, { queryCount: 0 }) || session;
    }
    
    const remaining = Math.max(0, RATE_LIMIT - (session.queryCount || 0));
    const allowed = (session.queryCount || 0) < RATE_LIMIT;
    
    return { allowed, remaining };
  }

  // Get FAQ categories
  app.get("/api/faq/categories", async (req, res) => {
    try {
      const categories = await knowledgeBaseService.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch FAQ categories" });
    }
  });

  // Get questions for a specific category
  app.get("/api/faq/category/:categoryName", async (req, res) => {
    try {
      const { categoryName } = req.params;
      const questions = await knowledgeBaseService.getCategoryQuestions(categoryName);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching category questions:", error);
      res.status(500).json({ message: "Failed to fetch category questions" });
    }
  });

  // Select a specific FAQ
  app.post("/api/faq/select", async (req, res) => {
    try {
      const { questionId } = faqSelectSchema.parse(req.body);
      
      const faq = await knowledgeBaseService.getFaqById(questionId);
      if (!faq) {
        return res.status(404).json({ message: "FAQ not found" });
      }

      // Update usage count
      await storage.updateFaqEntryUsage(questionId);
      
      const response: ChatResponse = {
        response: faq.answer,
        source: 'kb',
        responseTime: 50, // Instant response
        kbEntryId: questionId,
        rateLimitRemaining: RATE_LIMIT // FAQ selections don't count against rate limit
      };

      res.json(response);
    } catch (error) {
      console.error("Error selecting FAQ:", error);
      res.status(500).json({ message: "Failed to process FAQ selection" });
    }
  });

  // Chat query endpoint - main RAG + Gemini pipeline
  app.post("/api/chat/query", async (req, res) => {
    try {
      const { message, sessionId } = chatQuerySchema.parse(req.body);
      const startTime = Date.now();

      // Check rate limit
      const { allowed, remaining } = await checkRateLimit(sessionId);
      
      if (!allowed) {
        const response: ChatResponse = {
          response: "Daily free usage limit reached. Please try again tomorrow or contact customer care for immediate assistance.",
          source: 'system',
          responseTime: Date.now() - startTime,
          rateLimitRemaining: 0
        };
        return res.json(response);
      }

      // Update query count
      const session = await storage.getChatSession(sessionId);
      if (session) {
        await storage.updateChatSession(sessionId, { 
          queryCount: (session.queryCount || 0) + 1 
        });
      }

      // Step 1: Search knowledge base using RAG
      const allEntries = await storage.getAllFaqEntries();
      const bestMatch = await ragService.getBestMatch(message, allEntries);
      
      let response: ChatResponse;

      if (bestMatch && bestMatch.score >= 0.6) {
        // High confidence KB match - return directly
        await storage.updateFaqEntryUsage(bestMatch.entry.id);
        
        response = {
          response: bestMatch.entry.answer,
          source: 'kb',
          responseTime: Date.now() - startTime,
          similarityScore: bestMatch.score,
          kbEntryId: bestMatch.entry.id,
          rateLimitRemaining: remaining - 1
        };
      } else {
        // Low confidence or no match - use Gemini with KB context
        const topMatches = await ragService.getTopMatches(message, allEntries, 3);
        const kbContext = topMatches.map(match => ({
          question: match.entry.question,
          answer: match.entry.answer
        }));
        
        const geminiResponse = await generateCustomerSupportResponse(message, kbContext, sessionId);
        
        response = {
          response: geminiResponse.response,
          source: 'gemini',
          responseTime: geminiResponse.responseTime,
          similarityScore: bestMatch?.score,
          rateLimitRemaining: remaining - 1
        };
      }

      // Log the conversation
      await storage.createChatMessage({
        sessionId,
        message,
        response: response.response,
        source: response.source,
        responseTime: response.responseTime
      });

      res.json(response);
    } catch (error) {
      console.error("Error processing chat query:", error);
      res.status(500).json({ message: "Failed to process your query. Please try again." });
    }
  });

  // Get knowledge base statistics
  app.get("/api/kb/stats", async (req, res) => {
    try {
      const stats = await knowledgeBaseService.getKnowledgeBaseStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching KB stats:", error);
      res.status(500).json({ message: "Failed to fetch knowledge base statistics" });
    }
  });

  // Get chat history for a session
  app.get("/api/chat/history/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getChatMessagesBySession(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // Check session rate limit status
  app.get("/api/session/:sessionId/status", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { allowed, remaining } = await checkRateLimit(sessionId);
      res.json({ allowed, remaining, limit: RATE_LIMIT });
    } catch (error) {
      console.error("Error checking session status:", error);
      res.status(500).json({ message: "Failed to check session status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
