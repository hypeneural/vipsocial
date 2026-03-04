import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, Info, CheckCircle } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmVariant = "danger" | "warning" | "info" | "success";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string | ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmVariant;
    onConfirm: () => void | Promise<void>;
    loading?: boolean;
    icon?: ReactNode;
}

const variantStyles: Record<
    ConfirmVariant,
    { icon: ReactNode; buttonClass: string; iconBg: string }
> = {
    danger: {
        icon: <Trash2 className="w-6 h-6 text-destructive" />,
        buttonClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
        iconBg: "bg-destructive/10",
    },
    warning: {
        icon: <AlertTriangle className="w-6 h-6 text-warning" />,
        buttonClass: "bg-warning hover:bg-warning/90 text-warning-foreground",
        iconBg: "bg-warning/10",
    },
    info: {
        icon: <Info className="w-6 h-6 text-info" />,
        buttonClass: "bg-info hover:bg-info/90 text-info-foreground",
        iconBg: "bg-info/10",
    },
    success: {
        icon: <CheckCircle className="w-6 h-6 text-success" />,
        buttonClass: "bg-success hover:bg-success/90 text-success-foreground",
        iconBg: "bg-success/10",
    },
};

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "danger",
    onConfirm,
    loading = false,
    icon,
}: ConfirmDialogProps) {
    const styles = variantStyles[variant];

    const handleConfirm = async () => {
        await onConfirm();
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="rounded-2xl max-w-md">
                <AlertDialogHeader className="gap-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={cn(
                            "w-14 h-14 rounded-full flex items-center justify-center mx-auto",
                            styles.iconBg
                        )}
                    >
                        {icon || styles.icon}
                    </motion.div>
                    <AlertDialogTitle className="text-center text-lg">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                    <AlertDialogCancel asChild>
                        <Button
                            variant="outline"
                            className="rounded-xl w-full sm:w-auto"
                            disabled={loading}
                        >
                            {cancelText}
                        </Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button
                            className={cn("rounded-xl w-full sm:w-auto", styles.buttonClass)}
                            onClick={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Processando...
                                </span>
                            ) : (
                                confirmText
                            )}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// Hook for easier usage
import { useState, useCallback } from "react";

interface UseConfirmDialogOptions {
    title: string;
    description: string | ReactNode;
    variant?: ConfirmVariant;
    confirmText?: string;
    onConfirm: () => void | Promise<void>;
}

export function useConfirmDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<UseConfirmDialogOptions | null>(null);
    const [loading, setLoading] = useState(false);

    const confirm = useCallback((opts: UseConfirmDialogOptions) => {
        setOptions(opts);
        setIsOpen(true);
    }, []);

    const handleConfirm = useCallback(async () => {
        if (!options) return;
        setLoading(true);
        try {
            await options.onConfirm();
        } finally {
            setLoading(false);
            setIsOpen(false);
        }
    }, [options]);

    const dialogProps = {
        open: isOpen,
        onOpenChange: setIsOpen,
        title: options?.title || "",
        description: options?.description || "",
        variant: options?.variant || "danger",
        confirmText: options?.confirmText,
        onConfirm: handleConfirm,
        loading,
    };

    return { confirm, dialogProps, ConfirmDialog };
}

export default ConfirmDialog;
