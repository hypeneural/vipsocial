import { motion } from "framer-motion";
import type { RaffleUiState } from "@/features/whatsapp-raffle/types";
import { FakePhoneTicker } from "@/features/whatsapp-raffle/components/FakePhoneTicker";

interface RaffleSpinAnimationProps {
    state: RaffleUiState;
}

export function RaffleSpinAnimation({ state }: RaffleSpinAnimationProps) {
    const active = ["requesting", "preparing", "shuffling", "slowing-down", "revealing-winner"].includes(state);

    return (
        <div className="text-center">
            <motion.div
                className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border border-[#ff8000]/35 bg-[#ff8000]/10 text-5xl font-black text-[#ffb46b] shadow-[0_0_80px_rgba(255,128,0,0.18)]"
                animate={active ? { rotate: 360, scale: [1, 1.04, 1] } : { rotate: 0, scale: 1 }}
                transition={active ? { rotate: { duration: 1.1, repeat: Infinity, ease: "linear" }, scale: { duration: 0.7, repeat: Infinity } } : { duration: 0.2 }}
            >
                VIP
            </motion.div>
            <FakePhoneTicker active={active} />
        </div>
    );
}
