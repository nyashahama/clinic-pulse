import { Skeleton } from "@/components/demo/skeleton";

export default function FinderLoading() {
  return (
    <main className="min-h-screen bg-bg-muted px-3 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4">
        <Skeleton className="h-40 rounded-lg" />
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
          <Skeleton className="h-[560px] rounded-lg" />
          <div className="grid gap-4">
            <Skeleton className="h-56 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        </section>
      </div>
    </main>
  );
}
