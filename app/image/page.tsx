import type { Metadata } from 'next';
import { AppShell }    from '@/components/shell/app-shell';
import { ImageStudio } from '@/components/image/image-studio';

export const metadata: Metadata = {
  title: 'Image Studio',
  description: 'AI image generation with FLUX.1-schnell via HuggingFace, Replicate, Fal.ai, and ComfyUI.',
};

export default function ImagePage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AI Image Studio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate product images, banners, and social posts using FLUX.1-schnell.
        </p>
      </div>
      <ImageStudio />
    </AppShell>
  );
}
