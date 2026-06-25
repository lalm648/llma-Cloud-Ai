// Fal.ai — FLUX Schnell
// Direct synchronous call, returns remote image URL

export async function generateFal(
  prompt: string,
  negativePrompt: string,
  width: number,
  height: number,
  apiKey: string,
): Promise<string> {
  const resp = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: { width, height },
      num_images: 1,
      num_inference_steps: 4,
      enable_safety_checker: false,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`Fal.ai ${resp.status}: ${body.slice(0, 200)}`);
  }

  const result = await resp.json() as {
    images?: Array<{ url: string }>;
    error?: string;
  };

  const url = result.images?.[0]?.url;
  if (!url) throw new Error('Fal.ai returned no image URL');
  return url;
}
