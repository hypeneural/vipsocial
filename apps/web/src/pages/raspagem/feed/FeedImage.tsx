import { useEffect, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedImageProps {
    src?: string | null;
    alt: string;
    className?: string;
    aspectRatio?: "video" | "square";
    fallbackSize?: "sm" | "md";
}

export function FeedImage({
    src,
    alt,
    className,
    aspectRatio = "video",
    fallbackSize = "md",
}: FeedImageProps) {
    const [loaded, setLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setLoaded(false);
        setHasError(false);
    }, [src]);

    if (!src || hasError) {
        return (
            <div
                className={cn(
                    "flex items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/40",
                    aspectRatio === "video" ? "aspect-video" : "aspect-square",
                    fallbackSize === "sm" ? "p-3" : "p-6",
                    className,
                )}
            >
                <div className="flex flex-col items-center gap-2 text-center">
                    <ImageIcon className={cn("text-muted-foreground", fallbackSize === "sm" ? "h-4 w-4" : "h-6 w-6")} />
                    <span className="text-[11px] leading-tight text-muted-foreground">
                        Imagem indisponivel
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl bg-muted",
                aspectRatio === "video" ? "aspect-video" : "aspect-square",
                className,
            )}
        >
            {!loaded && (
                <div className="absolute inset-0 animate-pulse bg-muted" />
            )}
            <img
                src={src}
                alt={alt}
                className={cn(
                    "h-full w-full object-cover transition-opacity duration-300",
                    loaded ? "opacity-100" : "opacity-0",
                )}
                loading="lazy"
                referrerPolicy="no-referrer"
                onLoad={() => setLoaded(true)}
                onError={() => setHasError(true)}
            />
        </div>
    );
}
