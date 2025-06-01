import formidable from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false, // Disable Next.js default parser for multipart
  },
};

export async function POST(req) {
  const form = new formidable.IncomingForm();

  return new Promise((resolve) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return resolve(new Response(JSON.stringify({ success: false, error: err.message }), { status: 400 }));
      }

      const phone = fields.phone;
      const type = fields.type; // 'image' or 'video'
      const file = files.file;

      if (!phone || !type || !file) {
        return resolve(new Response(JSON.stringify({ success: false, error: 'Missing phone, type or file' }), { status: 400 }));
      }

      try {
        // Read the file buffer
        const fileBuffer = fs.readFileSync(file.filepath);

        // Upload media to WhatsApp Cloud API
        const uploadRes = await fetch(`https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/media`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          },
          body: createFormData(fileBuffer, file.originalFilename, file.mimetype),
        });

        if (!uploadRes.ok) {
          const errorBody = await uploadRes.text();
          return resolve(new Response(JSON.stringify({ success: false, error: `Media upload failed: ${errorBody}` }), { status: 500 }));
        }

        const uploadData = await uploadRes.json();
        const mediaId = uploadData.id;

        // Send media message
        const sendMessageRes = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: type,
            [type]: {
              id: mediaId,
            },
          }),
        });

        if (!sendMessageRes.ok) {
          const errorBody = await sendMessageRes.text();
          return resolve(new Response(JSON.stringify({ success: false, error: `Send message failed: ${errorBody}` }), { status: 500 }));
        }

        resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
      } catch (error) {
        resolve(new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 }));
      }
    });
  });
}

// Helper: create FormData for media upload
function createFormData(fileBuffer, filename, mimetype) {
  // Since Node.js doesn't have native FormData, use form-data package or manual multipart
  // To avoid extra dependencies, do manual multipart:

  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const CRLF = '\r\n';

  let body = '';
  body += `--${boundary}${CRLF}`;
  body += `Content-Disposition: form-data; name="file"; filename="${filename}"${CRLF}`;
  body += `Content-Type: ${mimetype}${CRLF}${CRLF}`;

  const preamble = Buffer.from(body, 'utf8');
  const ending = Buffer.from(`${CRLF}--${boundary}--${CRLF}`, 'utf8');

  // Combine buffers: preamble + fileBuffer + ending
  const combined = Buffer.concat([preamble, fileBuffer, ending]);

  // We need to attach headers and body in fetch call:
  // But fetch requires us to pass the headers outside this function.
  // So instead, let's switch to using 'form-data' package (recommended).

  // Alternatively, return the combined body and boundary so caller can set headers:

  return {
    getHeaders: () => ({
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    }),
    getBuffer: () => combined,
  };
}
