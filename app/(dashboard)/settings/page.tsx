"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSupabaseSession } from "@/lib/supabase/hooks";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { settingsProfileSchema, type SettingsProfileInput } from "@/lib/validations";

export default function SettingsPage() {
  const session = useSupabaseSession();
  const [saved, setSaved] = useState(false);

  const form = useForm<SettingsProfileInput>({
    resolver: zodResolver(settingsProfileSchema),
    defaultValues: {
      name: session?.user?.user_metadata?.full_name ?? "",
      email: session?.user?.email ?? "",
      title: "Account Executive",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      phone: "+1 (555) 000-0000",
    },
  });

  useEffect(() => {
    if (session?.user) {
      form.reset({
        name: session.user.user_metadata?.full_name ?? "",
        email: session.user.email ?? "",
        title: "Account Executive",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        phone: "+1 (555) 000-0000",
      });
    }
  }, [session?.user, form]);

  async function onSubmit(_values: SettingsProfileInput) {
    await new Promise((r) => setTimeout(r, 400));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3000);
  }

  return (
    <>
      <DashboardHeader title="Settings" subtitle="Profile and workspace preferences" />
      <main className="flex-1 overflow-y-auto px-6 py-5">
        <Card className="max-w-lg border-white/10 bg-[oklch(0.086_0.024_282)]/95 p-6 shadow-lg shadow-black/25 backdrop-blur-sm">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" className="border-white/12 bg-white/5" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                className="border-white/12 bg-white/5 opacity-80"
                {...form.register("email")}
                disabled
              />
              <p className="text-[11px] text-muted-foreground">Managed by your identity provider.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" className="border-white/12 bg-white/5" {...form.register("title")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input id="timezone" className="border-white/12 bg-white/5" {...form.register("timezone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" className="border-white/12 bg-white/5" {...form.register("phone")} />
            </div>
            {saved && <p className="text-sm text-emerald-400">Profile saved.</p>}
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="bg-brand font-semibold text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)]"
            >
              {form.formState.isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </Card>
      </main>
    </>
  );
}
