import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '1mb' }));

// Lazy GoogleGenAI client
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return genAIClient;
}

// System instruction generator based on mood
function getSystemInstruction(mood?: string | null): string {
  const baseInstruction = `You are Optimus Prime AI, an expert, empathetic, and professional customer service assistant.
Your goal is to assist customers with orders, returns, account issues, shipping delays, troubleshooting, product questions, and inquiries.
You write in a natural, human, conversational tone. Keep your responses concise (2 to 4 sentences), clear, directly addressing the user's issue with immediate actionable help or asking necessary clarifying details.

CRITICAL TONE DIRECTIVES:
- Never mention camera technicalities, facial recognition algorithms, or internal metrics to the customer (e.g., NEVER say "I see your webcam detects you are angry" or "My sensor calculated 90% confidence").
- Do NOT explicitly call out their facial emotion in every reply unless it is naturally empathetic to do so.
- Instead, NATURALLY embody the appropriate emotional posture through your empathy, choice of words, pacing, and willingness to solve their issue.
`;

  let moodToneGuide = '';
  switch (mood?.toLowerCase()) {
    case 'angry':
      moodToneGuide = `CUSTOMER CURRENT EMOTIONAL STATE: ANGRY / HIGH FRUSTRATION
Tone Requirement: Calm, highly empathetic, de-escalating, reassuring, and immediate solution-oriented.
Action: Validate their frustration with genuine care, take ownership without being defensive, and offer immediate concrete steps or ask for details to resolve their problem right away.`;
      break;

    case 'sad':
      moodToneGuide = `CUSTOMER CURRENT EMOTIONAL STATE: SAD / DISAPPOINTED
Tone Requirement: Supportive, gentle, warm, understanding, and attentive.
Action: Acknowledge the disappointment, speak gently, and reassure them that you will personally make sure everything is taken care of.`;
      break;

    case 'happy':
      moodToneGuide = `CUSTOMER CURRENT EMOTIONAL STATE: HAPPY / DELIGHTED
Tone Requirement: Friendly, warm, energetic, and appreciative.
Action: Match their upbeat energy while remaining professional and expeditious.`;
      break;

    case 'fearful':
      moodToneGuide = `CUSTOMER CURRENT EMOTIONAL STATE: FEARFUL / ANXIOUS
Tone Requirement: Reassuring, calming, transparent, and structured.
Action: Eliminate ambiguity, outline clear facts and steps, and relieve stress with dependable guidance.`;
      break;

    case 'surprised':
      moodToneGuide = `CUSTOMER CURRENT EMOTIONAL STATE: SURPRISED / CONFUSED
Tone Requirement: Clarifying, transparent, informative, and patient.
Action: Break down unexpected charges, changes, or outcomes clearly and concisely.`;
      break;

    case 'disgusted':
      moodToneGuide = `CUSTOMER CURRENT EMOTIONAL STATE: DISGUSTED / UNPLEASANT EXPERIENCE
Tone Requirement: High accountability, sincere regret, decisive, and corrective.
Action: Take immediate responsibility for the bad experience and outline quick resolution or compensation.`;
      break;

    default:
      moodToneGuide = `CUSTOMER CURRENT EMOTIONAL STATE: NEUTRAL / STANDARD
Tone Requirement: Courteous, professional, crisp, helpful, and friendly.
Action: Provide prompt, accurate, and pleasant support.`;
      break;
  }

  return `${baseInstruction}\n\n${moodToneGuide}`;
}

// Detect temporary API failure conditions (503, UNAVAILABLE, high demand/overload, 429 rate limit)
function isTemporaryApiFailure(err: any): boolean {
  if (!err) return false;
  const status = Number(err.status || err.statusCode || err.response?.status || 0);
  if (status === 503 || status === 429 || status === 500 || status === 502 || status === 504) {
    return true;
  }
  const msg = String(err.message || err.toString() || err.error || '').toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('overload') ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('temporarily') ||
    msg.includes('busy')
  );
}

// Execute Gemini call with gemini-2.5-flash-lite as primary and gemini-2.5-flash as fallback
async function generateConversationalReply(
  contents: any[],
  systemInstruction: string
): Promise<{ text: string; modelUsed: string }> {
  const ai = getGeminiClient();

  const callModel = async (model: string) => {
    try {
      return await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          topP: 0.95
        }
      });
    } catch (err: any) {
      const msg = String(err?.message || '');
      // Handle API model migration recommendations gracefully
      if (msg.includes('no longer available') && msg.includes('gemini-3.5-flash-lite')) {
        return await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            topP: 0.95
          }
        });
      }
      if (msg.includes('no longer available') && msg.includes('gemini-3.6-flash')) {
        return await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            topP: 0.95
          }
        });
      }
      throw err;
    }
  };

  const PRIMARY_MODEL = 'gemini-2.5-flash-lite';
  const FALLBACK_MODEL = 'gemini-2.5-flash';

  // 1. First attempt with primary model: gemini-2.5-flash-lite
  try {
    const res1 = await callModel(PRIMARY_MODEL);
    const text = res1.text?.trim();
    if (text) {
      return { text, modelUsed: PRIMARY_MODEL };
    }
  } catch (err1: any) {
    console.warn(`Primary model (${PRIMARY_MODEL}) initial attempt failed:`, err1?.message || err1);

    // If it's a temporary error, retry exactly once on primary model
    if (isTemporaryApiFailure(err1)) {
      try {
        console.log(`Retrying once on primary model (${PRIMARY_MODEL})...`);
        await new Promise((resolve) => setTimeout(resolve, 600));
        const resRetry = await callModel(PRIMARY_MODEL);
        const text = resRetry.text?.trim();
        if (text) {
          return { text, modelUsed: PRIMARY_MODEL };
        }
      } catch (retryErr: any) {
        console.warn(`Primary model (${PRIMARY_MODEL}) retry failed:`, retryErr?.message || retryErr);
      }
    }

    // Fallback attempt: exactly one fallback attempt on secondary model (gemini-2.5-flash)
    console.log(`Attempting fallback to secondary model: ${FALLBACK_MODEL}`);
    try {
      const resFallback = await callModel(FALLBACK_MODEL);
      const text = resFallback.text?.trim();
      if (text) {
        return { text, modelUsed: FALLBACK_MODEL };
      }
    } catch (fallbackErr: any) {
      console.error(`Fallback model (${FALLBACK_MODEL}) also failed:`, fallbackErr?.message || fallbackErr);
      throw fallbackErr;
    }
  }

  return {
    text: "I'm here to help. Could you please share more details about your request?",
    modelUsed: PRIMARY_MODEL
  };
}

// Chat API Route
app.post('/api/chat', async (req, res) => {
  try {
    const { message, mood, confidence, stability, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const systemInstruction = getSystemInstruction(mood);

    // Format previous messages for conversational context
    const contents: any[] = [];

    if (Array.isArray(history)) {
      // Keep up to last 10 turns to stay focused and fast
      const recentHistory = history.slice(-10);
      for (const item of recentHistory) {
        if (item.role === 'user' && item.content) {
          contents.push({
            role: 'user',
            parts: [{ text: item.content }]
          });
        } else if (item.role === 'assistant' && item.content) {
          contents.push({
            role: 'model',
            parts: [{ text: item.content }]
          });
        }
      }
    }

    // Add latest user prompt with mood metadata context
    const contextNote = mood
      ? `[Facial Mood Context: Customer expression is stabilized as ${mood.toUpperCase()} (Confidence: ${confidence || 0}%, Stability: ${stability || 'Normal'})]`
      : `[Facial Mood Context: Customer facial mood unavailable / no face detected]`;

    contents.push({
      role: 'user',
      parts: [
        {
          text: `${contextNote}\n\nCustomer: "${message.trim()}"`
        }
      ]
    });

    const { text: reply, modelUsed } = await generateConversationalReply(
      contents,
      systemInstruction
    );

    return res.json({
      reply,
      moodUsed: mood || null,
      confidenceUsed: confidence || 0,
      stabilityUsed: stability || null,
      modelUsed
    });
  } catch (err: any) {
    console.error('Error generating AI response after retries/fallback:', err);
    // User requirement: "If both models fail: Show a friendly error message in the chat:
    // 'The AI service is temporarily busy. Please try again in a moment.'
    // Do NOT display raw JSON/API error messages to the user."
    return res.status(503).json({
      error: 'The AI service is temporarily busy. Please try again in a moment.'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY)
  });
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Optimus Prime server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
