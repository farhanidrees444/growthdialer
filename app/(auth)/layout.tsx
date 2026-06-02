export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Full-bleed matte black — each auth page owns its own 50/50 split layout.
  return (
    <div className="min-h-screen bg-[hsl(200,50%,3%)] text-[hsl(200,7%,96%)] antialiased">
      {children}
    </div>
  );
}
