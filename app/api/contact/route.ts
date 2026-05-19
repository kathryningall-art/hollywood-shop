// TODO: Replace console.log with a real email-sending service before launch.
// Good options: Resend (resend.com), Postmark, or a Supabase Edge Function.
// Currently all submissions are only logged to the server console and are NOT
// delivered anywhere. This is intentional during development.

import { NextRequest, NextResponse } from "next/server";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, message } = body as Record<string, unknown>;

  // ── Server-side validation ────────────────────────────────────────────────
  const errors: Record<string, string> = {};

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.name = "Name is required.";
  }
  if (!email || typeof email !== "string" || !isValidEmail(email.trim())) {
    errors.email = "A valid email address is required.";
  }
  if (!message || typeof message !== "string" || message.trim().length < 10) {
    errors.message = "Message must be at least 10 characters.";
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  // ── Log submission (replace with email service before launch) ────────────
  console.log("[contact form]", {
    timestamp: new Date().toISOString(),
    name: (name as string).trim(),
    email: (email as string).trim(),
    message: (message as string).trim(),
  });

  return NextResponse.json({ success: true });
}
