import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { ChatPanel } from "@/components/chat/chat-panel";

export const metadata: Metadata = {
  title: "AI Chat",
  description: "Streaming Groq AI chat with model selection and ecommerce context."
};

export default function ChatPage() {
  return (
    <AppShell>
      <ChatPanel />
    </AppShell>
  );
}
