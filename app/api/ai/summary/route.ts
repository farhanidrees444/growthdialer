import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });

export async function POST(req: NextRequest) {
  const { transcript, contactName, company, duration } =
    await req.json() as {
      transcript: string;
      contactName: string;
      company: string;
      duration: string;
    };

  if (!process.env.OPENAI_API_KEY) {
    // Return mock summary if no API key configured
    return Response.json({
      summary: `Call with ${contactName} at ${company} lasted ${duration}. Prospect showed interest in the Growth plan. Key pain points: manual dialing slowing down SDR team. Next step: send ROI calculator and schedule follow-up demo with VP Sales.`,
      sentiment: "positive",
      nextAction: "Send ROI calculator and schedule follow-up demo",
      keyTopics: ["Pricing", "Team size", "CRM integration"],
    });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a sales call analyst. Summarize the call concisely (3-4 sentences), identify sentiment (positive/neutral/negative), suggest the best next action, and list 2-3 key topics discussed. Respond in JSON with keys: summary, sentiment, nextAction, keyTopics (array).",
      },
      {
        role: "user",
        content: `Contact: ${contactName} at ${company}. Duration: ${duration}.\n\nTranscript:\n${transcript}`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 400,
  });

  const content = completion.choices[0].message.content;
  return Response.json(content ? JSON.parse(content) : {});
}
