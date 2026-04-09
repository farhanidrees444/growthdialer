import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });

export async function POST(req: NextRequest) {
  const { outcome, contactName, company, notes } =
    await req.json() as {
      outcome: string;
      contactName: string;
      company: string;
      notes: string;
    };

  if (!process.env.OPENAI_API_KEY) {
    const suggestions: Record<string, { action: string; timing: string; template: string }> = {
      meeting: {
        action: "Send calendar invite + pre-meeting agenda",
        timing: "Within 1 hour",
        template: `Hi ${contactName}, looking forward to our demo! I'll send over an agenda shortly. Any specific topics you'd like to cover?`,
      },
      callback: {
        action: "Schedule follow-up call",
        timing: "Tomorrow morning",
        template: `Hi ${contactName}, great speaking with you! Confirming our follow-up call. Let me know if the time still works.`,
      },
      voicemail: {
        action: "Send follow-up email",
        timing: "Within 2 hours",
        template: `Hi ${contactName}, I left you a voicemail — just wanted to connect about how GrowthDialer helps teams like ${company} 3x their pipeline. Worth a quick 15 min?`,
      },
      not_interested: {
        action: "Add to 90-day nurture sequence",
        timing: "In 90 days",
        template: `Hi ${contactName}, understood! I'll check back in a few months. In the meantime, here's our ROI calculator if priorities change.`,
      },
    };
    return Response.json(suggestions[outcome] ?? suggestions.callback);
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a sales coach. Based on the call outcome, suggest the best next action, ideal timing, and a short follow-up message template. Respond in JSON with keys: action, timing, template.",
      },
      {
        role: "user",
        content: `Outcome: ${outcome}. Contact: ${contactName} at ${company}. Notes: ${notes}`,
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 300,
  });

  const content = completion.choices[0].message.content;
  return Response.json(content ? JSON.parse(content) : {});
}
