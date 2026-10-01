// Stores one attachment from the /intro form in Vercel Blob and returns its URL.
// The browser sends the raw file as the request body: POST /api/upload?name=brief.pdf
import { put } from '@vercel/blob';

const MAX_BYTES = 1024 * 1024; // matches the 1 MB limit on the form
const ALLOWED = /\.(png|jpe?g|gif|webp|heic|svg|pdf|docx?|pptx?|key|xlsx?|csv|txt|zip|fig|sketch)$/i;
const ORIGINS = /^https:\/\/(www\.)?vorten\.studio$|^https:\/\/[a-z0-9-]+\.vercel\.app$|^http:\/\/localhost(:\d+)?$/;

const json = (body, status = 200) => Response.json(body, { status });

export async function POST(request) {
  const origin = request.headers.get('origin') || '';
  if (!ORIGINS.test(origin)) return json({ error: 'Forbidden' }, 403);

  const name = (new URL(request.url).searchParams.get('name') || '').trim();
  if (!name || !ALLOWED.test(name)) return json({ error: 'File type not allowed' }, 400);
  if (Number(request.headers.get('content-length') || 0) > MAX_BYTES) return json({ error: 'File too large' }, 413);

  const body = await request.arrayBuffer();
  if (!body.byteLength) return json({ error: 'Empty file' }, 400);
  if (body.byteLength > MAX_BYTES) return json({ error: 'File too large' }, 413);

  const safe = name.replace(/[^\w.\- ]+/g, '_').slice(-120);
  const blob = await put(`intro/${safe}`, body, {
    access: 'public',
    addRandomSuffix: true, // unguessable URL, no overwrites
    contentType: request.headers.get('content-type') || 'application/octet-stream',
  });
  return json({ url: blob.url });
}
