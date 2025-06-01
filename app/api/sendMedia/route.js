import { NextResponse } from 'next/server';
import FormData from 'form-data';
import fetch from 'node-fetch';

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    const phone = form.get('phone');
    const type = form.get('type'); // 'image' or 'video'

    if (!file || !phone || !type) {
      return NextResponse.json({ success: false, error: 'Missing data' }, { status: 400 });
    }

    // Upload to WhatsApp
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadForm = new FormData();
    uploadForm.append('file', buffer, file.name);
    uploadForm.append('type', file.type);
    uploadForm.append('messaging_product', 'whatsapp');

    const uploadRes = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/media`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        },
        body: uploadForm,
      }
    );

    const uploadData = await uploadRes.json();

    if (!uploadData.id) {
      return NextResponse.json({ success: false, error: 'Media upload failed', detail: uploadData }, { status: 500 });
    }

    // Send message
    const sendRes = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type,
          [type]: { id: uploadData.id },
        }),
      }
    );

    const sendData = await sendRes.json();

    if (sendData.error) {
      return NextResponse.json({ success: false, error: 'Failed to send message', detail: sendData }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Failed to send media:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
