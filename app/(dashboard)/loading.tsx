export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-white/[0.06]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
        ))}
      </div>
      <div className="flex-1 min-h-[240px] rounded-2xl bg-white/[0.03] border border-white/[0.06]" />
    </div>
  );
}
