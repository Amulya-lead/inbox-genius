import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ListTodo,
  Mail,
  Search,
  ShieldAlert,
  Sparkles,
  Wand2,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MailSense — AI inbox triage" },
      {
        name: "description",
        content:
          "MailSense triages your inbox with AI: priority scoring, deadline alerts, task extraction, and one-prompt email drafting.",
      },
      { property: "og:title", content: "MailSense — AI inbox triage" },
      {
        property: "og:description",
        content:
          "Priority scoring, deadline alerts, task extraction, and one-prompt drafting.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid place-items-center h-7 w-7 rounded-md bg-primary/15 text-primary">
              <Mail className="h-4 w-4" />
            </div>
            <span className="font-display text-base font-semibold tracking-tight">
              MailSense
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {authed ? (
              <Button size="sm" onClick={() => navigate({ to: "/dashboard" })}>
                Open inbox <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/auth">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="border-b border-border/60"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28 text-center">
          <Badge variant="outline" className="mb-5 gap-1.5 text-primary border-primary/30 bg-primary/10">
            <Sparkles className="h-3 w-3" /> AI-triaged inbox
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
            Stop reading email.{" "}
            <span className="text-primary">Start finishing it.</span>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground">
            MailSense reads your inbox, scores what deserves your attention, surfaces
            deadlines in red, pulls out tasks, and drafts replies from a single prompt.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to={authed ? "/dashboard" : "/auth"}>
                {authed ? "Open inbox" : "Try the demo"}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">See how it works</a>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Free to try · Email + Google sign-in
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            One assistant. Every email pattern.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built for people who get hundreds of emails and have minutes to spare.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={<Sparkles className="h-4 w-4" />}
            title="Attention Score"
            body="Each email gets a 0–100 score blending urgency, sender, effort, and your past behavior."
          />
          <Feature
            icon={<Clock className="h-4 w-4" />}
            title="Deadline radar"
            body="Detects “by Friday”, “tomorrow 5 PM”, “end of month” — and shows red alerts under 48h."
            accent
          />
          <Feature
            icon={<ListTodo className="h-4 w-4" />}
            title="Tasks, extracted"
            body="Action items pulled out of every thread so nothing slips through."
          />
          <Feature
            icon={<CheckCircle2 className="h-4 w-4" />}
            title="2-line summaries"
            body="Long threads collapse to what actually matters, in plain English."
          />
          <Feature
            icon={<ShieldAlert className="h-4 w-4" />}
            title="Phishing flag"
            body="Spoofed domains, urgent language, and shady links get quarantined automatically."
          />
          <Feature
            icon={<Search className="h-4 w-4" />}
            title="Natural search"
            body="“Unanswered HR emails this week” — search the way you think."
          />
          <Feature
            icon={<Wand2 className="h-4 w-4" />}
            title="Prompt → email"
            body="“Ask manager for 2 days sick leave” becomes a polished, ready-to-send draft."
          />
          <Feature
            icon={<Mail className="h-4 w-4" />}
            title="Context replies"
            body="One-tap drafts that already understand the thread, your tone, and the ask."
          />
          <Feature
            icon={<ArrowRight className="h-4 w-4" />}
            title="Gmail & Outlook"
            body="Bring your inbox. We never store message content beyond what you triage."
          />
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} MailSense</span>
          <span>Built with AI · Your inbox stays yours.</span>
        </div>
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  body,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/60 p-5 shadow-[var(--shadow-card)]">
      <div
        className={
          accent
            ? "grid h-9 w-9 place-items-center rounded-lg bg-destructive/15 text-destructive"
            : "grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary"
        }
      >
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
