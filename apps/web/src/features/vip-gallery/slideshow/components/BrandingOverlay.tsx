import logoVipsocial from "@/assets/logo-vipsocial.png";
import {
    SLIDESHOW_LOGO_DOCK,
    SLIDESHOW_NEON_PANEL,
    SLIDESHOW_SAFE_BOTTOM,
    SLIDESHOW_SAFE_LEFT,
    SLIDESHOW_SAFE_RIGHT,
    SLIDESHOW_SAFE_TOP,
} from "../design/tokens";

export function BrandingOverlay({
    showNeon,
    neonText,
    partnerLogo,
    showSenderCredit,
    senderCredit,
    syncLabel,
    reducedEffects = false,
}: {
    showNeon: boolean;
    neonText?: string | null;
    partnerLogo?: string | null;
    showSenderCredit?: boolean;
    senderCredit?: string | null;
    syncLabel?: string;
    reducedEffects?: boolean;
}) {
    return (
        <>
            {showNeon && neonText ? (
                <div className={`pointer-events-none absolute z-30 ${SLIDESHOW_SAFE_LEFT} ${SLIDESHOW_SAFE_TOP}`}>
                    <div className={reducedEffects ? "rounded-full border border-white/15 bg-black/45 px-5 py-2 shadow-lg" : SLIDESHOW_NEON_PANEL}>
                        <p className="text-sm uppercase tracking-[0.35em] text-orange-200/80">Ao vivo</p>
                        <p className="mt-1 text-[clamp(1rem,1.5vw,1.5rem)] font-semibold text-white">
                            {neonText}
                        </p>
                    </div>
                </div>
            ) : null}

            {syncLabel ? (
                <div className={`pointer-events-none absolute z-30 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/65 ${reducedEffects ? "" : "backdrop-blur-md"} ${SLIDESHOW_SAFE_RIGHT} ${SLIDESHOW_SAFE_TOP}`}>
                    {syncLabel}
                </div>
            ) : null}

            {partnerLogo ? (
                <div className={`pointer-events-none absolute z-30 flex h-14 w-28 items-center justify-center ${reducedEffects ? "rounded-2xl border border-white/10 bg-black/55 p-3 shadow-lg" : SLIDESHOW_LOGO_DOCK} ${SLIDESHOW_SAFE_BOTTOM} ${SLIDESHOW_SAFE_LEFT}`}>
                    <img src={partnerLogo} alt="Logo do parceiro" className="max-h-full max-w-full object-contain" />
                </div>
            ) : null}

            {showSenderCredit && senderCredit ? (
                <div
                    className={`pointer-events-none absolute z-30 rounded-2xl border border-white/10 bg-black/45 px-4 py-2 text-left ${reducedEffects ? "shadow-lg" : "backdrop-blur-md shadow-[0_16px_50px_rgba(0,0,0,0.22)]"} ${SLIDESHOW_SAFE_LEFT} ${partnerLogo ? "bottom-[calc(max(16px,2vh)+72px)]" : SLIDESHOW_SAFE_BOTTOM}`}
                >
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/55">FOTO POR:</p>
                    <p className="mt-1 text-sm font-medium text-white/88">{senderCredit}</p>
                </div>
            ) : null}

            <div className={`pointer-events-none absolute z-30 flex h-14 w-28 items-center justify-center ${reducedEffects ? "rounded-2xl border border-white/10 bg-black/55 p-3 shadow-lg" : SLIDESHOW_LOGO_DOCK} ${SLIDESHOW_SAFE_BOTTOM} ${SLIDESHOW_SAFE_RIGHT}`}>
                <img src={logoVipsocial} alt="VipSocial" className="max-h-full max-w-full object-contain" />
            </div>
        </>
    );
}

export default BrandingOverlay;
