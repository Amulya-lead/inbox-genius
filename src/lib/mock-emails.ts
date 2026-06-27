export type Priority = "critical" | "high" | "medium" | "low";
export type Category = "Work" | "HR" | "Finance" | "Personal" | "Promotions" | "Travel";

export interface EmailTask {
  text: string;
  done: boolean;
}

export interface MockEmail {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  body: string;
  receivedAt: string; // ISO
  unread: boolean;
  priority: Priority;
  attentionScore: number; // 0-100
  category: Category;
  summary: string;
  tasks: EmailTask[];
  deadline?: { label: string; dueAt: string };
  spam?: boolean;
  sentiment?: "positive" | "neutral" | "negative" | "urgent";
}

const now = new Date();
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600_000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString();

export const mockEmails: MockEmail[] = [
  {
    id: "e1",
    from: "Priya Menon",
    fromEmail: "priya@northwind.io",
    subject: "Final report due Monday 6 PM — testing before Sunday",
    preview:
      "Please submit the final project report by Monday 6 PM and complete testing before Sunday.",
    body: "Hi,\n\nPlease submit the final project report by Monday 6 PM. Make sure testing is complete before Sunday EOD so QA can sign off. Loop in Aarav if you need access to the staging cluster.\n\nThanks,\nPriya",
    receivedAt: hoursAgo(1),
    unread: true,
    priority: "critical",
    attentionScore: 94,
    category: "Work",
    summary:
      "Submit final report by Mon 6 PM. Finish testing by Sunday so QA can approve. Contact Aarav for staging access if needed.",
    tasks: [
      { text: "Submit final project report", done: false },
      { text: "Finish testing before Sunday EOD", done: false },
      { text: "Ping Aarav for staging access", done: false },
    ],
    deadline: { label: "Monday 6:00 PM", dueAt: hoursFromNow(40) },
    sentiment: "urgent",
  },
  {
    id: "e2",
    from: "Stripe",
    fromEmail: "receipts@stripe.com",
    subject: "Your October invoice is ready",
    preview: "Invoice #INV-10421 for $1,240.00 is now available.",
    body: "Your invoice for October is ready. Total due: $1,240.00. Payment will be auto-charged on Nov 5.",
    receivedAt: hoursAgo(4),
    unread: true,
    priority: "medium",
    attentionScore: 58,
    category: "Finance",
    summary: "October invoice for $1,240 is available. Auto-charge on Nov 5 — no action needed unless disputing.",
    tasks: [],
    deadline: { label: "Auto-charge Nov 5", dueAt: hoursFromNow(96) },
    sentiment: "neutral",
  },
  {
    id: "e3",
    from: "Ananya — HR",
    fromEmail: "hr@northwind.io",
    subject: "Open enrollment closes Friday",
    preview: "Reminder: benefits open enrollment closes this Friday at 11:59 PM.",
    body: "Hi team, friendly reminder that benefits open enrollment closes this Friday at 11:59 PM. Update your selections in Workday. Reach out if you have questions about the new dental plan.",
    receivedAt: hoursAgo(7),
    unread: true,
    priority: "high",
    attentionScore: 78,
    category: "HR",
    summary: "Open enrollment closes Friday 11:59 PM — update benefits in Workday.",
    tasks: [{ text: "Update benefit selections in Workday", done: false }],
    deadline: { label: "Friday 11:59 PM", dueAt: hoursFromNow(60) },
    sentiment: "neutral",
  },
  {
    id: "e4",
    from: "Calendly",
    fromEmail: "no-reply@calendly.com",
    subject: "Meeting confirmed: 30 min with Daniel Park, Tuesday 11 AM",
    preview: "Your meeting with Daniel Park is confirmed for Tuesday at 11:00 AM IST.",
    body: "Your meeting with Daniel Park is confirmed for Tuesday at 11:00 AM IST. Topic: Q4 roadmap review.",
    receivedAt: hoursAgo(11),
    unread: false,
    priority: "medium",
    attentionScore: 52,
    category: "Work",
    summary: "Meeting with Daniel Park, Tue 11 AM IST — Q4 roadmap review.",
    tasks: [{ text: "Prepare Q4 roadmap notes", done: false }],
    deadline: { label: "Tue 11:00 AM", dueAt: hoursFromNow(72) },
    sentiment: "neutral",
  },
  {
    id: "e5",
    from: "Notion",
    fromEmail: "team@makenotion.com",
    subject: "🎉 50% off Notion AI — limited time",
    preview: "Upgrade your workspace and get 50% off Notion AI for 3 months.",
    body: "Limited offer — upgrade and save 50% on Notion AI for 3 months.",
    receivedAt: hoursAgo(20),
    unread: true,
    priority: "low",
    attentionScore: 18,
    category: "Promotions",
    summary: "Promo: 50% off Notion AI for 3 months. Ignore unless upgrading.",
    tasks: [],
    sentiment: "neutral",
  },
  {
    id: "e6",
    from: "security-alerts",
    fromEmail: "verify-account@paypa1-secure.com",
    subject: "URGENT: Your account will be suspended in 24h",
    preview: "Click here immediately to verify your account or it will be suspended.",
    body: "Dear customer, your account will be suspended unless you verify within 24 hours. Click here: http://bit.ly/verify-now",
    receivedAt: hoursAgo(26),
    unread: true,
    priority: "low",
    attentionScore: 8,
    category: "Promotions",
    summary: "Phishing attempt — spoofed sender domain, urgent language, suspicious shortened link.",
    tasks: [],
    spam: true,
    sentiment: "urgent",
  },
  {
    id: "e7",
    from: "Rohan Verma",
    fromEmail: "rohan@northwind.io",
    subject: "Re: PR #482 — needs review before deploy",
    preview: "Hey, can you review PR #482 today? Blocking the deploy tomorrow morning.",
    body: "Hey, can you review PR #482 today? It is blocking the deploy tomorrow morning. I addressed the comments from the previous round.",
    receivedAt: hoursAgo(2),
    unread: true,
    priority: "high",
    attentionScore: 82,
    category: "Work",
    summary: "Review PR #482 today — blocks tomorrow morning deploy.",
    tasks: [{ text: "Review PR #482", done: false }],
    deadline: { label: "Tomorrow morning", dueAt: hoursFromNow(18) },
    sentiment: "urgent",
  },
  {
    id: "e8",
    from: "Mom",
    fromEmail: "mom@family.com",
    subject: "Dinner Sunday?",
    preview: "Are you free for dinner this Sunday at 7?",
    body: "Hey beta, are you free for dinner Sunday at 7? Let me know so I can plan groceries.",
    receivedAt: hoursAgo(14),
    unread: false,
    priority: "medium",
    attentionScore: 45,
    category: "Personal",
    summary: "Mom is asking if you're free for dinner Sunday at 7.",
    tasks: [{ text: "Reply about Sunday dinner", done: false }],
    sentiment: "positive",
  },
];

export const priorityMeta: Record<
  Priority,
  { label: string; dot: string; chip: string; ring: string }
> = {
  critical: {
    label: "Critical",
    dot: "bg-critical",
    chip: "bg-critical/15 text-critical border-critical/30",
    ring: "ring-critical/40",
  },
  high: {
    label: "High",
    dot: "bg-high",
    chip: "bg-high/15 text-high border-high/30",
    ring: "ring-high/40",
  },
  medium: {
    label: "Medium",
    dot: "bg-medium",
    chip: "bg-medium/15 text-medium border-medium/30",
    ring: "ring-medium/30",
  },
  low: {
    label: "Low",
    dot: "bg-low",
    chip: "bg-low/15 text-low border-low/30",
    ring: "ring-low/30",
  },
};

export function formatRelative(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60_000);
  const hrs = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);
  const past = diffMs < 0;
  let label: string;
  if (mins < 60) label = `${mins}m`;
  else if (hrs < 24) label = `${hrs}h`;
  else label = `${days}d`;
  return past ? `${label} ago` : `in ${label}`;
}

export function isDeadlineSoon(iso?: string): boolean {
  if (!iso) return false;
  const diffMs = new Date(iso).getTime() - Date.now();
  return diffMs > 0 && diffMs < 48 * 3600_000;
}
