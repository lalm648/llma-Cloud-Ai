import Link from "next/link";
import { Suspense } from "react";
import { Bot, Menu, Zap } from "lucide-react";
import { NavLinks }    from "@/components/shell/nav-links";
import { MobileNav }   from "@/components/shell/mobile-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-border bg-card px-4 py-5 lg:flex">
        {/* Brand */}
        <Link className="flex items-center gap-3 px-2" href="/">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-sm">
            <Bot className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
              NeoGen
            </span>
            <span className="block text-lg font-semibold leading-5 text-foreground">
              AI Studio
            </span>
          </span>
        </Link>

        {/* Navigation — client component for active state */}
        <NavLinks />

        {/* Bottom controls */}
        <div className="mt-auto flex flex-col gap-2">
          {/* Dark mode row */}
          <ThemeToggle variant="row" />

          {/* Speed profile card */}
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Zap className="h-4 w-4" />
              Speed profile
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Server components, edge streaming, lazy client islands, and
              virtualized heavy workflows.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Mobile header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
        <Link className="flex items-center gap-2 font-semibold text-foreground" href="/">
          <Bot className="h-5 w-5 text-primary" />
          NeoGen AI Studio
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle variant="icon" />
          <Suspense fallback={<Menu className="h-5 w-5" />}>
            <MobileNav />
          </Suspense>
        </div>
      </header>

      {/* ── Page content ─────────────────────────────────────────────── */}
      <main className="lg:pl-72">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
