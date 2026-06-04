/**
 * Skeleton — shimmer placeholder block. Compose with Tailwind sizing classes.
 *   <Skeleton className="h-4 w-1/2 rounded-full" />
 */
export default function Skeleton({ className = '' }) {
  return (
    <div className={`bg-slate-200 animate-pulse rounded-md ${className}`} aria-hidden="true" />
  )
}

/** Common card-row skeleton reused by list pages. */
export function CardRowSkeleton() {
  return (
    <div className="flex gap-3 bg-white p-3 rounded-2xl border border-slate-100">
      <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2 justify-center">
        <Skeleton className="w-3/4 h-4 rounded-full" />
        <Skeleton className="w-1/2 h-3 rounded-full" />
      </div>
    </div>
  )
}

/** A vertical stack of CardRowSkeletons. */
export function ListSkeleton({ count = 4, className = 'flex flex-col gap-3 px-4' }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => <CardRowSkeleton key={i} />)}
    </div>
  )
}
