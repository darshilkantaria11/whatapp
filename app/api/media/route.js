// /app/api/media/route.js
export async function GET(req) {
  const url = req.nextUrl.searchParams.get('url');
  const token = process.env.WHATSAPP_TOKEN;

  if (!url) return new Response('Missing URL', { status: 400 });

  const mediaRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!mediaRes.ok) {
    console.error('Failed to fetch media:', await mediaRes.text());
    return new Response('Failed to fetch media', { status: mediaRes.status });
  }

  const buffer = await mediaRes.arrayBuffer();

  return new Response(Buffer.from(buffer), {
    headers: {
      'Content-Type': mediaRes.headers.get('content-type') || 'application/octet-stream',
      'Cache-Control': 'no-store',
    },
  });
}
