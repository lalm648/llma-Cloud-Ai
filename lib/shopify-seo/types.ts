export type HandleStatus = 'ok' | 'weak' | 'sku_first';

export type IssueKey =
  | 'missing_description'
  | 'missing_seo_title'
  | 'missing_seo_description'
  | 'weak_handle'
  | 'missing_image_alt';

export type FilterKey =
  | 'all'
  | 'missing_description'
  | 'missing_seo_title'
  | 'missing_seo_description'
  | 'weak_handle';

export type ProductAudit = {
  rowIndex: number;        // 0-based index into dataRows (first row for this handle)
  handle: string;
  title: string;
  bodyHtml: string;
  vendor: string;
  productType: string;
  tags: string;
  sku: string;
  imageAltText: string;
  seoTitle: string;
  seoDescription: string;
  color: string;
  size: string;
  issues: IssueKey[];
  handleStatus: HandleStatus;
  handleWeakReason: string;
};

export type AuditSummary = {
  totalProducts: number;
  missingDescription: number;
  missingSeoTitle: number;
  missingSeoDescription: number;
  weakHandles: number;
  skuFirstHandles: number;
  alreadyOptimized: number;
};

export type FieldName =
  | 'Handle'
  | 'SEO Title'
  | 'SEO Description'
  | 'Body HTML'
  | 'Image Alt Text';

export type ComparisonRow = {
  rowIndex: number;
  productTitle: string;
  sku: string;
  field: FieldName;
  oldValue: string;
  newValue: string;
  reason: string;
  confidence: number;
  status: 'missing' | 'weak' | 'updated';
  approved: boolean;
};

export type ParsedCSV = {
  filename: string;
  headers: string[];
  rows: string[][];         // dataRows only (no header row)
  colMap: Record<string, number>;  // original-case header -> index
};

export type GenerateProductPayload = {
  rowIndex: number;
  title: string;
  vendor: string;
  productType: string;
  handle: string;
  handleStatus: HandleStatus;      // 'ok' | 'weak' | 'sku_first' — tells AI why handle needs fixing
  handleWeakReason: string;        // human-readable reason e.g. "Starts with a number"
  bodyHtml: string;
  seoTitle: string;
  seoDescription: string;
  sku: string;
  color: string;
  size: string;
  tags: string;
  imageAltText: string;
  generateFields: string[];   // subset of: optimized_handle, seo_title, seo_description, body_html, image_alt_text
};

export type GenerateProductResult = {
  rowIndex: number;
  success: boolean;
  error?: string;
  optimizedHandle?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  bodyHtml?: string | null;
  imageAltText?: string | null;
  reasons: Partial<Record<'handle' | 'seoTitle' | 'seoDescription' | 'bodyHtml' | 'imageAltText', string>>;
};

export type GenerationState = {
  status: 'idle' | 'running' | 'done' | 'error';
  total: number;
  processed: number;
  fields: number;
  errors: string[];
};
