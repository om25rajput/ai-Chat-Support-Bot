import { type NextRequest, NextResponse } from "next/server"
import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

const RATE_LIMIT = 25
const DAY_MS = 24 * 60 * 60 * 1000
const rateStore = new Map<string, { count: number; resetTime: number }>()

function getClientIp(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for")
  return (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip")) || "unknown"
}

function checkAndIncrement(ip: string) {
  const now = Date.now()
  const entry = rateStore.get(ip)
  if (!entry || now > entry.resetTime) {
    rateStore.set(ip, { count: 1, resetTime: now + DAY_MS })
    return { ok: true, remaining: RATE_LIMIT - 1, resetTime: now + DAY_MS }
  }
  if (entry.count >= RATE_LIMIT) {
    return { ok: false, remaining: 0, resetTime: entry.resetTime }
  }
  entry.count += 1
  return { ok: true, remaining: RATE_LIMIT - entry.count, resetTime: entry.resetTime }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limit = checkAndIncrement(ip)
    if (!limit.ok) {
      const resp = NextResponse.json(
        { error: "Daily free usage limit reached. Please try again tomorrow." },
        { status: 429 },
      )
      resp.headers.set("X-RateLimit-Limit", String(RATE_LIMIT))
      resp.headers.set("X-RateLimit-Remaining", String(limit.remaining))
      resp.headers.set("X-RateLimit-Reset", String(limit.resetTime))
      return resp
    }

    const { query, context } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const safeArray = Array.isArray(context) ? context : []
    const contextInfo =
      safeArray.length > 0
        ? safeArray.map((faq: any) => `Q: ${faq.question}\nA: ${faq.answer}`).join("\n\n")
        : "No specific context available"

    console.log("[v0] Context received:", Array.isArray(context), "len:", safeArray.length)

    const systemPrompt = `You are an Amazon customer service representative. You are professional, helpful, and concise.
- Always respond as if you work for Amazon
- Keep responses under 100 words
- Use specific Amazon features (Your Orders, Prime, Returns Center)
- If unsure, offer to connect the customer with a specialist
- Prefer direct, factual answers. Avoid generic filler.

Context from knowledge base:
${contextInfo}

Customer Query: ${query}
Respond in 2-5 short sentences.`

    console.log("[v0] Making Groq API call with query:", query)

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      system: systemPrompt,
      prompt: query,
      temperature: 0.4,
      maxTokens: 180,
    })

    const response =
      text?.trim() || "I’m sorry—something went wrong generating a reply. Please try again or contact customer care."

    const resp = NextResponse.json({ response })
    resp.headers.set("X-RateLimit-Limit", String(RATE_LIMIT))
    resp.headers.set("X-RateLimit-Remaining", String(limit.remaining))
    resp.headers.set("X-RateLimit-Reset", String(limit.resetTime))
    return resp
  } catch (error) {
    console.error("[v0] Groq API error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
