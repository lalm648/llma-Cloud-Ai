"use client";

import { useState, useTransition } from "react";
import { Copy, Sparkles } from "lucide-react";
import { ecommercePrompt } from "@/lib/ai/prompts";
import { models } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function GeneratorPanel({
  title,
  tasks,
  placeholder
}: {
  title: string;
  tasks: string[];
  placeholder: string;
}) {
  const [task, setTask] = useState(tasks[0]);
  const [model, setModel] = useState<string>(models[0].id);
  const [product, setProduct] = useState("");
  const [keywords, setKeywords] = useState("");
  const [output, setOutput] = useState("");
  const [isPending, startTransition] = useTransition();

  function generate() {
    const prompt = ecommercePrompt({ task, product, keywords });
    setOutput("");

    startTransition(async () => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!response.ok || !response.body) {
        setOutput(await response.text());
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        setOutput((current) => current + decoder.decode(value, { stream: true }));
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="p-5">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Generate structured, ecommerce-ready content with low-latency model
          streaming.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Output type
            <Select onChange={(event) => setTask(event.target.value)} value={task}>
              {tasks.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Model
            <Select
              onChange={(event) => setModel(event.target.value)}
              value={model}
            >
              {models.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            SEO keywords
            <Input
              onChange={(event) => setKeywords(event.target.value)}
              placeholder="carry-on luggage, lightweight suitcase"
              value={keywords}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Source
            <Textarea
              onChange={(event) => setProduct(event.target.value)}
              placeholder={placeholder}
              value={product}
            />
          </label>
          <Button disabled={isPending} onClick={generate} type="button">
            <Sparkles className="h-4 w-4" />
            Generate
          </Button>
        </div>
      </Card>

      <Card className="min-h-[560px] p-5">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="font-semibold">Output</h2>
            <p className="text-xs text-muted-foreground">
              Markdown-ready content streamed from Groq
            </p>
          </div>
          <Button
            aria-label="Copy output"
            onClick={() => navigator.clipboard.writeText(output)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4 whitespace-pre-wrap text-sm leading-7">
          {output || "Generated content will appear here."}
        </div>
      </Card>
    </div>
  );
}
