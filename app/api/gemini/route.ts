import { type NextRequest, NextResponse } from "next/server"

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function getRateLimitKey(request: NextRequest): string {
  // Use IP address for rate limiting
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"
  return ip
}

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const dayInMs = 24 * 60 * 60 * 1000

  const userLimit = rateLimitStore.get(key)

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimitStore.set(key, { count: 1, resetTime: now + dayInMs })
    return true
  }

  if (userLimit.count >= 25) {
    return false
  }

  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitKey = getRateLimitKey(request)

    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json({ error: "Daily free usage limit reached. Please try again tomorrow." }, { status: 429 })
    }

    const { query, context, prompt } = await request.json()

    // In production, implement actual Gemini API call here
    // For now, return a simulated response
    const response = generateSimulatedResponse(query, context)

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error in Gemini API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateSimulatedResponse(query: string, context: any[]): string {
  const lowerQuery = query.toLowerCase()

  // Amazon-specific responses as if working on Amazon platform
  if (lowerQuery.includes("order") || lowerQuery.includes("delivery")) {
    return "I can help you with your Amazon order. Please check 'Your Orders' section for tracking details, or I can connect you with our customer care team for immediate assistance."
  }

  if (lowerQuery.includes("payment") || lowerQuery.includes("refund")) {
    return "For Amazon payment queries, refunds typically process within 3-5 business days to your original payment method. I can help you track your refund status."
  }

  if (lowerQuery.includes("return") || lowerQuery.includes("exchange")) {
    return "Amazon returns can be initiated through 'Your Orders' section. Most items have a 7-10 day return window with free pickup. I can guide you through the process."
  }

  if (lowerQuery.includes("prime") || lowerQuery.includes("membership")) {
    return "Amazon Prime offers free one-day delivery, exclusive deals, Prime Video, and Prime Music. Check 'Your Account' > 'Prime Membership' for details or I can help you upgrade."
  }

  if (lowerQuery.includes("cancel")) {
    return "Amazon orders can be cancelled before dispatch through 'Your Orders'. Once dispatched, you can return the item instead. I can help you with either process."
  }

  if (lowerQuery.includes("track") || lowerQuery.includes("shipping")) {
    return "Track your Amazon orders in real-time through 'Your Orders' or the tracking link sent via email. I can also provide current status updates."
  }

  // Default Amazon customer service response
  return "Thank you for contacting Amazon customer support. I'm here to help with any questions about your orders, payments, returns, or Prime membership. Please contact our customer care team for detailed assistance with your specific concern."
}
