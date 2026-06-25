// ComfyUI local API — FLUX.1-schnell workflow
// Queues prompt → polls history → fetches output image as base64 data URL

function buildFluxWorkflow(
  prompt: string,
  width: number,
  height: number,
  seed: number,
): Record<string, unknown> {
  return {
    '6':  { inputs: { text: prompt, clip: ['11', 0] },                                                           class_type: 'CLIPTextEncode' },
    '8':  { inputs: { samples: ['13', 0], vae: ['10', 0] },                                                      class_type: 'VAEDecode' },
    '9':  { inputs: { filename_prefix: 'neogen', images: ['8', 0] },                                             class_type: 'SaveImage' },
    '10': { inputs: { vae_name: 'ae.safetensors' },                                                               class_type: 'VAELoader' },
    '11': { inputs: { clip_name1: 'clip_l.safetensors', clip_name2: 't5xxl_fp8_e4m3fn.safetensors', type: 'flux' }, class_type: 'DualCLIPLoader' },
    '12': { inputs: { unet_name: 'flux1-schnell.safetensors', weight_dtype: 'fp8_e4m3fn' },                       class_type: 'UNETLoader' },
    '13': { inputs: { noise: ['25', 0], guider: ['22', 0], sampler: ['16', 0], sigmas: ['17', 0], latent_image: ['27', 0] }, class_type: 'SamplerCustomAdvanced' },
    '16': { inputs: { sampler_name: 'euler' },                                                                    class_type: 'KSamplerSelect' },
    '17': { inputs: { model: ['12', 0], scheduler: 'simple', steps: 4, denoise: 1, max_shift: 1.15, base_shift: 0.5 }, class_type: 'BasicScheduler' },
    '22': { inputs: { model: ['12', 0], conditioning: ['6', 0] },                                                 class_type: 'BasicGuider' },
    '25': { inputs: { noise_seed: seed },                                                                         class_type: 'RandomNoise' },
    '27': { inputs: { width, height, batch_size: 1 },                                                             class_type: 'EmptySD3LatentImage' },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

export async function generateComfyUI(
  prompt: string,
  _negativePrompt: string,
  width: number,
  height: number,
  apiUrl: string,
): Promise<string> {
  const seed = Math.floor(Math.random() * 9_999_999_999);
  const workflow = buildFluxWorkflow(prompt, width, height, seed);

  const queueResp = await fetch(`${apiUrl}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow }),
  });

  if (!queueResp.ok) {
    throw new Error(`ComfyUI queue failed (${queueResp.status}). Is ComfyUI running at ${apiUrl}?`);
  }

  const { prompt_id: promptId } = await queueResp.json() as { prompt_id: string };
  if (!promptId) throw new Error('ComfyUI did not return a prompt_id');

  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    await sleep(2000);

    const histResp = await fetch(`${apiUrl}/history/${promptId}`);
    if (!histResp.ok) continue;

    const history = await histResp.json() as Record<string, {
      outputs?: Record<string, { images?: Array<{ filename: string; subfolder: string; type: string }> }>;
    }>;

    const result = history[promptId];
    if (!result?.outputs) continue;

    for (const output of Object.values(result.outputs)) {
      const img = output.images?.[0];
      if (!img) continue;

      const imgUrl = `${apiUrl}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder)}&type=${img.type}`;
      const imgResp = await fetch(imgUrl);
      if (!imgResp.ok) throw new Error('ComfyUI: failed to fetch output image');

      const blob = await imgResp.blob();
      const buffer = await blob.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:image/png;base64,${base64}`;
    }
  }

  throw new Error('ComfyUI: timed out after 120s waiting for output');
}
