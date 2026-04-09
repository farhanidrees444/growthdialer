"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

function passwordStrength(password: string) {
  if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
    return { label: "Strong", color: "text-emerald-400" };
  }
  if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
    return { label: "Good", color: "text-amber-300" };
  }
  if (password.length >= 8) {
    return { label: "Fair", color: "text-yellow-300" };
  }
  return { label: "Weak", color: "text-destructive" };
}

export function SignupForm({ showGoogle }: { showGoogle: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });

      if (error) {
        setError(error.message || "Could not create account.");
        return;
      }

      if (data.session) {
        const next = plan ? `/dashboard?plan=${encodeURIComponent(plan)}` : "/dashboard";
        router.push(next);
        router.refresh();
        return;
      }

      setSuccess("Check your email for a confirmation link to complete signup.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-md rounded-2xl border border-white/10 bg-[oklch(0.086_0.024_282)] p-8 shadow-2xl shadow-black/40"
    >
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center glow-brand-sm">
            <Zap className="w-4 h-4 text-[oklch(0.08_0.04_153)]" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-lg">
            Growth<span className="text-brand">Dialer</span>
          </span>
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {plan ? (
            <>
              You selected the <span className="text-brand font-medium">{plan}</span> plan — finish
              signup to continue.
            </>
          ) : (
            "14-day trial · no credit card required."
          )}
        </p>
      </div>

      {showGoogle && (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full border-white/15 bg-white/5 hover:bg-white/10 mb-4"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
            }}
          >
            Continue with Google
          </Button>
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[oklch(0.086_0.024_282)] px-2 text-muted-foreground">Or</span>
            </div>
          </div>
        </>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            className="bg-white/5 border-white/12"
            placeholder="Alex Rivera"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white/5 border-white/12"
            placeholder="you@company.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="bg-white/5 border-white/12"
            placeholder="At least 8 characters"
          />
          <p className={`text-xs ${passwordStrength(password).color}`}>
            Password strength: {passwordStrength(password).label}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="bg-white/5 border-white/12"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-emerald-400" role="status">
            {success}
          </p>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-brand text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)] font-semibold"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-brand font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
