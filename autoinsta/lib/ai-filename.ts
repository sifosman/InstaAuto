import { createClient } from '@supabase/supabase-js';

export type BusinessProfile = {
  company_name?: string | null;
  industry?: string | null;
  key_topics?: string[] | null;
  tone_style?: string | null;
  content_brief?: string | null;
};

function guessExt(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  return 'webp';
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function getBusinessProfile() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE!;
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await supabase.from('business_profile').select('*').limit(1).maybeSingle();
  return (data || {}) as BusinessProfile;
}

async function callGeminiForFilename(base64: string, mimeType: string, profile: BusinessProfile): Promise<string | null> {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!GEMINI_API_KEY) return null;

    // Using Gemini 1.5 flash or image-preview endpoint format
    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: { mimeType, data: base64 }
            },
            {
              text:
                `You will receive an image and business context.\n` +
                `Your task: return ONLY a short, SEO-friendly filename (no spaces, use hyphens).\n` +
                `Do not include an extension. Do not include quotes or extra words.\n` +
                `Structure: {industry-context}_{main-subject}_{content-angle}.\n` +
                `Example: marketing-agency_client-presentation_business-growth-strategies.\n` +
                `Business: ${profile.company_name || ''}. Industry: ${profile.industry || ''}.\n` +
                `Key topics: ${(profile.key_topics || []).join(', ')}. Tone: ${profile.tone_style || ''}.\n` +
                `Brief: ${(profile.content_brief || '').slice(0, 400)}.`
            }
          ]
        }
      ]
    };

    const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const json = await resp.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) return null;

    // Extract a single line, sanitize
    const cleaned = text
      .trim()
      .replace(/^```[a-z]*\n?/i, '')
      .replace(/```$/i, '')
      .split(/\r?\n/)[0]
      .trim();

    return slugify(cleaned);
  } catch {
    return null;
  }
}

export async function generateSmartFilename(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);
  const base64 = buf.toString('base64');
  const ext = guessExt(file.type || 'image/webp');
  const ts = Date.now();

  const profile = await getBusinessProfile();
  const aiName = await callGeminiForFilename(base64, file.type || 'image/webp', profile);

  // Fallback to company/industry + original name stub
  const fallbackBase = slugify(
    [profile.industry || 'brand', file.name.replace(/\.[a-z0-9]+$/i, '')]
      .filter(Boolean)
      .join('-')
  ) || 'upload';

  const base = aiName || fallbackBase;
  return `${base}_${ts}.${ext}`;
}
