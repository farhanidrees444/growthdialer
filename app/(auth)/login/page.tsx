import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

function LoginInner() {
  const showGoogle =
    Boolean(process.env.AUTH_GOOGLE_ID?.trim()) &&
    Boolean(process.env.AUTH_GOOGLE_SECRET?.trim());
  return <LoginForm showGoogle={showGoogle} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-64 w-full max-w-md animate-pulse rounded-2xl bg-white/5" />}>
      <LoginInner />
    </Suspense>
  );
}
