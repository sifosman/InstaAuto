import { NextRequest, NextResponse } from 'next/server';

// Returns a ready-to-use prompt for a VLM/LLM to create an Instagram post
// from a product image hosted in the ig_products bucket. Optionally includes
// price/sale tags and uses brand colors pulled from the profile API.
export async function POST(req: NextRequest) {
  try {
    const { image, name, price, sale_tag } = await req.json();
    if (!image && !name) {
      return NextResponse.json({ error: 'Provide image (public URL) or name (path) from ig_products.' }, { status: 400 });
    }

    // If name is provided, assume it is the object path in ig_products public bucket URL
    let imageUrl: string = image;
    if (!imageUrl && typeof name === 'string') {
      // Caller should have product bucket public; we can infer URL shape if env set
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const bucket = process.env.IG_PRODUCTS_BUCKET || 'ig_products';
      if (!baseUrl) {
        return NextResponse.json({ error: 'Missing NEXT_PUBLIC_SUPABASE_URL to resolve product image URL.' }, { status: 500 });
      }
      imageUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${name}`;
    }

    // Pull profile to get brand colors and (optionally) logo
    const origin = req.nextUrl?.origin || process.env.NEXT_PUBLIC_SITE_URL || '';
    const profRes = await fetch(`${origin}/api/profile`, { cache: 'no-store' }).catch(()=>null);
    const profJson = await profRes?.json().catch(()=>null);
    const profile = profJson?.profile || {};
    const primary = profile.brand_primary_hex || '#0A84FF';
    const accent = profile.brand_accent_hex || '#00C2A8';
    const company = profile.company_name || 'Our Brand';

    const sysPrompt = `You are a senior e-commerce social media copywriter and brand stylist.
- Goal: Create a scroll-stopping Instagram post (caption + hashtags) for a single product image.
- Tone: Friendly, confident, concise, and on-brand for ${company}.
- Constraints: Keep the entire caption under 2,200 characters. Avoid overusing emojis (<= 3). Use UK English.
- Visual Theme: When suggesting overlays/backdrops/colors, prefer brand colors Primary ${primary} and Accent ${accent}.`;

    const requirements: string[] = [
      'Analyze the product IMAGE to infer product category, material/finish, distinguishing features, and intended use.',
      'Identify a short, punchy hook (<= 8 words) as the opening line.',
      'Write a 2-3 sentence benefit-focused description using brand tone.',
      'If a PRICE is provided, incorporate it naturally (e.g., “Now only R999”).',
      'If a SALE TAG is provided (e.g., “20% OFF”, “New Arrival”), include it once near the end.',
      'Include 10-15 relevant, high-intent hashtags. Mix broad and niche tags. No banned tags.',
      'Add an ADA-friendly alt text (<= 120 chars) describing the product for screen readers.',
    ];

    const metaLines: string[] = [];
    if (price) metaLines.push(`PRICE: ${price}`);
    if (sale_tag) metaLines.push(`SALE_TAG: ${sale_tag}`);

    const userPrompt = `IMAGE_URL: ${imageUrl}
BRAND_PRIMARY: ${primary}
BRAND_ACCENT: ${accent}
${metaLines.join('\n')}

Follow these requirements precisely:
${requirements.map((r, i)=>` ${i+1}. ${r}`).join('\n')}

Output JSON with the following keys only:
{
  "hook": string,
  "caption": string,        // full IG caption including hook line and body
  "hashtags": string[],     // 10-15 items without the # prefix
  "alt_text": string        // <=120 chars
}`;

    const merged = `${sysPrompt}\n\n${userPrompt}`;

    return NextResponse.json({
      system_prompt: sysPrompt,
      user_prompt: userPrompt,
      merged_prompt: merged,
      variables: { image: imageUrl, price: price || null, sale_tag: sale_tag || null, brand_primary: primary, brand_accent: accent, company }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to build prompt' }, { status: 500 });
  }
}
