import {
  BarChart3,
  BookOpenText,
  Boxes,
  FileSpreadsheet,
  Home,
  Image,
  Library,
  MessageSquareText,
  Search,
  Settings,
  Sparkles
} from "lucide-react";

export const models = [
  {
    id: "openai/gpt-oss-120b",
    name: "GPT OSS 120B",
    provider: "Groq",
    latency: "Fast",
    context: "Large"
  },
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B",
    provider: "Groq",
    latency: "Fastest",
    context: "Large"
  },
  {
    id: "deepseek-r1-distill-llama-70b",
    name: "DeepSeek R1 Distill 70B",
    provider: "Groq",
    latency: "Reasoning",
    context: "Large"
  }
] as const;

export const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "AI Chat", href: "/chat", icon: MessageSquareText },
  { name: "Content Studio", href: "/content", icon: Sparkles },
  { name: "SEO Studio", href: "/seo", icon: Search },
  { name: "Product Studio", href: "/products", icon: Boxes },
  { name: "CSV Processor", href: "/csv", icon: FileSpreadsheet },
  { name: "Image Studio", href: "/image", icon: Image },
  { name: "Prompt Library", href: "/prompts", icon: Library },
  { name: "Knowledge Base", href: "/knowledge", icon: BookOpenText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings }
] as const;

export const studioTasks = [
  "Product Titles",
  "Descriptions",
  "SEO Titles",
  "Meta Descriptions",
  "Collection Content",
  "Category Content",
  "Blogs",
  "Push Notifications",
  "Emails",
  "Social Media Posts",
  "ALT Text",
  "FAQ",
  "Features",
  "Specifications"
];

export const ecommerceFields = [
  "Title",
  "Description",
  "SEO Title",
  "Meta Description",
  "Handle",
  "Features",
  "Materials",
  "Specifications",
  "Highlights",
  "Google Shopping Fields",
  "Shopify Fields"
];
