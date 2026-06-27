import type { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

type HistoryItem = { role: string; text: string };

export async function POST(request: NextRequest): Promise<Response> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'GOOGLE_AI_API_KEY is not set. Add it to .env.local and restart the server.' },
      { status: 500 },
    );
  }

  let body: { message?: string; history?: HistoryItem[] };
  try { body = await request.json() as typeof body; }
  catch { return Response.json({ error: 'Invalid request body' }, { status: 400 }); }

  const message = body.message?.trim();
  if (!message) return Response.json({ error: 'Message is required' }, { status: 400 });

  const ai = new GoogleGenAI({ apiKey });

  const history = (body.history ?? [])
    .filter(h => h.text)
    .map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.text }],
    }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] },
      ],
      config: {
        systemInstruction: 'You are a helpful text assistant. You cannot generate, display, or produce images — that is handled by a separate image model. If the user asks for an image or photo, do NOT pretend to generate one. Instead, tell them to start their message with words like "generate", "create", or "draw" and the image generator will handle it automatically.',
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return Response.json({ error: 'Empty response from Gemini' }, { status: 502 });

    return Response.json({ text });

  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error('[/api/gemini]', msg);
    return Response.json({ error: msg }, { status: 502 });
  }
}
