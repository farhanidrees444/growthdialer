import { NextRequest, NextResponse } from 'next/server';
import { generateAccessToken } from '@/lib/twilio';

// Simple in-memory rate limiting (production should use Redis)
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimit.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { identity } = body;

    if (!process.env.TWILIO_API_KEY_SID || !process.env.TWILIO_API_KEY_SECRET || !process.env.TWILIO_TWIML_APP_SID) {
      return NextResponse.json(
        { error: 'Twilio credentials are not configured. Please set TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, and TWILIO_TWIML_APP_SID.' },
        { status: 500 }
      );
    }

    // Validate input
    if (!identity || typeof identity !== 'string' || identity.length > 100) {
      return NextResponse.json(
        { error: 'Invalid identity. Must be a string under 100 characters.' },
        { status: 400 }
      );
    }

    // Generate token
    const token = generateAccessToken(identity);

    return NextResponse.json({
      token,
      identity,
      expiresIn: 3600 // 1 hour
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}