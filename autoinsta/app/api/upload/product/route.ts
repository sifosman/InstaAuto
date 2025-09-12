import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  const fileName = file.name;
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

  return NextResponse.json({ name: fileName, public_url: pub.publicUrl });
}
