import type { MockEmail } from "./mock-emails";

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString();
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600_000).toISOString();

// Additional "incoming" emails appended on each Sync
export const syncBatches: MockEmail[][] = [
  [
    {
      id: "s1",
      from: "Aarav Singh",
      fromEmail: "aarav@northwind.io",
      subject: "Staging cluster access granted",
      preview: "You now have admin access to staging-2. Token expires in 7 days.",
      body: "Hey, I granted you admin on staging-2. The token expires in 7 days, rotate before Friday.",
      receivedAt: hoursAgo(0.2),
      unread: true,
      priority: "high",
      attentionScore: 74,
      category: "Work",
      summary: "Staging-2 admin access granted. Rotate token before Friday (expires in 7 days).",
      tasks: [{ text: "Rotate staging-2 token before Friday", done: false }],
      deadline: { label: "Friday", dueAt: hoursFromNow(96) },
      sentiment: "neutral",
    },
    {
      id: "s2",
      from: "Linear",
      fromEmail: "notifications@linear.app",
      subject: "3 issues assigned to you in MAIL project",
      preview: "MAIL-118, MAIL-122, MAIL-125 assigned this morning.",
      body: "3 issues were assigned to you: MAIL-118 (bug), MAIL-122 (feature), MAIL-125 (chore).",
      receivedAt: hoursAgo(0.4),
      unread: true,
      priority: "medium",
      attentionScore: 48,
      category: "Work",
      summary: "3 new Linear issues assigned to you in MAIL project.",
      tasks: [{ text: "Triage MAIL-118 / 122 / 125", done: false }],
      sentiment: "neutral",
    },
  ],
  [
    {
      id: "s3",
      from: "CEO — Maya Iyer",
      fromEmail: "maya@northwind.io",
      subject: "URGENT: Q4 numbers need correction before board call",
      preview: "Board call is at 4 PM. Revenue slide has wrong figure — fix ASAP.",
      body: "The revenue figure on slide 12 is off by $200k. Please correct it before the 4 PM board call today. This cannot wait.",
      receivedAt: hoursAgo(0.1),
      unread: true,
      priority: "critical",
      attentionScore: 98,
      category: "Work",
      summary: "Revenue figure on slide 12 is wrong. Fix before 4 PM board call today.",
      tasks: [
        { text: "Correct revenue figure on slide 12", done: false },
        { text: "Re-send deck before 4 PM", done: false },
      ],
      deadline: { label: "Today 4:00 PM", dueAt: hoursFromNow(3) },
      sentiment: "urgent",
    },
    {
      id: "s4",
      from: "Airbnb",
      fromEmail: "no-reply@airbnb.com",
      subject: "Your trip to Lisbon is confirmed",
      preview: "Check-in Dec 12. Reservation HMRBN42.",
      body: "Your reservation is confirmed. Check-in Dec 12, check-out Dec 18. Host: Sofia.",
      receivedAt: hoursAgo(0.5),
      unread: true,
      priority: "low",
      attentionScore: 28,
      category: "Travel",
      summary: "Lisbon trip confirmed — check-in Dec 12, host Sofia.",
      tasks: [],
      sentiment: "positive",
    },
  ],
];
