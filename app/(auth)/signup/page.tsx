import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";

function SignupInner() {
  const showGoogle =
    Boolean(process.env.AUTH_GOOGLE_ID?.trim()) &&
    Boolean(process.env.AUTH_GOOGLE_SECRET?.trim());
  return <SignupForm showGoogle={showGoogle} />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-2xl bg-white/5" />}>
      <SignupInner />
    </Suspense>
  );
}
