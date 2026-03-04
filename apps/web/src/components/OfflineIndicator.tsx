import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowReconnected(true);
            setTimeout(() => setShowReconnected(false), 3000);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowReconnected(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {/* Offline indicator */}
            {!isOnline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground"
                >
                    <div className="flex items-center justify-center gap-2 py-2 px-4">
                        <WifiOff className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            Você está offline. Verifique sua conexão.
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Reconnected toast */}
            {showReconnected && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-success text-success-foreground"
                >
                    <div className="flex items-center justify-center gap-2 py-2 px-4">
                        <Wifi className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            Conexão restaurada!
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default OfflineIndicator;
