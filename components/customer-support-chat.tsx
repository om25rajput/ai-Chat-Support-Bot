"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Bot,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  CreditCard,
  RotateCcw,
  X,
  Crown,
  Truck,
  Paperclip,
  Trash2,
  User,
  Menu,
} from "lucide-react"
import { faqDatabase } from "@/lib/faq-database"
import { findMultipleSimilarFAQs } from "@/lib/rag-utils"

interface Message {
  id: string
  type: "user" | "bot"
  content: string
  timestamp: Date
  metadata?: {
    matchType?: "faq" | "ai" | "fallback"
    confidence?: number
    sources?: string[]
  }
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

// Helper to call Groq API and return response + headers
async function callGroqAPI(query: string, context: any[]) {
  const res = await fetch("/api/groq-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, context }),
  })
  let data: any = null
  try {
    data = await res.json()
  } catch {
    data = { error: "Invalid response" }
  }
  return { ok: res.ok, status: res.status, data, headers: res.headers }
}

const MAX_REQUESTS = 25
const USAGE_KEY = "yoai-usage-v1"

export function CustomerSupportChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [requestCount, setRequestCount] = useState(0)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [mobileFaqOpen, setMobileFaqOpen] = useState(false) // control mobile slide-over visibility
  const [limitBanner, setLimitBanner] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(USAGE_KEY) : null
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { count: number; resetTime: number }
        if (parsed && typeof parsed.count === "number" && typeof parsed.resetTime === "number") {
          if (Date.now() > parsed.resetTime) {
            localStorage.setItem(USAGE_KEY, JSON.stringify({ count: 0, resetTime: Date.now() + 24 * 60 * 60 * 1000 }))
            setRequestCount(0)
          } else {
            setRequestCount(parsed.count)
          }
        }
      } catch {}
    } else {
      localStorage.setItem(USAGE_KEY, JSON.stringify({ count: 0, resetTime: Date.now() + 24 * 60 * 60 * 1000 }))
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    setMessages([
      {
        id: "1",
        type: "bot",
        content:
          "Welcome! I'm your AI customer support assistant. I have access to over 1,000 FAQ entries and can help you with orders, payments, returns, and more. Browse the categories on the left for instant answers, or type your question below for a personalized response.",
        timestamp: new Date(),
        metadata: { matchType: "fallback", confidence: 1.0 },
      },
    ])
  }, [])

  const categories = [
    { name: "Orders", icon: MessageCircle, count: 25, color: "text-blue-600" },
    { name: "Payments", icon: CreditCard, count: 20, color: "text-blue-500" },
    { name: "Returns & Refunds", icon: RotateCcw, count: 15, color: "text-blue-500" },
    { name: "Cancellations", icon: X, count: 10, color: "text-red-500" },
    { name: "Membership / Prime", icon: Crown, count: 10, color: "text-orange-500" },
    { name: "Delivery", icon: Truck, count: 15, color: "text-orange-500" },
  ]

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName)
      } else {
        newSet.add(categoryName)
      }
      return newSet
    })
  }

  const handleFAQSelect = async (faq: FAQ) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: faq.question,
      timestamp: new Date(),
    }

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: "bot",
      content: faq.answer + "\n\nIs there anything else I can help you with regarding your Amazon experience?",
      timestamp: new Date(),
      metadata: {
        matchType: "faq",
        confidence: 1.0,
        sources: [faq.category],
      },
    }

    setMessages((prev) => [...prev, userMessage, botMessage])
    setLimitBanner(null)
  }

  const getFAQsByCategory = (categoryName: string) => {
    return faqDatabase.filter((faq) => faq.category === categoryName).slice(0, 10)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      console.log("[v0] Processing user query:", input)

      const similarFAQs = await findMultipleSimilarFAQs(input, faqDatabase, 5)
      const bestMatch = similarFAQs.length > 0 ? similarFAQs[0] : null

      console.log("[v0] Best match found:", bestMatch?.similarity || 0)

      let botResponse = ""
      let metadata: Message["metadata"] = { matchType: "fallback", confidence: 0 }

      if (bestMatch && bestMatch.similarity > 0.88) {
        botResponse =
          bestMatch.faq.answer + "\n\nIs there anything else I can help you with regarding your Amazon experience?"
        metadata = {
          matchType: "faq",
          confidence: bestMatch.similarity,
          sources: [bestMatch.faq.category],
        }
        setLimitBanner(null)
      } else {
        const context =
          bestMatch && bestMatch.similarity > 0.3 ? similarFAQs.slice(0, 3).map((m) => m.faq) : faqDatabase.slice(0, 5)

        if (requestCount >= MAX_REQUESTS) {
          setLimitBanner("Daily AI limit reached. You can still browse FAQs and use RAG results.")
          const tips = context
            .slice(0, 3)
            .map((f) => `• ${f.question}`)
            .join("\n")
          botResponse =
            "Daily AI limit reached. Here are some related FAQs you can check:\n" +
            tips +
            "\n\nYou can continue using the left-side FAQs. Try again tomorrow for AI assistance."
          metadata = { matchType: "fallback", confidence: 0.0, sources: ["FAQ"] }
        } else {
          console.log("[v0] Using AI response with context")
          const { ok, status, data, headers } = await callGroqAPI(userMessage.content, context)
          if (!ok) {
            if (status === 429) {
              setLimitBanner("Daily AI limit reached. You can still browse FAQs and use RAG results.")
            }
            throw new Error(data?.error || `API error ${status}`)
          }

          botResponse =
            data?.response?.trim() ||
            "I’m sorry—something went wrong generating a reply. Please try again or contact customer care."
          metadata = {
            matchType: "ai",
            confidence: Math.max(0.1, bestMatch?.similarity ?? 0.1),
            sources: context.map((faq) => faq.category),
          }

          const limit = Number(headers.get("X-RateLimit-Limit") || MAX_REQUESTS)
          const remaining = Number(
            headers.get("X-RateLimit-Remaining") || Math.max(0, MAX_REQUESTS - (requestCount + 1)),
          )
          const reset = Number(headers.get("X-RateLimit-Reset") || 0)
          const used = Math.min(limit, limit - remaining)

          setRequestCount(used)
          writeUsage(used, reset)

          if (remaining <= 0) {
            setLimitBanner("Daily AI limit reached. You can still browse FAQs and use RAG results.")
          } else {
            setLimitBanner(null)
          }
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: botResponse,
        timestamp: new Date(),
        metadata,
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("[v0] Error in chat response:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content:
          "I'm experiencing technical difficulties. You can still use the FAQs on the left. For urgent help, contact Amazon customer care.",
        timestamp: new Date(),
        metadata: { matchType: "fallback", confidence: 0 },
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const sampleQuestions = [
    "How do I track my order?",
    "When will my order be processed?",
    "Can I modify my order after placing it?",
    "What is same-day delivery?",
    "Why hasn't my order shipped yet?",
  ]

  // Centralize localStorage write for AI count
  const writeUsage = (nextCount: number, prevReset?: number) => {
    try {
      const raw = localStorage.getItem(USAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : { count: 0, resetTime: Date.now() + 24 * 60 * 60 * 1000 }
      const resetTime = typeof prevReset === "number" ? prevReset : parsed.resetTime
      localStorage.setItem(USAGE_KEY, JSON.stringify({ ...parsed, count: nextCount, resetTime }))
    } catch {}
  }

  const SidebarBody: React.FC = () => (
    <>
      <div className="p-4 border-b flex-shrink-0">
        <div className="space-y-2">
          {sampleQuestions.map((question, index) => (
            <button
              key={index}
              className="block w-full text-left text-sm text-gray-700 hover:text-blue-600 py-1"
              onClick={() => {
                setInput(question)
                // On mobile, close the drawer when picking a sample
                setMobileFaqOpen(false)
              }}
            >
              {question}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4">
          <div className="space-y-2">
            {categories.map((category) => {
              const IconComponent = category.icon
              const isExpanded = expandedCategories.has(category.name)
              const categoryFAQs = getFAQsByCategory(category.name)

              return (
                <div key={category.name} className="border rounded-lg">
                  <div
                    className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleCategory(category.name)}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`h-5 w-5 ${category.color}`} />
                      <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-gray-900 text-white text-xs px-2 py-1">
                        {category.count}
                      </Badge>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-gray-50">
                      <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                        {categoryFAQs.map((faq) => (
                          <button
                            key={faq.id}
                            className="block w-full text-left text-xs text-gray-600 hover:text-blue-600 hover:bg-white p-2 rounded transition-colors"
                            onClick={() => {
                              handleFAQSelect(faq)
                              setMobileFaqOpen(false) // close drawer after selecting
                            }}
                          >
                            {faq.question}
                          </button>
                        ))}
                        {categoryFAQs.length === 0 && (
                          <p className="text-xs text-gray-500 p-2">No FAQs available in this category</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">AI Customer Support</h1>
            <p className="text-sm text-gray-600">Powered by Groq API & RAG System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="md:hidden bg-transparent"
            onClick={() => setMobileFaqOpen(true)}
            aria-label="Browse FAQs"
          >
            <Menu className="h-4 w-4 mr-2" />
            Browse FAQs
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Online</span>
          </div>
          <span className="text-sm text-gray-600">
            {requestCount}/{MAX_REQUESTS} queries today
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:flex w-80 bg-white border-r flex-col h-full">
          <SidebarBody />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">AI Customer Support Agent</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Online • Powered by Groq API</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">
                RAG + AI Hybrid
              </Badge>
              <span className="text-sm text-gray-600">
                {requestCount}/{MAX_REQUESTS} AI queries today
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMessages([
                    {
                      id: "1",
                      type: "bot",
                      content:
                        "Welcome! I'm your AI customer support assistant. I have access to over 1,000 FAQ entries and can help you with orders, payments, returns, and more. Browse the categories on the left for instant answers, or type your question below for a personalized response.",
                      timestamp: new Date(),
                      metadata: { matchType: "fallback", confidence: 1.0 },
                    },
                  ])
                  setExpandedCategories(new Set())
                  setInput("")
                  setMobileFaqOpen(false)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {limitBanner && (
            <div className="px-6 py-3 bg-amber-50 text-amber-800 text-sm border-b border-amber-200">{limitBanner}</div>
          )}

          <div className="flex-1 p-4 md:p-6 overflow-y-auto min-h-0">
            {" "}
            {/* ensure scroll area on small screens */}
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === "user" ? "bg-gray-500" : "bg-blue-500"
                    }`}
                  >
                    {message.type === "user" ? (
                      <User className="h-5 w-5 text-white" />
                    ) : (
                      <Bot className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {message.type === "user" ? "You" : "AI Support Agent"}
                      </span>
                      {message.type === "bot" && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                          ⚠️ System
                        </Badge>
                      )}
                    </div>
                    <div className="text-gray-700 text-sm leading-relaxed">{message.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">AI Support Agent</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div
            className="bg-white border-t p-3 md:p-6 sticky bottom-0"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
          >
            {" "}
            {/* sticky composer with safe-area padding for mobile */}
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question here... (e.g., 'How do I return an item?')"
                  disabled={isLoading}
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-sm opacity-100 border-black text-black"
                />
                <Button variant="ghost" size="sm" type="button">
                  <Paperclip className="h-4 w-4 text-gray-500" />
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6"
                >
                  Send
                </Button>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span>📊 RAG Search Enabled</span>
                  <span>{requestCount >= MAX_REQUESTS ? "⛔ AI limit reached" : "🤖 Groq AI Available"}</span>
                </div>
                <span>{input.length}/500 characters</span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {mobileFaqOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-black/40"
            aria-label="Close FAQ drawer"
            onClick={() => setMobileFaqOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[88vw] max-w-sm bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="font-medium">Browse FAQs</div>
              <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setMobileFaqOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 flex flex-col overflow-hidden">
              <SidebarBody />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
