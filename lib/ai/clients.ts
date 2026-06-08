import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const GEMINI_MODEL = 'gemini-2.5-flash';
export const EMBEDDING_MODEL = 'text-embedding-004';

export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const model = geminiAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text.slice(0, 8192));
    return result.embedding.values;
  } catch (err) {
    console.error('Embedding generation failed:', err);
    return null;
  }
}

export interface AIAnalysis {
  summary: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  talking_points: string[];
  objections: string[];
  buying_signals: string[];
  next_steps: string;
  suggested_disposition: string;
  memories_to_save: Array<{
    type: 'preference' | 'objection' | 'interest' | 'fact';
    content: string;
    importance: number;
  }>;
}

const ANALYSIS_PROMPT = (
  transcript: string,
  companyName: string,
  industry: string,
  jobTitle: string,
  previousMemories: string,
) => `You are an AI sales call analyst. Analyze this call transcript and extract structured insights.

LEAD CONTEXT:
Company: ${companyName}
Industry: ${industry}
Job Title: ${jobTitle}

PREVIOUS INTERACTIONS (from AI memory):
${previousMemories || 'No previous interactions on record.'}

CALL TRANSCRIPT:
${transcript}

Return ONLY valid JSON with no markdown, no code fences:
{
  "summary": ["bullet 1", "bullet 2", "bullet 3"],
  "sentiment": "positive",
  "sentiment_score": 0.7,
  "talking_points": ["topic 1", "topic 2"],
  "objections": ["objection 1"],
  "buying_signals": ["signal 1"],
  "next_steps": "Follow up with pricing proposal by Friday",
  "suggested_disposition": "callback",
  "memories_to_save": [
    { "type": "objection", "content": "Concerned about pricing", "importance": 0.8 }
  ]
}

Valid dispositions: interested, callback, not_interested, meeting_booked, voicemail, wrong_number
Memory types: preference, objection, interest, fact`;

export async function analyzeCallWithGemini(
  transcript: string,
  companyName: string,
  industry: string,
  jobTitle: string,
  previousMemories: string,
): Promise<AIAnalysis> {
  const model = geminiAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
  });

  const prompt = ANALYSIS_PROMPT(transcript, companyName, industry, jobTitle, previousMemories);
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(cleaned) as AIAnalysis;
}

export async function analyzeCallWithGroq(
  transcript: string,
  companyName: string,
  industry: string,
  jobTitle: string,
  previousMemories: string,
): Promise<AIAnalysis> {
  const prompt = ANALYSIS_PROMPT(transcript, companyName, industry, jobTitle, previousMemories);
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });
  const text = response.choices[0]?.message?.content ?? '{}';
  return JSON.parse(text) as AIAnalysis;
}
