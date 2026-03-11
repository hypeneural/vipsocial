export function FeedCardSkeleton() {
    return (
        <div className="animate-pulse overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
            <div className="p-4">
                <div className="mb-3 flex items-center gap-2">
                    <div className="h-5 w-16 rounded-full bg-muted" />
                    <div className="h-5 w-14 rounded-full bg-muted" />
                </div>

                <div className="flex gap-4">
                    <div className="hidden h-24 w-28 flex-shrink-0 rounded-xl bg-muted sm:block md:w-36" />

                    <div className="min-w-0 flex-1 space-y-3">
                        <div className="h-4 w-4/5 rounded bg-muted" />
                        <div className="h-4 w-3/5 rounded bg-muted" />

                        <div className="flex items-center gap-2">
                            <div className="h-3 w-20 rounded bg-muted" />
                            <div className="h-3 w-16 rounded bg-muted" />
                            <div className="h-3 w-12 rounded bg-muted" />
                        </div>

                        <div className="space-y-2">
                            <div className="h-3 w-full rounded bg-muted" />
                            <div className="h-3 w-4/5 rounded bg-muted" />
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="h-5 w-14 rounded-full bg-muted" />
                            <div className="h-5 w-12 rounded-full bg-muted" />
                            <div className="h-5 w-16 rounded-full bg-muted" />
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-border/50 pt-3">
                    <div className="h-8 w-24 rounded-lg bg-muted" />
                    <div className="h-8 w-28 rounded-lg bg-muted" />
                    <div className="ml-auto h-3 w-28 rounded bg-muted" />
                </div>
            </div>
        </div>
    );
}

export function FeedCardSkeletonGrid({ count = 8 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }, (_, index) => (
                <FeedCardSkeleton key={`skeleton-${index}`} />
            ))}
        </div>
    );
}
