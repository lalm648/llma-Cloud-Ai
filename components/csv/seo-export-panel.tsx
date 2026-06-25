"use client";

import { Download, FileDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ComparisonRow } from "@/lib/shopify-seo/types";

type Props = {
  rows: ComparisonRow[];
  filename: string;
  onExportCSV: () => void;
  onExportLog: () => void;
  onExportRejected: () => void;
  onReset: () => void;
};

export function SeoExportPanel({
  rows, filename,
  onExportCSV, onExportLog, onExportRejected, onReset,
}: Props) {
  const approved = rows.filter(r => r.approved);
  const rejected = rows.filter(r => !r.approved);

  const byField = approved.reduce<Record<string, number>>((acc, r) => {
    acc[r.field] = (acc[r.field] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Export</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Review your approved changes and download the Shopify-ready CSV.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{approved.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Changes approved</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold text-muted-foreground">{rejected.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Changes rejected</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{new Set(approved.map(r => r.rowIndex)).size}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Products updated</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{rows.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Total changes</p>
        </Card>
      </div>

      {/* Field breakdown */}
      {Object.keys(byField).length > 0 && (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Approved changes by field</h3>
          <div className="space-y-2">
            {Object.entries(byField).map(([field, count]) => (
              <div key={field} className="flex items-center gap-3">
                <span className="w-36 text-sm">{field}</span>
                <div className="flex-1 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-violet-500"
                    style={{ width: `${Math.min(100, (count / (approved.length || 1)) * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-medium">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Download actions */}
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-semibold">Downloads</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            onClick={onExportCSV}
            disabled={approved.length === 0}
            className="flex flex-col items-start gap-2 rounded-lg border-2 border-violet-200 bg-violet-50 p-4 text-left transition-colors hover:border-violet-400 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-violet-800 dark:bg-violet-900/20 dark:hover:bg-violet-900/40"
          >
            <Download className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <div>
              <p className="font-medium text-violet-900 dark:text-violet-200">Shopify CSV</p>
              <p className="mt-0.5 text-xs text-violet-700 dark:text-violet-400">
                {approved.length} approved changes applied to {filename}
              </p>
            </div>
          </button>

          <button
            onClick={onExportLog}
            disabled={rows.length === 0}
            className="flex flex-col items-start gap-2 rounded-lg border-2 border-border p-4 text-left transition-colors hover:border-accent hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileDown className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Change Log CSV</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                All {rows.length} changes with before/after/reason
              </p>
            </div>
          </button>

          <button
            onClick={onExportRejected}
            disabled={rejected.length === 0}
            className="flex flex-col items-start gap-2 rounded-lg border-2 border-border p-4 text-left transition-colors hover:border-accent hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileDown className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Rejected Changes</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {rejected.length} rejected — review later
              </p>
            </div>
          </button>
        </div>
      </Card>

      {/* Reset */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          Start over with a new CSV
        </Button>
      </div>
    </div>
  );
}
