import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NeoGen AI Studio",
    template: "%s | NeoGen AI Studio"
  },
  description:
    "Ultra-fast AI operating system for ecommerce content, SEO, product enrichment, CSV automation, and AI assistants.",
  metadataBase: new URL("https://neogen-ai-studio.vercel.app"),
  openGraph: {
    title: "NeoGen AI Studio",
    description:
      "AI SaaS platform for Shopify automation, ecommerce content, SEO, CSV processing, and knowledge workflows.",
    type: "website"
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#003876"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
