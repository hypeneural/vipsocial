import { Loader2, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BigDrawButtonProps {
    disabled?: boolean;
    loading?: boolean;
    onClick: () => void;
}

export function BigDrawButton({ disabled = false, loading = false, onClick }: BigDrawButtonProps) {
    return (
        <Button
            type="button"
            size="lg"
            disabled={disabled || loading}
            onClick={onClick}
            className="h-24 min-w-[260px] rounded-md bg-[#ff8000] px-10 text-2xl font-black uppercase tracking-normal text-zinc-950 shadow-[0_0_60px_rgba(255,128,0,0.35)] transition hover:bg-[#ff9a2f] focus-visible:ring-[#ffb46b] disabled:opacity-70 sm:h-28 sm:min-w-[340px] sm:text-3xl"
        >
            {loading ? (
                <Loader2 className="mr-3 h-8 w-8 animate-spin" aria-hidden="true" />
            ) : (
                <Shuffle className="mr-3 h-8 w-8" aria-hidden="true" />
            )}
            Sortear
        </Button>
    );
}
