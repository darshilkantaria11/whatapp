import formidable from 'formidable';
import fs from 'fs';
import { Readable } from 'stream';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
      if (err) return resolve(Response.json({ success: false, error: err.message }));

      const phone = fields.phone?.[0];
      const type = fields.type?.[0];
      const file = files.file?.[0];

      if (!phone || !file || !type) {
        return resolve(Response.json({ success: false, error: 'Missing fields' }));
      }

      try {
        // Step 1: Upload media to WhatsApp Cloud API
        const token = process.env.WHATSAPP_TOKEN;
        const buffer = fs.readFileSync(file.filepath);

        const formData = new FormData();
        formData.append('file', new Blob([buffer]), file.originalFilename);
        formData.append('messaging_product', 'whatsapp');
        formData.append('type', type);

        const uploadRes = await fetch('https://graph.facebook.com/v19.0/me/media', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadJson.id) {
          return resolve(Response.json({ success: false, error: 'Upload failed', uploadJson }));
        }

        // Step 2: Send media message
        const sendRes = await fetch(`https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type,
            [type]: {
              id: uploadJson.id,
            },
          }),
        });

        const sendJson = await sendRes.json();

        if (sendJson.error) {
          return resolve(Response.json({ success: false, error: sendJson.error.message }));
        }

        resolve(Response.json({ success: true }));
      } catch (err) {
        console.error('SendMedia error:', err);
        resolve(Response.json({ success: false, error: err.message }));
      }
    });
  });
}
