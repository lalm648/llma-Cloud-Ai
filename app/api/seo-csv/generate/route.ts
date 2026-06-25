import type { NextRequest } from 'next/server';
import type { GenerateProductPayload, GenerateProductResult } from '@/lib/shopify-seo/types';

export const dynamic = 'force-dynamic';

const SEO_SYSTEM_PROMPT = `You are a Shopify SEO specialist for BlueSalon, a luxury retail store in Qatar.
Generate SEO-optimized content from product data. Return ONLY valid JSON — no markdown, no explanation.

STRICT OUTPUT SCHEMA:
{
  "optimized_handle": string | null,
  "seo_title": string | null,
  "seo_description": string | null,
  "body_html": string | null,
  "image_alt_text": string | null,
  "reasons": {
    "handle": string,
    "seo_title": string,
    "seo_description": string,
    "body_html": string,
    "image_alt_text": string
  }
}

HANDLE RULES (CRITICAL):
- If "optimized_handle" is in generate_fields you MUST return a new handle string — NEVER return null.
- Structure: brand-producttype-keyfeature-color  (e.g. cole-haan-grandpro-sneakers-white)
- lowercase only, hyphens only, NO spaces, NO special chars, NO apostrophes, NO quotes
- 3–7 meaningful SEO words, max 70 characters total
- BRAND NUMBERS: if the vendor is a number (e.g. vendor="81"), that number IS the brand — use it
  as the first segment: "81-ceramic-mug-eternal-legacy" NOT "official-81-..." or "qatar-..."
  Each product of the same brand must have a UNIQUE handle — use the product's own descriptive
  keywords (eternal-legacy, united-by-football, legends-never-fade) to differentiate, not the SKU
- SKU codes: if handle starts with an internal SKU/product-code (not the brand number), restructure it
- If handle_issue says "Too long": shorten — keep brand + product type + 1–2 key features only
- Append SKU at the END only if genuinely needed for uniqueness
- Do NOT include filler words: the, a, an, and, or, with, for, of, featuring, by, official

SEO TITLE RULES:
- 50–60 chars ideal, max 70. Include brand + product type. Natural, no keyword stuffing.

SEO DESCRIPTION RULES:
- HARD LIMIT ≤140 chars total. Brand + product type + one key benefit. Click-worthy.

BODY HTML RULES:
- Format: <p>Premium intro...</p><ul><li>Feature 1</li><li>Color/size if known</li></ul>
- 120–250 words, luxury retail tone. No invented specs, materials, or scent notes.

IMAGE ALT TEXT RULES:
- 6–12 descriptive words, no keyword stuffing.

GENERAL:
- For any field NOT in generate_fields: return null.
- Never invent materials, ingredients, warranty, country of origin unless in input data.`;

async function callGroq(
  product: GenerateProductPayload,
  apiKey: string,
): Promise<GenerateProductResult> {
  const userMsg = JSON.stringify({
    title:            product.title,
    vendor:           product.vendor,
    product_type:     product.productType,
    handle:           product.handle,
    handle_status:    product.handleStatus,   // 'ok' | 'weak' | 'sku_first'
    handle_issue:     product.handleWeakReason, // e.g. "Starts with a number" / "Too long (72 chars)"
    body_html:        product.bodyHtml,
    seo_title:        product.seoTitle,
    seo_description:  product.seoDescription,
    sku:              product.sku,
    color:            product.color,
    size:             product.size,
    tags:             product.tags,
    image_alt_text:   product.imageAltText,
    generate_fields:  product.generateFields,
  });

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SEO_SYSTEM_PROMPT },
        { role: 'user',   content: userMsg },
      ],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Groq ${resp.status}: ${body.slice(0, 120)}`);
  }

  const json = await resp.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = json.choices?.[0]?.message?.content;
  if (!raw) throw new Error('Empty Groq response');

  const parsed = JSON.parse(raw) as {
    optimized_handle?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
    body_html?: string | null;
    image_alt_text?: string | null;
    reasons?: Record<string, string>;
  };

  // Sanitise and enforce handle constraints
  let handle = parsed.optimized_handle ?? null;
  if (handle) {
    handle = handle
      .toLowerCase()
      .replace(/[^a-z0-9\-\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 70);
    if (!handle) handle = null;
  }

  // Hard-cap meta description at 140 chars, clean word boundary
  let seoDesc = parsed.seo_description ?? null;
  if (seoDesc && seoDesc.length > 140) {
    const trimmed = seoDesc.slice(0, 137);
    const lastSpace = trimmed.lastIndexOf(' ');
    seoDesc = (lastSpace > 80 ? trimmed.slice(0, lastSpace) : trimmed) + '...';
  }

  return {
    rowIndex:        product.rowIndex,
    success:         true,
    optimizedHandle: handle,
    seoTitle:        parsed.seo_title ?? null,
    seoDescription:  seoDesc,
    bodyHtml:        parsed.body_html ?? null,
    imageAltText:    parsed.image_alt_text ?? null,
    reasons: {
      handle:         parsed.reasons?.handle          ?? '',
      seoTitle:       parsed.reasons?.seo_title       ?? '',
      seoDescription: parsed.reasons?.seo_description ?? '',
      bodyHtml:       parsed.reasons?.body_html       ?? '',
      imageAltText:   parsed.reasons?.image_alt_text  ?? '',
    },
  };
}

export async function POST(request: NextRequest): Promise<Response> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
  }

  let body: { product?: GenerateProductPayload };
  try {
    body = await request.json() as { product?: GenerateProductPayload };
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { product } = body;
  if (!product?.title) {
    return Response.json({ error: 'Missing product data' }, { status: 400 });
  }

  try {
    const result = await callGroq(product, apiKey);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    const result: GenerateProductResult = {
      rowIndex: product.rowIndex,
      success:  false,
      error:    message,
      reasons:  {},
    };
    return Response.json(result, { status: 200 });
  }
}
