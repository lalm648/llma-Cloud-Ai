import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { GeneratorPanel } from "@/components/studio/generator-panel";
import { studioTasks } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Content Studio",
  description: "Generate ecommerce content, blogs, emails, FAQs, and ALT text."
};

export default function ContentStudioPage() {
  return (
    <AppShell>
      <GeneratorPanel
        placeholder="Paste product notes, collection details, target audience, tone, and constraints."
        tasks={[...studioTasks]}
        title="Content Studio"
      />
    </AppShell>
  );
}
