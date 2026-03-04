import { useState, useEffect } from 'react';
import { formatFullDate } from '@/types/roteiros';

interface RealtimeClockResult {
    time: string;
    date: string;
    fullDate: string;
    rawDate: Date;
}

/**
 * Hook para relógio em tempo real
 * Atualiza a cada segundo com formatação em português
 */
export const useRealtimeClock = (cityName: string = 'Tijucas'): RealtimeClockResult => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const time = now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const fullDate = formatFullDate(now);
    const capitalizedDate = fullDate.charAt(0).toUpperCase() + fullDate.slice(1);

    // Formato: "Tijucas, 20 de janeiro de 2026 (Segunda-Feira)"
    const weekday = now.toLocaleDateString('pt-BR', { weekday: 'long' });
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

    const dateWithoutWeekday = now.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return {
        time,
        date: `${cityName}, ${dateWithoutWeekday} (${capitalizedWeekday})`,
        fullDate: capitalizedDate,
        rawDate: now
    };
};
