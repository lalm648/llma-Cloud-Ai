import {
  BarChart3,
  Boxes,
  Clock3,
  FileSpreadsheet,
  MessageSquareText,
  Search,
  Sparkles,
  Zap
} from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ModuleCard } from "@/components/dashboard/module-card";

const modules = [
  {
    title: "AI Chat",
    description: "Streaming multi-model workspace for assistants and operators.",
    href: "/chat",
    icon: MessageSquareText,
    status: "Live"
  },
  {
    title: "Content Studio",
    description: "Generate ecommerce copy, emails, blogs, FAQs, and ALT text.",
    href: "/content",
    icon: Sparkles,
    status: "Live"
  },
  {
    title: "SEO Studio",
    description: "Create metadata, category copy, schema drafts, and search snippets.",
    href: "/seo",
    icon: Search,
    status: "Live"
  },
  {
    title: "Product Studio",
    description: "Enrich SKUs with Shopify and Google Shopping fields.",
    href: "/products",
    icon: Boxes,
    status: "Live"
  },
  {
    title: "CSV Processor",
    description: "Preview, validate, bulk generate, and export platform-ready CSVs.",
    href: "/csv",
    icon: FileSpreadsheet,
    status: "Worker"
  },
  {
    title: "Analytics",
    description: "Track usage, costs, jobs, prompts, and performance health.",
    href: "/analytics",
    icon: BarChart3,
    status: "Ready"
  }
];

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            AI operating system
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            NeoGen AI Studio
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            A fast SaaS workspace for Shopify automation, ecommerce content,
            SEO, product enrichment, CSV processing, and knowledge workflows.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-sm">
          <span className="font-medium text-success">Optimized target:</span>{" "}
          first load under 1s, streamed AI under 2s
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          detail="Edge streaming and small client islands"
          icon={Zap}
          label="AI latency"
          value="<2s"
        />
        <KpiCard
          detail="Server-rendered route shell"
          icon={Clock3}
          label="First load"
          value="<1s"
        />
        <KpiCard
          detail="Groq primary, Ollama secondary-ready"
          icon={MessageSquareText}
          label="Models"
          value="3"
        />
        <KpiCard
          detail="CSV, content, SEO, product, image"
          icon={Boxes}
          label="Studios"
          value="5"
        />
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <ModuleCard key={module.title} {...module} />
        ))}
      </section>
    </AppShell>
  );
}
