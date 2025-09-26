import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSmartFilename } from '@/lib/ai-filename';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
    { auth: { persistSession: false } }
  );

  const bucket = process.env.IG_PRODUCTS_BUCKET || 'ig_products';
  // Generate a descriptive, SEO-friendly filename
  const fileName = await generateSmartFilename(file);
  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase
    .storage
    .from(bucket)
    .upload(fileName, arrayBuffer, { contentType: file.type, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: pub } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(fileName);

  // Fire n8n webhook to trigger downstream workflow (one event per upload)
  // We intentionally do not fail this API if the webhook request fails.
  try {
    const webhookUrl = process.env.N8N_PRODUCT_CREATED_WEBHOOK || 'https://sifosman.app.n8n.cloud/webhook/product-created';
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fileName,
        url: pub.publicUrl,
        bucket,
        mime: file.type,
        size: arrayBuffer.byteLength,
        ts: new Date().toISOString(),
      }),
      // Avoid caching
      cache: 'no-store',
    });
  } catch (e) {
    // Swallow errors to keep upload UX smooth; logs would go to server console
    console.warn('n8n webhook call failed for product upload', e);
  }

  return NextResponse.json({ name: fileName, public_url: pub.publicUrl });
}

