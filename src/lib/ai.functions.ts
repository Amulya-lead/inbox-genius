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
    if (!key) {
      return {
        priority: "medium" as const,
        attentionScore: 72,
        category: "Work" as const,
        summary: "Demo triage result — AI features are running without a Lovable API key.",
        tasks: ["Review the sender and context", "Follow up if needed"],
        deadlineLabel: null,
        isPhishing: false,
        sentiment: "neutral" as const,
      };
    }

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
    if (!key) {
      return { reply: "Thanks for the note — I'm handling this in demo mode for now. I'll follow up shortly." };
    }

    const gateway = createLovableAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: `You draft email replies. Tone: ${data.tone}. Keep it under 120 words. Output only the reply body — no subject line, no greeting placeholders like [Your Name]. Sign as "Best,".`,
      prompt: `Reply to this email${data.instruction ? ` with the goal: ${data.instruction}` : ""}.\n\nFrom: ${data.from}\nSubject: ${data.subject}\n\n${data.body}`,
    });
    return { reply: text };
  });

const ComposeInput = z.object({
  prompt: z.string().default(""),
  tone: z.enum(["professional", "friendly", "concise", "assertive"]).default("professional"),
  purpose: z.enum(["general", "follow-up", "request", "apology", "introduction", "meeting", "thank-you", "leave"]).default("general"),
  recipient: z.string().optional(),
  reason: z.string().optional(),
}).refine(
  (input) => input.prompt.trim().length >= 3 || (input.reason?.trim().length ?? 0) >= 3,
  { path: ["reason"], message: "Describe what you want the email to say." },
);

function extractLineInstruction(prompt: string): { text: string; count: number } | undefined {
  const match = prompt.match(/(?:exactly|in|for|within|no more than|at most)\s+(\d+)\s+lines?/i);
  if (match) {
    return { text: `Write the email in exactly ${match[1]} lines.`, count: Number(match[1]) };
  }
  return undefined;
}

function extractSignature(prompt: string): string | undefined {
  const match = prompt.match(/(?:write|use|sign)(?:\s+it)?\s+(?:my\s+)?name\s+as\s+([A-Za-z][A-Za-z .'-]{1,40})/i)
    ?? prompt.match(/(?:my\s+name\s+is|sign(?:\s+as)?)\s+([A-Za-z][A-Za-z .'-]{1,40})/i);
  return match?.[1]?.trim().replace(/[.,]+$/, "");
}

function cleanDraftDetails(value: string): string {
  return value
    .replace(/(?:make|write|keep|create)\s+(?:the\s+)?(?:email|message)\s+(?:for|in|within)\s+\d+\s+lines?/gi, "")
    .replace(/(?:write|use|sign)(?:\s+it)?\s+(?:my\s+)?name\s+as\s+[A-Za-z][A-Za-z .'-]{1,40}/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferRoleAndCompany(prompt: string) {
  const roleMatch = prompt.match(/role\s*-\s*([^,\n]+)/i) || prompt.match(/role\s*[:\-]\s*([^,\n]+)/i);
  const companyMatch = prompt.match(/company\s*-\s*([^,\n]+)/i) || prompt.match(/company\s*[:\-]\s*([^,\n]+)/i);
  return {
    role: roleMatch?.[1]?.trim(),
    company: companyMatch?.[1]?.trim(),
  };
}

function makeFallbackEmail(prompt: string, tone: string, lineCount?: number, purpose = "general", recipient?: string, reason?: string) {
  const details = cleanDraftDetails([reason, prompt].filter(Boolean).join(" "));
  const normalized = [purpose, reason, prompt].filter(Boolean).join(" ").replace(/\s+/g, " ").toLowerCase();
  let subject = "";
  const lines: string[] = [];
  const greeting = recipient ? `Hello ${recipient},` : "Hello,";
  const signature = extractSignature([reason, prompt].filter(Boolean).join(" "));
  const signOff = signature ? ["Best regards,", signature] : ["Best regards,", "[Your Name]"];
  const context = details || "I would appreciate your consideration and would be happy to share more details.";

  // Detect email type and generate appropriate professional format
  if (purpose === "leave" || /leave|time off|vacation|sick|day off|health/i.test(normalized)) {
    subject = "Request for Leave";
    lines.push(greeting);
    lines.push("");
    lines.push("I hope you are doing well.");
    lines.push("");
    lines.push("I am writing to request leave due to the circumstances mentioned. I would appreciate your approval for this request.");
    lines.push("");
    lines.push("I will ensure that any urgent work is handled before my leave, and I remain available for critical communication if needed.");
    lines.push("");
    lines.push("Thank you for your understanding and support.");
    lines.push("");
    lines.push(...signOff);
  } else if (purpose === "apology" || /apolog|sorry|mistake|delay/i.test(normalized)) {
    subject = "Apologies and next steps";
    lines.push(greeting, "", "I apologize for the situation and any inconvenience it caused.", "", context, "", "Thank you for your understanding.", "", ...signOff);
  } else if (purpose === "meeting" || /meeting|call|sync|schedule|discuss/i.test(normalized)) {
    subject = "Meeting Request";
    lines.push(greeting, "", "I would like to schedule a meeting to discuss this further.", "", context, "", "Please share a time that works for you, and I will send a calendar invite.", "", ...signOff);
  } else if (purpose === "follow-up" || /follow.?up|checking in|status/i.test(normalized)) {
    subject = "Following up";
    lines.push(greeting, "", "I wanted to follow up on my previous message and see whether you had a chance to review it.", "", context, "", "Please let me know if you need any additional context from me.", "", ...signOff);
  } else if (purpose === "thank-you" || /thank|appreciat/i.test(normalized)) {
    subject = "Thank you";
    lines.push(greeting, "", "Thank you for your time and support. I really appreciate your help.", "", context, "", "It made a meaningful difference.", "", ...signOff);
  } else if (purpose === "introduction") {
    subject = "Introduction";
    lines.push(greeting, "", "I wanted to introduce myself and connect regarding the context below.", "", context, "", "I would be glad to find a time to speak if useful.", "", ...signOff);
  } else if (purpose === "request" || /request|approval|need|could you/i.test(normalized)) {
    subject = "A quick request";
    lines.push(greeting, "", context, "", "Please let me know whether this would be possible.", "", "Thank you for your consideration.", "", ...signOff);
  } else if (/refer|recommend|job|opportunit/i.test(normalized)) {
    subject = "Request for a job referral";
    lines.push(greeting, "", "I am reaching out to ask whether you would be comfortable referring me for a suitable role.", "", context || "I would be grateful if you could keep me in mind for relevant opportunities.", "", "I can share my resume and any additional details you need.", "", ...signOff);
  } else if (/extension|deadline|delay/i.test(normalized)) {
    subject = "Request for Extension";
    lines.push("Dear [Recipient's Name],");
    lines.push("");
    lines.push("I hope this message finds you well.");
    lines.push("");
    lines.push("I am writing to request an extension on the current deadline. I am committed to delivering quality work and believe a few additional days would allow me to do so effectively.");
    lines.push("");
    lines.push("I appreciate your understanding and consideration of this request.");
    lines.push("");
    lines.push(...signOff);
  } else {
    subject = "Email";
    lines.push(greeting);
    lines.push("");
    lines.push(context);
    lines.push("");
    lines.push("Thank you for your time and consideration.");
    lines.push("");
    lines.push(...signOff);
  }

  // Adjust to specified line count
  if (lineCount && lineCount > 0) {
    const compactLines = lines.filter(Boolean);
    const signoffIndex = compactLines.findIndex((line) => line === "Best regards,");
    if (compactLines.length > lineCount) {
      const bodyLines = signoffIndex >= 0
        ? [...compactLines.slice(0, signoffIndex).slice(0, Math.max(0, lineCount - signOff.length)), ...signOff]
        : compactLines.slice(0, lineCount);
      return { subject, body: bodyLines.slice(0, lineCount).join("\n") };
    } else if (lines.length < lineCount) {
      const fillerLines = [
        "I would appreciate your prompt attention to this matter.",
        "Please feel free to reach out if you need any additional information.",
        "I am available to discuss this further at your convenience.",
        "Your feedback on this matter would be greatly appreciated.",
      ];
      let fillerIndex = 0;
      while (compactLines.length < lineCount - signOff.length) {
        compactLines.splice(Math.max(0, compactLines.length - signOff.length), 0, fillerLines[fillerIndex % fillerLines.length]);
        fillerIndex++;
      }
      return { subject, body: [...compactLines.slice(0, lineCount - signOff.length), ...signOff].slice(0, lineCount).join("\n") };
    }
  }

  return { subject, body: lines.join("\n") };
}

export const composeEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ComposeInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    const userInstructions = [data.reason, data.prompt].filter(Boolean).join("\n");
    const lineInstruction = extractLineInstruction(userInstructions);
    const lineCount = lineInstruction?.count;
    const context = [
      `Purpose: ${data.purpose}`,
      data.recipient ? `Recipient: ${data.recipient}` : "",
      data.reason ? `Reason: ${data.reason}` : "",
    ].filter(Boolean).join("\n");

    if (!key) {
      return makeFallbackEmail(data.prompt, data.tone, lineCount, data.purpose, data.recipient, data.reason);
    }

    const composeInstructions = [
      `Compose a complete, context-aware email using the ${data.tone} tone and the purpose: ${data.purpose}.`,
      "Use the recipient and reason to make the message specific, useful, and natural rather than generic.",
      "Include a clear subject and a polished body. Sign the email as 'Best,'.",
      "Follow every explicit condition in the user's instructions, including names, exact line counts, dates, formatting, and requested wording.",
      "If the prompt includes a pasted job description or role details, incorporate that information in the email.",
    ];
    if (lineInstruction) {
      composeInstructions.push(lineInstruction.text);
    }

    const gateway = createLovableAiGatewayProvider(key);
    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      output: Output.object({
        schema: z.object({ subject: z.string(), body: z.string() }),
      }),
      system: composeInstructions.join(" "),
      prompt: `${context}\nAdditional instructions: ${userInstructions}`,
    });
    return output;
  });
