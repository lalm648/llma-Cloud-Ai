'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Sparkles, Copy, CheckCircle2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { GenerateImageResult } from '@/lib/image-gen/types';

type Message = {
  role: 'user' | 'assistant';
  text: string;
  image?: string | null;
  loading?: boolean;
};

const WELCOME: Message = {
  role: 'assistant',
  text: "Hey! I'm your AI assistant powered by Gemini + FLUX. Ask me anything, or say \"generate\" / \"create\" to make an image. What would you like?",
};

const IMAGE_RE = /\b(generate|create|make|draw|paint|design|illustrate|render|produce|show me|give me|image of|photo of|picture of|a photo|an image|a picture|a drawing|a painting|a render|a sketch|a portrait|a landscape|a banner|a logo|a poster|a wallpaper)\b/i;

function downloadUrl(url: string) {
  if (url.startsWith('data:')) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    window.open(url, '_blank');
  }
}

export function StylizedChatModal({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function send() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setInput('');
    const history = messages
      .filter(m => !m.loading)
      .map(m => ({ role: m.role, text: m.text }));

    setMessages(prev => [
      ...prev,
      { role: 'user', text: trimmed },
      { role: 'assistant', text: '', loading: true },
    ]);
    setLoading(true);

    try {
      if (IMAGE_RE.test(trimmed)) {
        // Image generation via HuggingFace FLUX
        const resp = await fetch('/api/images/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: trimmed,
            negativePrompt: 'blurry, low quality, distorted, watermark',
            width: 1024,
            height: 1024,
            provider: 'huggingface',
            numImages: 1,
          }),
        });
        const result = await resp.json() as GenerateImageResult;

        if (result.success && result.images.length > 0) {
          setMessages(prev => prev.map((m, i) =>
            i === prev.length - 1
              ? { role: 'assistant', text: "Here's your generated image!", image: result.images[0].url }
              : m,
          ));
        } else {
          setMessages(prev => prev.map((m, i) =>
            i === prev.length - 1
              ? { role: 'assistant', text: `Image generation failed: ${result.error ?? 'Unknown error'}` }
              : m,
          ));
        }

      } else {
        // Text chat via Gemini 2.5 Flash
        const resp = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, history }),
        });
        const data = await resp.json() as { text?: string; error?: string };
        const reply = data.text ?? data.error ?? 'Something went wrong.';
        setMessages(prev => prev.map((m, i) =>
          i === prev.length - 1 ? { role: 'assistant', text: reply } : m,
        ));
      }

    } catch {
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1 ? { role: 'assistant', text: 'Request failed. Please try again.' } : m,
      ));
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(idx: number, text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:h-[680px]">

        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border bg-gradient-to-r from-violet-500/10 to-pink-500/10 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">AI Assistant</p>
            <p className="truncate text-xs text-muted-foreground">Chat · Image generation · Powered by Gemini + FLUX</p>
          </div>
          <Button aria-label="Close" onClick={onClose} size="icon" type="button" variant="ghost" className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'group relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6',
                  msg.role === 'user'
                    ? 'rounded-br-sm bg-primary text-primary-foreground'
                    : 'rounded-bl-sm bg-muted text-foreground',
                )}
              >
                {msg.loading
                  ? <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…
                    </span>
                  : <span className="whitespace-pre-wrap">{msg.text}</span>
                }

                {msg.image && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-border/50">
                    <img src={msg.image} alt="Generated" className="w-full object-contain max-h-80" />
                    <div className="flex gap-2 bg-background/80 px-3 py-2">
                      <Button size="sm" variant="secondary" type="button" className="h-7 gap-1 text-xs"
                        onClick={() => downloadUrl(msg.image!)}>
                        <Download className="h-3 w-3" /> Download
                      </Button>
                      <Button size="sm" variant="ghost" type="button" className="h-7 gap-1 text-xs"
                        onClick={() => handleCopy(idx * 100, msg.text)}>
                        {copiedIdx === idx * 100
                          ? <CheckCircle2 className="h-3 w-3 text-green-500" />
                          : <Copy className="h-3 w-3" />}
                        {copiedIdx === idx * 100 ? 'Copied' : 'Copy prompt'}
                      </Button>
                    </div>
                  </div>
                )}

                {msg.role === 'assistant' && !msg.loading && !msg.image && (
                  <button
                    type="button"
                    onClick={() => handleCopy(idx, msg.text)}
                    className="absolute -bottom-1 -right-1 hidden rounded-full border border-border bg-background p-1 group-hover:flex"
                  >
                    {copiedIdx === idx
                      ? <CheckCircle2 className="h-3 w-3 text-green-500" />
                      : <Copy className="h-3 w-3 text-muted-foreground" />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border p-3">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              className="min-h-[44px] max-h-32 resize-none py-2.5 text-sm"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); }
              }}
              placeholder='Chat or "generate a sunset over Dubai skyline"…'
              rows={1}
            />
            <Button type="button" onClick={() => void send()}
              disabled={loading || !input.trim()} size="icon" className="shrink-0 self-end">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            Chat → Gemini 2.5 Flash · Images → FLUX · Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}
