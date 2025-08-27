import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateCustomerSupportResponse } from '../services/gemini.js';
import { ragService } from '../services/rag.js';
import { storage } from '../storage.js';

// Rate limiting storage (in production, use Redis or similar)
const sessionLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 25;
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

function checkRateLimit(sessionId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const session = sessionLimits.get(sessionId);
  
  if (!session || now > session.resetTime) {
    sessionLimits.set(sessionId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }
  
  if (session.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  session.count++;
  return { allowed: true, remaining: RATE_LIMIT - session.count };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ message: 'Message and sessionId are required' });
    }

    // Check rate limit
    const { allowed, remaining } = checkRateLimit(sessionId);
    if (!allowed) {
      return res.status(429).json({ 
        message: 'Rate limit exceeded. Please try again tomorrow.',
        rateLimitRemaining: 0
      });
    }

    // Update or create session
    let session = await storage.getChatSession(sessionId);
    if (!session) {
      session = await storage.createChatSession({ sessionId });
    }
    
    await storage.updateChatSession(sessionId, { 
      queryCount: (session.queryCount || 0) + 1 
    });

    const startTime = Date.now();
    const allEntries = await storage.getAllFaqEntries();

    // Try RAG system first
    const bestMatch = await ragService.findBestMatch(message, allEntries);
    let response;

    if (bestMatch && bestMatch.score > 0.7) {
      // High confidence match from knowledge base
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
}