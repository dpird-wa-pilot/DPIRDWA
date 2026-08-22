import { GoogleGenerativeAI } from "@google/generative-ai";

// geminiKey is evaluated inside the handler dynamically

// System prompt that constrains Gemini to respond only about DPIRD using official sources
const SYSTEM_PROMPT = `You are a DPIRD (Department of Primary Industries and Regional Development, Western Australia) digital assistant.

YOUR PRIMARY INFORMATION SOURCE:
- Official DPIRD website: https://www.dpird.wa.gov.au/
- Official resources and grants pages
- Publicly available government information from dpird.wa.gov.au

Your role is to help users find information about:
- Government grants and funding programs (from dpird.wa.gov.au/grants)
- Digital transformation services
- Business resources and support
- Agricultural and regional development initiatives

CRITICAL CONSTRAINTS:
1. You ONLY answer questions based on information from the official DPIRD website (dpird.wa.gov.au)
2. If you don't have current information from the official source, explicitly say:
   "I don't have access to the latest information. Please visit https://www.dpird.wa.gov.au/ for the most current details"
3. NEVER make up or assume information about DPIRD programs, eligibility, or requirements
4. Always cite the source as "according to dpird.wa.gov.au" when providing information
5. For questions outside DPIRD scope, politely redirect to DPIRD topics
6. If eligibility criteria, amounts, or deadlines are requested, direct users to the official website for current information
7. Always be helpful, professional, and accurate
8. Do not ask the user about their language preferences. All interactions must be exclusively in English.

TONE & APPROACH:
- Professional and helpful
- Honest about information limitations
- Always prioritize directing users to official dpird.wa.gov.au for authoritative information
- Better to say "I don't have current information" than to provide potentially outdated details

Remember: You represent DPIRD. Accuracy and trustworthiness are critical. When uncertain, default to providing the official website URL.`;

export default async function handler(req, res) {
  // Handle CORS and method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    console.error('GEMINI_API_KEY not found in environment');
    return res.status(500).json({ error: 'API configuration error' });
  }

  try {
    console.log(`[${new Date().toISOString()}] Processing query: "${message.substring(0, 50)}..."`);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Build context with source information
    const userPrompt = `Based on information from the official DPIRD website (https://www.dpird.wa.gov.au/), please answer this user question:

User Question: ${message}

Important: Only use information from the official DPIRD website. If you don't have current information about this topic, say so and direct the user to dpird.wa.gov.au`;

    // Call Gemini with system prompt + user message
    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${SYSTEM_PROMPT}\n\n${userPrompt}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    });

    const responseText = response.response.text();

    console.log(`[${new Date().toISOString()}] Response sent successfully`);

    return res.status(200).json({
      response: responseText,
      source: "https://www.dpird.wa.gov.au/"
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Check if Gemini API returned a 503 Service Unavailable or is overloaded
    if (error.status === 503 || error.message.includes('503') || error.message.includes('overloaded')) {
      return res.status(503).json({
        error: 'Service overloaded',
        message: 'The AI service is currently experiencing high demand.'
      });
    }

    return res.status(500).json({
      error: 'Chat processing failed',
      message: error.message
    });
  }
}
