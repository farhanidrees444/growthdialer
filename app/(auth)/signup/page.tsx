"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Zap, Eye, EyeOff, Star, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";

function getPasswordStrength(password: string) {
  if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
    return { level: 3, label: "Strong", color: "bg-green-500" };
  }
  if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
    return { level: 2, label: "Good", color: "bg-yellow-500" };
  }
  if (password.length >= 8) {
    return { level: 1, label: "Fair", color: "bg-orange-500" };
  }
  return { level: 0, label: "Weak", color: "bg-red-500" };
}

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordStrength = getPasswordStrength(formData.password);

  async function handleGoogleSignUp() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/auth/callback' }
    });
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!agreeToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            company: formData.company
          }
        }
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
          <div className="mx-auto w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-4">Check your email</h2>
              <p className="text-slate-400 mb-6">
                We've sent a confirmation link to <strong className="text-white">{formData.email}</strong>
              </p>
              <p className="text-sm text-slate-500">
                Click the link in the email to complete your account setup and start your free trial.
              </p>
              <Button
                onClick={() => router.push('/login')}
                className="w-full mt-6 bg-brand text-white hover:bg-brand/90"
              >
                Back to sign in
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 xl:px-12">
        <div className="mx-auto w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="inline-flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center glow-brand-sm">
                <Zap className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <span className="font-display font-bold text-2xl text-white">
                Growth<span className="text-brand">Dialer</span>
              </span>
            </Link>

            <h1 className="font-display text-4xl font-bold text-white mb-4">
              AI-Powered Sales Dialer
            </h1>
            <p className="text-lg text-slate-300 mb-8">
              Automate your outbound sales with intelligent parallel dialing and AI voice calling.
            </p>

            {/* Social proof stats */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">2,400+</div>
                <div className="text-sm text-slate-400">Teams</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="text-2xl font-bold text-white">4.9</div>
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                </div>
                <div className="text-sm text-slate-400">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">14</div>
                <div className="text-sm text-slate-400">Day Trial</div>
              </div>
            </div>

            <p className="text-slate-400 text-sm">
              Join thousands of sales teams already using GrowthDialer to book more meetings.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side - Signup form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl"
          >
            <div className="mb-8 text-center">
              <h2 className="font-display text-2xl font-bold text-white">Start your free trial</h2>
              <p className="text-slate-400 mt-2">14 days free. No credit card required.</p>
            </div>

            {/* Google sign up */}
            <Button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full bg-white text-slate-900 hover:bg-white/90 font-medium py-3 rounded-lg mb-6 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-400">or sign up with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Full name</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-brand"
                  placeholder="Alex Rivera"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-brand"
                  placeholder="you@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    minLength={8}
                    className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-brand pr-10"
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full ${
                            level <= passwordStrength.level ? passwordStrength.color : 'bg-white/20'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">Password strength: {passwordStrength.label}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-white">Company name <span className="text-slate-400">(optional)</span></Label>
                <Input
                  id="company"
                  type="text"
                  autoComplete="organization"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-brand"
                  placeholder="Acme Corp"
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  className="mt-0.5 border-white/20 data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                />
                <label htmlFor="terms" className="text-sm text-slate-400 leading-relaxed">
                  I agree to the{" "}
                  <Link href="/terms" className="text-brand hover:underline">Terms of Service</Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-brand hover:underline">Privacy Policy</Link>
                </label>
              </div>

              {error && (
                <p className="text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading || !agreeToTerms}
                className="w-full bg-brand text-white hover:bg-brand/90 font-semibold py-3"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create free account"}
              </Button>
            </form>

            <p className="text-center text-slate-400 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-brand font-medium hover:underline">
                Sign in →
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
