export type ImageProvider = 'huggingface' | 'replicate' | 'fal' | 'comfyui';

export type ImageType =
  | 'product'
  | 'lifestyle'
  | 'homepage_banner'
  | 'mobile_banner'
  | 'collection_banner'
  | 'social_post'
  | 'google_display';

export type SizePreset = {
  key: string;
  label: string;
  width: number;
  height: number;
  category: 'product' | 'banner' | 'social' | 'google';
};

export const SIZE_PRESETS: SizePreset[] = [
  { key: 'product_sq',      label: 'Product Square',    width: 1024, height: 1024, category: 'product' },
  { key: 'homepage',        label: 'Homepage Banner',   width: 1920, height: 720,  category: 'banner'  },
  { key: 'collection',      label: 'Collection Banner', width: 1920, height: 600,  category: 'banner'  },
  { key: 'mobile_banner',   label: 'Mobile Banner',     width: 1024, height: 720,  category: 'banner'  },
  { key: 'instagram_post',  label: 'Instagram Post',    width: 1080, height: 1080, category: 'social'  },
  { key: 'instagram_story', label: 'Instagram Story',   width: 1080, height: 1920, category: 'social'  },
  { key: 'facebook_ad',     label: 'Facebook Ad',       width: 1200, height: 628,  category: 'social'  },
  { key: 'google_300x250',  label: 'Google 300×250',    width: 300,  height: 250,  category: 'google'  },
  { key: 'google_336x280',  label: 'Google 336×280',    width: 336,  height: 280,  category: 'google'  },
  { key: 'google_728x90',   label: 'Google 728×90',     width: 728,  height: 90,   category: 'google'  },
  { key: 'google_300x600',  label: 'Google 300×600',    width: 300,  height: 600,  category: 'google'  },
  { key: 'google_320x100',  label: 'Google 320×100',    width: 320,  height: 100,  category: 'google'  },
  { key: 'google_970x250',  label: 'Google 970×250',    width: 970,  height: 250,  category: 'google'  },
];

// ─── Quality profiles ─────────────────────────────────────────────────────────

export type QualityProfile = 'auto' | 'premium' | 'balanced' | 'fast';

export type ModelConfig = {
  modelId: string;
  steps: number;
  label: string;
};

export const QUALITY_CONFIGS: Record<Exclude<QualityProfile, 'auto'>, ModelConfig> = {
  premium:  { modelId: 'black-forest-labs/FLUX.2-dev',     steps: 28, label: 'FLUX.2-dev via fal-ai' },
  balanced: { modelId: 'black-forest-labs/FLUX.1-schnell', steps: 8,  label: 'FLUX.1-schnell ×8' },
  fast:     { modelId: 'black-forest-labs/FLUX.1-schnell', steps: 4,  label: 'FLUX.1-schnell ×4' },
};

export const AUTO_QUALITY_MAP: Record<ImageType, Exclude<QualityProfile, 'auto'>> = {
  homepage_banner:   'premium',
  collection_banner: 'premium',
  lifestyle:         'premium',
  social_post:       'balanced',
  product:           'balanced',
  mobile_banner:     'fast',
  google_display:    'fast',
};

export function resolveQuality(
  profile: QualityProfile,
  imageType: ImageType,
): ModelConfig {
  const key = profile === 'auto' ? AUTO_QUALITY_MAP[imageType] : profile;
  return QUALITY_CONFIGS[key];
}

export type GenerateImagePayload = {
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  provider: ImageProvider;
  qualityProfile: QualityProfile;
  numImages: number;
  imageType: ImageType;
  brand: string;
  productTitle: string;
};

export type GeneratedImage = {
  id: string;
  url: string;
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  provider: ImageProvider;
  imageType: ImageType;
  brand: string;
  productTitle: string;
  createdAt: string;
};

export type GenerateImageResult = {
  success: boolean;
  images: GeneratedImage[];
  error?: string;
};

export type ImageIntentResult = {
  isImageRequest: boolean;
  imageType: ImageType;
  brand: string;
  product: string;
  width: number;
  height: number;
  prompt: string;
};
