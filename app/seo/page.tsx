import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { GeneratorPanel } from "@/components/studio/generator-panel";

export const metadata: Metadata = {
  title: "SEO Studio",
  description: "Create SEO titles, meta descriptions, category copy, and snippets."
};

const seoTasks = [
  "SEO Title",
  "Meta Description",
  "Collection Content",
  "Category Content",
  "FAQ",
  "Schema Draft",
  "Search Snippet"
];

export default function SeoStudioPage() {
  return (
    <AppShell>
      <GeneratorPanel
        placeholder="Paste URL intent, collection details, target query, competitor notes, and required keyword limits."
        tasks={seoTasks}
        title="SEO Studio"
      />
    </AppShell>
  );
}
