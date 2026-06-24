import type { Metadata } from "next";
import { Activity, BarChart3, Coins, Gauge, History, Users } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Usage, token, cost, CSV job, user activity, and performance metrics."
};

export default function AnalyticsPage() {
  return (
    <AppShell>
      <section>
        <h1 className="text-3xl font-semibold">Analytics</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Monitor generation volume, token usage, API cost, CSV jobs, user
          activity, top prompts, and performance metrics.
        </p>
      </section>
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard detail="Current workspace" icon={Activity} label="Generations" value="0" />
        <KpiCard detail="Groq streamed tokens" icon={BarChart3} label="Tokens" value="0" />
        <KpiCard detail="Provider cost estimate" icon={Coins} label="API Cost" value="$0.00" />
        <KpiCard detail="P95 route latency" icon={Gauge} label="Performance" value="Ready" />
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {[History, Users].map((Icon, index) => (
          <Card className="min-h-72 p-5" key={index}>
            <Icon className="h-5 w-5 text-accent" />
            <h2 className="mt-4 font-semibold">
              {index === 0 ? "Job history" : "User activity"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect Supabase tables to populate live operational telemetry.
            </p>
          </Card>
        ))}
      </section>
    </AppShell>
  );
}
