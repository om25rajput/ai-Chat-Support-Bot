import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(),
  queryCount: integer("query_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  lastActivity: timestamp("last_activity").defaultNow(),
});

export const faqEntries = pgTable("faq_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull(),
  keywords: text("keywords").array(),
  usageCount: integer("usage_count").default(0),
  embedding: jsonb("embedding"),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  source: text("source").notNull(), // 'kb', 'gemini', 'system'
  responseTime: integer("response_time"), // in milliseconds
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  sessionId: true,
});

export const insertFaqEntrySchema = createInsertSchema(faqEntries).pick({
  question: true,
  answer: true,
  category: true,
  keywords: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  message: true,
  response: true,
  source: true,
  responseTime: true,
});

// Query schemas
export const chatQuerySchema = z.object({
  message: z.string().min(1).max(500),
  sessionId: z.string(),
});

export const faqSelectSchema = z.object({
  category: z.string(),
  questionId: z.string(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

export type InsertFaqEntry = z.infer<typeof insertFaqEntrySchema>;
export type FaqEntry = typeof faqEntries.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type ChatQuery = z.infer<typeof chatQuerySchema>;
export type FaqSelect = z.infer<typeof faqSelectSchema>;

// Chat response types
export interface ChatResponse {
  response: string;
  source: 'kb' | 'gemini' | 'system';
  responseTime: number;
  similarityScore?: number;
  kbEntryId?: string;
  rateLimitRemaining: number;
}

export interface FAQCategory {
  name: string;
  icon: string;
  count: number;
  questions: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}
