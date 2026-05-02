import { Skeleton } from "@/components/demo/skeleton";

export default function DemoLoading() {
  return (
    <div className="grid gap-4 pb-4">
      <div className="grid gap-3 md:grid-cols-4">
        {["status", "alerts", "reports", "sync"].map((item) => (
          <Skeleton key={item} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(22rem,0.95fr)]">
        <div className="grid gap-4">
          <Skeleton className="h-[380px] rounded-lg" />
          <Skeleton className="h-[420px] rounded-lg" />
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-[420px] rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
