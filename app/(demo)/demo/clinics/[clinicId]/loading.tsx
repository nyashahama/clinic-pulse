import { Skeleton } from "@/components/demo/skeleton";

export default function ClinicDetailLoading() {
  return (
    <div className="grid gap-4 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-7 w-36 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(22rem,1.1fr)]">
        <div className="grid gap-4">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
        <div className="grid content-start gap-4">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
