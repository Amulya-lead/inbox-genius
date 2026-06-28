import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const TriageInput = z.object({
  from: z.string(),
  subject: z.string(),
  body: z.string(),
});

const TriageSchema = z.object({
  priority: z.enum(["critical", "high", "medium", "low"]),
  attentionScore: z.number().min(0).max(100),
  category: z.enum(["Work", "HR", "Finance", "Personal", "Promotions", "Travel"]),
  summary: z.string(),
  tasks: z.array(z.string()).max(6),
  deadlineLabel: z.string().nullable(),
  isPhishing: z.boolean(),
  sentiment: z.enum(["positive", "neutral", "negative", "urgent"]),
});

export const triageEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TriageInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({ schema: TriageSchema }),
      system:
        "You are an inbox triage AI. Classify priority, extract action items, identify deadlines, flag phishing. Be concise and decisive.",
      prompt: `From: ${data.from}\nSubject: ${data.subject}\n\n${data.body}`,
    });
    return output;
  });

const ReplyInput = z.object({
  from: z.string(),
  subject: z.string(),
  body: z.string(),
  tone: z.enum(["professional", "friendly", "concise", "assertive"]).default("professional"),
  instruction: z.string().optional(),
});

export const generateReply = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ReplyInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: `You draft email replies. Tone: ${data.tone}. Keep it under 120 words. Output only the reply body — no subject line, no greeting placeholders like [Your Name]. Sign as "Best,".`,
      prompt: `Reply to this email${data.instruction ? ` with the goal: ${data.instruction}` : ""}.\n\nFrom: ${data.from}\nSubject: ${data.subject}\n\n${data.body}`,
    });
    return { reply: text };
  });

const ComposeInput = z.object({
  prompt: z.string().min(3),
  tone: z.enum(["professional", "friendly", "concise", "assertive"]).default("professional"),
});

export const composeEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ComposeInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({
        schema: z.object({ subject: z.string(), body: z.string() }),
      }),
      system: `You compose professional emails. Tone: ${data.tone}. Sign as "Best,".`,
      prompt: data.prompt,
    });
    return output;
  });
