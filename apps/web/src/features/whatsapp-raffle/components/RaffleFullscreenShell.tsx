import { MotionConfig } from "framer-motion";
import { RaffleDrawPanel } from "@/features/whatsapp-raffle/components/RaffleDrawPanel";

export function RaffleFullscreenShell() {
    return (
        <MotionConfig reducedMotion="user">
            <main className="min-h-screen overflow-hidden bg-zinc-950 text-white">
                <style>
                    {`
                    @keyframes fall {
                        0% { transform: translate3d(0, -20px, 0) rotate(0deg); opacity: 0; }
                        15% { opacity: 1; }
                        100% { transform: translate3d(40px, 100vh, 0) rotate(260deg); opacity: 0; }
                    }
                    `}
                </style>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ff800033,transparent_38%),linear-gradient(135deg,#18181b_0%,#09090b_50%,#1f2937_100%)]" />
                <div className="relative z-10 flex min-h-screen flex-col">
                    <header className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 pb-3 pt-8 text-center sm:pt-12">
                        <p className="rounded-full border border-[#ff8000]/35 bg-[#ff8000]/10 px-3 py-1 text-xs font-bold uppercase tracking-normal text-[#ffb46b]">
                            Sorteio auditado
                        </p>
                        <h1 className="mt-5 text-4xl font-black tracking-normal text-white sm:text-6xl">
                            Sorteador do Grupo
                        </h1>
                        <p className="mt-3 max-w-2xl text-base text-white/65 sm:text-lg">
                            Clique para sortear um participante do grupo VIP.
                        </p>
                    </header>
                    <section className="flex flex-1 items-center justify-center">
                        <RaffleDrawPanel />
                    </section>
                </div>
            </main>
        </MotionConfig>
    );
}
