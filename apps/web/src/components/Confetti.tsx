import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiPiece {
    id: number;
    x: number;
    delay: number;
    color: string;
    rotation: number;
    size: number;
}

interface ConfettiProps {
    isActive: boolean;
    duration?: number;
    pieceCount?: number;
    colors?: string[];
}

const defaultColors = [
    "#f97316", // Orange (primary)
    "#22c55e", // Green (success)
    "#3b82f6", // Blue (info)
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#8b5cf6", // Purple
];

/**
 * Confetti celebration animation component
 */
export function Confetti({
    isActive,
    duration = 3000,
    pieceCount = 50,
    colors = defaultColors,
}: ConfettiProps) {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isActive) {
            setShow(true);
            const timer = setTimeout(() => setShow(false), duration);
            return () => clearTimeout(timer);
        }
    }, [isActive, duration]);

    const pieces = useMemo<ConfettiPiece[]>(() => {
        return Array.from({ length: pieceCount }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 0.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            size: Math.random() * 8 + 4,
        }));
    }, [pieceCount, colors]);

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 pointer-events-none z-[1000] overflow-hidden">
                    {pieces.map((piece) => (
                        <motion.div
                            key={piece.id}
                            initial={{
                                y: -20,
                                x: `${piece.x}vw`,
                                rotate: 0,
                                opacity: 1,
                            }}
                            animate={{
                                y: "110vh",
                                rotate: piece.rotation + 720,
                                opacity: [1, 1, 0],
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 2.5 + Math.random(),
                                delay: piece.delay,
                                ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                            style={{
                                position: "absolute",
                                width: piece.size,
                                height: piece.size * 0.6,
                                backgroundColor: piece.color,
                                borderRadius: 2,
                            }}
                        />
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
}

/**
 * Hook to trigger confetti
 */
export function useConfetti() {
    const [isActive, setIsActive] = useState(false);

    const fire = () => {
        setIsActive(true);
        setTimeout(() => setIsActive(false), 100);
    };

    return { isActive, fire };
}

/**
 * Success celebration component with checkmark and confetti
 */
export function SuccessCelebration({
    isActive,
    message = "Sucesso!",
    onComplete,
}: {
    isActive: boolean;
    message?: string;
    onComplete?: () => void;
}) {
    useEffect(() => {
        if (isActive && onComplete) {
            const timer = setTimeout(onComplete, 2500);
            return () => clearTimeout(timer);
        }
    }, [isActive, onComplete]);

    return (
        <>
            <Confetti isActive={isActive} />
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[999] flex items-center justify-center bg-background/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="flex flex-col items-center"
                        >
                            {/* Animated checkmark */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                                className="w-24 h-24 bg-success rounded-full flex items-center justify-center mb-4 shadow-xl shadow-success/30"
                            >
                                <motion.svg
                                    viewBox="0 0 24 24"
                                    className="w-12 h-12 text-success-foreground"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
                                >
                                    <motion.path
                                        d="M5 13l4 4L19 7"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
                                    />
                                </motion.svg>
                            </motion.div>

                            {/* Message */}
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="text-xl font-semibold text-foreground"
                            >
                                {message}
                            </motion.p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default Confetti;
