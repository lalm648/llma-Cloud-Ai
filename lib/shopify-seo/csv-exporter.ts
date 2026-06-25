import type { ParsedCSV, ComparisonRow, FieldName } from './types';

// ─── CSV escaping ────────────────────────────────────────────────────────────

function escapeField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ─── Column resolution ───────────────────────────────────────────────────────

// Maps our internal FieldName to Shopify CSV column aliases (lowercase)
const FIELD_TO_COL_ALIASES: Record<FieldName, string[]> = {
  'Handle':           ['handle'],
  'SEO Title':        ['seo title', 'seo_title', 'meta title'],
  'SEO Description':  ['seo description', 'seo_description', 'meta description'],
  'Body HTML':        ['body (html)', 'body_html', 'description', 'body html'],
  'Image Alt Text':   ['image alt text', 'image_alt_text'],
};

function resolveColIndex(colMap: Record<string, number>, field: FieldName): number {
  for (const alias of FIELD_TO_COL_ALIASES[field]) {
    if (alias in colMap) return colMap[alias];
    // try original-case version stored alongside lowercase
    if (alias.toLowerCase() in colMap) return colMap[alias.toLowerCase()];
  }
  return -1;
}

// ─── Exports ────────────────────────────────────────────────────────────────

export function exportShopifyCSV(
  parsedCsv: ParsedCSV,
  comparisonRows: ComparisonRow[],
): string {
  const { headers, rows, colMap } = parsedCsv;
  const approved = comparisonRows.filter(r => r.approved);

  // Pre-resolve column indices
  const handleIdx       = resolveColIndex(colMap, 'Handle');
  const seoTitleIdx     = resolveColIndex(colMap, 'SEO Title');
  const seoDescIdx      = resolveColIndex(colMap, 'SEO Description');
  const bodyHtmlIdx     = resolveColIndex(colMap, 'Body HTML');
  const imageAltIdx     = resolveColIndex(colMap, 'Image Alt Text');

  // Build rowIndex → field → newValue map
  const changeMap = new Map<string, string>(); // `${rowIndex}:${field}` → newValue
  for (const row of approved) {
    changeMap.set(`${row.rowIndex}:${row.field}`, row.newValue);
  }

  // Collect handle renames: first-row rowIndex → new handle (for propagating to variant rows)
  const oldToNewHandle = new Map<string, string>();
  if (handleIdx >= 0) {
    for (const row of approved) {
      if (row.field === 'Handle') {
        const originalHandle = rows[row.rowIndex]?.[handleIdx] ?? '';
        if (originalHandle) oldToNewHandle.set(originalHandle, row.newValue);
      }
    }
  }

  // Track generated handles to enforce uniqueness
  const usedHandles = new Set<string>();

  const outputRows: string[][] = [headers.slice()];

  rows.forEach((row, i) => {
    const newRow = row.slice();
    // Pad to header length
    while (newRow.length < headers.length) newRow.push('');

    // ── Handle (propagate rename to all variant rows) ──
    if (handleIdx >= 0) {
      const currentHandle = newRow[handleIdx] ?? '';
      const renamed = oldToNewHandle.get(currentHandle);
      if (renamed) {
        // Ensure uniqueness: if already used, suffix with row index
        let finalHandle = renamed;
        if (usedHandles.has(finalHandle)) {
          finalHandle = `${renamed}-${i}`;
        }
        usedHandles.add(finalHandle);
        newRow[handleIdx] = finalHandle;
      } else {
        usedHandles.add(currentHandle);
      }
    }

    // ── SEO fields (only apply to the product's first row via rowIndex) ──
    const applyIfApproved = (idx: number, field: FieldName) => {
      if (idx < 0) return;
      const val = changeMap.get(`${i}:${field}`);
      if (val !== undefined) newRow[idx] = val;
    };

    applyIfApproved(seoTitleIdx,  'SEO Title');
    applyIfApproved(seoDescIdx,   'SEO Description');
    applyIfApproved(bodyHtmlIdx,  'Body HTML');
    applyIfApproved(imageAltIdx,  'Image Alt Text');

    outputRows.push(newRow.slice(0, headers.length));
  });

  return outputRows.map(r => r.map(escapeField).join(',')).join('\n');
}

export function exportChangeLogCSV(comparisonRows: ComparisonRow[]): string {
  const header = [
    'Product Title', 'SKU', 'Field',
    'Old Value', 'New Value', 'Reason',
    'Status', 'Approved',
  ];
  const dataRows = comparisonRows.map(r => [
    r.productTitle,
    r.sku,
    r.field,
    r.oldValue,
    r.newValue,
    r.reason,
    r.status,
    r.approved ? 'Yes' : 'No',
  ]);
  return [header, ...dataRows].map(r => r.map(escapeField).join(',')).join('\n');
}

export function exportRejectedCSV(comparisonRows: ComparisonRow[]): string {
  const rejected = comparisonRows.filter(r => !r.approved);
  return exportChangeLogCSV(rejected);
}

export function triggerDownload(
  content: string,
  filename: string,
  mimeType = 'text/csv;charset=utf-8;',
): void {
  const bom = '﻿'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([bom + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
