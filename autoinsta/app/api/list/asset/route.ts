import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
    { auth: { persistSession: false } }
  );
  const bucket = process.env.IG_ASSETS_BUCKET || 'ig_assets';
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit') ?? 24);
  const offset = Number(url.searchParams.get('offset') ?? 0);

  const { data: files, error } = await supabase
    .storage
    .from(bucket)
    .list('', { limit, offset, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const items = (files || []).map(f => ({
    name: f.name,
    url: supabase.storage.from(bucket).getPublicUrl(f.name).data.publicUrl,
  }));
  return NextResponse.json({ items });
}
