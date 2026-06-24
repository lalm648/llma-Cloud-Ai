import type { Metadata } from "next";
import { BookOpenText } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { ModulePage } from "@/components/placeholder/module-page";

export const metadata: Metadata = {
  title: "Knowledge Base",
  description: "Project knowledge, source documents, and memory-backed AI context."
};

export default function KnowledgePage() {
  return (
    <AppShell>
      <ModulePage
        description="Project memory layer for brand rules, product catalogs, style guides, policies, and historical generated content."
        icon={BookOpenText}
        items={[
          "Brand guidelines",
          "Product catalogs",
          "Policy documents",
          "Semantic search",
          "Context memory",
          "Source citations"
        ]}
        title="Knowledge Base"
      />
    </AppShell>
  );
}
