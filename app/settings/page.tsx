import type { Metadata } from "next";
import { KeyRound, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure providers, security, roles, and workspace defaults."
};

export default function SettingsPage() {
  return (
    <AppShell>
      <section>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Configure providers, defaults, security controls, and deployment
          environment values.
        </p>
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <KeyRound className="h-5 w-5 text-accent" />
          <h2 className="mt-4 font-semibold">AI providers</h2>
          <div className="mt-4 grid gap-3">
            <Input readOnly value="Groq - primary" />
            <Input readOnly value="Ollama - secondary-ready" />
            <Select defaultValue="openai/gpt-oss-120b">
              <option value="openai/gpt-oss-120b">GPT OSS 120B</option>
              <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
              <option value="deepseek-r1-distill-llama-70b">
                DeepSeek R1 Distill 70B
              </option>
            </Select>
          </div>
        </Card>
        <Card className="p-5">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <h2 className="mt-4 font-semibold">Security</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>JWT authentication boundary</li>
            <li>Role-based access model</li>
            <li>Rate limiting hooks</li>
            <li>Audit log tables</li>
            <li>Encrypted provider secrets</li>
          </ul>
        </Card>
        <Card className="p-5">
          <SlidersHorizontal className="h-5 w-5 text-accent" />
          <h2 className="mt-4 font-semibold">Performance</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>Server component shell</li>
            <li>Lazy client workflows</li>
            <li>Edge streaming chat route</li>
            <li>Virtualized heavy tables planned</li>
            <li>FastAPI async worker queue</li>
          </ul>
        </Card>
      </section>
    </AppShell>
  );
}
