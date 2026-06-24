import { z } from "zod";
import { models } from "@/lib/constants";
import { systemPrompt } from "@/lib/ai/prompts";

const requestSchema = z.object({
  model: z
    .string()
    .default("openai/gpt-oss-120b")
    .refine((model) => models.some((item) => item.id === model), {
      message: "Unsupported model"
    }),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().min(1).max(12000)
      })
    )
    .min(1)
    .max(40)
});

export type ChatRequest = z.infer<typeof requestSchema>;

export function parseChatRequest(input: unknown): ChatRequest {
  return requestSchema.parse(input);
}

export function getGroqApiKey() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY environment variable.");
  }

  return apiKey;
}

export async function streamGroqChat(request: ChatRequest) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getGroqApiKey()}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: request.model,
      temperature: 0.35,
      max_tokens: 1800,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...request.messages.map((message) => ({
          role: message.role,
          content: message.content
        }))
      ]
    })
  });

  if (!response.ok || !response.body) {
    throw new Error(`Groq request failed with status ${response.status}`);
  }

  return response.body;
}
