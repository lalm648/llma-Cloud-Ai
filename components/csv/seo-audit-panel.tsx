"use client";

import { useRef, useState } from "react";
import {
  AlertCircle, CheckCircle2, ChevronRight,
  FileSpreadsheet, Search, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AuditSummary, FilterKey, ProductAudit } from "@/lib/shopify-seo/types";

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, variant = "neutral",
}: {
  label: string;
  value: number;
  variant?: "neutral" | "warn" | "ok" | "error";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border px-4 py-3",
        variant === "warn"  && "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20",
        variant === "ok"    && "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20",
        variant === "error" && "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20",
        variant === "neutral" && "border-border bg-muted",
      )}
    >
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// ─── Issue badge ──────────────────────────────────────────────────────────────

function IssueBadge({ issue }: { issue: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    missing_description:    { label: "No Description",    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    missing_seo_title:      { label: "No SEO Title",      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    missing_seo_description:{ label: "No Meta Desc",      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    weak_handle:            { label: "Weak Handle",       color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    missing_image_alt:      { label: "No Alt Text",       color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  };
  const { label, color } = labels[issue] ?? { label: issue, color: "bg-muted text-muted-foreground" };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", color)}>
      {label}
    </span>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",                    label: "All Issues" },
  { key: "missing_description",    label: "No Description" },
  { key: "missing_seo_title",      label: "No SEO Title" },
  { key: "missing_seo_description",label: "No Meta Desc" },
  { key: "weak_handle",            label: "Weak Handle" },
];

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  products: ProductAudit[];
  summary: AuditSummary;
  filename: string;
  onGenerate: (selected: ProductAudit[], batchSize: number) => void;
  isGenerating: boolean;
};

export function SeoAuditPanel({
  products, summary, filename, onGenerate, isGenerating,
}: Props) {
  const [filter, setFilter]         = useState<FilterKey>("all");
  const [search, setSearch]         = useState("");
  const [batchSize, setBatchSize]   = useState(50);
  const [page, setPage]             = useState(0);
  const PAGE_SIZE = 50;

  const filtered = products.filter(p => {
    if (filter !== "all" && !p.issues.includes(filter as any)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.handle.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const issueProducts = products.filter(p => p.issues.length > 0);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function handleGenerate() {
    const queue = issueProducts.slice(0, batchSize);
    onGenerate(queue, batchSize);
  }

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">SEO Audit</h2>
          <p className="text-sm text-muted-foreground">{filename}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Batch size picker */}
          <select
            className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            value={batchSize}
            onChange={e => setBatchSize(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map(n => (
              <option key={n} value={n}>{n} products</option>
            ))}
          </select>
          <Button
            disabled={isGenerating || issueProducts.length === 0}
            onClick={handleGenerate}
          >
            {isGenerating ? "Generating…" : "Generate Next"}
            {!isGenerating && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Products"     value={summary.totalProducts}         variant="neutral" />
        <StatCard label="No Description"     value={summary.missingDescription}    variant={summary.missingDescription ? "error" : "ok"} />
        <StatCard label="No SEO Title"       value={summary.missingSeoTitle}       variant={summary.missingSeoTitle ? "warn" : "ok"} />
        <StatCard label="No Meta Desc"       value={summary.missingSeoDescription} variant={summary.missingSeoDescription ? "warn" : "ok"} />
        <StatCard label="Weak Handles"       value={summary.weakHandles + summary.skuFirstHandles} variant={summary.weakHandles ? "warn" : "ok"} />
        <StatCard label="Already Optimized"  value={summary.alreadyOptimized}      variant="ok" />
      </div>

      {/* Filter + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(0); }}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === f.key
                  ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                  : "border-border text-muted-foreground hover:border-accent hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent sm:w-56"
            placeholder="Search products…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
      </div>

      {/* Products table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead className="bg-muted">
              <tr>
                {["Handle", "Title", "SKU", "Issues", "Handle Status"].map(h => (
                  <th key={h} className="border-b border-border px-3 py-2.5 font-medium text-xs uppercase tracking-wide text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    {search || filter !== "all"
                      ? "No products match your filter."
                      : "All products are fully optimized!"}
                  </td>
                </tr>
              ) : (
                paginated.map(p => (
                  <tr
                    key={p.rowIndex}
                    className={cn(
                      "border-b border-border transition-colors hover:bg-muted/50",
                      p.issues.length === 0 && "opacity-60",
                    )}
                  >
                    <td className="px-3 py-2 font-mono text-xs max-w-[160px] truncate" title={p.handle}>
                      {p.handle || <span className="text-muted-foreground italic">empty</span>}
                    </td>
                    <td className="px-3 py-2 max-w-[200px] truncate" title={p.title}>
                      {p.title || <span className="text-muted-foreground italic">no title</span>}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {p.sku || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {p.issues.length === 0 ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          p.issues.map(issue => <IssueBadge key={issue} issue={issue} />)
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {p.handleStatus === "ok" ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400">OK</span>
                      ) : (
                        <span
                          className={cn(
                            "text-xs",
                            p.handleStatus === "sku_first"
                              ? "text-red-600 dark:text-red-400"
                              : "text-amber-600 dark:text-amber-400",
                          )}
                          title={p.handleWeakReason}
                        >
                          {p.handleStatus === "sku_first" ? "SKU-first" : "Weak"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
            <span>
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="rounded px-2 py-1 hover:bg-muted disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="rounded px-2 py-1 hover:bg-muted disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Generate hint */}
      {issueProducts.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>{issueProducts.length} products</strong> have SEO issues.
            Select batch size and click <strong>Generate Next</strong> to create AI-optimized content for the first batch.
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Drop-zone used before a CSV is loaded ────────────────────────────────────

type DropzoneProps = {
  onFile: (file: File) => void;
  error: string | null;
};

export function CsvDropzone({ onFile, error }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function pick(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) return;
    onFile(file);
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) pick(file);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors",
        dragging
          ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
          : "border-border bg-muted/50 hover:border-accent hover:bg-muted",
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-background shadow">
        <FileSpreadsheet className="h-7 w-7 text-accent" />
      </div>
      <div className="text-center">
        <p className="font-medium">Drop your Shopify product CSV here</p>
        <p className="mt-1 text-sm text-muted-foreground">
          or click to browse — supports any Shopify product export
        </p>
      </div>
      {error && (
        <p className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) pick(f); }}
      />
    </div>
  );
}
