import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const webhook = process.env.N8N_IG_AUTH_WEBHOOK;
    if (!webhook) {
      return NextResponse.json({ error: 'N8N_IG_AUTH_WEBHOOK is not configured' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({} as any));
    const access_token = body?.access_token as string | undefined;
    if (!access_token) {
      return NextResponse.json({ error: 'Missing access_token' }, { status: 400 });
    }

    // Forward token to n8n webhook for exchange to long-lived IG token and storage
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token }),
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: `n8n webhook failed: ${res.status} ${text}` }, { status: 502 });
    }

    // Try to return JSON if possible; otherwise return text
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json);
    } catch {
      return NextResponse.json({ ok: true, result: text });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
