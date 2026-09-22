/** Route transition skeleton — generic branded dashboard placeholder. */
export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6" aria-hidden>
      <div className="space-y-2">
        <div className="dash-skeleton h-7 w-48" />
        <div className="dash-skeleton h-4 w-72" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="dash-skeleton h-24" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="dash-skeleton h-72 lg:col-span-2" />
        <div className="dash-skeleton h-72" />
      </div>
    </div>
  );
}
