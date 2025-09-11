import { NextRequest, NextResponse } from 'next/server';

// This endpoint triggers the daily n8n workflow immediately.
// Preferred: set N8N_RUN_WEBHOOK_URL to an n8n Webhook node URL wired to start your daily flow.
// Fallback: if N8N_RUN_WEBHOOK_URL is missing, we return 501 with instructions.

export async function POST(req: NextRequest) {
  const url = process.env.N8N_RUN_WEBHOOK_URL;
  if (!url) {
    return NextResponse.json({
      error: 'N8N_RUN_WEBHOOK_URL not configured',
      hint: 'Create a Webhook node in your n8n daily workflow and expose its production URL, then set it as N8N_RUN_WEBHOOK_URL in Vercel envs.'
    }, { status: 501 });
  }
  const res = await fetch(url, { method: 'POST' });
  const text = await res.text();
  if (!res.ok) return NextResponse.json({ error: `Webhook returned ${res.status}`, body: text }, { status: 500 });
  return NextResponse.json({ ok: true, body: text });
}
