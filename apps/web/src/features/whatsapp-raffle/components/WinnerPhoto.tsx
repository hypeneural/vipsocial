import { UserRound } from "lucide-react";

interface WinnerPhotoProps {
    src: string | null;
}

export function WinnerPhoto({ src }: WinnerPhotoProps) {
    if (!src) {
        return (
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/15 bg-white/10">
                <UserRound className="h-14 w-14 text-white/70" aria-hidden="true" />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt="Foto do participante sorteado"
            className="h-28 w-28 rounded-full border-4 border-[#ff8000] object-cover shadow-[0_0_45px_rgba(255,128,0,0.32)]"
            referrerPolicy="no-referrer"
        />
    );
}
