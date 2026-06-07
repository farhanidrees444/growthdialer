export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050507] text-[#F5F5F7] antialiased">
      {children}
    </div>
  );
}
