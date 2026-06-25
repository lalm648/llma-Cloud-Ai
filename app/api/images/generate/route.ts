import type { NextRequest } from 'next/server';
import type { GenerateImagePayload, GenerateImageResult, GeneratedImage } from '@/lib/image-gen/types';
import { resolveQuality } from '@/lib/image-gen/types';
import { generateImageURL } from '@/lib/image-gen/providers';

export const dynamic = 'force-dynamic';

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function POST(request: NextRequest): Promise<Response> {
  let payload: GenerateImagePayload;
  try {
    payload = await request.json() as GenerateImagePayload;
  } catch {
    return Response.json({ success: false, images: [], error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    prompt,
    negativePrompt = '',
    width         = 1024,
    height        = 1024,
    provider,
    qualityProfile = 'balanced',
    numImages     = 1,
    imageType,
    brand         = '',
    productTitle  = '',
  } = payload;

  if (!prompt?.trim()) {
    return Response.json({ success: false, images: [], error: 'Prompt is required' }, { status: 400 });
  }
  if (!provider) {
    return Response.json({ success: false, images: [], error: 'Provider is required' }, { status: 400 });
  }

  // Resolve which model + steps to use
  const modelConfig = resolveQuality(qualityProfile, imageType);

  const count     = Math.max(1, Math.min(numImages, 4));
  const createdAt = new Date().toISOString();

  const results = await Promise.allSettled(
    Array.from({ length: count }, () =>
      generateImageURL(provider, prompt.trim(), negativePrompt, width, height, modelConfig),
    ),
  );

  const images: GeneratedImage[] = [];
  const errors: string[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      images.push({
        id: nanoid(),
        url: result.value,
        prompt: prompt.trim(),
        negativePrompt,
        width,
        height,
        provider,
        imageType,
        brand,
        productTitle,
        createdAt,
      });
    } else {
      const msg = result.reason instanceof Error ? result.reason.message : String(result.reason);
      errors.push(msg);
    }
  }

  if (images.length === 0) {
    return Response.json({
      success: false,
      images: [],
      error: errors[0] ?? 'All generation attempts failed',
    } satisfies GenerateImageResult);
  }

  return Response.json({
    success: true,
    images,
    error: errors.length > 0 ? `${errors.length} of ${count} image(s) failed` : undefined,
  } satisfies GenerateImageResult);
}
