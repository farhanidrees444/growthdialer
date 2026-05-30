import { NextRequest } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { checkAIRateLimit } from "@/lib/ai/rate-limiter";

// Lazy init — newer OpenAI SDK throws at module load if no key is set.
// We have a graceful no-key fallback below, so don't crash the build.
function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export async function POST(req: NextRequest) {
  // SECURITY: require an authenticated user. Without this, an unauth POST
  // loop straight to OpenAI would drain the workspace API credits.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Per-user rate limit (uses the existing rate-limiter that backs process-call)
  const { allowed, used, limit } = await checkAIRateLimit(user.id);
  if (!allowed) {
    return Response.json(
      { error: "Rate limit exceeded", used, limit },
      { status: 429 },
    );
  }

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

  const openai = getOpenAI();
  if (!openai) {
    return Response.json({ error: "OpenAI not configured" }, { status: 503 });
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
