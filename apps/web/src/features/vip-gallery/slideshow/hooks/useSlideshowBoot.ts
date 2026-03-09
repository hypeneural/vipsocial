import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import getSlideshowBoot from "../api/getSlideshowBoot";
import getSlideshowState from "../api/getSlideshowState";
import type { SlideshowBootData } from "../types";

const RESYNC_INTERVAL_MS = 90_000;

interface UseSlideshowBootOptions {
    code: string;
    onSnapshot: (snapshot: SlideshowBootData, kind: "boot" | "state") => void;
    onExpired: (message?: string | null) => void;
    onError: (message: string) => void;
}

export function useSlideshowBoot({
    code,
    onSnapshot,
    onExpired,
    onError,
}: UseSlideshowBootOptions) {
    const [isSyncing, setIsSyncing] = useState(false);

    const sync = useCallback(async (kind: "boot" | "state" = "state") => {
        setIsSyncing(true);

        try {
            const snapshot = kind === "boot"
                ? await getSlideshowBoot(code)
                : await getSlideshowState(code);

            onSnapshot(snapshot, kind);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 410) {
                onExpired("O telao foi encerrado ou esta indisponivel.");
                return;
            }

            onError(kind === "boot"
                ? "Nao foi possivel sincronizar o telao agora."
                : "Nao foi possivel ressicronizar o player.");
        } finally {
            setIsSyncing(false);
        }
    }, [code, onError, onExpired, onSnapshot]);

    useEffect(() => {
        let active = true;

        const guardedSync = async (kind: "boot" | "state") => {
            if (!active) {
                return;
            }

            await sync(kind);
        };

        void guardedSync("boot");
        const interval = window.setInterval(() => {
            void guardedSync("state");
        }, RESYNC_INTERVAL_MS);

        return () => {
            active = false;
            window.clearInterval(interval);
        };
    }, [sync]);

    return {
        isSyncing,
        resync: () => sync("state"),
    };
}

export default useSlideshowBoot;
