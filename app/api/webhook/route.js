
import { NextResponse } from 'next/server';

export async function GET(req) {
  // Handle GET requests for webhook verification
  const { hub_challenge, hub_verify_token, hub_mode } = await req.json(); // Or use request.query for URL parameters
  
  if (hub_verify_token === process.env.VERIFY_TOKEN && hub_mode === 'subscribe') {
    return NextResponse.json({
      hub_challenge: hub_challenge,
    });
  }

  return new NextResponse('Verification failed', { status: 401 });
}

export async function POST(req) {
  // Handle POST requests for incoming messages
  try {
    const body = await req.json();
    // Process the webhook data (see below)
    console.log(JSON.stringify(body, null, 2)); // Log the webhook data
    // Handle different event types (messages, etc.)
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }
}