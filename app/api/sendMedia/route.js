// app/api/sendMedia/route.js

import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';
import fs from 'fs';

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('file');
  const phone = formData.get('phone');
  const type = formData.get('type'); // 'image' or 'video'

  if (!file || !phone || !type) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  // Save file temporarily
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join('/tmp', file.name);
  await writeFile(filePath, buffer);

  try {
    // Step 1: Upload to WhatsApp
    const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      },
      body: (() => {
        const data = new FormData();
        data.append('file', fs.createReadStream(filePath));
        data.append('type', file.type);
        data.append('messaging_product', 'whatsapp');
        return data;
      })(),
    });

    const uploadJson = await uploadRes.json();
    if (!uploadJson.id) {
      return NextResponse.json({ success: false, error: 'Media upload failed' }, { status: 500 });
    }

    // Step 2: Send media message
    const sendRes = await fetch(`https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type,
        [type]: {
          id: uploadJson.id,
        },
      }),
    });

    const sendJson = await sendRes.json();

    if (sendJson.error) {
      return NextResponse.json({ success: false, error: sendJson.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Media send failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
