import type { Metadata } from "next";
import { Image } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { ModulePage } from "@/components/placeholder/module-page";

export const metadata: Metadata = {
  title: "Image Studio",
  description: "Cloud image generation architecture for FLUX and ComfyUI APIs."
};

export default function ImagePage() {
  return (
    <AppShell>
      <ModulePage
        description="Future module for FLUX, ComfyUI API, Cloudinary, and cloud GPU execution. No image models are loaded in the Vercel app."
        icon={Image}
        items={[
          "Prompt to image",
          "Product background generation",
          "ALT text extraction",
          "Cloud GPU queue",
          "Cloudinary storage",
          "Moderation pipeline"
        ]}
        title="Image Studio"
      />
    </AppShell>
  );
}
