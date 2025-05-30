import crypto from "crypto";
import { NextResponse } from "next/server";

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

  console.log("GET webhook verification request:");
  console.log({ mode, token, challenge });

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  } else {
    return new NextResponse("Invalid verification", { status: 403 });
  }
}

export async function POST(req) {
  const signature = req.headers.get("x-hub-signature-256");
  const rawBody = await req.text();

  console.log("Raw POST body from Facebook:");
  console.log(rawBody);

  if (!verifySignature(rawBody, signature)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const payload = JSON.parse(rawBody);

  // Log the full parsed payload
  console.log("Parsed POST payload from Facebook:");
  console.log(payload);

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
