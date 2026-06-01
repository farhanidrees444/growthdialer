export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Full-bleed matte black — each auth page owns its own 50/50 split layout.
  return (
    <div className="min-h-screen bg-[#08080A] text-[#F5F5F7] antialiased">
      {children}
    </div>
  );
}
