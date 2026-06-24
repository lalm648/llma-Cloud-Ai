import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const palette = {
  amber: {
    stripe: "from-amber-400 to-orange-400",
    icon: "bg-amber-50 text-amber-600 ring-1 ring-amber-200/80",
  },
  blue: {
    stripe: "from-blue-400 to-indigo-400",
    icon: "bg-blue-50 text-blue-600 ring-1 ring-blue-200/80",
  },
  violet: {
    stripe: "from-violet-400 to-purple-500",
    icon: "bg-violet-50 text-violet-600 ring-1 ring-violet-200/80",
  },
  emerald: {
    stripe: "from-emerald-400 to-teal-400",
    icon: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/80",
  },
} as const;

type Color = keyof typeof palette;

export function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  color = "blue"
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  color?: Color;
}) {
  const p = palette[color];
  return (
    <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-black/[0.06]">
      <div className={cn("h-[3px] w-full bg-gradient-to-r", p.stripe)} />
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", p.icon)}>
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent className="pb-5">
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1.5 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
