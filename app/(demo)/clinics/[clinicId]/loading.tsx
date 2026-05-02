import { Skeleton } from "@/components/demo/skeleton";

export default function ClinicDetailLoading() {
  return (
    <div className="grid gap-4 pb-4">
      <Skeleton className="h-72 rounded-lg" />
      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="grid gap-4">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
