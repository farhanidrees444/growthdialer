export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-background text-foreground relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, oklch(0.82 0.27 153) 0%, transparent 65%)",
        }}
      />
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="relative z-10 w-full flex justify-center">{children}</div>
    </div>
  );
}
