import { NextRequest } from "next/server";
import { z } from "zod";

const salesLeadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().min(1),
  message: z.string().min(10),
});

/** Demo endpoint — replace with CRM / email provider in production. */
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = salesLeadSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  return Response.json({ ok: true, message: "Thanks — our team will reach out shortly." });
}
