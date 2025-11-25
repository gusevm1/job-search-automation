export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Job Search Automation
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Active Applications</h3>
          <p className="text-2xl font-bold text-primary mt-2">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Interviews Scheduled</h3>
          <p className="text-2xl font-bold text-primary mt-2">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Offers Received</h3>
          <p className="text-2xl font-bold text-primary mt-2">0</p>
        </div>
      </div>
    </div>
  );
}
