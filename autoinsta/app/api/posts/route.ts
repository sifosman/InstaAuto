import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const schema = z.object({
  date: z.string(),
  template: z.string(),
  headline: z.string().max(120),
  subtext: z.string().optional().default(''),
  cta: z.string().optional().default(''),
  hashtags: z.string().optional().default(''),
  style_variant: z.string().optional().default('minimalist high-contrast'),
  image_strategy: z.enum(['ai','img2img','videoai']),
  asset_url: z.string().url().optional().default(''),
  asset_tags: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  status: z.string().optional().default('todo'),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!,
    { auth: { persistSession: false } }
  );
  const { data, error } = await supabase
    .from('ig_posts')
    .insert([parsed.data])
    .select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ row: data?.[0] });
}
