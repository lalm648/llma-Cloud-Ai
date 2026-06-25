import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#003876" },
    { media: "(prefers-color-scheme: dark)",  color: "#1e3a5f" },
  ]
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Anti-flash script: runs synchronously before paint.
          Reads localStorage → applies .dark to <html> before React hydrates,
          eliminating the flash of incorrect theme on reload.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('neogen-theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
