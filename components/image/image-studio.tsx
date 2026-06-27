'use client';

import { useState, useEffect } from 'react';
import {
  Download, RefreshCw, Copy, Loader2, Trash2,
  Image as ImageIcon, Wand2, ChevronDown, ChevronUp,
  CheckCircle2, AlertCircle, Inbox,
} from 'lucide-react';
import { Button }   from '@/components/ui/button';
import { Card }     from '@/components/ui/card';
import { Input }    from '@/components/ui/input';
import { Select }   from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn }       from '@/lib/utils';
import { SIZE_PRESETS } from '@/lib/image-gen/types';
import type { ImageProvider, ImageType, GeneratedImage, GenerateImageResult, SizePreset, QualityProfile } from '@/lib/image-gen/types';
import { AUTO_QUALITY_MAP, QUALITY_CONFIGS } from '@/lib/image-gen/types';
import { buildPrompt, DEFAULT_NEG } from '@/lib/image-gen/prompt-builder';

// ─── Tab configuration ────────────────────────────────────────────────────────

type TabKey =
  | 'product' | 'lifestyle' | 'homepage_banner' | 'mobile_banner'
  | 'collection_banner' | 'social_post' | 'google_display'
  | 'custom_prompt' | 'history' | 'settings';

type TabConfig = {
  key: TabKey;
  label: string;
  imageType?: ImageType;
  defaultWidth: number;
  defaultHeight: number;
  presetKeys: string[];
};

const TABS: TabConfig[] = [
  { key: 'product',           label: 'Product Image',     imageType: 'product',           defaultWidth: 1024, defaultHeight: 1024, presetKeys: ['product_sq'] },
  { key: 'lifestyle',         label: 'Lifestyle Image',   imageType: 'lifestyle',         defaultWidth: 1024, defaultHeight: 1024, presetKeys: ['product_sq', 'instagram_post'] },
  { key: 'homepage_banner',   label: 'Homepage Banner',   imageType: 'homepage_banner',   defaultWidth: 1920, defaultHeight: 720,  presetKeys: ['homepage'] },
  { key: 'mobile_banner',     label: 'Mobile Banner',     imageType: 'mobile_banner',     defaultWidth: 1024, defaultHeight: 720,  presetKeys: ['mobile_banner'] },
  { key: 'collection_banner', label: 'Collection Banner', imageType: 'collection_banner', defaultWidth: 1920, defaultHeight: 600,  presetKeys: ['collection'] },
  { key: 'social_post',       label: 'Social Post',       imageType: 'social_post',       defaultWidth: 1080, defaultHeight: 1080, presetKeys: ['instagram_post', 'instagram_story', 'facebook_ad'] },
  { key: 'google_display',    label: 'Google Display',    imageType: 'google_display',    defaultWidth: 300,  defaultHeight: 250,  presetKeys: ['google_300x250', 'google_336x280', 'google_728x90', 'google_300x600', 'google_320x100', 'google_970x250'] },
  { key: 'custom_prompt',     label: 'Custom Prompt',     defaultWidth: 1024,             defaultHeight: 1024, presetKeys: ['product_sq', 'homepage', 'collection', 'instagram_post', 'instagram_story', 'facebook_ad', 'mobile_banner'] },
  { key: 'history',           label: 'Image History',     defaultWidth: 1024,             defaultHeight: 1024, presetKeys: [] },
  { key: 'settings',          label: 'Provider Settings', defaultWidth: 1024,             defaultHeight: 1024, presetKeys: [] },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  brand: string;
  productTitle: string;
  category: string;
  color: string;
  material: string;
  style: string;
  background: string;
  width: number;
  height: number;
  prompt: string;
  negativePrompt: string;
  numImages: number;
  provider: ImageProvider;
  qualityProfile: QualityProfile;
};

type GenState = {
  status: 'idle' | 'generating' | 'done' | 'error';
  images: GeneratedImage[];
  error?: string;
};

// ─── localStorage helpers ─────────────────────────────────────────────────────

const HISTORY_KEY  = 'neogen_image_history';
const PROVIDER_KEY = 'neogen_image_provider';

function loadHistory(): GeneratedImage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as GeneratedImage[]) : [];
  } catch { return []; }
}

function saveToHistory(images: GeneratedImage[]): void {
  try {
    const existing = loadHistory();
    const combined = [...images, ...existing].slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(combined));
  } catch { /* localStorage full */ }
}

// ─── Download helper ──────────────────────────────────────────────────────────

function downloadImage(url: string, filename: string): void {
  if (url.startsWith('data:')) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    window.open(url, '_blank');
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function IdleState() {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
      <ImageIcon className="mb-3 h-10 w-10 opacity-30" />
      <p className="text-sm">Fill in details and click Generate</p>
      <p className="mt-1 text-xs opacity-60">Supports Hugging Face, Replicate, Fal.ai, ComfyUI</p>
    </div>
  );
}

function LoadingState({ provider }: { provider: ImageProvider }) {
  const labels: Record<ImageProvider, string> = {
    huggingface: 'HuggingFace FLUX.1 / FLUX.2',
    replicate:   'Replicate FLUX Schnell',
    fal:         'Fal.ai FLUX Schnell',
    comfyui:     'ComfyUI (local)',
  };
  const timing: Record<ImageProvider, string> = {
    huggingface: 'Cold start: up to 2 min · Warm: 10–30 s',
    replicate:   '10–30 seconds',
    fal:         '5–15 seconds',
    comfyui:     'Depends on local hardware',
  };
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border">
      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-70" />
      <p className="text-sm font-medium">Generating image…</p>
      <p className="text-xs text-muted-foreground">{labels[provider]}</p>
      <p className="text-xs text-muted-foreground opacity-60">{timing[provider]}</p>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
      <AlertCircle className="h-8 w-8 text-destructive opacity-70" />
      <p className="text-sm font-medium text-destructive">{error}</p>
      <Button size="sm" variant="outline" onClick={onRetry} type="button" className="gap-1">
        <RefreshCw className="h-3 w-3" /> Retry
      </Button>
    </div>
  );
}

function ImageCard({
  img,
  copiedId,
  onDownload,
  onCopy,
  onSave,
}: {
  img: GeneratedImage;
  copiedId: string | null;
  onDownload: (url: string, name: string) => void;
  onCopy: (prompt: string, id: string) => void;
  onSave: (img: GeneratedImage) => void;
}) {
  const filename = `${img.productTitle || img.brand || 'neogen'}-${img.width}x${img.height}.png`.replace(/\s+/g, '-').toLowerCase();
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative bg-muted">
        <img
          src={img.url}
          alt={img.productTitle || 'Generated image'}
          className="w-full object-contain"
          style={{ aspectRatio: `${img.width}/${img.height}`, maxHeight: 420 }}
        />
        <span className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
          {img.width}×{img.height}
        </span>
        <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-xs capitalize text-white">
          {img.provider}
        </span>
      </div>
      <div className="p-3">
        {img.productTitle && (
          <p className="truncate text-sm font-medium">{img.productTitle}</p>
        )}
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{img.prompt}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm" variant="secondary" type="button"
            className="h-7 gap-1 text-xs"
            onClick={() => onDownload(img.url, filename)}
          >
            <Download className="h-3 w-3" /> Download
          </Button>
          <Button
            size="sm" variant="ghost" type="button"
            className="h-7 gap-1 text-xs"
            onClick={() => onCopy(img.prompt, img.id)}
          >
            {copiedId === img.id
              ? <CheckCircle2 className="h-3 w-3 text-green-500" />
              : <Copy className="h-3 w-3" />}
            {copiedId === img.id ? 'Copied' : 'Prompt'}
          </Button>
          <Button
            size="sm" variant="ghost" type="button"
            className="h-7 gap-1 text-xs"
            onClick={() => onSave(img)}
          >
            + History
          </Button>
        </div>
      </div>
    </div>
  );
}

function ImageGrid({
  images, copiedId, onDownload, onCopy, onSave, onRegenerate,
}: {
  images: GeneratedImage[];
  copiedId: string | null;
  onDownload: (url: string, name: string) => void;
  onCopy: (prompt: string, id: string) => void;
  onSave: (img: GeneratedImage) => void;
  onRegenerate: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {images.length} image{images.length !== 1 ? 's' : ''} generated
        </span>
        <Button size="sm" variant="ghost" type="button" onClick={onRegenerate} className="gap-1">
          <RefreshCw className="h-3 w-3" /> Regenerate
        </Button>
      </div>
      <div className={cn('grid gap-3', images.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1')}>
        {images.map(img => (
          <ImageCard
            key={img.id}
            img={img}
            copiedId={copiedId}
            onDownload={onDownload}
            onCopy={onCopy}
            onSave={onSave}
          />
        ))}
      </div>
    </div>
  );
}

function HistoryPanel({
  history,
  copiedId,
  onDelete,
  onCopy,
  onDownload,
}: {
  history: GeneratedImage[];
  copiedId: string | null;
  onDelete: (id: string) => void;
  onCopy: (prompt: string, id: string) => void;
  onDownload: (url: string, name: string) => void;
}) {
  if (history.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Inbox className="h-10 w-10 opacity-30" />
        <p className="text-sm">No images saved yet</p>
        <p className="text-xs opacity-60">Generate images and click &ldquo;+ History&rdquo; to save them</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{history.length} saved image{history.length !== 1 ? 's' : ''} (last 20)</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {history.map(img => {
          const filename = `${img.productTitle || img.brand || 'neogen'}-${img.width}x${img.height}.png`.replace(/\s+/g, '-').toLowerCase();
          return (
            <div key={img.id} className="overflow-hidden rounded-lg border border-border bg-card">
              <div className="relative bg-muted">
                <img
                  src={img.url}
                  alt={img.productTitle || 'Saved image'}
                  className="w-full object-contain"
                  style={{ aspectRatio: `${img.width}/${img.height}`, maxHeight: 200 }}
                />
                <span className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                  {img.width}×{img.height}
                </span>
              </div>
              <div className="p-3">
                {img.productTitle && (
                  <p className="truncate text-xs font-medium">{img.productTitle}</p>
                )}
                <p className="mt-0.5 truncate text-xs text-muted-foreground capitalize">
                  {img.provider} · {new Date(img.createdAt).toLocaleDateString()}
                </p>
                <div className="mt-2 flex gap-1.5">
                  <Button size="sm" variant="secondary" type="button" className="h-6 gap-1 text-xs"
                    onClick={() => onDownload(img.url, filename)}>
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" type="button" className="h-6 gap-1 text-xs"
                    onClick={() => onCopy(img.prompt, img.id)}>
                    {copiedId === img.id ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="ghost" type="button" className="h-6 gap-1 text-xs text-destructive hover:text-destructive"
                    onClick={() => onDelete(img.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettingsPanel({ currentProvider, onSet }: { currentProvider: ImageProvider; onSet: (p: ImageProvider) => void }) {
  const providers: Array<{
    key: ImageProvider;
    label: string;
    model: string;
    speed: string;
    sizes: string;
    envVar: string;
    docsUrl: string;
  }> = [
    { key: 'huggingface', label: 'HuggingFace',  model: 'FLUX.1-schnell', speed: 'Fast',    sizes: 'Up to 1024×1024', envVar: 'HUGGINGFACE_API_KEY',  docsUrl: 'https://huggingface.co/settings/tokens' },
    { key: 'replicate',   label: 'Replicate',     model: 'FLUX.1-schnell', speed: 'Fast',    sizes: 'Any (multiples of 16)', envVar: 'REPLICATE_API_TOKEN',  docsUrl: 'https://replicate.com/account/api-tokens' },
    { key: 'fal',         label: 'Fal.ai',        model: 'FLUX Schnell',   speed: 'Fastest', sizes: 'Any size',        envVar: 'FAL_KEY',              docsUrl: 'https://fal.ai/dashboard/keys' },
    { key: 'comfyui',     label: 'ComfyUI Local', model: 'FLUX.1-schnell', speed: 'Varies',  sizes: 'Any size',        envVar: 'COMFYUI_API_URL',      docsUrl: 'https://github.com/comfyanonymous/ComfyUI' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Configure image generation providers. Set API keys in your <code className="rounded bg-muted px-1 text-xs">.env</code> file.
        Your default provider is saved in the browser.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {providers.map(p => (
          <div
            key={p.key}
            className={cn(
              'rounded-lg border p-4 transition-colors',
              currentProvider === p.key ? 'border-primary bg-primary/5' : 'border-border',
            )}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.model}</p>
              </div>
              {currentProvider === p.key && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Default</span>
              )}
            </div>
            <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Speed: {p.speed}</span>
              <span>Sizes: {p.sizes}</span>
            </div>
            <p className="mb-3 rounded bg-muted px-2 py-1 font-mono text-xs">{p.envVar}=your_key</p>
            <div className="flex gap-2">
              <Button
                size="sm" variant={currentProvider === p.key ? 'secondary' : 'outline'}
                type="button" className="h-7 text-xs"
                onClick={() => onSet(p.key)}
              >
                {currentProvider === p.key ? 'Default ✓' : 'Set as Default'}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/10 dark:text-amber-400">
        <strong>Banner sizes (1920×720, 1920×600):</strong> HuggingFace caps at 1024×1024.
        Use Replicate or Fal.ai for large banner generation.
      </div>
    </div>
  );
}

// ─── Quality selector ─────────────────────────────────────────────────────────

const QUALITY_OPTIONS: Array<{
  value: QualityProfile;
  icon: string;
  label: string;
  sub: string;
}> = [
  { value: 'auto',     icon: '🧠', label: 'Auto',       sub: 'AI picks per image type' },
  { value: 'premium',  icon: '💎', label: 'Premium',    sub: 'FLUX.2-dev · Highest quality' },
  { value: 'balanced', icon: '🚀', label: 'Balanced',   sub: 'FLUX.1-schnell ×8 · Recommended' },
  { value: 'fast',     icon: '⚡', label: 'Ultra Fast',  sub: 'FLUX.1-schnell ×4 · Fastest' },
];

function QualitySelector({
  value, imageType, onChange,
}: {
  value: QualityProfile;
  imageType: ImageType;
  onChange: (q: QualityProfile) => void;
}) {
  const resolved = value === 'auto'
    ? `Auto → ${AUTO_QUALITY_MAP[imageType]} (${QUALITY_CONFIGS[AUTO_QUALITY_MAP[imageType]].label})`
    : null;

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        AI Image Model
      </label>
      <div className="grid grid-cols-2 gap-1.5">
        {QUALITY_OPTIONS.map(opt => (
          <button
            key={opt.value} type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex items-start gap-2 rounded-lg border p-2.5 text-left transition-colors',
              value === opt.value
                ? 'border-primary bg-primary/8 text-foreground'
                : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
            )}
          >
            <span className="mt-0.5 text-base leading-none">{opt.icon}</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-4">{opt.label}</p>
              <p className="text-[10px] leading-3 opacity-70">{opt.sub}</p>
            </div>
          </button>
        ))}
      </div>
      {resolved && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">{resolved}</p>
      )}
    </div>
  );
}

// ─── Generator form ───────────────────────────────────────────────────────────

function GeneratorForm({
  form, presets, showNeg, onToggleNeg, onPatch, onPreset,
  onAutoBuild, onGenerate, onProviderChange, isGenerating, imageType,
}: {
  form: FormState;
  presets: SizePreset[];
  showNeg: boolean;
  onToggleNeg: () => void;
  onPatch: (p: Partial<FormState>) => void;
  onPreset: (p: SizePreset) => void;
  onAutoBuild: () => void;
  onGenerate: () => void;
  onProviderChange: (p: ImageProvider) => void;
  isGenerating: boolean;
  imageType: ImageType;
}) {
  const hfLargeBanner = form.provider === 'huggingface'
    && (form.width > 1024 || form.height > 1024);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Brand">
          <Input value={form.brand} onChange={e => onPatch({ brand: e.target.value })} placeholder="BlueSalon" />
        </Field>
        <Field label="Product">
          <Input value={form.productTitle} onChange={e => onPatch({ productTitle: e.target.value })} placeholder="Creed Aventus" />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Field label="Category">
          <Input value={form.category} onChange={e => onPatch({ category: e.target.value })} placeholder="Perfume" />
        </Field>
        <Field label="Color">
          <Input value={form.color} onChange={e => onPatch({ color: e.target.value })} placeholder="Gold" />
        </Field>
        <Field label="Material">
          <Input value={form.material} onChange={e => onPatch({ material: e.target.value })} placeholder="Glass" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Style">
          <Input value={form.style} onChange={e => onPatch({ style: e.target.value })} placeholder="Luxury" />
        </Field>
        <Field label="Background">
          <Input value={form.background} onChange={e => onPatch({ background: e.target.value })} placeholder="White studio" />
        </Field>
      </div>

      {presets.length > 0 && (
        <Field label="Size Presets">
          <div className="flex flex-wrap gap-1.5">
            {presets.map(p => (
              <button
                key={p.key} type="button"
                onClick={() => onPreset(p)}
                className={cn(
                  'rounded border px-2.5 py-1 text-xs font-medium transition-colors',
                  form.width === p.width && form.height === p.height
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Field label="Width (px)">
          <Input type="number" value={form.width} onChange={e => onPatch({ width: parseInt(e.target.value) || 1024 })} />
        </Field>
        <Field label="Height (px)">
          <Input type="number" value={form.height} onChange={e => onPatch({ height: parseInt(e.target.value) || 1024 })} />
        </Field>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Prompt
          </label>
          <Button size="sm" variant="ghost" type="button" onClick={onAutoBuild} className="h-5 gap-1 px-2 text-xs">
            <Wand2 className="h-3 w-3" /> Auto-build
          </Button>
        </div>
        <Textarea
          className="min-h-[80px] text-sm"
          placeholder="Describe the image or click Auto-build from fields above…"
          value={form.prompt}
          onChange={e => onPatch({ prompt: e.target.value })}
        />
      </div>

      <button
        type="button" onClick={onToggleNeg}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {showNeg ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Negative prompt
      </button>
      {showNeg && (
        <Textarea
          className="min-h-[56px] text-sm"
          value={form.negativePrompt}
          onChange={e => onPatch({ negativePrompt: e.target.value })}
        />
      )}

      <QualitySelector
        value={form.qualityProfile}
        imageType={imageType}
        onChange={q => onPatch({ qualityProfile: q })}
      />

      <div className="grid grid-cols-2 gap-2">
        <Field label="Images">
          <Select value={String(form.numImages)} onChange={e => onPatch({ numImages: parseInt(e.target.value) })}>
            {[1, 2, 3, 4].map(n => (
              <option key={n} value={n}>{n} image{n > 1 ? 's' : ''}</option>
            ))}
          </Select>
        </Field>
        <Field label="Provider">
          <Select value={form.provider} onChange={e => onProviderChange(e.target.value as ImageProvider)}>
            <option value="huggingface">HuggingFace</option>
            <option value="replicate">Replicate</option>
            <option value="fal">Fal.ai</option>
            <option value="comfyui">ComfyUI (Local)</option>
          </Select>
        </Field>
      </div>

      {hfLargeBanner && (
        <p className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          HuggingFace caps at 1024×1024. For larger banners use Replicate or Fal.ai.
        </p>
      )}

      <Button
        onClick={onGenerate} disabled={isGenerating}
        className="mt-1 w-full gap-2" type="button"
      >
        {isGenerating
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
          : <><ImageIcon className="h-4 w-4" /> Generate Image</>}
      </Button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ImageStudio() {
  const [tab, setTab] = useState<TabKey>('product');
  const [form, setForm] = useState<FormState>({
    brand: '', productTitle: '', category: '', color: '',
    material: '', style: '', background: '',
    width: 1024, height: 1024,
    prompt: '', negativePrompt: DEFAULT_NEG,
    numImages: 1, provider: 'huggingface',
    qualityProfile: 'auto',
  });
  const [showNeg, setShowNeg] = useState(false);
  const [gen, setGen] = useState<GenState>({ status: 'idle', images: [] });
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
    const saved = localStorage.getItem(PROVIDER_KEY) as ImageProvider | null;
    if (saved) setForm(f => ({ ...f, provider: saved }));
  }, []);

  const currentTab = TABS.find(t => t.key === tab)!;
  const presets = SIZE_PRESETS.filter(p => currentTab.presetKeys.includes(p.key));

  function handleTabChange(next: TabKey) {
    const cfg = TABS.find(t => t.key === next)!;
    setTab(next);
    setForm(f => ({ ...f, width: cfg.defaultWidth, height: cfg.defaultHeight }));
    setGen({ status: 'idle', images: [] });
  }

  function patchForm(patch: Partial<FormState>) {
    setForm(f => ({ ...f, ...patch }));
  }

  function handlePreset(p: SizePreset) {
    patchForm({ width: p.width, height: p.height });
  }

  function handleAutoBuild() {
    const imageType = currentTab.imageType ?? 'product';
    patchForm({ prompt: buildPrompt({ ...form, imageType }) });
  }

  function handleProviderChange(p: ImageProvider) {
    patchForm({ provider: p });
    localStorage.setItem(PROVIDER_KEY, p);
  }

  async function handleGenerate() {
    let prompt = form.prompt.trim();
    if (!prompt) {
      prompt = buildPrompt({ ...form, imageType: currentTab.imageType ?? 'product' });
    }
    if (!prompt) {
      setGen({ status: 'error', images: [], error: 'Enter a prompt or fill in product details first.' });
      return;
    }

    setGen({ status: 'generating', images: [] });

    try {
      const resp = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negativePrompt: form.negativePrompt,
          width: form.width,
          height: form.height,
          provider: form.provider,
          qualityProfile: form.qualityProfile,
          numImages: form.numImages,
          imageType: currentTab.imageType ?? 'product',
          brand: form.brand,
          productTitle: form.productTitle,
        }),
      });

      const result = await resp.json() as GenerateImageResult;

      if (!result.success || result.images.length === 0) {
        setGen({ status: 'error', images: [], error: result.error ?? 'Generation failed' });
      } else {
        setGen({ status: 'done', images: result.images });
      }
    } catch (err) {
      setGen({ status: 'error', images: [], error: err instanceof Error ? err.message : 'Request failed' });
    }
  }

  function handleSave(img: GeneratedImage) {
    saveToHistory([img]);
    setHistory(loadHistory());
  }

  function handleDeleteHistory(id: string) {
    const updated = history.filter(h => h.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  }

  function handleCopy(prompt: string, id: string) {
    navigator.clipboard.writeText(prompt).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="flex overflow-x-auto border-b border-border">
        {TABS.map(t => (
          <button
            key={t.key} type="button"
            onClick={() => handleTabChange(t.key)}
            className={cn(
              'shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
              tab === t.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* History */}
      {tab === 'history' && (
        <HistoryPanel
          history={history}
          copiedId={copiedId}
          onDelete={handleDeleteHistory}
          onCopy={handleCopy}
          onDownload={downloadImage}
        />
      )}

      {/* Provider settings */}
      {tab === 'settings' && (
        <SettingsPanel currentProvider={form.provider} onSet={handleProviderChange} />
      )}

      {/* Custom Prompt tab — paste any detailed prompt, skip the form fields */}
      {tab === 'custom_prompt' && (
        <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
          <Card className="p-4">
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Your Prompt
                </label>
                <Textarea
                  className="min-h-[200px] text-sm"
                  placeholder={"Paste your full detailed prompt here…\n\nExample:\nA luxury Creed Aventus perfume bottle, gold cap, clear glass, studio lighting on white marble, photorealistic, 8K sharp focus, product photography"}
                  value={form.prompt}
                  onChange={e => patchForm({ prompt: e.target.value })}
                />
              </div>
              <Field label="Negative Prompt">
                <Textarea
                  className="min-h-[56px] text-sm"
                  placeholder="blurry, low quality, watermark, text, distorted…"
                  value={form.negativePrompt}
                  onChange={e => patchForm({ negativePrompt: e.target.value })}
                />
              </Field>
              <Field label="Size Presets">
                <div className="flex flex-wrap gap-1.5">
                  {SIZE_PRESETS.filter(p =>
                    ['product_sq','homepage','collection','instagram_post','instagram_story','facebook_ad','mobile_banner'].includes(p.key)
                  ).map(p => (
                    <button
                      key={p.key} type="button"
                      onClick={() => patchForm({ width: p.width, height: p.height })}
                      className={cn(
                        'rounded border px-2.5 py-1 text-xs font-medium transition-colors',
                        form.width === p.width && form.height === p.height
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground',
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Width (px)">
                  <Input type="number" value={form.width} onChange={e => patchForm({ width: parseInt(e.target.value) || 1024 })} />
                </Field>
                <Field label="Height (px)">
                  <Input type="number" value={form.height} onChange={e => patchForm({ height: parseInt(e.target.value) || 1024 })} />
                </Field>
              </div>
              <QualitySelector
                value={form.qualityProfile}
                imageType="product"
                onChange={q => patchForm({ qualityProfile: q })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Images">
                  <Select value={String(form.numImages)} onChange={e => patchForm({ numImages: parseInt(e.target.value) })}>
                    {[1, 2, 3, 4].map(n => (
                      <option key={n} value={n}>{n} image{n > 1 ? 's' : ''}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Provider">
                  <Select value={form.provider} onChange={e => handleProviderChange(e.target.value as ImageProvider)}>
                    <option value="huggingface">HuggingFace</option>
                    <option value="replicate">Replicate</option>
                    <option value="fal">Fal.ai</option>
                    <option value="comfyui">ComfyUI (Local)</option>
                  </Select>
                </Field>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!form.prompt.trim() || gen.status === 'generating'}
                className="mt-1 w-full gap-2" type="button"
              >
                {gen.status === 'generating'
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                  : <><ImageIcon className="h-4 w-4" /> Generate Image</>}
              </Button>
            </div>
          </Card>
          <div>
            {gen.status === 'idle'       && <IdleState />}
            {gen.status === 'generating' && <LoadingState provider={form.provider} />}
            {gen.status === 'error'      && <ErrorState error={gen.error!} onRetry={handleGenerate} />}
            {gen.status === 'done'       && (
              <ImageGrid
                images={gen.images}
                copiedId={copiedId}
                onDownload={downloadImage}
                onCopy={handleCopy}
                onSave={handleSave}
                onRegenerate={handleGenerate}
              />
            )}
          </div>
        </div>
      )}

      {/* Generation tabs */}
      {tab !== 'history' && tab !== 'settings' && tab !== 'custom_prompt' && (
        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <Card className="p-4">
            <GeneratorForm
              form={form}
              presets={presets}
              showNeg={showNeg}
              onToggleNeg={() => setShowNeg(s => !s)}
              onPatch={patchForm}
              onPreset={handlePreset}
              onAutoBuild={handleAutoBuild}
              onGenerate={handleGenerate}
              onProviderChange={handleProviderChange}
              isGenerating={gen.status === 'generating'}
              imageType={currentTab.imageType ?? 'product'}
            />
          </Card>

          <div>
            {gen.status === 'idle'       && <IdleState />}
            {gen.status === 'generating' && <LoadingState provider={form.provider} />}
            {gen.status === 'error'      && <ErrorState error={gen.error!} onRetry={handleGenerate} />}
            {gen.status === 'done'       && (
              <ImageGrid
                images={gen.images}
                copiedId={copiedId}
                onDownload={downloadImage}
                onCopy={handleCopy}
                onSave={handleSave}
                onRegenerate={handleGenerate}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
