import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Newspaper, MessageCircle, Vote, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

// ==========================================
// TYPES
// ==========================================

interface FABAction {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
    color?: string;
}

interface FABProps {
    actions?: FABAction[];
    className?: string;
}

// ==========================================
// DEFAULT ACTIONS (context-aware)
// ==========================================

const defaultActions: FABAction[] = [
    {
        id: "roteiro",
        label: "Novo Roteiro",
        icon: Newspaper,
        path: "/pauta/roteiros/novo",
        color: "bg-primary",
    },
    {
        id: "alerta",
        label: "Novo Alerta",
        icon: Zap,
        path: "/alertas/novo",
        color: "bg-warning",
    },
    {
        id: "enquete",
        label: "Nova Enquete",
        icon: Vote,
        path: "/engajamento/enquetes/nova",
        color: "bg-info",
    },
    {
        id: "destino",
        label: "Novo Destino",
        icon: MessageCircle,
        path: "/alertas/destinos/novo",
        color: "bg-success",
    },
];

// ==========================================
// FAB COMPONENT
// ==========================================

export function FAB({ actions = defaultActions, className }: FABProps) {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Close on route change
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    // Close on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (isOpen) setIsOpen(false);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) setIsOpen(false);
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen]);

    const toggle = useCallback(() => {
        haptics.light();
        setIsOpen((prev) => !prev);
    }, []);

    const handleAction = useCallback(
        (action: FABAction) => {
            haptics.medium();
            setIsOpen(false);
            navigate(action.path);
        },
        [navigate]
    );

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* FAB Container */}
            <div
                className={cn(
                    "fixed right-4 bottom-20 z-50 flex flex-col-reverse items-end gap-3 md:hidden",
                    className
                )}
            >
                {/* Action buttons */}
                <AnimatePresence>
                    {isOpen &&
                        actions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <motion.button
                                    key={action.id}
                                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                        y: 0,
                                        transition: { delay: index * 0.05 },
                                    }}
                                    exit={{
                                        opacity: 0,
                                        scale: 0.5,
                                        y: 20,
                                        transition: { delay: (actions.length - index) * 0.03 },
                                    }}
                                    onClick={() => handleAction(action)}
                                    className="flex items-center gap-3"
                                >
                                    <span className="px-3 py-1.5 bg-card rounded-lg shadow-lg text-sm font-medium border border-border/50">
                                        {action.label}
                                    </span>
                                    <div
                                        className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform",
                                            action.color || "bg-primary",
                                            "text-white"
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </div>
                                </motion.button>
                            );
                        })}
                </AnimatePresence>

                {/* Main FAB button */}
                <motion.button
                    onClick={toggle}
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                        "w-14 h-14 rounded-full shadow-xl flex items-center justify-center",
                        "bg-gradient-to-br from-primary to-primary-dark text-white",
                        "active:shadow-lg transition-shadow",
                        "touch-manipulation"
                    )}
                    style={{
                        WebkitTapHighlightColor: "transparent",
                    }}
                >
                    <Plus className="w-6 h-6" />
                </motion.button>
            </div>
        </>
    );
}

// ==========================================
// CONTEXT-AWARE FAB HOOK
// ==========================================

export function useFABActions(): FABAction[] {
    const location = useLocation();

    // Return context-specific actions based on current route
    if (location.pathname.startsWith("/alertas")) {
        return [
            { id: "alerta", label: "Novo Alerta", icon: Zap, path: "/alertas/novo", color: "bg-warning" },
            { id: "destino", label: "Novo Destino", icon: MessageCircle, path: "/alertas/destinos/novo", color: "bg-success" },
        ];
    }

    if (location.pathname.startsWith("/engajamento")) {
        return [
            { id: "enquete", label: "Nova Enquete", icon: Vote, path: "/engajamento/enquetes/nova", color: "bg-info" },
        ];
    }

    if (location.pathname.startsWith("/pauta") || location.pathname.startsWith("/roteiros")) {
        return [
            { id: "roteiro", label: "Novo Roteiro", icon: Newspaper, path: "/pauta/roteiros/novo", color: "bg-primary" },
        ];
    }

    // Default: show all actions
    return defaultActions;
}

export default FAB;
