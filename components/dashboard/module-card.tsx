import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const palette = {
  violet: {
    icon: "bg-violet-50 text-violet-600 ring-1 ring-violet-200/80",
    ring: "hover:ring-violet-300/50",
    glow: "from-violet-50/70 to-transparent",
    arrow: "text-violet-600",
  },
  blue: {
    icon: "bg-blue-50 text-blue-600 ring-1 ring-blue-200/80",
    ring: "hover:ring-blue-300/50",
    glow: "from-blue-50/70 to-transparent",
    arrow: "text-blue-600",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/80",
    ring: "hover:ring-emerald-300/50",
    glow: "from-emerald-50/70 to-transparent",
    arrow: "text-emerald-600",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600 ring-1 ring-amber-200/80",
    ring: "hover:ring-amber-300/50",
    glow: "from-amber-50/70 to-transparent",
    arrow: "text-amber-600",
  },
  cyan: {
    icon: "bg-cyan-50 text-cyan-600 ring-1 ring-cyan-200/80",
    ring: "hover:ring-cyan-300/50",
    glow: "from-cyan-50/70 to-transparent",
    arrow: "text-cyan-600",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600 ring-1 ring-rose-200/80",
    ring: "hover:ring-rose-300/50",
    glow: "from-rose-50/70 to-transparent",
    arrow: "text-rose-600",
  },
} as const;

type Color = keyof typeof palette;

const statusStyles: Record<string, string> = {
  Live: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
  Worker: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80",
  Ready: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/80",
};

export function ModuleCard({
  title,
  description,
  href,
  icon: Icon,
  status,
  color = "blue"
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status: string;
  color?: Color;
}) {
  const p = palette[color];
  return (
    <Link href={href} className="group block h-full">
      <Card className={cn(
        "relative h-full overflow-hidden p-5 transition-all duration-200",
        "border-0 shadow-sm ring-1 ring-black/[0.06]",
        "hover:-translate-y-0.5 hover:shadow-md",
        p.ring
      )}>
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          p.glow
        )} />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", p.icon)}>
              <Icon className="h-5 w-5" />
            </span>
            <span className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              statusStyles[status] ?? "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
            )}>
              {status}
            </span>
          </div>
          <h3 className="mt-5 text-base font-semibold tracking-tight">{title}</h3>
          <p className="mt-1.5 min-h-[2.75rem] text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          <span className={cn(
            "mt-4 inline-flex items-center gap-1.5 text-sm font-medium",
            p.arrow
          )}>
            Open module
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Card>
    </Link>
  );
}
