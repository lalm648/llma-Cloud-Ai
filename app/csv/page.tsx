import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { CsvProcessor } from "@/components/csv/csv-processor";

export const metadata: Metadata = {
  title: "CSV Processor",
  description: "Fast CSV preview, validation, SKU matching, and bulk AI generation."
};

export default function CsvPage() {
  return (
    <AppShell>
      <CsvProcessor />
    </AppShell>
  );
}
