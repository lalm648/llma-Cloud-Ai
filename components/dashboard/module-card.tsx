import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export function ModuleCard({
  title,
  description,
  href,
  icon: Icon,
  status
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full p-5 transition-colors hover:border-accent">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {status}
          </span>
        </div>
        <h3 className="mt-5 text-lg font-semibold">{title}</h3>
        <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent">
          Open module <ArrowRight className="h-4 w-4" />
        </span>
      </Card>
    </Link>
  );
}
