import { useMemo } from "react";
import { motion } from "framer-motion";
import type { SlideRuntimeItem } from "../types";
import { cn } from "@/lib/utils";

export function MediaSurface({
    media,
    fit = "contain",
    className,
    imageClassName,
    reducedEffects = false,
}: {
    media: SlideRuntimeItem;
    fit?: "contain" | "cover";
    className?: string;
    imageClassName?: string;
    reducedEffects?: boolean;
}) {
    const sharedClassName = useMemo(
        () => cn("h-full w-full", fit === "cover" ? "object-cover" : "object-contain", imageClassName),
        [fit, imageClassName]
    );

    if (media.type === "video") {
        return (
            <div className={cn("relative h-full w-full overflow-hidden", className)}>
                <video
                    key={media.id}
                    src={media.url}
                    className={sharedClassName}
                    autoPlay
                    muted
                    playsInline
                    loop
                />
            </div>
        );
    }

    return (
        <div className={cn("relative h-full w-full overflow-hidden", className)}>
            <motion.img
                key={`${media.id}-${media.url}`}
                src={media.url}
                alt={media.sender_name || "Foto da Cobertura VIP"}
                className={cn(sharedClassName, "will-change-[opacity,transform]")}
                initial={reducedEffects ? { opacity: 0.18 } : { opacity: 0.18, scale: 0.992 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reducedEffects ? 0.22 : 0.42, ease: "easeOut" }}
            />
        </div>
    );
}

export default MediaSurface;
