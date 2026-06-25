// HuggingFace image generation — two routing paths:
//
// 1. FLUX.1-schnell (balanced / fast):
//    Direct fetch → router.huggingface.co/hf-inference/models/{model}
//    api-inference.huggingface.co is DNS-blocked on this machine; router.huggingface.co works.
//
// 2. FLUX.2-dev (premium quality):
//    Python FastAPI worker → POST {FASTAPI_WORKER_URL}/generate-image
//    Worker uses InferenceClient(provider="fal-ai") which handles fal-ai routing correctly.
//    Falls back to FLUX.1-schnell×28 if the worker is unreachable.

export type HFGenerateOptions = {
  modelId: string;
  steps: number;
};

const TIMEOUT_MS = 150_000; // 2.5 min — covers cold-start + generation

// ─── HF router path (FLUX.1-schnell) ─────────────────────────────────────────

async function hfFetch(
  modelId: string,
  body: string,
  headers: Record<string, string>,
): Promise<Response> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(
      `https://router.huggingface.co/hf-inference/models/${modelId}`,
      { method: 'POST', headers, body, signal: ctrl.signal },
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('HuggingFace request timed out after 2.5 min. Try again shortly.');
    }
    const cause    = (err as { cause?: unknown }).cause;
    const causeMsg = cause instanceof Error ? cause.message : cause != null ? String(cause) : '';
    const baseMsg  = err instanceof Error ? err.message : String(err);
    const detail   = causeMsg && causeMsg !== baseMsg ? `${baseMsg} → ${causeMsg}` : baseMsg;
    throw new Error(`HuggingFace network error: ${detail}`);
  } finally {
    clearTimeout(timer);
  }
}

async function generateSchnell(
  prompt: string,
  negativePrompt: string,
  width: number,
  height: number,
  apiKey: string,
  steps: number,
): Promise<string> {
  const modelId = 'black-forest-labs/FLUX.1-schnell';
  // FLUX.1-schnell via hf-inference requires 32px grid + 1024 cap
  const snap = (n: number) => Math.round(Math.min(n, 1024) / 32) * 32;

  const headers: Record<string, string> = {
    Authorization:  `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const bodyJson = JSON.stringify({
    inputs: prompt,
    parameters: {
      negative_prompt:     negativePrompt || undefined,
      width:               snap(width),
      height:              snap(height),
      num_inference_steps: steps,
      guidance_scale:      0,
    },
  });

  let resp = await hfFetch(modelId, bodyJson, headers);

  // Auto-retry once on 503 (model cold-starting)
  if (resp.status === 503) {
    const info = await resp.json().catch(() => ({})) as { estimated_time?: number };
    const wait = Math.min(Math.ceil((info.estimated_time ?? 20) * 1000), 30_000);
    await new Promise(r => setTimeout(r, wait));
    resp = await hfFetch(modelId, bodyJson, headers);
    if (resp.status === 503) {
      throw new Error('HuggingFace model is still loading. Please retry in ~30 seconds.');
    }
  }

  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`HuggingFace ${resp.status} (${modelId}): ${body.slice(0, 300)}`);
  }

  const blob   = await resp.blob();
  const buffer = await blob.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  const mime   = blob.type || 'image/jpeg';
  return `data:${mime};base64,${base64}`;
}

// ─── FastAPI worker path (FLUX.2-dev via fal-ai) ─────────────────────────────

async function generateViaWorker(
  prompt: string,
  negativePrompt: string,
  width: number,
  height: number,
  workerUrl: string,
  options: HFGenerateOptions,
): Promise<string> {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const resp = await fetch(`${workerUrl}/generate-image`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        prompt,
        negative_prompt:     negativePrompt || '',
        width,
        height,
        num_inference_steps: options.steps,
        model:               options.modelId,
        provider:            'fal-ai',
        guidance_scale:      3.5,
      }),
      signal: ctrl.signal,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`FastAPI worker ${resp.status}: ${text.slice(0, 200)}`);
    }

    const data = await resp.json() as { url?: string };
    if (!data.url) throw new Error('FastAPI worker returned no image URL');
    return data.url;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('FastAPI worker timed out after 2.5 min.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function generateHuggingFace(
  prompt: string,
  negativePrompt: string,
  width: number,
  height: number,
  apiKey: string,
  options: HFGenerateOptions = {
    modelId: 'black-forest-labs/FLUX.1-schnell',
    steps: 4,
  },
): Promise<string> {
  const { modelId, steps } = options;

  // FLUX.2-dev: route through the Python FastAPI worker which uses
  // InferenceClient(provider="fal-ai") — the Python SDK does correct
  // fal-ai endpoint resolution that raw fetch cannot replicate.
  if (modelId === 'black-forest-labs/FLUX.2-dev') {
    const workerUrl = process.env.FASTAPI_WORKER_URL;
    if (workerUrl) {
      try {
        return await generateViaWorker(prompt, negativePrompt, width, height, workerUrl, options);
      } catch (workerErr) {
        // Worker unreachable or failed — fall back to FLUX.1-schnell×28 with a warning prefix
        const reason = workerErr instanceof Error ? workerErr.message : String(workerErr);
        console.warn(`[image-gen] FastAPI worker unavailable (${reason}), falling back to FLUX.1-schnell×28`);
        return generateSchnell(prompt, negativePrompt, width, height, apiKey, 28);
      }
    }
    // No worker URL configured — fall back silently
    return generateSchnell(prompt, negativePrompt, width, height, apiKey, 28);
  }

  // All other models (FLUX.1-schnell): direct HF router
  return generateSchnell(prompt, negativePrompt, width, height, apiKey, steps);
}
