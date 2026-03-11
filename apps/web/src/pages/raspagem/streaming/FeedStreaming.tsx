import { useEffect } from "react";
import { StreamingHeader } from "./StreamingHeader";
import { StreamingGrid } from "./StreamingGrid";
import { useStreamingFeed } from "./useStreamingFeed";

export default function FeedStreaming() {
    const stream = useStreamingFeed();

    // Close with Esc
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                window.history.back();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Respect prefers-reduced-motion
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (mq.matches) {
            document.documentElement.style.setProperty("--streaming-anim-duration", "0s");
        }
        return () => {
            document.documentElement.style.removeProperty("--streaming-anim-duration");
        };
    }, []);

    return (
        <div className="min-h-screen bg-background">
            <StreamingHeader
                newCount={stream.newCount}
                lastUpdatedAt={stream.lastUpdatedAt}
                isOffline={stream.consecutiveErrors >= 2}
            />

            <main className="px-4 pb-8 pt-20">
                <StreamingGrid
                    items={stream.items}
                    isLoading={stream.isLoading}
                    isError={stream.isError}
                />
            </main>
        </div>
    );
}
