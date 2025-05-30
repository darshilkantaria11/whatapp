import crypto from 'crypto';
import { NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: false, // Not used in App Router, but left for clarity
  },
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  } else {
    return new NextResponse("Invalid verification", { status: 403 });
  }
}

export async function POST(req) {
  const signature = req.headers.get("x-hub-signature-256");
  const rawBody = await req.text();

  if (!verifySignature(rawBody, signature)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const payload = JSON.parse(rawBody);

  if (payload.object === "instagram") {
    payload.entry.forEach((entry) => {
      entry.changes.forEach((change) => {
        if (change.field === "story_insights") {
          console.log("📊 Story insights received:");
          console.log(change.value);
        }
      });
    });
  }

  return new NextResponse("OK", { status: 200 });
}

function verifySignature(rawBody, headerSignature) {
  if (!headerSignature) return false;

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", process.env.FB_APP_SECRET)
      .update(rawBody)
      .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature);
  const headerBuffer = Buffer.from(headerSignature);

  return (
    expectedBuffer.length === headerBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, headerBuffer)
  );
}
