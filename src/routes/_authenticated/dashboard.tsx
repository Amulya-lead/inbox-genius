import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Archive,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Filter,
  Inbox,
  KeyRound,
  ListTodo,
  LogOut,
  Loader2,
  Mail,
  PenLine,
  Reply,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Star,
  TimerReset,
  Trash2,
  TrendingUp,
  UserPlus,
  Wand2,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  formatRelative,
  isDeadlineSoon,
  mockEmails as seedEmails,
  priorityMeta,
  type MockEmail,
  type Priority,
} from "@/lib/mock-emails";
import { fetchInboxMessages, getConfiguredInboxProvider, sendGmailMessage, type GmailMailbox } from "@/lib/inbox-sync";
import { triageEmail, generateReply, composeEmail } from "@/lib/ai.functions";
import { InboxAnalytics } from "@/components/inbox-analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SentItem = { id: string; subject: string; to: string; at: string; kind: "reply" | "compose" };
type ComposePurpose = "general" | "follow-up" | "request" | "apology" | "introduction" | "meeting" | "thank-you" | "leave";

const COMPOSE_PURPOSES: { value: ComposePurpose; label: string; hint: string; icon: React.ReactNode }[] = [
  { value: "general", label: "General", hint: "A clear everyday email", icon: <PenLine className="h-4 w-4" /> },
  { value: "follow-up", label: "Follow-up", hint: "Nudge without sounding pushy", icon: <Reply className="h-4 w-4" /> },
  { value: "request", label: "Request", hint: "Ask for help or approval", icon: <KeyRound className="h-4 w-4" /> },
  { value: "apology", label: "Apology", hint: "Own the situation gracefully", icon: <HeartHandshake className="h-4 w-4" /> },
  { value: "introduction", label: "Introduction", hint: "Start a useful connection", icon: <UserPlus className="h-4 w-4" /> },
  { value: "meeting", label: "Meeting", hint: "Propose time with context", icon: <BriefcaseBusiness className="h-4 w-4" /> },
  { value: "thank-you", label: "Thank you", hint: "Make appreciation specific", icon: <Sparkles className="h-4 w-4" /> },
  { value: "leave", label: "Leave / time off", hint: "Request time away", icon: <Clock className="h-4 w-4" /> },
];

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Inbox — MailSense" },
      { name: "description", content: "Your AI-triaged inbox: priorities, deadlines, tasks and summaries." },
    ],
  }),
  component: DashboardPage,
});

type Tone = "professional" | "friendly" | "concise" | "assertive";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "deadlines", label: "Deadlines" },
  { id: "reminders", label: "Reminders" },
  { id: "spam", label: "Flagged" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const MAILBOXES: { id: GmailMailbox; label: string; icon: React.ReactNode }[] = [
  { id: "inbox", label: "Inbox", icon: <Inbox className="h-4 w-4" /> },
  { id: "sent", label: "Sent", icon: <Send className="h-4 w-4" /> },
  { id: "starred", label: "Starred", icon: <Star className="h-4 w-4" /> },
  { id: "spam", label: "Spam", icon: <ShieldAlert className="h-4 w-4" /> },
  { id: "trash", label: "Trash", icon: <Trash2 className="h-4 w-4" /> },
  { id: "all", label: "All mail", icon: <Archive className="h-4 w-4" /> },
];

function DashboardPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<MockEmail[]>(seedEmails);
  const [query, setQuery] = useState("");
  const [mailbox, setMailbox] = useState<GmailMailbox>("inbox");
  const [filter, setFilter] = useState<FilterId>("all");
  const [selectedId, setSelectedId] = useState<string>(seedEmails[0]?.id ?? "");
  const [syncedAt, setSyncedAt] = useState<string>(new Date().toISOString());
  const [syncing, setSyncing] = useState(false);
  const [auto, setAuto] = useState(false);
  const [snoozed, setSnoozed] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [reminded, setReminded] = useState<Record<string, boolean>>({});
  const [triaging, setTriaging] = useState(false);

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyTone, setReplyTone] = useState<Tone>("professional");
  const [replyDraft, setReplyDraft] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyInstr, setReplyInstr] = useState("");

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTone, setComposeTone] = useState<Tone>("professional");
  const [composePurpose, setComposePurpose] = useState<ComposePurpose>("general");
  const [composeRecipient, setComposeRecipient] = useState("");
  const [composeReason, setComposeReason] = useState("");
  const [composePrompt, setComposePrompt] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeLoading, setComposeLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [sentLog, setSentLog] = useState<SentItem[]>([]);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const analyticsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    void handleSync(false);
  }, [mailbox]);

  // Auto-sync every 60s
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => handleSync(true), 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  // Follow-up reminder scan every 20s — flags un-replied >6h old non-done critical/high
  useEffect(() => {
    const tick = () => {
      const next: Record<string, boolean> = {};
      for (const e of emails) {
        const ageH = (Date.now() - new Date(e.receivedAt).getTime()) / 3600_000;
        if (
          !done[e.id] &&
          !snoozed[e.id] &&
          (e.priority === "critical" || e.priority === "high") &&
          ageH > 6
        ) {
          next[e.id] = true;
        }
      }
      setReminded(next);
    };
    tick();
    const t = setInterval(tick, 20_000);
    return () => clearInterval(t);
  }, [emails, done, snoozed]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return emails
      .filter((e) => !snoozed[e.id])
      .filter((e) => {
        if (filter === "deadlines") return !!e.deadline;
        if (filter === "spam") return !!e.spam;
        if (filter === "reminders") return !!reminded[e.id];
        if (filter !== "all" && e.priority !== filter) return false;
        return true;
      })
      .filter((e) =>
        !q
          ? true
          : [e.subject, e.from, e.preview, e.summary, e.category].join(" ").toLowerCase().includes(q),
      )
      .sort((a, b) => b.attentionScore - a.attentionScore);
  }, [filter, query, emails, snoozed, reminded]);

  const selected = emails.find((e) => e.id === selectedId) ?? filtered[0] ?? emails[0];

  const stats = useMemo(() => {
    const alive = emails.filter((e) => !done[e.id] && !snoozed[e.id]);
    return {
      critical: alive.filter((e) => e.priority === "critical").length,
      high: alive.filter((e) => e.priority === "high").length,
      tasks: alive.reduce((n, e) => n + e.tasks.filter((t) => !t.done).length, 0),
      dueSoon: alive.filter((e) => isDeadlineSoon(e.deadline?.dueAt)).length,
      reminders: Object.values(reminded).filter(Boolean).length,
    };
  }, [emails, done, snoozed, reminded]);

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore Supabase sign-out errors and redirect to the auth screen.
    }

    navigate({ to: "/auth", replace: true });
  }

  async function handleSync(silent = false) {
    if (syncing) return;
    setSyncing(true);
    try {
      const provider = getConfiguredInboxProvider();
      const { data } = await supabase.auth.getSession();
      const providerToken = data.session?.provider_token ?? null;

      if (!providerToken) {
        if (!silent) {
          toast.error("Connect with Google to load your real inbox.");
        }
        return;
      }

      const fresh = await fetchInboxMessages({
        provider,
        token: providerToken,
        mailbox,
      });

      setEmails(fresh);
      setSelectedId(fresh[0]?.id ?? "");
      const label = provider === "realmails" ? "RealMails" : `${MAILBOXES.find((item) => item.id === mailbox)?.label ?? "Gmail"} mail`;
      if (!silent) toast.success(`Synced ${fresh.length} ${label} message${fresh.length === 1 ? "" : "s"}`);
    } catch (err) {
      if (!silent) {
        toast.error(err instanceof Error ? err.message : "Inbox sync failed");
      }
    } finally {
      setSyncing(false);
      setSyncedAt(new Date().toISOString());
    }
  }

  async function handleTriage() {
    if (!selected) return;
    setTriaging(true);
    try {
      const out = await triageEmail({
        data: { from: selected.from, subject: selected.subject, body: selected.body },
      });
      setEmails((prev) =>
        prev.map((e) =>
          e.id === selected.id
            ? {
                ...e,
                priority: out.priority,
                attentionScore: out.attentionScore,
                category: out.category,
                summary: out.summary,
                tasks: out.tasks.map((t) => ({ text: t, done: false })),
                deadline: out.deadlineLabel
                  ? e.deadline ?? { label: out.deadlineLabel, dueAt: e.receivedAt }
                  : e.deadline,
                spam: out.isPhishing,
                sentiment: out.sentiment,
              }
            : e,
        ),
      );
      toast.success("AI triage updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Triage failed");
    } finally {
      setTriaging(false);
    }
  }

  async function openReply() {
    if (!selected) return;
    setReplyOpen(true);
    setReplyDraft("");
    setReplyInstr("");
    setReplyLoading(true);
    try {
      const { reply } = await generateReply({
        data: {
          from: selected.from,
          subject: selected.subject,
          body: selected.body,
          tone: replyTone,
        },
      });
      setReplyDraft(reply);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not draft reply");
    } finally {
      setReplyLoading(false);
    }
  }

  async function regenerateReply() {
    if (!selected) return;
    setReplyLoading(true);
    try {
      const { reply } = await generateReply({
        data: {
          from: selected.from,
          subject: selected.subject,
          body: selected.body,
          tone: replyTone,
          instruction: replyInstr || undefined,
        },
      });
      setReplyDraft(reply);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not regenerate");
    } finally {
      setReplyLoading(false);
    }
  }

  async function runCompose() {
    setComposeLoading(true);
    try {
      const out = await composeEmail({
        data: {
          prompt: composePrompt,
          tone: composeTone,
          purpose: composePurpose,
          recipient: composeRecipient || undefined,
          reason: composeReason || undefined,
        },
      });
      setComposeSubject(out.subject);
      setComposeBody(out.body);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Compose failed");
    } finally {
      setComposeLoading(false);
    }
  }

  async function sendMessage(to: string, subject: string, body: string, kind: "reply" | "compose", emailId?: string) {
    if (!to.trim() || !subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      const { data } = await supabase.auth.getSession();
      await sendGmailMessage({ token: data.session?.provider_token, to, subject, body });
      setSentLog((log) => [...log, { id: `${kind[0]}-${Date.now()}`, subject, to, at: new Date().toISOString(), kind }]);
      if (emailId) markDone(emailId);
      toast.success("Message sent through Gmail");
      setReplyOpen(false);
      setComposeOpen(false);
      setComposePrompt(""); setComposeReason(""); setComposeRecipient(""); setComposeSubject(""); setComposeBody(""); setComposePurpose("general");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send message");
    } finally {
      setSending(false);
    }
  }

  function scrollToAnalytics() {
    setAnalyticsOpen(true);
    requestAnimationFrame(() => {
      analyticsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function snooze(id: string) {
    setSnoozed((s) => ({ ...s, [id]: true }));
    toast("Snoozed for now", {
      action: { label: "Undo", onClick: () => setSnoozed((s) => ({ ...s, [id]: false })) },
    });
  }
  function markDone(id: string) {
    setDone((d) => ({ ...d, [id]: true }));
    setReminded((r) => ({ ...r, [id]: false }));
    toast.success("Marked done");
  }
  function toggleTask(emailId: string, idx: number) {
    setEmails((prev) =>
      prev.map((e) =>
        e.id === emailId
          ? { ...e, tasks: e.tasks.map((t, i) => (i === idx ? { ...t, done: !t.done } : t)) }
          : e,
      ),
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-foreground">
      <TopBar
        email={email}
        onSignOut={handleSignOut}
        onSync={() => handleSync(false)}
        syncing={syncing}
        syncedAt={syncedAt}
        auto={auto}
        onToggleAuto={() => setAuto((a) => !a)}
        onCompose={() => setComposeOpen(true)}
      />

      <section className="border-b border-border/60" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Critical now" value={stats.critical} icon={<AlertTriangle className="h-4 w-4 text-critical" />} accent="text-critical" />
          <StatCard label="High priority" value={stats.high} icon={<Sparkles className="h-4 w-4 text-gold" />} />
          <StatCard label="Open tasks" value={stats.tasks} icon={<ListTodo className="h-4 w-4 text-primary" />} />
          <StatCard label="Deadlines < 48h" value={stats.dueSoon} icon={<Clock className="h-4 w-4 text-destructive" />} accent="text-destructive" pulse={stats.dueSoon > 0} />
          <StatCard label="Follow-ups" value={stats.reminders} icon={<Bell className="h-4 w-4 text-primary" />} pulse={stats.reminders > 0} />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-primary"><Sparkles className="h-3.5 w-3.5" /> Inbox intelligence active</span>
          <span>Prioritize the work that moves today forward.</span>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 py-6">
        <div className="grid gap-4 lg:grid-cols-[1.05fr_1.4fr]">
          <div className="rounded-2xl border border-border/70 bg-card/60 overflow-hidden flex flex-col min-h-[640px]">
            <div className="p-4 border-b border-border/70 space-y-3">
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {MAILBOXES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setMailbox(item.id);
                      setFilter("all");
                    }}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                      mailbox === item.id ? "bg-primary text-primary-foreground shadow-[var(--shadow-gold)]" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search naturally — “HR emails”, “invoices”…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-2.5 py-1.5">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <Select value={filter} onValueChange={(value) => setFilter(value as FilterId)}>
                    <SelectTrigger className="h-8 w-[150px] border-0 bg-transparent p-0 shadow-none focus:ring-0">
                      <SelectValue placeholder="Mails" />
                    </SelectTrigger>
                    <SelectContent>
                      {FILTERS.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.label}
                          {f.id === "reminders" && stats.reminders > 0 ? ` (${stats.reminders})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" variant="outline" onClick={() => setComposeOpen(true)} className="h-8 rounded-full px-3">
                  <PenLine className="h-3.5 w-3.5" />
                  <span className="ml-1.5">Compose</span>
                </Button>
                <Button size="sm" variant="outline" onClick={scrollToAnalytics} className="h-8 rounded-full px-3">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span className="ml-1.5">Triage Analytics</span>
                </Button>
                {FILTERS.slice(1, 4).map((quickFilter) => (
                  <Button key={quickFilter.id} size="sm" variant={filter === quickFilter.id ? "secondary" : "ghost"} onClick={() => setFilter(quickFilter.id)} className="h-8 rounded-full px-3 text-xs">
                    {quickFilter.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {filtered.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">No emails match.</div>
              ) : (
                filtered.map((e) => (
                  <EmailListItem
                    key={e.id}
                    email={e}
                    isDone={!!done[e.id]}
                    reminded={!!reminded[e.id]}
                    selected={e.id === selected?.id}
                    onClick={() => setSelectedId(e.id)}
                  />
                ))
              )}
            </div>
          </div>

          {selected && (
            <EmailDetail
              email={selected}
              isDone={!!done[selected.id]}
              onSnooze={() => snooze(selected.id)}
              onDone={() => markDone(selected.id)}
              onAiReply={openReply}
              onTriage={handleTriage}
              triaging={triaging}
              onToggleTask={(i) => toggleTask(selected.id, i)}
            />
          )}
        </div>
      </section>

      {analyticsOpen && (
        <section ref={analyticsRef} className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-8">
          <InboxAnalytics emails={emails} sentLog={sentLog} />
        </section>
      )}



      {/* AI Reply dialog */}
      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" /> AI reply draft
            </DialogTitle>
            <DialogDescription>
              Drafted for {selected?.from} · re: {selected?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Tone</span>
              <Select value={replyTone} onValueChange={(v) => setReplyTone(v as Tone)}>
                <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="assertive">Assertive</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Optional: tell AI what to emphasize"
                value={replyInstr}
                onChange={(e) => setReplyInstr(e.target.value)}
                className="h-8 flex-1"
              />
              <Button size="sm" variant="outline" disabled={replyLoading} onClick={regenerateReply}>
                {replyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                <span className="ml-1.5">Regenerate</span>
              </Button>
            </div>
            <Textarea
              rows={10}
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              placeholder={replyLoading ? "AI is drafting…" : "Your reply"}
              className="font-sans"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReplyOpen(false)}>Cancel</Button>
            <Button
              onClick={() => selected && sendMessage(selected.fromEmail, `Re: ${selected.subject}`, replyDraft, "reply", selected.id)}
              disabled={!replyDraft.trim() || sending}
            >
              {sending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />} Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compose dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="h-4 w-4 text-primary" /> AI Composer
            </DialogTitle>
            <DialogDescription>Choose the intent, explain the situation, and let AI shape the right message.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {COMPOSE_PURPOSES.map((purpose) => (
                <button
                  key={purpose.value}
                  type="button"
                  onClick={() => setComposePurpose(purpose.value)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all hover:border-primary/60 hover:bg-primary/5",
                    composePurpose === purpose.value ? "border-primary bg-primary/10 shadow-[var(--shadow-glow)]" : "border-border/70 bg-background/30",
                  )}
                >
                  <span className={cn("flex items-center gap-2 text-sm font-medium", composePurpose === purpose.value ? "text-primary" : "text-foreground")}>
                    {purpose.icon} {purpose.label}
                  </span>
                  <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{purpose.hint}</span>
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Recipient name or email (optional)" value={composeRecipient} onChange={(e) => setComposeRecipient(e.target.value)} />
              <Select value={composeTone} onValueChange={(v) => setComposeTone(v as Tone)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="assertive">Assertive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input placeholder="What is the reason or outcome you need? (e.g. need Friday off for a family appointment)" value={composeReason} onChange={(e) => setComposeReason(e.target.value)} />
              <Button size="sm" onClick={runCompose} disabled={composeLoading || (composePrompt.trim().length < 3 && composeReason.trim().length < 3)} className="h-10 px-4">
                {composeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                <span className="ml-1.5">Draft with AI</span>
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Extra details, links, dates, or constraints"
                value={composePrompt}
                onChange={(e) => setComposePrompt(e.target.value)}
                className="h-9 flex-1"
              />
              <span className="hidden text-[11px] text-muted-foreground sm:inline">Optional details (may be left empty)</span>
            </div>
            <div className="flex items-center gap-2 border-t border-border/60 pt-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Your draft</span>
              <span className="text-xs text-muted-foreground">Review and edit before sending</span>
            </div>
            <Input placeholder="Subject" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} />
            <Textarea rows={10} placeholder="Body" value={composeBody} onChange={(e) => setComposeBody(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button
              onClick={() => sendMessage(composeRecipient, composeSubject, composeBody, "compose")}
              disabled={!composeBody.trim() || !composeSubject.trim() || !composeRecipient.trim() || sending}
            >
              {sending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />} Send via Gmail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TopBar({
  email, onSignOut, onSync, syncing, syncedAt, auto, onToggleAuto, onCompose,
}: {
  email: string; onSignOut: () => void; onSync: () => void; syncing: boolean;
  syncedAt: string; auto: boolean; onToggleAuto: () => void; onCompose: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid place-items-center h-7 w-7 rounded-md bg-primary/20 text-primary">
            <Mail className="h-4 w-4" />
          </div>
          <span className="font-display text-base font-semibold tracking-tight text-gold">MailSense</span>
          <Badge variant="outline" className="ml-2 text-[10px] uppercase tracking-wider">Beta</Badge>
        </Link>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex flex-wrap items-center justify-end gap-2 rounded-full border border-border/70 bg-background/70 px-2 py-1.5 shadow-sm">
            <Button size="sm" variant="outline" onClick={onSync} disabled={syncing} className="h-8 rounded-full px-3">
              {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              <span className="ml-1.5 hidden sm:inline">Sync</span>
            </Button>
            <Button size="sm" variant={auto ? "default" : "outline"} onClick={onToggleAuto} title="Auto-sync every 60s" className="h-8 rounded-full px-3">
              <TimerReset className="h-3.5 w-3.5" />
              <span className="ml-1.5 hidden sm:inline">{auto ? "Auto on" : "Auto"}</span>
            </Button>
            <Button size="sm" onClick={onCompose} className="h-8 rounded-full px-3">
              <PenLine className="h-3.5 w-3.5" />
              <span className="ml-1.5 hidden sm:inline">Compose</span>
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 rounded-full border border-border/60 bg-muted/30 px-2 py-1.5">
            <span className="hidden md:inline text-[11px] text-muted-foreground">
              synced {formatRelative(syncedAt)}
            </span>
            <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[160px]">{email}</span>
            <Button variant="ghost" size="sm" onClick={onSignOut} className="h-8 rounded-full px-3">
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatCard({ label, value, icon, accent, pulse }: { label: string; value: number; icon: React.ReactNode; accent?: string; pulse?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={cn("relative grid place-items-center", pulse && "animate-pulse")}>{icon}</span>
      </div>
      <div className={cn("mt-2 text-3xl font-semibold tabular-nums", accent)}>{value}</div>
    </div>
  );
}

function EmailListItem({
  email, selected, onClick, isDone, reminded,
}: { email: MockEmail; selected: boolean; onClick: () => void; isDone: boolean; reminded: boolean }) {
  const meta = priorityMeta[email.priority];
  const soon = isDeadlineSoon(email.deadline?.dueAt);
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3.5 flex gap-3 items-start transition-colors",
        selected ? "bg-accent/60" : "hover:bg-accent/30",
        isDone && "opacity-50",
      )}
    >
      <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", meta.dot)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn("font-medium text-foreground/90 truncate", email.unread && "text-foreground")}>{email.from}</span>
          {email.spam && (
            <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">
              <ShieldAlert className="h-3 w-3 mr-1" /> Suspicious
            </Badge>
          )}
          {reminded && !isDone && (
            <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
              <Bell className="h-3 w-3 mr-1" /> Follow up
            </Badge>
          )}
          <span className="ml-auto shrink-0">{formatRelative(email.receivedAt)}</span>
        </div>
        <div className={cn("text-sm mt-0.5 truncate", email.unread ? "font-semibold" : "font-medium", isDone && "line-through")}>
          {email.subject}
        </div>
        <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{email.summary}</div>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <Badge variant="outline" className={cn("text-[10px]", meta.chip)}>{meta.label}</Badge>
          <Badge variant="outline" className="text-[10px] text-muted-foreground">{email.category}</Badge>
          {email.deadline && (
            <Badge variant="outline" className={cn("text-[10px] gap-1", soon ? "bg-destructive/15 text-destructive border-destructive/40" : "text-muted-foreground")}>
              <Clock className="h-3 w-3" /> {email.deadline.label}
            </Badge>
          )}
          {email.tasks.length > 0 && (
            <Badge variant="outline" className="text-[10px] gap-1 text-muted-foreground">
              <ListTodo className="h-3 w-3" /> {email.tasks.filter((t) => !t.done).length}/{email.tasks.length}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

function EmailDetail({
  email, isDone, onSnooze, onDone, onAiReply, onTriage, triaging, onToggleTask,
}: {
  email: MockEmail; isDone: boolean;
  onSnooze: () => void; onDone: () => void; onAiReply: () => void;
  onTriage: () => void; triaging: boolean;
  onToggleTask: (i: number) => void;
}) {
  const meta = priorityMeta[email.priority];
  const soon = isDeadlineSoon(email.deadline?.dueAt);
  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 overflow-hidden flex flex-col min-h-[640px]">
      <div className="p-5 sm:p-6 border-b border-border/70">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="outline" className={cn("gap-1", meta.chip)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {meta.label} priority
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">{email.category}</Badge>
          <Badge variant="outline" className="ml-auto gap-1 text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-primary" /> Attention {email.attentionScore}
          </Badge>
        </div>
        <h2 className="text-xl font-semibold leading-snug">{email.subject}</h2>
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="text-foreground/90 font-medium">{email.from}</span> &lt;{email.fromEmail}&gt; · {formatRelative(email.receivedAt)}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
        {email.spam && (
          <AlertBlock tone="danger" icon={<ShieldAlert className="h-4 w-4" />} title="Likely phishing"
            body="Suspicious sender domain and urgent language with a shortened link. Do not click." />
        )}

        {email.deadline && (
          <AlertBlock tone={soon ? "danger" : "info"} icon={<Clock className="h-4 w-4" />}
            title={soon ? `⚠ Deadline: ${email.deadline.label}` : `Deadline: ${email.deadline.label}`}
            body={soon ? `Due ${formatRelative(email.deadline.dueAt)} — bumped to the top of your queue.` : `Due ${formatRelative(email.deadline.dueAt)}.`} />
        )}

        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> AI summary
            </h3>
            <Button size="sm" variant="ghost" disabled={triaging} onClick={onTriage} className="h-7 text-xs">
              {triaging ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
              <span className="ml-1">Re-triage with AI</span>
            </Button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{email.summary}</p>
        </section>

        {email.tasks.length > 0 && (
          <section>
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ListTodo className="h-3.5 w-3.5 text-primary" /> Action items
            </h3>
            <ul className="mt-2 space-y-1.5">
              {email.tasks.map((t, i) => (
                <li key={i}>
                  <button onClick={() => onToggleTask(i)} className="flex items-start gap-2 text-sm text-left hover:opacity-80 w-full">
                    <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0", t.done ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn(t.done && "line-through text-muted-foreground")}>{t.text}</span>
                  </button>
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
          <pre className="mt-2 text-sm whitespace-pre-wrap font-sans text-foreground/85">{email.body}</pre>
        </section>
      </div>

      <div className="p-4 border-t border-border/70 flex flex-wrap items-center gap-2 bg-background/40">
        <Button size="sm" onClick={onAiReply} disabled={isDone}>
          <Sparkles className="h-4 w-4 mr-1.5" /> AI reply
        </Button>
        <Button size="sm" variant="outline" onClick={onSnooze} disabled={isDone}>Snooze</Button>
        <Button size="sm" variant="ghost" onClick={onDone} disabled={isDone}>
          {isDone ? "Done" : "Mark done"}
        </Button>
      </div>
    </div>
  );
}

function AlertBlock({ tone, icon, title, body }: { tone: "danger" | "info"; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className={cn(
      "rounded-xl border p-3.5 flex gap-3",
      tone === "danger" ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-primary",
    )}>
      <span className="mt-0.5">{icon}</span>
      <div className="text-sm">
        <div className="font-semibold">{title}</div>
        <div className={cn("mt-0.5", tone === "danger" ? "text-destructive/90" : "text-foreground/85")}>{body}</div>
      </div>
    </div>
  );
}
