// app/api/sendMedia/route.js
import { NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';
import { Readable } from 'stream';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  const token = process.env.WHATSAPP_TOKEN;
  const form = formidable({ multiples: false });

  const [fields, files] = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve([fields, files]);
    });
  });

  const phone = fields.phone;
  const file = files.file;

  const mediaBuffer = fs.readFileSync(file.filepath);
  const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/media`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: new URLSearchParams({
      messaging_product: 'whatsapp',
      type: file.mimetype.startsWith('image') ? 'image' : 'audio',
      file: mediaBuffer,
    }),
  });

  const mediaJson = await mediaRes.json();
  const mediaId = mediaJson.id;

  // Send the media message
  await fetch(`https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: file.mimetype.startsWith('image') ? 'image' : 'audio',
      [file.mimetype.startsWith('image') ? 'image' : 'audio']: {
        id: mediaId,
      },
    }),
  });

  return NextResponse.json({ success: true });
}
