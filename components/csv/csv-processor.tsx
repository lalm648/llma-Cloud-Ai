"use client";

import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type CsvState = {
  headers: string[];
  rows: string[][];
  filename: string;
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function CsvProcessor() {
  const [csv, setCsv] = useState<CsvState | null>(null);

  const validation = useMemo(() => {
    if (!csv) return [];
    const required = ["sku", "title", "description"];
    const normalized = csv.headers.map((header) => header.trim().toLowerCase());
    return required.map((field) => ({
      field,
      ok: normalized.includes(field)
    }));
  }, [csv]);

  async function onFile(file: File) {
    const matrix = parseCsv(await file.text());
    setCsv({
      filename: file.name,
      headers: matrix[0] || [],
      rows: matrix.slice(1)
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="p-5">
        <h1 className="text-2xl font-semibold">CSV Processor</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Upload, preview, validate, match SKU fields, and prepare Shopify,
          WooCommerce, or Magento exports.
        </p>
        <label className="mt-6 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted p-6 text-center hover:border-accent">
          <Upload className="h-8 w-8 text-accent" />
          <span className="mt-3 text-sm font-medium">Upload CSV</span>
          <span className="mt-1 text-xs text-muted-foreground">
            Browser preview now, Polars worker for large jobs
          </span>
          <input
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile(file);
            }}
            type="file"
          />
        </label>

        <div className="mt-6 space-y-2">
          {validation.map((item) => (
            <div
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              key={item.field}
            >
              <span>{item.field}</span>
              <span
                className={item.ok ? "text-success" : "text-muted-foreground"}
              >
                {item.ok ? "Found" : "Missing"}
              </span>
            </div>
          ))}
        </div>

        <Button className="mt-6 w-full" disabled={!csv} type="button">
          <Download className="h-4 w-4" />
          Export Shopify Ready
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">Preview</h2>
            <p className="text-xs text-muted-foreground">
              {csv ? `${csv.filename} - ${csv.rows.length} rows` : "No file loaded"}
            </p>
          </div>
          <FileSpreadsheet className="h-5 w-5 text-accent" />
        </div>
        <div className="max-h-[640px] overflow-auto">
          {csv ? (
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  {csv.headers.map((header, index) => (
                    <th
                      className="border-b border-border px-3 py-2 font-medium"
                      key={`${header}-${index}`}
                    >
                      {header || `Column ${index + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csv.rows.slice(0, 100).map((row, rowIndex) => (
                  <tr className="border-b border-border" key={rowIndex}>
                    {csv.headers.map((_, cellIndex) => (
                      <td className="px-3 py-2" key={cellIndex}>
                        {row[cellIndex]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center p-6 text-center text-sm text-muted-foreground">
              CSV preview, comparison, validation, bulk generation, and export
              results appear here.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
