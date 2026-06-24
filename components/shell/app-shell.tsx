import Link from "next/link";
import { Suspense } from "react";
import { Bot, Menu, Zap } from "lucide-react";
import { navigation } from "@/lib/constants";
import { MobileNav } from "@/components/shell/mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border bg-card px-4 py-5 lg:block">
        <Link className="flex items-center gap-3 px-2" href="/">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              NeoGen
            </span>
            <span className="block text-lg font-semibold leading-5">
              AI Studio
            </span>
          </span>
        </Link>

        <nav className="mt-8 grid gap-1">
          {navigation.map((item) => (
            <Link
              className="group flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              href={item.href}
              key={item.name}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute inset-x-4 bottom-5 rounded-lg border border-border bg-muted p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Zap className="h-4 w-4 text-accent" />
            Speed profile
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Server components, edge streaming, lazy client islands, and
            virtualized heavy workflows.
          </p>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
        <Link className="flex items-center gap-2 font-semibold" href="/">
          <Bot className="h-5 w-5 text-primary" />
          NeoGen AI Studio
        </Link>
        <Suspense fallback={<Menu className="h-5 w-5" />}>
          <MobileNav />
        </Suspense>
      </header>

      <main className="lg:pl-72">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
