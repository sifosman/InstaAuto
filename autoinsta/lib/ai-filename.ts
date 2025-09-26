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

function sanitizeWord(input: string): string {
  // Lowercase, keep only letters, collapse to a single token (no spaces/hyphens)
  const word = (input || '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '')
    .slice(0, 20);
  return word || 'image';
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
                `Return ONLY ONE WORD (lowercase letters only) that best describes the main subject of the image.\n` +
                `No spaces, no hyphens, no numbers, no punctuation, no quotes.\n` +
                `Examples: laptop, portrait, sneaker, skyline, salad.\n` +
                `Business: ${profile.company_name || ''}. Industry: ${profile.industry || ''}.\n` +
                `Key topics: ${(profile.key_topics || []).join(', ')}. Tone: ${profile.tone_style || ''}.\n` +
                `Brief: ${(profile.content_brief || '').slice(0, 200)}.`
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

    // Keep only the first token of letters
    const token = text.trim().split(/\s+/)[0] || '';
    return sanitizeWord(token);
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

  // Fallback to a single descriptive word (industry or first key topic)
  const fallbackBase = sanitizeWord(
    (profile.key_topics && profile.key_topics[0]) || profile.industry || 'image'
  );

  const base = aiName || fallbackBase;
  return `${base}_${ts}.${ext}`;
}
