import type { ImageType } from './types';

export const DEFAULT_NEG =
  'text, watermark, logo, blurry, out of focus, low quality, distorted, deformed, ugly, artifacts, noise, pixelated, overexposed, underexposed, grainy, duplicate, mutated';

const BLUESALON_STYLE =
  'premium luxury retail photography, clean white and deep navy background, elegant Qatar ecommerce aesthetic, soft studio shadows, minimal composition, high-end department store, polished product presentation';

const IMAGE_TYPE_SUFFIX: Record<ImageType, string> = {
  product:           'clean premium retail background, soft studio lighting, elegant composition, sharp details, high-end Shopify product photography',
  lifestyle:         'lifestyle setting, real-world environment, natural lighting, aspirational mood, in-use context',
  homepage_banner:   'wide panoramic hero banner, luxury ecommerce homepage, immersive brand story, high resolution',
  mobile_banner:     'mobile-optimized banner, bold composition, clear focal point, eye-catching design',
  collection_banner: 'wide collection banner, product range showcase, cohesive brand aesthetic, editorial style',
  social_post:       'social media post, bold visual impact, scroll-stopping composition, Instagram-ready, square format',
  google_display:    'Google Display Ad, clean layout, product-focused, high contrast, ad-ready design, no text',
};

type PromptFields = {
  brand: string;
  productTitle: string;
  category: string;
  color: string;
  material: string;
  style: string;
  background: string;
  imageType: ImageType;
};

export function buildPrompt(fields: PromptFields): string {
  const parts: string[] = [];

  const isBlueSalon =
    fields.brand.toLowerCase() === 'bluesalon' ||
    fields.brand.toLowerCase().includes('blue salon');

  if (isBlueSalon) {
    parts.push(BLUESALON_STYLE);
  } else {
    parts.push('luxury ecommerce product image');
    if (fields.brand)        parts.push(`for ${fields.brand}`);
  }

  if (fields.productTitle)   parts.push(`featuring ${fields.productTitle}`);
  if (fields.category)       parts.push(fields.category);
  if (fields.color)          parts.push(fields.color);
  if (fields.material)       parts.push(fields.material);
  if (fields.style)          parts.push(fields.style);
  if (fields.background)     parts.push(`${fields.background} background`);

  parts.push(IMAGE_TYPE_SUFFIX[fields.imageType]);
  parts.push('no text, no watermark, no logo');

  return parts.filter(Boolean).join(', ');
}
