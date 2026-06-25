"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ComparisonRow, FieldName } from "@/lib/shopify-seo/types";

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ComparisonRow["status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        status === "missing" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        status === "weak"    && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        status === "updated" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Field name badge ─────────────────────────────────────────────────────────

function FieldBadge({ field }: { field: FieldName }) {
  const colors: Record<FieldName, string> = {
    "Handle":          "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    "SEO Title":       "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "SEO Description": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    "Body HTML":       "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "Image Alt Text":  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
  };
  return (
    <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", colors[field])}>
      {field}
    </span>
  );
}

// ─── Value cell with expand ───────────────────────────────────────────────────

function ValueCell({
  value, label, isHtml = false,
}: {
  value: string;
  label: string;
  isHtml?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isEmpty = !value;
  const isLong = value.length > 100 || isHtml;

  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      {isEmpty ? (
        <p className="text-xs italic text-muted-foreground">(empty)</p>
      ) : (
        <div>
          {isHtml ? (
            <div
              className={cn(
                "text-xs leading-relaxed",
                !expanded && "line-clamp-2",
              )}
              dangerouslySetInnerHTML={{ __html: value }}
            />
          ) : (
            <p className={cn("text-xs leading-relaxed", !expanded && "line-clamp-2")}>
              {value}
            </p>
          )}
          {isLong && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="mt-0.5 flex items-center gap-0.5 text-[10px] text-accent hover:underline"
            >
              {expanded ? (
                <><ChevronUp className="h-3 w-3" /> Less</>
              ) : (
                <><ChevronDown className="h-3 w-3" /> More</>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

type FilterTab = "all" | "pending" | "approved" | "rejected";

function Toolbar({
  rows,
  activeFilter,
  onFilterChange,
  onApproveAll,
  onRejectAll,
  onApproveSelected,
  onRejectSelected,
  selectedCount,
}: {
  rows: ComparisonRow[];
  activeFilter: FilterTab;
  onFilterChange: (f: FilterTab) => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onApproveSelected: () => void;
  onRejectSelected: () => void;
  selectedCount: number;
}) {
  const counts = useMemo(() => ({
    all:      rows.length,
    pending:  rows.filter(r => !r.approved).length,
    approved: rows.filter(r => r.approved).length,
    rejected: 0,
  }), [rows]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all",      label: `All (${counts.all})` },
    { key: "pending",  label: `Pending (${counts.pending})` },
    { key: "approved", label: `Approved (${counts.approved})` },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => onFilterChange(t.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeFilter === t.key
                ? "bg-accent text-white"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedCount > 0 && (
          <>
            <Button size="sm" variant="secondary" onClick={onApproveSelected}>
              <Check className="h-3.5 w-3.5" /> Approve {selectedCount}
            </Button>
            <Button size="sm" variant="ghost" onClick={onRejectSelected}>
              <X className="h-3.5 w-3.5" /> Reject {selectedCount}
            </Button>
          </>
        )}
        <Button size="sm" onClick={onApproveAll}>
          <Check className="h-3.5 w-3.5" /> Approve All
        </Button>
        <Button size="sm" variant="outline" onClick={onRejectAll}>
          <X className="h-3.5 w-3.5" /> Reject All
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  rows: ComparisonRow[];
  onToggle: (rowIndex: number, field: FieldName, approved: boolean) => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
};

export function SeoComparisonPanel({ rows, onToggle, onApproveAll, onRejectAll }: Props) {
  const [filter, setFilter]       = useState<FilterTab>("all");
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [fieldFilter, setFieldFilter] = useState<FieldName | "all">("all");
  const PAGE_SIZE = 40;
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let r = rows;
    if (filter === "pending")  r = r.filter(x => !x.approved);
    if (filter === "approved") r = r.filter(x => x.approved);
    if (fieldFilter !== "all") r = r.filter(x => x.field === fieldFilter);
    return r;
  }, [rows, filter, fieldFilter]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function rowKey(r: ComparisonRow) { return `${r.rowIndex}:${r.field}`; }

  function toggleSelect(r: ComparisonRow) {
    const k = rowKey(r);
    setSelected(prev => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map(rowKey)));
    }
  }

  function applyToSelected(approved: boolean) {
    selected.forEach(k => {
      const [ri, ...parts] = k.split(':');
      const field = parts.join(':') as FieldName;
      onToggle(Number(ri), field, approved);
    });
    setSelected(new Set());
  }

  const FIELD_OPTIONS: Array<FieldName | "all"> = [
    "all", "Handle", "SEO Title", "SEO Description", "Body HTML", "Image Alt Text",
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Toolbar
        rows={rows}
        activeFilter={filter}
        onFilterChange={f => { setFilter(f); setPage(0); }}
        onApproveAll={onApproveAll}
        onRejectAll={onRejectAll}
        onApproveSelected={() => applyToSelected(true)}
        onRejectSelected={() => applyToSelected(false)}
        selectedCount={selected.size}
      />

      {/* Field filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {FIELD_OPTIONS.map(f => (
          <button
            key={f}
            onClick={() => { setFieldFilter(f); setPage(0); }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              fieldFilter === f
                ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                : "border-border text-muted-foreground hover:border-accent",
            )}
          >
            {f === "all" ? `All fields (${rows.length})` : f}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="border-b border-border px-3 py-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selected.size === paginated.length}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                {["Product", "SKU", "Field", "Old Value", "New Value", "Status", "Approve"].map(h => (
                  <th key={h} className="border-b border-border px-3 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No changes match the current filter.
                  </td>
                </tr>
              ) : (
                paginated.map(row => {
                  const k = rowKey(row);
                  const isSelected = selected.has(k);
                  return (
                    <tr
                      key={k}
                      className={cn(
                        "border-b border-border transition-colors",
                        row.approved
                          ? "bg-emerald-50/50 dark:bg-emerald-900/10"
                          : "hover:bg-muted/40",
                        isSelected && "bg-violet-50/60 dark:bg-violet-900/10",
                      )}
                    >
                      {/* Select */}
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(row)}
                          className="rounded"
                        />
                      </td>

                      {/* Product */}
                      <td className="px-3 py-3 max-w-[140px]">
                        <p className="truncate text-xs font-medium" title={row.productTitle}>
                          {row.productTitle || "—"}
                        </p>
                      </td>

                      {/* SKU */}
                      <td className="px-3 py-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {row.sku || "—"}
                        </span>
                      </td>

                      {/* Field */}
                      <td className="px-3 py-3">
                        <FieldBadge field={row.field} />
                      </td>

                      {/* Old value */}
                      <td className="px-3 py-3 max-w-[180px]">
                        <ValueCell
                          value={row.oldValue}
                          label="Before"
                          isHtml={row.field === "Body HTML"}
                        />
                      </td>

                      {/* New value */}
                      <td className="px-3 py-3 max-w-[200px]">
                        <ValueCell
                          value={row.newValue}
                          label="After"
                          isHtml={row.field === "Body HTML"}
                        />
                        {row.reason && (
                          <p className="mt-1 text-[10px] text-muted-foreground italic line-clamp-1" title={row.reason}>
                            {row.reason}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <StatusBadge status={row.status} />
                      </td>

                      {/* Approve toggle */}
                      <td className="px-3 py-3">
                        <button
                          onClick={() => onToggle(row.rowIndex, row.field, !row.approved)}
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                            row.approved
                              ? "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600"
                              : "border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-600",
                          )}
                          title={row.approved ? "Approved — click to reject" : "Click to approve"}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
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
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="rounded px-2 py-1 hover:bg-muted disabled:opacity-40">
                Prev
              </button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="rounded px-2 py-1 hover:bg-muted disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Summary line */}
      <p className="text-xs text-muted-foreground">
        {rows.filter(r => r.approved).length} approved · {rows.filter(r => !r.approved).length} pending
      </p>
    </div>
  );
}
