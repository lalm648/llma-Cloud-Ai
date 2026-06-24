"use client";

import { Copy, RefreshCw, Send } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { models } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const starterMessages: Message[] = [
  {
    role: "assistant",
    content:
      "Welcome to NeoGen AI Studio. Choose a model and send a product, SEO, CSV, or ecommerce automation request."
  }
];

export function ChatPanel() {
  const [model, setModel] = useState<string>(models[0].id);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [isPending, startTransition] = useTransition();

  const lastAssistant = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant"),
    [messages]
  );

  async function sendMessage(prompt = input) {
    const trimmed = prompt.trim();
    if (!trimmed || isPending) return;

    setInput("");
    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
      { role: "assistant", content: "" }
    ];
    setMessages(nextMessages);

    startTransition(async () => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: nextMessages
            .filter((message) => message.content)
            .map((message) => ({
              role: message.role,
              content: message.content
            }))
        })
      });

      if (!response.ok || !response.body) {
        const fallback = await response.text();
        setMessages((current) =>
          current.map((message, index) =>
            index === current.length - 1
              ? { ...message, content: fallback || "AI request failed." }
              : message
          )
        );
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const token = decoder.decode(value, { stream: true });
        setMessages((current) =>
          current.map((message, index) =>
            index === current.length - 1
              ? { ...message, content: message.content + token }
              : message
          )
        );
      }
    });
  }

  return (
    <div className="grid min-h-[calc(100vh-7rem)] gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-lg border border-border bg-card p-4">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Model
        </label>
        <Select
          className="mt-2"
          onChange={(event) => setModel(event.target.value)}
          value={model}
        >
          {models.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <div className="mt-6 grid gap-2">
          {["Pinned chats", "Search history", "Folders", "Context memory"].map(
            (item) => (
              <button
                className="rounded-md border border-border px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
                key={item}
                type="button"
              >
                {item}
              </button>
            )
          )}
        </div>
      </aside>

      <Card className="flex min-h-[620px] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold">AI Chat</h1>
            <p className="text-xs text-muted-foreground">
              Streaming Groq responses with progressive rendering
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              aria-label="Copy last response"
              onClick={() =>
                navigator.clipboard.writeText(lastAssistant?.content || "")
              }
              size="icon"
              type="button"
              variant="ghost"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              aria-label="Regenerate"
              onClick={() => sendMessage(messages.at(-2)?.content || "")}
              size="icon"
              type="button"
              variant="ghost"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div
              className={
                message.role === "user"
                  ? "ml-auto max-w-[85%] rounded-lg bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground"
                  : "max-w-[88%] whitespace-pre-wrap rounded-lg bg-muted px-4 py-3 text-sm leading-6"
              }
              key={`${message.role}-${index}`}
            >
              {message.content || "Generating..."}
            </div>
          ))}
        </div>

        <form
          className="border-t border-border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage();
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Textarea
              className="min-h-20"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Generate Shopify-ready title, description, SEO meta, specs, and Google Shopping fields for..."
              value={input}
            />
            <Button className="sm:h-20 sm:w-14" disabled={isPending} type="submit">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
