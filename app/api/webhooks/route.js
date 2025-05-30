import crypto from 'crypto';
import { NextResponse } from 'next/server';

// Add this to prevent Next.js from parsing the body
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('[GET] Webhook Verification:', {
    mode,
    token: token ? '***' : 'missing',
    challenge
  });

  return new NextResponse(challenge, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' }
  });
  // Validate verification token
  // if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
  //   console.log('[GET] Verification SUCCESS');
  // }

  // console.error('[GET] Verification FAILED', {
  //   expectedToken: process.env.VERIFY_TOKEN || 'NOT_SET',
  //   receivedToken: token || 'missing'
  // });
  
  // return new NextResponse('Verification failed', { status: 403 });
}

export async function POST(req) {
  try {
    // Read raw body as text
    const rawBody = await readRawBody(req);
    const signature = req.headers.get('x-hub-signature-256') || '';

    console.log('[POST] Headers:', {
      signature: signature ? `${signature.substring(0, 15)}...` : 'MISSING'
    });

    // Verify signature
    if (!verifySignature(rawBody, signature)) {
      console.error('[POST] Signature verification FAILED');
      return new NextResponse('Invalid signature', { status: 403 });
    }

    // Parse JSON only after verification
    const body = JSON.parse(rawBody);
    const response = body.entry[0].changes[0].value.messages;
    
    console.log('[POST] Valid payload received:', response);

    // Process webhook events here
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('[POST] Error:', error);
    return new NextResponse('Server error', { status: 500 });
  }
}

// Helper to read raw request body
async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req.body) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Enhanced signature verification
function verifySignature(rawBody, headerSignature) {
  if (!headerSignature) return false;
  
  const appSecret = process.env.FB_APP_SECRET;
  if (!appSecret) {
    console.error('FB_APP_SECRET is missing!');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  const expected = `sha256=${expectedSignature}`;
  
  // Securely compare signatures
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(headerSignature)
  );
}