import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

/**
 * Shimmer skeleton component with animated gradient
 */
export function Shimmer({ className, ...props }: ShimmerProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl bg-muted/50",
                className
            )}
            {...props}
        >
            <motion.div
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ translateX: ["0%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );
}

/**
 * Shimmer text line
 */
export function ShimmerText({ width = "100%" }: { width?: string | number }) {
    return <Shimmer className="h-4" style={{ width }} />;
}

/**
 * Shimmer avatar
 */
export function ShimmerAvatar({ size = 40 }: { size?: number }) {
    return <Shimmer className="rounded-full" style={{ width: size, height: size }} />;
}

/**
 * Shimmer card preset
 */
export function ShimmerCard() {
    return (
        <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-4">
            <div className="flex items-center gap-3">
                <ShimmerAvatar />
                <div className="flex-1 space-y-2">
                    <ShimmerText width="70%" />
                    <ShimmerText width="50%" />
                </div>
            </div>
            <Shimmer className="h-24 w-full" />
            <div className="flex gap-2">
                <Shimmer className="h-9 w-24" />
                <Shimmer className="h-9 w-24" />
            </div>
        </div>
    );
}

/**
 * Shimmer list item
 */
export function ShimmerListItem() {
    return (
        <div className="bg-card rounded-2xl border border-border/50 p-4">
            <div className="flex items-center gap-3">
                <Shimmer className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <ShimmerText width="60%" />
                    <ShimmerText width="40%" />
                </div>
                <Shimmer className="h-8 w-8 rounded-lg" />
            </div>
        </div>
    );
}

/**
 * Shimmer list
 */
export function ShimmerList({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                >
                    <ShimmerListItem />
                </motion.div>
            ))}
        </div>
    );
}

/**
 * Shimmer KPI
 */
export function ShimmerKPI() {
    return (
        <div className="bg-card rounded-2xl border border-border/50 p-4 space-y-2">
            <ShimmerText width="60%" />
            <Shimmer className="h-8 w-20" />
        </div>
    );
}

/**
 * Shimmer dashboard layout
 */
export function ShimmerDashboard() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <ShimmerKPI />
                    </motion.div>
                ))}
            </div>

            {/* Main content */}
            <div className="grid lg:grid-cols-2 gap-6">
                <ShimmerCard />
                <ShimmerCard />
            </div>

            {/* List */}
            <ShimmerList count={3} />
        </motion.div>
    );
}

/**
 * Shimmer table
 */
export function ShimmerTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            {/* Header */}
            <div className="flex gap-4 p-4 border-b border-border/30 bg-muted/30">
                <ShimmerText width="25%" />
                <ShimmerText width="25%" />
                <ShimmerText width="25%" />
                <ShimmerText width="25%" />
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-4 p-4 border-b border-border/20"
                >
                    <ShimmerText width="25%" />
                    <ShimmerText width="25%" />
                    <ShimmerText width="25%" />
                    <ShimmerText width="25%" />
                </motion.div>
            ))}
        </div>
    );
}

/**
 * Shimmer page header
 */
export function ShimmerPageHeader() {
    return (
        <div className="mb-6 space-y-2">
            <Shimmer className="h-8 w-48" />
            <ShimmerText width="200px" />
        </div>
    );
}

/**
 * Full page shimmer loading
 */
export function ShimmerPage() {
    return (
        <div className="p-6 lg:p-8">
            <ShimmerPageHeader />
            <ShimmerDashboard />
        </div>
    );
}

export default Shimmer;
