import type { ImageProvider, ModelConfig } from '../types';
import { generateHuggingFace } from './huggingface';
import { generateReplicate }   from './replicate';
import { generateFal }         from './fal';
import { generateComfyUI }     from './comfyui';

export async function generateImageURL(
  provider: ImageProvider,
  prompt: string,
  negativePrompt: string,
  width: number,
  height: number,
  modelConfig?: ModelConfig,
): Promise<string> {
  switch (provider) {
    case 'huggingface': {
      const key = process.env.HUGGINGFACE_API_KEY;
      if (!key) throw new Error('HUGGINGFACE_API_KEY is not set');
      return generateHuggingFace(prompt, negativePrompt, width, height, key, modelConfig
        ? { modelId: modelConfig.modelId, steps: modelConfig.steps }
        : undefined,
      );
    }
    case 'replicate': {
      const token = process.env.REPLICATE_API_TOKEN;
      if (!token) throw new Error('REPLICATE_API_TOKEN is not set');
      return generateReplicate(prompt, negativePrompt, width, height, token);
    }
    case 'fal': {
      const key = process.env.FAL_KEY;
      if (!key) throw new Error('FAL_KEY is not set');
      return generateFal(prompt, negativePrompt, width, height, key);
    }
    case 'comfyui': {
      const url = process.env.COMFYUI_API_URL ?? 'http://localhost:8188';
      return generateComfyUI(prompt, negativePrompt, width, height, url);
    }
    default:
      throw new Error(`Unknown provider: ${String(provider)}`);
  }
}

export type ProviderStatus = { provider: ImageProvider; label: string; envVar: string; available: boolean };

export function getProviderStatuses(): ProviderStatus[] {
  return [
    { provider: 'huggingface', label: 'HuggingFace (FLUX.1 + FLUX.2)', envVar: 'HUGGINGFACE_API_KEY',  available: Boolean(process.env.HUGGINGFACE_API_KEY) },
    { provider: 'replicate',   label: 'Replicate (FLUX.1-schnell)',     envVar: 'REPLICATE_API_TOKEN',  available: Boolean(process.env.REPLICATE_API_TOKEN) },
    { provider: 'fal',         label: 'Fal.ai (FLUX Schnell)',          envVar: 'FAL_KEY',              available: Boolean(process.env.FAL_KEY) },
    { provider: 'comfyui',     label: 'ComfyUI (Local)',                envVar: 'COMFYUI_API_URL',      available: true },
  ];
}
