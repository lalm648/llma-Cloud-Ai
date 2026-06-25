'use client';

import { Copy, RefreshCw, Send, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { models } from '@/lib/constants';
import { Button }   from '@/components/ui/button';
import { Card }     from '@/components/ui/card';
import { Select }   from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ImageIntentResult, GenerateImageResult } from '@/lib/image-gen/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  imagePrompt?: string;
  imageLoading?: boolean;
};

// ─── Image detection heuristic ────────────────────────────────────────────────

const IMAGE_RE =
  /\b(generate|create|make|design|produce)\b.{0,80}\b(image|photo|banner|poster|picture|visual|graphic|ad)\b/i;

function looksLikeImageRequest(text: string): boolean {
  return IMAGE_RE.test(text);
}

// ─── Download helper ──────────────────────────────────────────────────────────

function downloadImage(url: string, ext: 'png' | 'jpg' = 'png'): void {
  const filename = `neogen-image.${ext}`;
  if (url.startsWith('data:')) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    window.open(url, '_blank');
  }
}

// ─── Starter messages ─────────────────────────────────────────────────────────

const starterMessages: Message[] = [
  {
    role: 'assistant',
    content:
      'Welcome to NeoGen AI Studio. Choose a model and send a product, SEO, CSV, or ecommerce request.\n\nFor image generation try: "Generate a luxury product image for Creed Aventus" or "Create a homepage banner 1920x720 for BlueSalon".',
  },
];

// ─── ChatPanel ────────────────────────────────────────────────────────────────

export function ChatPanel() {
  const [model, setModel]       = useState<string>(models[0].id);
  const [input, setInput]       = useState('');
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [isPending, startTransition] = useTransition();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const lastAssistant = useMemo(
    () => [...messages].reverse().find(m => m.role === 'assistant'),
    [messages],
  );

  // ── Image generation via /api/images/generate ──────────────────────────────

  async function generateChatImage(userMessage: string, msgIndex: number): Promise<void> {
    // Extract intent
    let intent: ImageIntentResult | null = null;
    try {
      const r = await fetch('/api/chat/image-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      if (r.ok) intent = await r.json() as ImageIntentResult;
    } catch { /* fall through to text chat */ }

    if (!intent?.isImageRequest) return generateTextResponse(userMessage);

    // Mark assistant message as loading
    setMessages(prev =>
      prev.map((m, i) =>
        i === msgIndex
          ? { ...m, imageLoading: true, content: `Generating ${intent!.imageType?.replace(/_/g, ' ')} image${intent!.product ? ` for "${intent!.product}"` : ''}… (${intent!.width}×${intent!.height})` }
          : m,
      ),
    );

    // Generate image
    const provider = (localStorage.getItem('neogen_image_provider') ?? 'huggingface') as string;
    const prompt = intent.prompt || userMessage;

    try {
      const genResp = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negativePrompt: 'text, watermark, logo, blurry, low quality, distorted',
          width:    intent.width  || 1024,
          height:   intent.height || 1024,
          provider,
          numImages: 1,
          imageType: intent.imageType || 'product',
          brand:    intent.brand   || '',
          productTitle: intent.product || '',
        }),
      });

      const result = await genResp.json() as GenerateImageResult;

      if (result.success && result.images.length > 0) {
        setMessages(prev =>
          prev.map((m, i) =>
            i === msgIndex
              ? {
                  ...m,
                  imageLoading: false,
                  content: `Here${result.images.length > 1 ? ' are' : "'s"} your generated image${result.images.length > 1 ? 's' : ''}:`,
                  images: result.images.map(img => img.url),
                  imagePrompt: prompt,
                }
              : m,
          ),
        );
      } else {
        setMessages(prev =>
          prev.map((m, i) =>
            i === msgIndex
              ? { ...m, imageLoading: false, content: `Image generation failed: ${result.error ?? 'Unknown error'}. Try the Image Studio at /image for more options.` }
              : m,
          ),
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed';
      setMessages(prev =>
        prev.map((m, i) =>
          i === msgIndex ? { ...m, imageLoading: false, content: `Error: ${msg}` } : m,
        ),
      );
    }
  }

  // ── Streaming text response ────────────────────────────────────────────────

  async function generateTextResponse(prompt: string): Promise<void> {
    const historyForApi = messages
      .filter(m => m.content && !m.imageLoading)
      .map(m => ({ role: m.role, content: m.content }));

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: historyForApi }),
    });

    if (!response.ok || !response.body) {
      const fallback = await response.text();
      setMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, content: fallback || 'AI request failed.' } : m,
        ),
      );
      return;
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const token = decoder.decode(value, { stream: true });
      setMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, content: m.content + token } : m,
        ),
      );
    }
  }

  // ── Send message (detects image intent first) ──────────────────────────────

  async function sendMessage(prompt = input) {
    const trimmed = prompt.trim();
    if (!trimmed || isPending) return;

    setInput('');
    const assistantPlaceholder: Message = { role: 'assistant', content: '' };
    const nextMessages: Message[] = [
      ...messages,
      { role: 'user', content: trimmed },
      assistantPlaceholder,
    ];
    setMessages(nextMessages);
    const assistantIdx = nextMessages.length - 1;

    startTransition(async () => {
      if (looksLikeImageRequest(trimmed)) {
        await generateChatImage(trimmed, assistantIdx);
      } else {
        await generateTextResponse(trimmed);
      }
    });
  }

  function handleCopy(idx: number, text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  return (
    <div className="grid min-h-[calc(100vh-7rem)] gap-4 lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <aside className="rounded-lg border border-border bg-card p-4">
        <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Model
        </label>
        <Select className="mt-2" value={model} onChange={e => setModel(e.target.value)}>
          {models.map(item => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </Select>
        <div className="mt-6 grid gap-2">
          {['Pinned chats', 'Search history', 'Folders', 'Context memory'].map(item => (
            <button
              key={item} type="button"
              className="rounded-md border border-border px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-6 rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-xs font-semibold text-muted-foreground">Image commands</p>
          <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            <li>"Generate product image for Creed Aventus"</li>
            <li>"Create homepage banner 1920x720"</li>
            <li>"Make Instagram post for Samsonite"</li>
            <li>"Generate Google ad 300x250"</li>
          </ul>
        </div>
      </aside>

      {/* Chat area */}
      <Card className="flex min-h-[620px] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold">AI Chat</h1>
            <p className="text-xs text-muted-foreground">
              Streaming chat + AI image generation
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              aria-label="Copy last response"
              onClick={() => navigator.clipboard.writeText(lastAssistant?.content ?? '')}
              size="icon" type="button" variant="ghost"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              aria-label="Regenerate"
              onClick={() => { void sendMessage(messages.at(-2)?.content ?? ''); }}
              size="icon" type="button" variant="ghost"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`}>
              <div
                className={
                  message.role === 'user'
                    ? 'ml-auto max-w-[85%] rounded-lg bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground'
                    : 'max-w-[88%] whitespace-pre-wrap rounded-lg bg-muted px-4 py-3 text-sm leading-6'
                }
              >
                {message.imageLoading
                  ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {message.content || 'Generating image…'}
                    </span>
                  )
                  : (message.content || 'Generating…')}

                {/* Generated images */}
                {message.images && message.images.length > 0 && (
                  <div className="mt-3 flex flex-col gap-3">
                    {message.images.map((url, imgIdx) => (
                      <div key={imgIdx} className="overflow-hidden rounded-lg border border-border/50">
                        <img
                          src={url}
                          alt="Generated"
                          className="w-full object-contain max-h-[400px]"
                        />
                        <div className="flex flex-wrap gap-2 bg-background/80 px-3 py-2">
                          <Button
                            size="sm" variant="secondary" type="button"
                            className="h-7 gap-1 text-xs"
                            onClick={() => downloadImage(url)}
                          >
                            <Download className="h-3 w-3" /> Download
                          </Button>
                          <Button
                            size="sm" variant="ghost" type="button"
                            className="h-7 gap-1 text-xs"
                            onClick={() => handleCopy(index * 100 + imgIdx, message.imagePrompt ?? '')}
                          >
                            {copiedIdx === index * 100 + imgIdx
                              ? <CheckCircle2 className="h-3 w-3 text-green-500" />
                              : <Copy className="h-3 w-3" />}
                            {copiedIdx === index * 100 + imgIdx ? 'Copied' : 'Prompt'}
                          </Button>
                          <Button
                            size="sm" variant="ghost" type="button"
                            className="h-7 text-xs"
                            onClick={() => window.location.href = '/image'}
                          >
                            Image Studio →
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <form
          className="border-t border-border p-4"
          onSubmit={e => { e.preventDefault(); void sendMessage(); }}
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <Textarea
              className="min-h-20"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Ask anything, or type 'Generate a product image for…' to create images inline (Enter to send)"
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
