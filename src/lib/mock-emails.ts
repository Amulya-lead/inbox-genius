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
const daysAgo = (d: number, h = 0) => hoursAgo(d * 24 + h);

// 7-day mailbox — spread across today → 6 days ago
export const mockEmails: MockEmail[] = [
  // ───── Today ─────
  {
    id: "e1",
    from: "Priya Menon",
    fromEmail: "priya@northwind.io",
    subject: "Final report due Monday 6 PM — testing before Sunday",
    preview: "Please submit the final project report by Monday 6 PM and complete testing before Sunday.",
    body: "Hi,\n\nPlease submit the final project report by Monday 6 PM. Make sure testing is complete before Sunday EOD so QA can sign off. Loop in Aarav if you need access to the staging cluster.\n\nThanks,\nPriya",
    receivedAt: hoursAgo(1),
    unread: true,
    priority: "critical",
    attentionScore: 94,
    category: "Work",
    summary: "Submit final report by Mon 6 PM. Finish testing by Sunday so QA can approve. Contact Aarav for staging access if needed.",
    tasks: [
      { text: "Submit final project report", done: false },
      { text: "Finish testing before Sunday EOD", done: false },
      { text: "Ping Aarav for staging access", done: false },
    ],
    deadline: { label: "Monday 6:00 PM", dueAt: hoursFromNow(40) },
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

  // ───── 1 day ago ─────
  {
    id: "e6",
    from: "security-alerts",
    fromEmail: "verify-account@paypa1-secure.com",
    subject: "URGENT: Your account will be suspended in 24h",
    preview: "Click here immediately to verify your account or it will be suspended.",
    body: "Dear customer, your account will be suspended unless you verify within 24 hours. Click here: http://bit.ly/verify-now",
    receivedAt: daysAgo(1, 2),
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
    id: "e9",
    from: "GitHub",
    fromEmail: "noreply@github.com",
    subject: "[northwind/mailsense] CI failed on main",
    preview: "Workflow 'tests' failed on commit a91f2c3 by you.",
    body: "Workflow 'tests' failed on commit a91f2c3. 2 tests failed in apps/inbox/triage.test.ts. View logs in Actions.",
    receivedAt: daysAgo(1, 4),
    unread: false,
    priority: "high",
    attentionScore: 71,
    category: "Work",
    summary: "CI failed on main — 2 tests in triage.test.ts. Investigate before next deploy.",
    tasks: [{ text: "Fix failing triage tests", done: false }],
    sentiment: "negative",
  },
  {
    id: "e10",
    from: "Maya Iyer (CEO)",
    fromEmail: "maya@northwind.io",
    subject: "Quick chat about Q4 roadmap",
    preview: "Got 15 min Thursday to walk me through priorities?",
    body: "Got 15 minutes Thursday afternoon to walk me through Q4 priorities? Particularly interested in the inbox-AI bets.",
    receivedAt: daysAgo(1, 9),
    unread: false,
    priority: "high",
    attentionScore: 80,
    category: "Work",
    summary: "CEO wants a 15-min Q4 roadmap walkthrough Thursday afternoon — focus on inbox-AI.",
    tasks: [{ text: "Send Thursday 15-min slot to Maya", done: false }],
    sentiment: "positive",
  },

  // ───── 2 days ago ─────
  {
    id: "e11",
    from: "AWS Billing",
    fromEmail: "billing@aws.amazon.com",
    subject: "Your AWS bill: $4,182.50 for October",
    preview: "Charges are 38% higher than September — driven by EC2 in us-east-1.",
    body: "Your October AWS bill is $4,182.50, up 38% MoM. Top driver: EC2 in us-east-1 (m6i.2xlarge fleet).",
    receivedAt: daysAgo(2, 1),
    unread: false,
    priority: "high",
    attentionScore: 75,
    category: "Finance",
    summary: "AWS bill up 38% to $4,182. EC2 us-east-1 m6i fleet is the driver — audit before Nov.",
    tasks: [{ text: "Audit us-east-1 EC2 fleet", done: false }],
    sentiment: "negative",
  },
  {
    id: "e12",
    from: "Lina (Design)",
    fromEmail: "lina@northwind.io",
    subject: "v2 mocks for Inbox detail view",
    preview: "Figma link inside — feedback by Wed if possible.",
    body: "Hi! Dropped v2 mocks for the inbox detail panel in Figma. Would love feedback by Wednesday so we can lock for sprint 14.",
    receivedAt: daysAgo(2, 5),
    unread: false,
    priority: "medium",
    attentionScore: 55,
    category: "Work",
    summary: "Review v2 inbox detail mocks in Figma — feedback wanted by Wednesday.",
    tasks: [{ text: "Review Figma v2 mocks", done: false }],
    deadline: { label: "Wed EOD", dueAt: hoursFromNow(36) },
    sentiment: "neutral",
  },

  // ───── 3 days ago ─────
  {
    id: "e13",
    from: "Sofia (Lisbon host)",
    fromEmail: "sofia@airbnb-message.com",
    subject: "Lisbon trip — check-in details",
    preview: "Keypad code and Wi-Fi info attached, see you Dec 12!",
    body: "Hi! Sharing the keypad code (4521) and Wi-Fi password (oceanview22) for your Lisbon stay. Trams stop right outside.",
    receivedAt: daysAgo(3, 2),
    unread: false,
    priority: "low",
    attentionScore: 30,
    category: "Travel",
    summary: "Lisbon Airbnb keypad 4521, Wi-Fi 'oceanview22'. Save for Dec 12 arrival.",
    tasks: [],
    sentiment: "positive",
  },
  {
    id: "e14",
    from: "Aarav Singh",
    fromEmail: "aarav@northwind.io",
    subject: "Postgres read replica is lagging again",
    preview: "30s lag this morning during the batch. Want me to bump the instance?",
    body: "Read replica lagged 30s during the morning batch. I can bump the instance class today if you approve.",
    receivedAt: daysAgo(3, 6),
    unread: false,
    priority: "high",
    attentionScore: 72,
    category: "Work",
    summary: "Postgres read replica lagging 30s. Aarav asking approval to bump instance class.",
    tasks: [{ text: "Approve replica instance bump", done: false }],
    sentiment: "neutral",
  },

  // ───── 4 days ago ─────
  {
    id: "e15",
    from: "LinkedIn",
    fromEmail: "messages-noreply@linkedin.com",
    subject: "You appeared in 12 searches this week",
    preview: "Your profile is gaining traction in 'Engineering Manager' searches.",
    body: "You appeared in 12 searches this week — mostly Engineering Manager and Staff Engineer roles.",
    receivedAt: daysAgo(4, 3),
    unread: false,
    priority: "low",
    attentionScore: 15,
    category: "Promotions",
    summary: "LinkedIn weekly insights — 12 appearances, mostly EM roles. No action.",
    tasks: [],
    sentiment: "neutral",
  },
  {
    id: "e16",
    from: "Daniel Park",
    fromEmail: "daniel@partnerco.com",
    subject: "Partnership proposal — draft v1",
    preview: "Attached the draft. Curious what you think on the revenue split.",
    body: "Here's draft v1 of the partnership proposal. Curious what you think — especially the 70/30 revenue split in section 4.",
    receivedAt: daysAgo(4, 8),
    unread: false,
    priority: "medium",
    attentionScore: 60,
    category: "Work",
    summary: "Partnership proposal v1 from Daniel — needs feedback on 70/30 revenue split.",
    tasks: [{ text: "Review section 4 of proposal", done: false }],
    sentiment: "positive",
  },

  // ───── 5 days ago ─────
  {
    id: "e17",
    from: "Doctor's Office",
    fromEmail: "clinic@meridian-health.com",
    subject: "Annual physical — reschedule confirmation",
    preview: "Confirmed for Nov 14, 9:30 AM. Please fast 12h prior.",
    body: "Your annual physical is confirmed for Nov 14 at 9:30 AM. Please fast for 12 hours prior to the appointment.",
    receivedAt: daysAgo(5, 4),
    unread: false,
    priority: "medium",
    attentionScore: 48,
    category: "Personal",
    summary: "Annual physical Nov 14, 9:30 AM. 12-hour fast required.",
    tasks: [{ text: "Set fasting reminder for Nov 13 evening", done: false }],
    deadline: { label: "Nov 14, 9:30 AM", dueAt: hoursFromNow(24 * 9) },
    sentiment: "neutral",
  },
  {
    id: "e18",
    from: "Vercel",
    fromEmail: "no-reply@vercel.com",
    subject: "Bandwidth alert: 82% of plan used",
    preview: "You're at 82% of your monthly bandwidth on the 'inbox-web' project.",
    body: "Heads up — 82% of monthly bandwidth used on inbox-web. Consider upgrading or reviewing the largest assets.",
    receivedAt: daysAgo(5, 9),
    unread: false,
    priority: "medium",
    attentionScore: 50,
    category: "Finance",
    summary: "Vercel bandwidth at 82% — review largest assets or upgrade plan soon.",
    tasks: [{ text: "Audit Vercel asset sizes", done: false }],
    sentiment: "negative",
  },

  // ───── 6 days ago ─────
  {
    id: "e19",
    from: "Hannah (Recruiter)",
    fromEmail: "hannah@orbitalsearch.io",
    subject: "Staff Engineering role at Helio — confidential",
    preview: "Reaching out about a Staff role — open to a quick call?",
    body: "Reaching out about a Staff Engineering role at Helio. Comp band $280–340k + equity. Open to a 20-min call this week?",
    receivedAt: daysAgo(6, 2),
    unread: false,
    priority: "low",
    attentionScore: 35,
    category: "Personal",
    summary: "Recruiter pitching Staff Eng role at Helio ($280–340k). Optional 20-min call.",
    tasks: [],
    sentiment: "positive",
  },
  {
    id: "e20",
    from: "Northwind All-Hands",
    fromEmail: "allhands@northwind.io",
    subject: "Recap: Q4 kickoff — slides + recording",
    preview: "Thanks everyone. Recording and slides linked here.",
    body: "Thanks for the energy at Q4 kickoff. Recording and slides are in the company drive. Please share with new hires.",
    receivedAt: daysAgo(6, 7),
    unread: false,
    priority: "low",
    attentionScore: 22,
    category: "Work",
    summary: "Q4 kickoff recap — slides and recording available. Share with new hires.",
    tasks: [],
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
