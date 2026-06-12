import { motion } from "framer-motion";
import { generateFakePhoneEndings } from "@/features/whatsapp-raffle/utils/generateFakePhoneEndings";

interface FakePhoneTickerProps {
    active: boolean;
}

const endings = generateFakePhoneEndings(24);

export function FakePhoneTicker({ active }: FakePhoneTickerProps) {
    return (
        <div className="mx-auto mt-5 flex h-16 w-full max-w-md items-center overflow-hidden rounded-md border border-white/10 bg-white/[0.04] px-4">
            <motion.div
                className="flex gap-3 text-2xl font-black tabular-nums text-white/75"
                animate={active ? { x: ["0%", "-55%"] } : { x: 0 }}
                transition={active ? { duration: 0.9, repeat: Infinity, ease: "linear" } : { duration: 0.2 }}
            >
                {[...endings, ...endings].map((ending, index) => (
                    <span key={`${ending}-${index}`} className="min-w-28 rounded-sm bg-white/10 px-3 py-2 text-center">
                        ****{ending}
                    </span>
                ))}
            </motion.div>
        </div>
    );
}
