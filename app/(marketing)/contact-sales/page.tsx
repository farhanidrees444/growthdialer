"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactSalesPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        company: String(fd.get("company") ?? ""),
        message: String(fd.get("message") ?? ""),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok && data.message) {
      setMessage(data.message as string);
      (e.target as HTMLFormElement).reset();
    } else {
      setMessage("Something went wrong. Please try again or email hello@growthdialer.com.");
    }
  }

  return (
    <div className="pt-28 pb-20 px-4">
      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-2">Enterprise</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Talk to sales</h1>
          <p className="text-muted-foreground mt-2">
            Custom limits, security review, and migration support — we&apos;ll reply within one business day.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onSubmit={onSubmit}
          className="rounded-2xl border border-white/10 bg-[oklch(0.086_0.024_282)] p-6 md:p-8 space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required minLength={2} className="bg-white/5 border-white/12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              className="bg-white/5 border-white/12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" name="company" required className="bg-white/5 border-white/12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">What are you looking for?</Label>
            <Textarea
              id="message"
              name="message"
              required
              minLength={10}
              rows={4}
              className="bg-white/5 border-white/12 resize-none"
              placeholder="Team size, CRM, compliance needs…"
            />
          </div>
          {message && <p className="text-sm text-brand">{message}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-brand text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)] font-semibold"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
          </Button>
        </motion.form>
      </div>
    </div>
  );
}
