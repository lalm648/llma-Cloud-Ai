export const systemPrompt = `You are NeoGen AI Studio, a fast enterprise ecommerce AI assistant.
Prioritize concise, conversion-focused, SEO-aware output.
When generating product or CSV fields, return structured, directly usable content.
Never invent regulated claims, shipping policies, stock quantities, or brand guarantees.`;

export function ecommercePrompt(input: {
  task: string;
  tone?: string;
  locale?: string;
  product?: string;
  keywords?: string;
}) {
  return [
    `Task: ${input.task}`,
    `Tone: ${input.tone || "premium, clear, ecommerce-ready"}`,
    `Locale: ${input.locale || "en"}`,
    input.product ? `Product: ${input.product}` : null,
    input.keywords ? `SEO keywords: ${input.keywords}` : null,
    "Return clean markdown with practical sections."
  ]
    .filter(Boolean)
    .join("\n");
}
