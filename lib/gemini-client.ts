export async function generateGroqResponse(query: string, context: any[]): Promise<string> {
  try {
    const contextText = context
      .slice(0, 5) // Limit context to prevent token overflow
      .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
      .join("\n\n")

    const response = await fetch("/api/groq-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        context: contextText,
      }),
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    return (
      data.response ||
      "I apologize, but I'm having trouble processing your request. Please contact customer care for immediate assistance."
    )
  } catch (error) {
    console.error("Error generating AI response:", error)

    // Fallback to enhanced keyword-based responses for Amazon-like experience
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes("order") || lowerQuery.includes("tracking") || lowerQuery.includes("delivery")) {
      return "I can help you track your order. Please check 'Your Orders' section for real-time tracking updates, or I can connect you with our shipping team for detailed assistance."
    }

    if (lowerQuery.includes("payment") || lowerQuery.includes("refund") || lowerQuery.includes("billing")) {
      return "For payment-related inquiries, refunds typically process within 3-5 business days to your original payment method. I can help you check your payment status or connect you with our billing specialists."
    }

    if (lowerQuery.includes("return") || lowerQuery.includes("exchange") || lowerQuery.includes("replacement")) {
      return "Returns are easy! Visit 'Your Orders' to start a return. Most items qualify for free returns within 30 days. I can guide you through the process or arrange a replacement."
    }

    if (lowerQuery.includes("prime") || lowerQuery.includes("membership") || lowerQuery.includes("subscription")) {
      return "Prime membership includes free shipping, Prime Video, exclusive deals, and more. I can help you manage your membership, check benefits, or upgrade your plan."
    }

    if (lowerQuery.includes("cancel") || lowerQuery.includes("modify")) {
      return "I can help you cancel or modify orders that haven't shipped yet. Check 'Your Orders' for available options, or I can assist you directly."
    }

    if (lowerQuery.includes("account") || lowerQuery.includes("password") || lowerQuery.includes("security")) {
      return "For account security, I recommend updating your password regularly and enabling two-factor authentication. I can guide you through account settings or connect you with our security team."
    }

    return "I'm here to help with your Amazon experience! Whether it's orders, payments, returns, or Prime membership, I can assist you or connect you with the right specialist. What specific issue can I help resolve today?"
  }
}

export const generateGeminiResponse = generateGroqResponse
