import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { GeneratorPanel } from "@/components/studio/generator-panel";
import { ecommerceFields } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Product Studio",
  description: "Generate Shopify and Google Shopping product enrichment fields."
};

export default function ProductStudioPage() {
  return (
    <AppShell>
      <GeneratorPanel
        placeholder="SKU, product name, image notes, materials, dimensions, variants, brand voice, and marketplace rules."
        tasks={[...ecommerceFields]}
        title="Product Studio"
      />
    </AppShell>
  );
}
