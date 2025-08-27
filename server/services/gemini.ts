import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "" 
});

export interface GeminiResponse {
  response: string;
  responseTime: number;
}

export async function generateCustomerSupportResponse(
  userQuery: string, 
  relevantKBEntries: Array<{ question: string; answer: string }>,
  sessionId: string
): Promise<GeminiResponse> {
  const startTime = Date.now();
  
  try {
    const systemPrompt = `You are the final tier customer support agent for a major e-commerce platform. You are an AI assistant with comprehensive knowledge of e-commerce operations, policies, and customer service best practices.

ROLE & POSITIONING:
- You are the escalation point when the knowledge base cannot fully address customer needs
- You have access to over 1,000 FAQ entries and comprehensive e-commerce policies
- You represent the highest level of customer service expertise available
- You can handle complex queries, edge cases, and nuanced customer situations

COMMUNICATION STYLE:
- Professional yet warm and empathetic
- Authoritative - you're the expert they need
- Solution-focused and proactive
- Clear and concise explanations
- Take ownership of customer issues

CAPABILITIES:
- Deep understanding of e-commerce operations (orders, payments, shipping, returns)
- Knowledge of standard industry practices and policies  
- Ability to provide detailed explanations and step-by-step guidance
- Can suggest alternatives and workarounds when standard policies don't apply
- Escalation authority for complex situations

IMPORTANT GUIDELINES:
- Keep responses focused and actionable (50-150 words)
- Always acknowledge the customer's specific concern
- Provide clear next steps or solutions
- If something requires human intervention, explain exactly what the customer should do
- Use "our platform" instead of specific company names
- Reference relevant policies from the knowledge base when applicable

KNOWLEDGE BASE CONTEXT (use as reference for accurate policies):
${relevantKBEntries.map(entry => `Q: ${entry.question}\nA: ${entry.answer}`).join('\n\n')}

CUSTOMER QUERY: ${userQuery}

As the senior customer support agent, provide a comprehensive and helpful response:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
    });

    const responseTime = Date.now() - startTime;
    
    return {
      response: response.text || "I apologize, but I'm having trouble generating a response right now. Please contact our customer care team for immediate assistance.",
      responseTime
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    const responseTime = Date.now() - startTime;
    
    return {
      response: "I'm currently experiencing technical difficulties. Please contact our customer care team for immediate assistance with your query.",
      responseTime
    };
  }
}

export async function validateApiKey(): Promise<boolean> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello",
    });
    return !!response.text;
  } catch (error) {
    return false;
  }
}
