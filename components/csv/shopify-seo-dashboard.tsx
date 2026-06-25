"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { auditShopifyCSV } from "@/lib/shopify-seo/csv-parser";
import {
  exportShopifyCSV,
  exportChangeLogCSV,
  exportRejectedCSV,
  triggerDownload,
} from "@/lib/shopify-seo/csv-exporter";
import type {
  AuditSummary,
  ComparisonRow,
  FieldName,
  GenerateProductPayload,
  GenerateProductResult,
  GenerationState,
  ParsedCSV,
  ProductAudit,
} from "@/lib/shopify-seo/types";
import { CsvDropzone, SeoAuditPanel } from "./seo-audit-panel";
import { SeoComparisonPanel } from "./seo-comparison-panel";
import { SeoExportPanel } from "./seo-export-panel";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "audit" | "comparison" | "export";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function callGenerateAPI(
  product: GenerateProductPayload,
): Promise<GenerateProductResult> {
  const res = await fetch("/api/seo-csv/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<GenerateProductResult>;
}

function buildPayload(p: ProductAudit): GenerateProductPayload {
  const generateFields: string[] = [];
  if (p.issues.includes("weak_handle"))            generateFields.push("optimized_handle");
  if (p.issues.includes("missing_seo_title"))      generateFields.push("seo_title");
  if (p.issues.includes("missing_seo_description"))generateFields.push("seo_description");
  if (p.issues.includes("missing_description"))    generateFields.push("body_html");
  if (p.issues.includes("missing_image_alt"))      generateFields.push("image_alt_text");

  return {
    rowIndex:         p.rowIndex,
    title:            p.title,
    vendor:           p.vendor,
    productType:      p.productType,
    handle:           p.handle,
    handleStatus:     p.handleStatus,       // tells AI why handle needs fixing
    handleWeakReason: p.handleWeakReason,   // e.g. "Starts with a number"
    bodyHtml:         p.bodyHtml,
    seoTitle:         p.seoTitle,
    seoDescription:   p.seoDescription,
    sku:              p.sku,
    color:            p.color,
    size:             p.size,
    tags:             p.tags,
    imageAltText:     p.imageAltText,
    generateFields,
  };
}

function buildComparisonRows(
  p: ProductAudit,
  r: GenerateProductResult,
): ComparisonRow[] {
  const rows: ComparisonRow[] = [];

  function push(
    field: FieldName,
    oldValue: string,
    newValue: string | null | undefined,
    reason: string,
    status: ComparisonRow["status"],
  ) {
    if (!newValue) return;
    rows.push({
      rowIndex:    p.rowIndex,
      productTitle:p.title,
      sku:         p.sku,
      field,
      oldValue,
      newValue,
      reason:      reason || "",
      confidence:  0.9,
      status,
      approved:    false,
    });
  }

  // Show handle row whenever AI returned a value (even if same as original — let user decide)
  // Also show if handle issue exists but AI returned null (so user knows it wasn't fixed)
  if (p.issues.includes("weak_handle")) {
    const newHandle = r.optimizedHandle;
    if (newHandle) {
      push(
        "Handle",
        p.handle,
        newHandle,
        r.reasons.handle || p.handleWeakReason || "Handle needs SEO optimisation",
        p.handleStatus === "sku_first" ? "missing" : "weak",
      );
    }
    // If AI returned null for a handle that needed fixing, log as an error row
    // (we don't add it to comparison but the generation error count increments)
  }
  if (r.seoTitle && p.issues.includes("missing_seo_title")) {
    push(
      "SEO Title",
      p.seoTitle,
      r.seoTitle,
      r.reasons.seoTitle ?? "Missing SEO title",
      p.seoTitle ? "weak" : "missing",
    );
  }
  if (r.seoDescription && p.issues.includes("missing_seo_description")) {
    push(
      "SEO Description",
      p.seoDescription,
      r.seoDescription,
      r.reasons.seoDescription ?? "Missing meta description",
      p.seoDescription ? "weak" : "missing",
    );
  }
  if (r.bodyHtml && p.issues.includes("missing_description")) {
    push(
      "Body HTML",
      p.bodyHtml,
      r.bodyHtml,
      r.reasons.bodyHtml ?? "Missing product description",
      p.bodyHtml ? "weak" : "missing",
    );
  }
  if (r.imageAltText && p.issues.includes("missing_image_alt")) {
    push(
      "Image Alt Text",
      p.imageAltText,
      r.imageAltText,
      r.reasons.imageAltText ?? "Missing image alt text",
      "missing",
    );
  }

  return rows;
}

// ─── Progress screen ──────────────────────────────────────────────────────────

function GeneratingScreen({ state }: { state: GenerationState }) {
  const pct = state.total ? Math.round((state.processed / state.total) * 100) : 0;
  const remaining = state.total - state.processed;

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-8 py-10">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/30">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600 dark:text-violet-400" />
      </div>

      <div className="w-full max-w-md text-center">
        <h2 className="text-lg font-semibold">Generating SEO content…</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Groq Llama is writing SEO copy for your products.
        </p>

        {/* Progress bar */}
        <div className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-sm tabular-nums text-muted-foreground">
          {state.processed} / {state.total} products
        </p>

        {/* Stats */}
        <div className="mt-5 flex justify-center gap-6 text-sm">
          <div>
            <p className="text-lg font-bold">{state.fields}</p>
            <p className="text-xs text-muted-foreground">Fields generated</p>
          </div>
          <div>
            <p className="text-lg font-bold">{remaining}</p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
          {state.errors.length > 0 && (
            <div>
              <p className="text-lg font-bold text-amber-600">{state.errors.length}</p>
              <p className="text-xs text-muted-foreground">Errors</p>
            </div>
          )}
        </div>

        {state.errors.length > 0 && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            <p className="font-medium mb-1 flex items-center gap-1">
              <TriangleAlert className="h-3.5 w-3.5" /> {state.errors.length} product(s) failed
            </p>
            {state.errors.slice(0, 3).map((e, i) => (
              <p key={i} className="truncate">• {e}</p>
            ))}
            {state.errors.length > 3 && (
              <p className="text-muted-foreground">+{state.errors.length - 3} more</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({
  activeTab,
  onTab,
  comparisonCount,
  approvedCount,
}: {
  activeTab: Tab;
  onTab: (t: Tab) => void;
  comparisonCount: number;
  approvedCount: number;
}) {
  const tabs: { key: Tab; label: string; badge?: number; disabled?: boolean }[] = [
    { key: "audit",      label: "Upload & Audit" },
    { key: "comparison", label: "Comparison Review", badge: comparisonCount, disabled: comparisonCount === 0 },
    { key: "export",     label: "Export",             badge: approvedCount,   disabled: comparisonCount === 0 },
  ];
  return (
    <div className="flex border-b border-border">
      {tabs.map(t => (
        <button
          key={t.key}
          disabled={t.disabled}
          onClick={() => onTab(t.key)}
          className={cn(
            "relative flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
            activeTab === t.key
              ? "border-violet-500 text-violet-700 dark:text-violet-400"
              : "border-transparent text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          {t.label}
          {t.badge != null && t.badge > 0 && (
            <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">
              {t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export function ShopifySEODashboard() {
  const [tab,           setTab]           = useState<Tab>("audit");
  const [products,      setProducts]      = useState<ProductAudit[]>([]);
  const [summary,       setSummary]       = useState<AuditSummary | null>(null);
  const [parsedCsv,     setParsedCsv]     = useState<ParsedCSV | null>(null);
  const [parseError,    setParseError]    = useState<string | null>(null);
  const [compRows,      setCompRows]      = useState<ComparisonRow[]>([]);
  const [isGenerating,  setIsGenerating]  = useState(false);
  const [genState,      setGenState]      = useState<GenerationState>({
    status: "idle", total: 0, processed: 0, fields: 0, errors: [],
  });

  // ── File upload ────────────────────────────────────────────────────────────

  async function handleFile(file: File) {
    setParseError(null);
    try {
      const text = await file.text();
      const { products, summary, parsedCsv } = auditShopifyCSV(file.name, text);
      setProducts(products);
      setSummary(summary);
      setParsedCsv(parsedCsv);
      setCompRows([]);
      setTab("audit");
      setGenState({ status: "idle", total: 0, processed: 0, fields: 0, errors: [] });
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Failed to parse CSV");
    }
  }

  // ── Generation ─────────────────────────────────────────────────────────────

  async function handleGenerate(selected: ProductAudit[], batchSize: number) {
    const queue = selected.slice(0, batchSize);
    const CONCURRENCY = 3;

    setIsGenerating(true);
    setGenState({ status: "running", total: queue.length, processed: 0, fields: 0, errors: [] });

    const newRows: ComparisonRow[] = [];
    let processedCount = 0;
    let fieldsCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < queue.length; i += CONCURRENCY) {
      const chunk = queue.slice(i, i + CONCURRENCY);

      const results = await Promise.allSettled(
        chunk.map(p => callGenerateAPI(buildPayload(p)))
      );

      results.forEach((outcome, ci) => {
        const product = chunk[ci];
        processedCount++;

        if (outcome.status === "fulfilled" && outcome.value.success) {
          const r = outcome.value;
          const rows = buildComparisonRows(product, r);
          newRows.push(...rows);
          fieldsCount += rows.length;
        } else {
          const msg = outcome.status === "rejected"
            ? String(outcome.reason)
            : (outcome.value?.error ?? "Unknown error");
          errors.push(`${product.title}: ${msg}`);
        }
      });

      setGenState(prev => ({
        ...prev,
        processed: processedCount,
        fields: fieldsCount,
        errors,
      }));
    }

    setGenState(prev => ({
      ...prev,
      status: "done",
      processed: processedCount,
      fields: fieldsCount,
      errors,
    }));
    setCompRows(prev => [...prev, ...newRows]);
    setIsGenerating(false);
    setTab("comparison");
  }

  // ── Comparison actions ─────────────────────────────────────────────────────

  function handleToggle(rowIndex: number, field: FieldName, approved: boolean) {
    setCompRows(prev =>
      prev.map(r =>
        r.rowIndex === rowIndex && r.field === field ? { ...r, approved } : r
      )
    );
  }

  function handleApproveAll() {
    setCompRows(prev => prev.map(r => ({ ...r, approved: true })));
  }

  function handleRejectAll() {
    setCompRows(prev => prev.map(r => ({ ...r, approved: false })));
  }

  // ── Exports ────────────────────────────────────────────────────────────────

  function handleExportCSV() {
    if (!parsedCsv) return;
    const csv = exportShopifyCSV(parsedCsv, compRows);
    const name = parsedCsv.filename.replace(/\.csv$/i, "-seo-optimised.csv");
    triggerDownload(csv, name);
  }

  function handleExportLog() {
    const csv = exportChangeLogCSV(compRows);
    triggerDownload(csv, "seo-change-log.csv");
  }

  function handleExportRejected() {
    const csv = exportRejectedCSV(compRows);
    triggerDownload(csv, "seo-rejected-changes.csv");
  }

  function handleReset() {
    setProducts([]);
    setSummary(null);
    setParsedCsv(null);
    setCompRows([]);
    setParseError(null);
    setTab("audit");
    setGenState({ status: "idle", total: 0, processed: 0, fields: 0, errors: [] });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const hasCsv = products.length > 0;

  return (
    <div className="space-y-0">
      {/* Page header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-sm">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Shopify SEO CSV</h1>
          <p className="text-sm text-muted-foreground">
            Audit, generate, review, and export SEO-optimised Shopify product data
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {/* Tab bar — only shown after CSV is loaded */}
        {hasCsv && (
          <TabBar
            activeTab={tab}
            onTab={setTab}
            comparisonCount={compRows.length}
            approvedCount={compRows.filter(r => r.approved).length}
          />
        )}

        <div className="p-5 sm:p-6">
          {/* No CSV yet → drop zone */}
          {!hasCsv && (
            <div className="mx-auto max-w-xl py-6">
              <CsvDropzone onFile={handleFile} error={parseError} />
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Detects: Handle · Title · Body HTML · SEO Title · SEO Description ·
                Variant SKU · Image Alt Text
              </p>
            </div>
          )}

          {/* Generating overlay */}
          {hasCsv && isGenerating && (
            <GeneratingScreen state={genState} />
          )}

          {/* Audit tab */}
          {hasCsv && !isGenerating && tab === "audit" && summary && (
            <SeoAuditPanel
              products={products}
              summary={summary}
              filename={parsedCsv?.filename ?? ""}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          )}

          {/* Comparison tab */}
          {hasCsv && !isGenerating && tab === "comparison" && (
            compRows.length > 0 ? (
              <SeoComparisonPanel
                rows={compRows}
                onToggle={handleToggle}
                onApproveAll={handleApproveAll}
                onRejectAll={handleRejectAll}
              />
            ) : (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No comparison data yet — generate SEO content first.
              </div>
            )
          )}

          {/* Export tab */}
          {hasCsv && !isGenerating && tab === "export" && (
            <SeoExportPanel
              rows={compRows}
              filename={parsedCsv?.filename ?? "products.csv"}
              onExportCSV={handleExportCSV}
              onExportLog={handleExportLog}
              onExportRejected={handleExportRejected}
              onReset={handleReset}
            />
          )}
        </div>
      </div>

      {/* Replace CSV button (after load) */}
      {hasCsv && !isGenerating && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => {
              const inp = document.createElement("input");
              inp.type = "file";
              inp.accept = ".csv,text/csv";
              inp.onchange = e => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (f) void handleFile(f);
              };
              inp.click();
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Load a different CSV
          </button>
        </div>
      )}
    </div>
  );
}
