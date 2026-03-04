import { useState, useRef, useCallback, ReactNode } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { Loader2, ArrowDown } from "lucide-react";

interface PullToRefreshProps {
    children: ReactNode;
    onRefresh: () => Promise<void>;
    disabled?: boolean;
}

export function PullToRefresh({
    children,
    onRefresh,
    disabled = false,
}: PullToRefreshProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const controls = useAnimation();

    const threshold = 80;
    const maxPull = 120;

    const handlePan = useCallback(
        (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            if (disabled || isRefreshing) return;

            const container = containerRef.current;
            if (!container || container.scrollTop > 0) return;

            const distance = Math.min(Math.max(0, info.offset.y), maxPull);
            setPullDistance(distance);
        },
        [disabled, isRefreshing]
    );

    const handlePanEnd = useCallback(async () => {
        if (disabled || isRefreshing) return;

        if (pullDistance >= threshold) {
            setIsRefreshing(true);
            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
            }
        }

        setPullDistance(0);
        controls.start({ y: 0 });
    }, [pullDistance, threshold, onRefresh, disabled, isRefreshing, controls]);

    const pullProgress = Math.min(pullDistance / threshold, 1);
    const rotation = pullProgress * 180;

    return (
        <div ref={containerRef} className="relative overflow-auto h-full">
            {/* Pull indicator */}
            <motion.div
                className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
                style={{ top: pullDistance - 50 }}
                animate={{ opacity: pullDistance > 10 ? 1 : 0 }}
            >
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    {isRefreshing ? (
                        <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
                    ) : (
                        <motion.div style={{ rotate: rotation }}>
                            <ArrowDown className="w-5 h-5 text-primary-foreground" />
                        </motion.div>
                    )}
                </div>
            </motion.div>

            {/* Content */}
            <motion.div
                animate={controls}
                onPan={handlePan}
                onPanEnd={handlePanEnd}
                style={{ y: isRefreshing ? 60 : pullDistance * 0.5 }}
                className="touch-pan-y"
            >
                {children}
            </motion.div>
        </div>
    );
}

export default PullToRefresh;
