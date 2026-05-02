import { Skeleton } from "@/components/demo/skeleton";

export default function FinderLoading() {
  return (
    <div className="grid gap-4 pb-4">
      <Skeleton className="h-40 rounded-lg" />
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <Skeleton className="h-[560px] rounded-lg" />
        <div className="grid gap-4">
          <Skeleton className="h-56 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </section>
    </div>
  );
}
