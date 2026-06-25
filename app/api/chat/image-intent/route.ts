import type { NextRequest } from 'next/server';
import type { ImageIntentResult, ImageType } from '@/lib/image-gen/types';

export const dynamic = 'force-dynamic';

const SIZE_MAP: Record<string, { width: number; height: number }> = {
  '1920x720':  { width: 1920, height: 720  },
  '1920x600':  { width: 1920, height: 600  },
  '1024x720':  { width: 1024, height: 720  },
  '1024x1024': { width: 1024, height: 1024 },
  '1080x1080': { width: 1080, height: 1080 },
  '1080x1920': { width: 1080, height: 1920 },
  '1200x628':  { width: 1200, height: 628  },
  '300x250':   { width: 300,  height: 250  },
  '336x280':   { width: 336,  height: 280  },
  '728x90':    { width: 728,  height: 90   },
  '300x600':   { width: 300,  height: 600  },
};

function detectSize(text: string): { width: number; height: number } {
  const m = text.match(/(\d{3,4})[xX×](\d{2,4})/);
  if (m) return { width: parseInt(m[1]), height: parseInt(m[2]) };

  const t = text.toLowerCase();
  if (t.includes('homepage') || t.includes('hero banner'))     return SIZE_MAP['1920x720'];
  if (t.includes('collection banner'))                          return SIZE_MAP['1920x600'];
  if (t.includes('mobile banner'))                              return SIZE_MAP['1024x720'];
  if (t.includes('instagram story') || t.includes('story'))    return SIZE_MAP['1080x1920'];
  if (t.includes('instagram') || t.includes('square'))         return SIZE_MAP['1080x1080'];
  if (t.includes('facebook') || t.includes('fb ad'))           return SIZE_MAP['1200x628'];
  if (t.includes('google') || t.includes('display ad'))        return SIZE_MAP['300x250'];
  return SIZE_MAP['1024x1024'];
}

function detectImageType(text: string): ImageType {
  const t = text.toLowerCase();
  if (t.includes('homepage') || t.includes('hero banner'))     return 'homepage_banner';
  if (t.includes('collection banner'))                          return 'collection_banner';
  if (t.includes('mobile banner'))                              return 'mobile_banner';
  if (t.includes('lifestyle'))                                  return 'lifestyle';
  if (t.includes('instagram') || t.includes('facebook') || t.includes('social')) return 'social_post';
  if (t.includes('google') || t.includes('display ad'))        return 'google_display';
  if (t.includes('banner'))                                     return 'homepage_banner';
  return 'product';
}

const IMAGE_INTENT_RE =
  /\b(generate|create|make|design|produce)\b.{0,80}\b(image|photo|banner|poster|picture|visual|graphic|ad)\b/i;

async function extractWithGroq(message: string, apiKey: string): Promise<ImageIntentResult> {
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      max_tokens: 250,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Extract image generation parameters from the user message. Return JSON matching this exact schema:
{
  "isImageRequest": boolean,
  "imageType": "product"|"lifestyle"|"homepage_banner"|"mobile_banner"|"collection_banner"|"social_post"|"google_display",
  "brand": string,
  "product": string,
  "width": number,
  "height": number,
  "prompt": string
}
Default sizes: homepage=1920×720, collection=1920×600, mobile=1024×720, instagram=1080×1080, facebook=1200×628, google_display=300×250, default=1024×1024.
If not an image request return {"isImageRequest":false,"imageType":"product","brand":"","product":"","width":1024,"height":1024,"prompt":""}`,
        },
        { role: 'user', content: message },
      ],
    }),
  });

  if (!resp.ok) throw new Error('Groq extraction failed');
  const json = await resp.json() as { choices?: Array<{ message?: { content?: string } }> };
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty Groq response');
  return JSON.parse(raw) as ImageIntentResult;
}

export async function POST(request: NextRequest): Promise<Response> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ success: false, error: 'GROQ_API_KEY not set' }, { status: 500 });
  }

  let body: { message?: string };
  try { body = await request.json() as { message?: string }; }
  catch { return Response.json({ isImageRequest: false }); }

  const message = body.message?.trim();
  if (!message) return Response.json({ isImageRequest: false });

  // Fast path: skip Groq if no image keywords
  if (!IMAGE_INTENT_RE.test(message)) {
    return Response.json({ isImageRequest: false } satisfies Partial<ImageIntentResult>);
  }

  try {
    const result = await extractWithGroq(message, apiKey);

    // Override size from raw text if Groq left default
    if (result.isImageRequest && result.width === 1024 && result.height === 1024) {
      const detected = detectSize(message);
      result.width  = detected.width;
      result.height = detected.height;
      if (!result.imageType || result.imageType === 'product') {
        result.imageType = detectImageType(message);
      }
    }
    return Response.json(result);
  } catch {
    // Regex fallback
    const size = detectSize(message);
    return Response.json({
      isImageRequest: true,
      imageType:      detectImageType(message),
      brand:          '',
      product:        '',
      width:          size.width,
      height:         size.height,
      prompt:         message,
    } satisfies ImageIntentResult);
  }
}
