import type { Metadata } from "next";
import { Library } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { ModulePage } from "@/components/placeholder/module-page";

export const metadata: Metadata = {
  title: "Prompt Library",
  description: "Reusable prompt templates for ecommerce and SEO workflows."
};

export default function PromptsPage() {
  return (
    <AppShell>
      <ModulePage
        description="Versioned prompt templates for content, product enrichment, SEO, email, social, and CSV automation."
        icon={Library}
        items={[
          "Template folders",
          "Prompt variables",
          "Model presets",
          "Team sharing",
          "A/B prompt versions",
          "Approval states"
        ]}
        title="Prompt Library"
      />
    </AppShell>
  );
}
