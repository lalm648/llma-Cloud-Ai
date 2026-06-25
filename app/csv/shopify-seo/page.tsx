import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { ShopifySEODashboard } from "@/components/csv/shopify-seo-dashboard";

export const metadata: Metadata = {
  title: "Shopify SEO CSV",
  description:
    "Upload a Shopify product CSV, detect SEO gaps, generate AI-optimised handles, titles, descriptions and alt text with Groq Llama, compare changes, and export a Shopify-ready CSV."
};

export default function ShopifySeoPage() {
  return (
    <AppShell>
      <ShopifySEODashboard />
    </AppShell>
  );
}
