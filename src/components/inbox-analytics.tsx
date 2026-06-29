import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, PieChart as PieIcon, Send } from "lucide-react";

import type { MockEmail, Priority } from "@/lib/mock-emails";

const PRIORITY_COLOR: Record<Priority, string> = {
  critical: "hsl(0 78% 60%)",
  high: "hsl(35 85% 58%)",
  medium: "hsl(45 90% 60%)",
  low: "hsl(150 35% 55%)",
};

const CATEGORY_COLOR = "oklch(0.78 0.16 80)"; // gold
const SENT_COLOR = "oklch(0.65 0.18 145)";

const DAY_FMT = new Intl.DateTimeFormat(undefined, { weekday: "short" });

interface Props {
  emails: MockEmail[];
  sentLog: { id: string; subject: string; to: string; at: string; kind: "reply" | "compose" }[];
}

export function InboxAnalytics({ emails, sentLog }: Props) {
  const priorityData = useMemo(() => {
    const counts: Record<Priority, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const e of emails) counts[e.priority]++;
    return (Object.keys(counts) as Priority[]).map((k) => ({
      name: k[0].toUpperCase() + k.slice(1),
      value: counts[k],
      key: k,
    }));
  }, [emails]);

  const daily = useMemo(() => {
    const days: { day: string; received: number; sent: number; date: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86_400_000);
      days.push({
        day: DAY_FMT.format(d),
        date: d.toISOString().slice(0, 10),
        received: 0,
        sent: 0,
      });
    }
    for (const e of emails) {
      const key = e.receivedAt.slice(0, 10);
      const slot = days.find((d) => d.date === key);
      if (slot) slot.received++;
    }
    for (const s of sentLog) {
      const key = s.at.slice(0, 10);
      const slot = days.find((d) => d.date === key);
      if (slot) slot.sent++;
    }
    return days;
  }, [emails, sentLog]);

  const byCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of emails) counts[e.category] = (counts[e.category] ?? 0) + 1;
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [emails]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-8">
      <div className="rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6">
        <header className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold tracking-tight text-gold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Triage analytics
          </h2>
          <span className="text-xs text-muted-foreground">Last 7 days · live</span>
        </header>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Daily volume */}
          <div className="rounded-xl border border-border/60 bg-background/40 p-4 lg:col-span-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Inbox volume vs. replies sent
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "oklch(0.7 0.02 70)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "oklch(0.7 0.02 70)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                    contentStyle={{
                      background: "oklch(0.18 0.03 55)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="received" name="Received" fill={CATEGORY_COLOR} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sent" name="Sent" fill={SENT_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Priority pie */}
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <PieIcon className="h-3.5 w-3.5" /> Priority mix
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={42}
                    outerRadius={70}
                    paddingAngle={2}
                    stroke="oklch(0.2 0.035 55)"
                  >
                    {priorityData.map((d) => (
                      <Cell key={d.key} fill={PRIORITY_COLOR[d.key]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.18 0.03 55)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category bars */}
          <div className="rounded-xl border border-border/60 bg-background/40 p-4 lg:col-span-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              By category
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke="oklch(1 0 0 / 0.06)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: "oklch(0.7 0.02 70)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={86} tick={{ fill: "oklch(0.8 0.02 70)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                    contentStyle={{
                      background: "oklch(0.18 0.03 55)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" name="Emails" fill={CATEGORY_COLOR} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sent log */}
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5" /> Recently sent
            </div>
            {sentLog.length === 0 ? (
              <div className="text-xs text-muted-foreground py-8 text-center">
                No replies sent yet. Open an email and tap <span className="text-foreground">AI reply</span>.
              </div>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {sentLog
                  .slice()
                  .reverse()
                  .slice(0, 8)
                  .map((s) => (
                    <li key={s.id} className="text-xs flex items-start gap-2 border-b border-border/40 pb-1.5 last:border-0">
                      <span
                        className="mt-1 h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ background: s.kind === "reply" ? SENT_COLOR : CATEGORY_COLOR }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-foreground/90">{s.subject}</div>
                        <div className="text-muted-foreground truncate">
                          {s.kind === "reply" ? "Replied to" : "Sent to"} {s.to}
                        </div>
                      </div>
                      <span className="text-muted-foreground shrink-0">
                        {new Date(s.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
