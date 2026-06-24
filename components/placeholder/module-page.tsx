import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ModulePage({
  title,
  description,
  icon: Icon,
  items
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  items: string[];
}) {
  return (
    <div>
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            NeoGen module
          </p>
          <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-primary">
          <Icon className="h-6 w-6" />
        </span>
      </section>
      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card className="p-5" key={item}>
            <h2 className="font-semibold">{item}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Architecture-ready with database, API, and role-based access
              boundaries prepared for production expansion.
            </p>
          </Card>
        ))}
      </section>
    </div>
  );
}
