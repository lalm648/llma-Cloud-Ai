import type {
  HandleStatus,
  IssueKey,
  ParsedCSV,
  ProductAudit,
  AuditSummary,
} from './types';

// ─── CSV Tokenizer ───────────────────────────────────────────────────────────

export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      field += '"';
      i++;
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

// ─── Column mapping ──────────────────────────────────────────────────────────

const ALIASES: Record<string, string[]> = {
  handle:         ['handle'],
  title:          ['title'],
  bodyHtml:       ['body (html)', 'body_html', 'description', 'body html'],
  vendor:         ['vendor'],
  productType:    ['type', 'product type'],
  tags:           ['tags'],
  sku:            ['variant sku', 'sku'],
  imageAltText:   ['image alt text', 'image_alt_text'],
  seoTitle:       ['seo title', 'seo_title', 'meta title'],
  seoDescription: ['seo description', 'seo_description', 'meta description'],
  color:          ['option1 value', 'color'],
  size:           ['option2 value', 'size'],
};

function buildColMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((h, i) => {
    map[h.trim()] = i;
    map[h.trim().toLowerCase()] = i;
  });
  return map;
}

function findCol(colMap: Record<string, number>, aliases: string[]): number {
  for (const a of aliases) {
    if (a in colMap) return colMap[a];
  }
  return -1;
}

function getVal(row: string[], idx: number): string {
  if (idx < 0 || idx >= row.length) return '';
  return (row[idx] ?? '').trim();
}

// ─── Brand-number extraction ─────────────────────────────────────────────────
// Returns the set of standalone numbers that appear in the vendor string.
// e.g. vendor "Official 81" → { "81" }
//      vendor "Qatar 81 Sports" → { "81" }
//      vendor "Aigner" → {}
function vendorNumbers(vendor: string): Set<string> {
  const tokens = vendor
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => /^[0-9]+$/.test(t));
  return new Set(tokens);
}

// ─── Handle weakness detection ────────────────────────────────────────────────

export function detectHandleStatus(
  handle: string,
  sku: string,
  vendor: string = '',
): { status: HandleStatus; reason: string } {
  if (!handle) return { status: 'weak', reason: 'Handle is empty' };

  const brandNums = vendorNumbers(vendor);

  // ── SKU prefix (first 5 chars of actual SKU code) ────────────────────────
  if (sku && handle.toLowerCase().startsWith(sku.toLowerCase().substring(0, 5))) {
    return { status: 'sku_first', reason: `Starts with SKU (${sku.substring(0, 8)})` };
  }

  // ── Numeric start — only flag if it's NOT a brand number ─────────────────
  if (/^[0-9]/.test(handle)) {
    const leadingNum = handle.match(/^([0-9]+)/)?.[1] ?? '';
    if (!brandNums.has(leadingNum)) {
      return { status: 'sku_first', reason: 'Starts with a number' };
    }
    // e.g. "81" is the vendor name → brand-first handle, continue other checks
  }

  // ── Format checks ─────────────────────────────────────────────────────────
  if (handle !== handle.toLowerCase()) {
    return { status: 'weak', reason: 'Contains uppercase letters' };
  }
  if (/\s/.test(handle)) {
    return { status: 'weak', reason: 'Contains spaces' };
  }
  if (/[^a-z0-9\-]/.test(handle)) {
    return { status: 'weak', reason: 'Contains special characters' };
  }
  if (handle.length > 70) {
    return { status: 'weak', reason: `Too long (${handle.length} chars)` };
  }

  const parts = handle.split('-').filter(Boolean);
  if (parts.length < 2) {
    return { status: 'weak', reason: 'Too short (< 2 segments)' };
  }
  if (new Set(parts).size !== parts.length) {
    return { status: 'weak', reason: 'Contains duplicate words' };
  }

  // ── Internal code pattern — skip if first segment is a known brand number ─
  // Matches things like "a81202", "xy01", "abc123" but NOT brand numbers like "81"
  if (
    /^[a-z]{0,3}[0-9]{2,}/.test(parts[0]) &&
    parts[0].length <= 8 &&
    !brandNums.has(parts[0])
  ) {
    return { status: 'sku_first', reason: 'Starts with product code' };
  }

  return { status: 'ok', reason: '' };
}

// ─── Content weakness ─────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordCount(text: string): number {
  return text.split(' ').filter(Boolean).length;
}

// ─── Main audit ───────────────────────────────────────────────────────────────

export function auditShopifyCSV(
  filename: string,
  text: string,
): { products: ProductAudit[]; summary: AuditSummary; parsedCsv: ParsedCSV } {
  const matrix = parseCsvText(text);
  if (matrix.length < 2) throw new Error('CSV has no data rows');

  const headers = matrix[0];
  const dataRows = matrix.slice(1);
  const colMap = buildColMap(headers);

  const cols = {
    handle:         findCol(colMap, ALIASES.handle),
    title:          findCol(colMap, ALIASES.title),
    bodyHtml:       findCol(colMap, ALIASES.bodyHtml),
    vendor:         findCol(colMap, ALIASES.vendor),
    productType:    findCol(colMap, ALIASES.productType),
    tags:           findCol(colMap, ALIASES.tags),
    sku:            findCol(colMap, ALIASES.sku),
    imageAltText:   findCol(colMap, ALIASES.imageAltText),
    seoTitle:       findCol(colMap, ALIASES.seoTitle),
    seoDescription: findCol(colMap, ALIASES.seoDescription),
    color:          findCol(colMap, ALIASES.color),
    size:           findCol(colMap, ALIASES.size),
  };

  const seenHandles = new Set<string>();
  const products: ProductAudit[] = [];

  dataRows.forEach((row, i) => {
    const handle = getVal(row, cols.handle);
    if (seenHandles.has(handle)) return;
    seenHandles.add(handle);

    const title          = getVal(row, cols.title);
    const bodyHtml       = getVal(row, cols.bodyHtml);
    const vendor         = getVal(row, cols.vendor);
    const productType    = getVal(row, cols.productType);
    const tags           = getVal(row, cols.tags);
    const sku            = getVal(row, cols.sku);
    const imageAltText   = getVal(row, cols.imageAltText);
    const seoTitle       = getVal(row, cols.seoTitle);
    const seoDescription = getVal(row, cols.seoDescription);
    const color          = getVal(row, cols.color);
    const size           = getVal(row, cols.size);

    // Pass vendor so brand-number handles (e.g. "81-ceramic-mug") are not mis-flagged
    const { status: handleStatus, reason: handleWeakReason } =
      detectHandleStatus(handle, sku, vendor);

    const descText  = stripHtml(bodyHtml);
    const descWords = wordCount(descText);

    const issues: IssueKey[] = [];
    if (!bodyHtml || descWords < 20)                       issues.push('missing_description');
    if (!seoTitle || seoTitle.length < 10)                 issues.push('missing_seo_title');
    if (!seoDescription || seoDescription.length < 20)    issues.push('missing_seo_description');
    if (handleStatus !== 'ok')                             issues.push('weak_handle');
    if (!imageAltText)                                     issues.push('missing_image_alt');

    products.push({
      rowIndex: i,
      handle, title, bodyHtml, vendor, productType, tags,
      sku, imageAltText, seoTitle, seoDescription, color, size,
      issues, handleStatus, handleWeakReason,
    });
  });

  const summary: AuditSummary = {
    totalProducts:         products.length,
    missingDescription:    products.filter(p => p.issues.includes('missing_description')).length,
    missingSeoTitle:       products.filter(p => p.issues.includes('missing_seo_title')).length,
    missingSeoDescription: products.filter(p => p.issues.includes('missing_seo_description')).length,
    weakHandles:           products.filter(p => p.handleStatus === 'weak').length,
    skuFirstHandles:       products.filter(p => p.handleStatus === 'sku_first').length,
    alreadyOptimized:      products.filter(p => p.issues.length === 0).length,
  };

  return {
    products,
    summary,
    parsedCsv: { filename, headers, rows: dataRows, colMap },
  };
}
