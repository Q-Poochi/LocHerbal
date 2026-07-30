export function ProductCardSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter mb-12">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-surface-container-low animate-pulse overflow-hidden">
          <div className="aspect-square bg-outline-variant/20 rounded-t-2xl" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-outline-variant/20 rounded w-3/4" />
            <div className="h-4 bg-outline-variant/20 rounded w-1/2" />
            <div className="h-8 bg-outline-variant/20 rounded-lg w-full mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
