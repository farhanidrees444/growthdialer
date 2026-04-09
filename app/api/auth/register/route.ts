import { NextRequest } from "next/server";
import { z } from "zod";
import { registerUser } from "@/lib/user-store";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;
  const user = registerUser({
    name,
    email,
    password,
    image: null,
  });

  if (!user) {
    return Response.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  return Response.json({ ok: true, email: user.email });
}
