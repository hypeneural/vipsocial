import {
    Circle,
    Loader,
    CheckCircle2,
    ShieldCheck,
    Radio,
    Clock,
    AlertCircle,
    XCircle,
    Pause,
    Play,
    Eye,
    FileText,
    Send,
    Ban,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Map of icon name strings (stored in DB) → Lucide components
 * This is the single source of truth for all status icons
 */
const ICON_MAP: Record<string, LucideIcon> = {
    circle: Circle,
    loader: Loader,
    "check-circle-2": CheckCircle2,
    "shield-check": ShieldCheck,
    radio: Radio,
    clock: Clock,
    "alert-circle": AlertCircle,
    "x-circle": XCircle,
    pause: Pause,
    play: Play,
    eye: Eye,
    "file-text": FileText,
    send: Send,
    ban: Ban,
};

export type StatusIconName = keyof typeof ICON_MAP;

/** All available icon options for the icon picker */
export const AVAILABLE_ICONS: { name: string; label: string }[] = [
    { name: "circle", label: "Círculo" },
    { name: "loader", label: "Em andamento" },
    { name: "check-circle-2", label: "Check" },
    { name: "shield-check", label: "Aprovado" },
    { name: "radio", label: "No Ar" },
    { name: "clock", label: "Relógio" },
    { name: "alert-circle", label: "Alerta" },
    { name: "x-circle", label: "Cancelado" },
    { name: "pause", label: "Pausado" },
    { name: "play", label: "Play" },
    { name: "eye", label: "Revisão" },
    { name: "file-text", label: "Rascunho" },
    { name: "send", label: "Enviado" },
    { name: "ban", label: "Bloqueado" },
];

interface StatusIconProps {
    name: string;
    className?: string;
    size?: number;
}

/**
 * Renders a Lucide icon by name string.
 * Falls back to Circle if name is not in the registry.
 */
export const StatusIcon = ({ name, className, size = 16 }: StatusIconProps) => {
    const IconComponent = ICON_MAP[name] ?? Circle;
    return <IconComponent className={cn("shrink-0", className)} size={size} />;
};
