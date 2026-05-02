import { Skeleton } from "@/components/demo/skeleton";

export default function DemoLoading() {
  return (
    <div className="grid gap-4 pb-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {["status", "alerts", "reports", "sync"].map((item) => (
          <Skeleton key={item} className="h-32 rounded-lg" />
        ))}
      </div>

      <Skeleton className="h-[34rem] rounded-lg" />
      <Skeleton className="h-96 rounded-lg" />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}
