import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function serverClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  const supabase = serverClient();
  const { data, error } = await supabase.from('business_profile').select('*').limit(1).maybeSingle();
  if (error && error.code !== 'PGRST116') return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data || null });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const supabase = serverClient();
  const payload = {
    company_name: body.company_name ?? null,
    brand_primary_hex: body.brand_primary_hex ?? null,
    brand_accent_hex: body.brand_accent_hex ?? null,
    logo_url: body.logo_url ?? null,
    timezone: body.timezone ?? 'Africa/Johannesburg',
    schedule_hours: Array.isArray(body.schedule_hours) ? body.schedule_hours : [8],
    enabled: body.enabled ?? true,
    updated_at: new Date().toISOString(),
  };
  // Upsert single row (assumes single-row table)
  const { data, error } = await supabase.from('business_profile').upsert(payload, { onConflict: 'id' }).select('*').limit(1);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data?.[0] || null });
}
