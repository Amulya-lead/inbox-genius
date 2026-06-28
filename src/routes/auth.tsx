import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — MailSense" },
      {
        name: "description",
        content: "Sign in to MailSense to triage your inbox with AI.",
      },
    ],
  }),
  component: AuthPage,
});

const credSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate({ to: "/dashboard" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>, mode: "signin" | "signup") {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = credSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. You're in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        toast.success("Welcome back.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setOauthLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed");
        setOauthLoading(false);
        return;
      }
      if (result.redirected) return;
      // session set; effect will redirect
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setOauthLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen grid place-items-center px-4 py-12"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 flex items-center gap-2 justify-center text-sm text-muted-foreground hover:text-foreground"
        >
          <Mail className="h-4 w-4 text-primary" />
          <span className="font-display text-base font-semibold tracking-tight text-foreground">
            MailSense
          </span>
        </Link>

        <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur p-6 sm:p-8 shadow-[var(--shadow-card)]">
          <h1 className="text-2xl font-semibold">Welcome</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to triage your inbox with AI.
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full"
            disabled={oauthLoading}
            onClick={handleGoogle}
          >
            {oauthLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span className="ml-2">Continue with Google</span>
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-card px-2 text-muted-foreground">or email</span>
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            {(["signin", "signup"] as const).map((mode) => (
              <TabsContent key={mode} value={mode}>
                <form className="space-y-4 mt-4" onSubmit={(e) => handleSubmit(e, mode)}>
                  <div className="space-y-1.5">
                    <Label htmlFor={`${mode}-email`}>Email</Label>
                    <Input
                      id={`${mode}-email`}
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`${mode}-password`}>Password</Label>
                    <Input
                      id={`${mode}-password`}
                      name="password"
                      type="password"
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {mode === "signin" ? "Sign in" : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            ))}
          </Tabs>

          <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Demo credentials
            </div>
            <div className="mt-1.5 text-muted-foreground space-y-0.5 font-mono">
              <div>email: <span className="text-foreground">demo@mailsense.app</span></div>
              <div>password: <span className="text-foreground">demo1234</span></div>
            </div>
            <button
              type="button"
              className="mt-2 text-primary hover:underline"
              onClick={async () => {
                setLoading(true);
                const creds = { email: "demo@mailsense.app", password: "demo1234" };
                let { error } = await supabase.auth.signInWithPassword(creds);
                if (error) {
                  const up = await supabase.auth.signUp({
                    ...creds,
                    options: { emailRedirectTo: window.location.origin },
                  });
                  error = up.error ?? null;
                  if (!up.error) {
                    await supabase.auth.signInWithPassword(creds);
                  }
                }
                if (error) toast.error(error.message);
                setLoading(false);
              }}
            >
              → Sign in as demo user
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.7 2.4 12 2.4 6.7 2.4 2.5 6.6 2.5 12s4.2 9.6 9.5 9.6c5.5 0 9.1-3.8 9.1-9.3 0-.6-.07-1.1-.16-1.6H12z"
      />
    </svg>
  );
}
