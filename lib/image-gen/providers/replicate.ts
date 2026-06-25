// Replicate API — FLUX.1-schnell
// Uses Prefer: wait=60 for synchronous response; falls back to polling
// Returns a remote image URL

const POLL_INTERVAL_MS = 2000;
const MAX_WAIT_MS = 120_000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateReplicate(
  prompt: string,
  negativePrompt: string,
  width: number,
  height: number,
  apiToken: string,
): Promise<string> {
  // Snap to multiples of 16 (Replicate requirement)
  const snap = (n: number) => Math.round(n / 16) * 16;

  const createResp = await fetch(
    'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        Prefer: 'wait=60',
      },
      body: JSON.stringify({
        input: {
          prompt,
          width:  snap(width),
          height: snap(height),
          num_outputs: 1,
          num_inference_steps: 4,
          output_format: 'png',
          output_quality: 90,
          go_fast: true,
          disable_safety_checker: true,
        },
      }),
    },
  );

  if (!createResp.ok) {
    const body = await createResp.text().catch(() => '');
    throw new Error(`Replicate ${createResp.status}: ${body.slice(0, 200)}`);
  }

  const prediction = await createResp.json() as {
    id: string;
    status: string;
    output?: string[];
    error?: string;
    urls?: { get: string };
  };

  if (prediction.status === 'succeeded' && prediction.output?.[0]) {
    return prediction.output[0];
  }
  if (prediction.error) throw new Error(`Replicate: ${prediction.error}`);

  // Poll until done
  const pollUrl = prediction.urls?.get
    ?? `https://api.replicate.com/v1/predictions/${prediction.id}`;
  const deadline = Date.now() + MAX_WAIT_MS;

  while (Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);

    const poll = await fetch(pollUrl, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });
    if (!poll.ok) continue;

    const result = await poll.json() as {
      status: string;
      output?: string[];
      error?: string;
    };

    if (result.status === 'succeeded' && result.output?.[0]) return result.output[0];
    if (result.status === 'failed') throw new Error(`Replicate failed: ${result.error ?? 'unknown'}`);
  }

  throw new Error('Replicate: timed out waiting for image');
}
