import { type User, type InsertUser, type ChatSession, type InsertChatSession, type FaqEntry, type InsertFaqEntry, type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";
import { faqData } from "./data/faqData";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chat sessions
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined>;
  
  // FAQ entries
  getAllFaqEntries(): Promise<FaqEntry[]>;
  getFaqEntriesByCategory(category: string): Promise<FaqEntry[]>;
  getFaqEntryById(id: string): Promise<FaqEntry | undefined>;
  createFaqEntry(entry: InsertFaqEntry): Promise<FaqEntry>;
  updateFaqEntryUsage(id: string): Promise<void>;
  
  // Chat messages
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatSessions: Map<string, ChatSession>;
  private faqEntries: Map<string, FaqEntry>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
    this.users = new Map();
    this.chatSessions = new Map();
    this.faqEntries = new Map();
    this.chatMessages = new Map();
    this.initializeFaqData();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    return Array.from(this.chatSessions.values()).find(
      (session) => session.sessionId === sessionId
    );
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = randomUUID();
    const session: ChatSession = {
      id,
      sessionId: insertSession.sessionId,
      queryCount: 0,
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    this.chatSessions.set(id, session);
    return session;
  }

  async updateChatSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession | undefined> {
    const session = await this.getChatSession(sessionId);
    if (session) {
      const updatedSession = { ...session, ...updates, lastActivity: new Date() };
      this.chatSessions.set(session.id, updatedSession);
      return updatedSession;
    }
    return undefined;
  }

  async getAllFaqEntries(): Promise<FaqEntry[]> {
    return Array.from(this.faqEntries.values());
  }

  async getFaqEntriesByCategory(category: string): Promise<FaqEntry[]> {
    return Array.from(this.faqEntries.values()).filter(
      (entry) => entry.category === category
    );
  }

  async getFaqEntryById(id: string): Promise<FaqEntry | undefined> {
    return this.faqEntries.get(id);
  }

  async createFaqEntry(insertEntry: InsertFaqEntry): Promise<FaqEntry> {
    const id = randomUUID();
    const entry: FaqEntry = {
      id,
      question: insertEntry.question,
      answer: insertEntry.answer,
      category: insertEntry.category,
      keywords: insertEntry.keywords || [],
      usageCount: 0,
      embedding: null,
    };
    this.faqEntries.set(id, entry);
    return entry;
  }

  async updateFaqEntryUsage(id: string): Promise<void> {
    const entry = this.faqEntries.get(id);
    if (entry) {
      entry.usageCount = (entry.usageCount || 0) + 1;
      this.faqEntries.set(id, entry);
    }
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      id,
      sessionId: insertMessage.sessionId,
      message: insertMessage.message,
      response: insertMessage.response,
      source: insertMessage.source,
      responseTime: insertMessage.responseTime || 0,
      timestamp: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).filter(
      (message) => message.sessionId === sessionId
    );
  }

  private initializeFaqData(): void {
    // Initialize with comprehensive 1000+ FAQ entries
    faqData.forEach((item, index) => {
      const id = `faq_${index + 1}`;
      const entry: FaqEntry = {
        id,
        question: item.question,
        answer: item.answer,
        category: item.category,
        keywords: item.keywords || [],
        usageCount: Math.floor(Math.random() * 20), // Random usage for testing
        embedding: null,
      };
      this.faqEntries.set(id, entry);
    });

    console.log(`✅ Initialized ${faqData.length} FAQ entries across ${new Set(faqData.map(f => f.category)).size} categories`);
  }
}

export const storage = new MemStorage();