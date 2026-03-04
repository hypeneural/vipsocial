import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    className?: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
}

export function AnimatedCounter({
    value,
    duration = 1,
    className,
    prefix = "",
    suffix = "",
    decimals = 0,
}: AnimatedCounterProps) {
    const spring = useSpring(0, { duration: duration * 1000 });
    const display = useTransform(spring, (current) =>
        `${prefix}${current.toFixed(decimals)}${suffix}`
    );
    const [displayValue, setDisplayValue] = useState(`${prefix}0${suffix}`);

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    useEffect(() => {
        const unsubscribe = display.on("change", (v) => setDisplayValue(v));
        return () => unsubscribe();
    }, [display]);

    return (
        <motion.span
            className={cn("tabular-nums", className)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {displayValue}
        </motion.span>
    );
}
