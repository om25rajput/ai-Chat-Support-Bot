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

    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes("track") || lowerQuery.includes("order") || lowerQuery.includes("delivery")) {
      return "I can help you track your order! You can find real-time tracking information in 'Your Orders' section of your account. Orders typically update within 24 hours of shipment. Would you like me to help you locate your specific order?"
    }

    if (lowerQuery.includes("payment") || lowerQuery.includes("refund") || lowerQuery.includes("billing")) {
      return "For payment inquiries, I can assist you right away. Refunds typically process within 3-5 business days to your original payment method. You can check your refund status in 'Your Account' > 'Your Orders'. Is there a specific payment issue I can help resolve?"
    }

    if (lowerQuery.includes("return") || lowerQuery.includes("exchange") || lowerQuery.includes("replacement")) {
      return "Returns are simple with Amazon! Most items can be returned within 30 days for a full refund. Visit 'Your Orders' to start a return - we'll provide a prepaid return label. Would you like me to guide you through the return process?"
    }

    if (lowerQuery.includes("prime") || lowerQuery.includes("membership") || lowerQuery.includes("subscription")) {
      return "Prime membership includes free 2-day shipping, Prime Video, exclusive deals, and more benefits. I can help you manage your membership, check your benefits, or answer questions about Prime features. What would you like to know about your Prime membership?"
    }

    if (lowerQuery.includes("cancel") || lowerQuery.includes("modify")) {
      return "I can help you cancel or modify orders that haven't shipped yet. Check 'Your Orders' for available options - you'll see 'Cancel items' or 'Change' buttons if modifications are possible. Would you like me to help you locate your order?"
    }

    return "I'm here to help with your Amazon experience! Whether it's tracking orders, processing returns, managing payments, or Prime membership questions, I can assist you directly. What specific issue can I help resolve for you today?"
  }
}
