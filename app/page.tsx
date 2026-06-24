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
    status: "Live",
    color: "violet" as const
  },
  {
    title: "Content Studio",
    description: "Generate ecommerce copy, emails, blogs, FAQs, and ALT text.",
    href: "/content",
    icon: Sparkles,
    status: "Live",
    color: "blue" as const
  },
  {
    title: "SEO Studio",
    description: "Create metadata, category copy, schema drafts, and search snippets.",
    href: "/seo",
    icon: Search,
    status: "Live",
    color: "emerald" as const
  },
  {
    title: "Product Studio",
    description: "Enrich SKUs with Shopify and Google Shopping fields.",
    href: "/products",
    icon: Boxes,
    status: "Live",
    color: "amber" as const
  },
  {
    title: "CSV Processor",
    description: "Preview, validate, bulk generate, and export platform-ready CSVs.",
    href: "/csv",
    icon: FileSpreadsheet,
    status: "Worker",
    color: "cyan" as const
  },
  {
    title: "Analytics",
    description: "Track usage, costs, jobs, prompts, and performance health.",
    href: "/analytics",
    icon: BarChart3,
    status: "Ready",
    color: "rose" as const
  }
];

export default function DashboardPage() {
  return (
    <AppShell>
      {/* Hero */}
      <section className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="pointer-events-none absolute -left-12 -top-12 h-80 w-80 rounded-full bg-gradient-to-br from-violet-100/50 to-blue-100/30 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-100 to-blue-100 px-3.5 py-1 ring-1 ring-violet-200/60">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-700">
              AI operating system
            </p>
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            NeoGen{" "}
            <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              AI Studio
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            A fast SaaS workspace for Shopify automation, ecommerce content,
            SEO, product enrichment, CSV processing, and knowledge workflows.
          </p>
        </div>

        <div className="relative shrink-0 rounded-xl border border-border/60 bg-gradient-to-br from-white to-slate-50 px-5 py-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Performance targets
          </p>
          <div className="mt-3 flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              First load{" "}
              <strong className="font-semibold text-foreground">under 1s</strong>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-200">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              </span>
              AI streaming{" "}
              <strong className="font-semibold text-foreground">under 2s</strong>
            </div>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <section className="mt-10">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          System metrics
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            color="amber"
            detail="Edge streaming and small client islands"
            icon={Zap}
            label="AI latency"
            value="<2s"
          />
          <KpiCard
            color="blue"
            detail="Server-rendered route shell"
            icon={Clock3}
            label="First load"
            value="<1s"
          />
          <KpiCard
            color="violet"
            detail="Groq primary, Ollama secondary-ready"
            icon={MessageSquareText}
            label="Models"
            value="3"
          />
          <KpiCard
            color="emerald"
            detail="CSV, content, SEO, product, image"
            icon={Boxes}
            label="Studios"
            value="5"
          />
        </div>
      </section>

      {/* Module cards */}
      <section className="mt-10">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Modules
        </p>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <ModuleCard key={module.title} {...module} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
