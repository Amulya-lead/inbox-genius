import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Inbox,
  ListTodo,
  LogOut,
  Mail,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  formatRelative,
  isDeadlineSoon,
  mockEmails,
  priorityMeta,
  type MockEmail,
  type Priority,
} from "@/lib/mock-emails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Inbox — MailSense" },
      {
        name: "description",
        content: "Your AI-triaged inbox: priorities, deadlines, tasks and summaries.",
      },
    ],
  }),
  component: DashboardPage,
});

const FILTERS: Array<{ id: "all" | Priority | "deadlines" | "spam"; label: string }> = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "deadlines", label: "Deadlines" },
  { id: "spam", label: "Flagged" },
];

function DashboardPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [selectedId, setSelectedId] = useState<string>(mockEmails[0].id);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockEmails
      .filter((e) => {
        if (filter === "deadlines") return !!e.deadline;
        if (filter === "spam") return !!e.spam;
        if (filter !== "all" && e.priority !== filter) return false;
        return true;
      })
      .filter((e) =>
        !q
          ? true
          : [e.subject, e.from, e.preview, e.summary, e.category]
              .join(" ")
              .toLowerCase()
              .includes(q),
      )
      .sort((a, b) => b.attentionScore - a.attentionScore);
  }, [filter, query]);

  const selected = mockEmails.find((e) => e.id === selectedId) ?? filtered[0] ?? mockEmails[0];

  const stats = useMemo(() => {
    const critical = mockEmails.filter((e) => e.priority === "critical").length;
    const high = mockEmails.filter((e) => e.priority === "high").length;
    const tasks = mockEmails.reduce((n, e) => n + e.tasks.filter((t) => !t.done).length, 0);
    const dueSoon = mockEmails.filter((e) => isDeadlineSoon(e.deadline?.dueAt)).length;
    return { critical, high, tasks, dueSoon };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <TopBar email={email} onSignOut={handleSignOut} />

      {/* Hero stats */}
      <section
        className="border-b border-border/60"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Critical now"
            value={stats.critical}
            icon={<AlertTriangle className="h-4 w-4 text-critical" />}
            accent="text-critical"
          />
          <StatCard
            label="High priority"
            value={stats.high}
            icon={<Sparkles className="h-4 w-4 text-high" />}
            accent="text-high"
          />
          <StatCard
            label="Open tasks"
            value={stats.tasks}
            icon={<ListTodo className="h-4 w-4 text-primary" />}
          />
          <StatCard
            label="Deadlines < 48h"
            value={stats.dueSoon}
            icon={<Clock className="h-4 w-4 text-destructive" />}
            accent="text-destructive"
            pulse={stats.dueSoon > 0}
          />
        </div>
      </section>

      {/* Inbox */}
      <section className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-6">
        <div className="grid gap-4 lg:grid-cols-[1.05fr_1.4fr]">
          {/* List */}
          <div className="rounded-2xl border border-border/70 bg-card/60 overflow-hidden flex flex-col min-h-[640px]">
            <div className="p-4 border-b border-border/70 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search naturally — “HR emails”, “invoices”…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1">
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap",
                      filter === f.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {filtered.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  No emails match.
                </div>
              ) : (
                filtered.map((e) => (
                  <EmailListItem
                    key={e.id}
                    email={e}
                    selected={e.id === selected.id}
                    onClick={() => setSelectedId(e.id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Detail */}
          <EmailDetail email={selected} />
        </div>
      </section>
    </div>
  );
}

function TopBar({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid place-items-center h-7 w-7 rounded-md bg-primary/15 text-primary">
            <Mail className="h-4 w-4" />
          </div>
          <span className="font-display text-base font-semibold tracking-tight">
            MailSense
          </span>
          <Badge variant="outline" className="ml-2 text-[10px] uppercase tracking-wider">
            Beta
          </Badge>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[180px]">
            {email}
          </span>
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            <LogOut className="h-4 w-4 mr-1.5" /> Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
  pulse,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: string;
  pulse?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className={cn("relative grid place-items-center", pulse && "animate-pulse")}>
          {icon}
        </span>
      </div>
      <div className={cn("mt-2 text-3xl font-semibold tabular-nums", accent)}>{value}</div>
    </div>
  );
}

function EmailListItem({
  email,
  selected,
  onClick,
}: {
  email: MockEmail;
  selected: boolean;
  onClick: () => void;
}) {
  const meta = priorityMeta[email.priority];
  const soon = isDeadlineSoon(email.deadline?.dueAt);
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3.5 flex gap-3 items-start transition-colors",
        selected ? "bg-accent/60" : "hover:bg-accent/30",
      )}
    >
      <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", meta.dot)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn("font-medium text-foreground/90 truncate", email.unread && "text-foreground")}>
            {email.from}
          </span>
          {email.spam && (
            <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">
              <ShieldAlert className="h-3 w-3 mr-1" /> Suspicious
            </Badge>
          )}
          <span className="ml-auto shrink-0">{formatRelative(email.receivedAt)}</span>
        </div>
        <div className={cn("text-sm mt-0.5 truncate", email.unread ? "font-semibold" : "font-medium")}>
          {email.subject}
        </div>
        <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {email.summary}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <Badge variant="outline" className={cn("text-[10px]", meta.chip)}>
            {meta.label}
          </Badge>
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            {email.category}
          </Badge>
          {email.deadline && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] gap-1",
                soon
                  ? "bg-destructive/15 text-destructive border-destructive/40"
                  : "text-muted-foreground",
              )}
            >
              <Clock className="h-3 w-3" /> {email.deadline.label}
            </Badge>
          )}
          {email.tasks.length > 0 && (
            <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
              <ListTodo className="h-3 w-3" /> {email.tasks.length}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

function EmailDetail({ email }: { email: MockEmail }) {
  const meta = priorityMeta[email.priority];
  const soon = isDeadlineSoon(email.deadline?.dueAt);
  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 overflow-hidden flex flex-col min-h-[640px]">
      <div className="p-5 sm:p-6 border-b border-border/70">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className={cn("gap-1", meta.chip)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {meta.label} priority
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            {email.category}
          </Badge>
          <Badge variant="outline" className="ml-auto gap-1 text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-primary" /> Attention {email.attentionScore}
          </Badge>
        </div>
        <h2 className="text-xl font-semibold leading-snug">{email.subject}</h2>
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="text-foreground/90 font-medium">{email.from}</span>{" "}
          &lt;{email.fromEmail}&gt; · {formatRelative(email.receivedAt)}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
        {email.spam && (
          <AlertBlock
            tone="danger"
            icon={<ShieldAlert className="h-4 w-4" />}
            title="Likely phishing"
            body="Suspicious sender domain and urgent language with a shortened link. Do not click."
          />
        )}

        {email.deadline && (
          <AlertBlock
            tone={soon ? "danger" : "info"}
            icon={<Clock className="h-4 w-4" />}
            title={soon ? `⚠ Deadline: ${email.deadline.label}` : `Deadline: ${email.deadline.label}`}
            body={
              soon
                ? `Due ${formatRelative(email.deadline.dueAt)} — bumped to the top of your queue.`
                : `Due ${formatRelative(email.deadline.dueAt)}.`
            }
          />
        )}

        <section>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> AI summary
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{email.summary}</p>
        </section>

        {email.tasks.length > 0 && (
          <section>
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ListTodo className="h-3.5 w-3.5 text-primary" /> Action items
            </h3>
            <ul className="mt-2 space-y-1.5">
              {email.tasks.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>{t.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Separator />

        <section>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Inbox className="h-3.5 w-3.5" /> Original
          </h3>
          <pre className="mt-2 text-sm whitespace-pre-wrap font-sans text-foreground/85">
            {email.body}
          </pre>
        </section>
      </div>

      <div className="p-4 border-t border-border/70 flex flex-wrap items-center gap-2 bg-background/40">
        <Button size="sm" disabled className="opacity-80">
          <Sparkles className="h-4 w-4 mr-1.5" /> AI reply
        </Button>
        <Button size="sm" variant="outline" disabled>
          Snooze
        </Button>
        <Button size="sm" variant="ghost" disabled>
          Mark done
        </Button>
        <span className="ml-auto text-[11px] text-muted-foreground">
          AI actions coming in next phase
        </span>
      </div>
    </div>
  );
}

function AlertBlock({
  tone,
  icon,
  title,
  body,
}: {
  tone: "danger" | "info";
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3.5 flex gap-3",
        tone === "danger"
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-primary/30 bg-primary/10 text-primary",
      )}
    >
      <span className="mt-0.5">{icon}</span>
      <div className="text-sm">
        <div className="font-semibold">{title}</div>
        <div className={cn("mt-0.5", tone === "danger" ? "text-destructive/90" : "text-foreground/85")}>
          {body}
        </div>
      </div>
    </div>
  );
}
