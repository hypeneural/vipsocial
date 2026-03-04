import { useState, useRef, ReactNode } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Trash2, Edit, Check, X } from "lucide-react";
import haptic from "@/lib/haptics";

// ==========================================
// SWIPE TO DELETE/EDIT
// ==========================================
interface SwipeableRowProps {
    children: ReactNode;
    onDelete?: () => void;
    onEdit?: () => void;
    deleteLabel?: string;
    editLabel?: string;
    height?: number;
    disabled?: boolean;
}

export function SwipeableRow({
    children,
    onDelete,
    onEdit,
    deleteLabel = "Excluir",
    editLabel = "Editar",
    height = 80,
    disabled = false,
}: SwipeableRowProps) {
    const x = useMotionValue(0);
    const [isDragging, setIsDragging] = useState(false);

    const leftOpacity = useTransform(x, [0, 80], [0, 1]);
    const rightOpacity = useTransform(x, [-80, 0], [1, 0]);

    const handleDragEnd = (event: any, info: PanInfo) => {
        setIsDragging(false);

        if (info.offset.x > 100 && onEdit) {
            haptic.medium();
            onEdit();
        } else if (info.offset.x < -100 && onDelete) {
            haptic.heavy();
            onDelete();
        }
    };

    if (disabled) {
        return <>{children}</>;
    }

    return (
        <div className="relative overflow-hidden rounded-xl" style={{ height }}>
            {/* Edit action (swipe right) */}
            {onEdit && (
                <motion.div
                    className="absolute inset-y-0 left-0 w-24 bg-info flex items-center justify-center"
                    style={{ opacity: leftOpacity }}
                >
                    <div className="flex flex-col items-center text-white">
                        <Edit className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">{editLabel}</span>
                    </div>
                </motion.div>
            )}

            {/* Delete action (swipe left) */}
            {onDelete && (
                <motion.div
                    className="absolute inset-y-0 right-0 w-24 bg-destructive flex items-center justify-center"
                    style={{ opacity: rightOpacity }}
                >
                    <div className="flex flex-col items-center text-white">
                        <Trash2 className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">{deleteLabel}</span>
                    </div>
                </motion.div>
            )}

            {/* Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: onDelete ? -120 : 0, right: onEdit ? 120 : 0 }}
                dragElastic={0.1}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className="h-full bg-card cursor-grab active:cursor-grabbing touch-pan-y"
            >
                {children}
            </motion.div>
        </div>
    );
}

// ==========================================
// SWIPE TO CONFIRM
// ==========================================
interface SwipeToConfirmProps {
    onConfirm: () => void;
    label?: string;
    confirmLabel?: string;
    disabled?: boolean;
    variant?: "default" | "danger";
}

export function SwipeToConfirm({
    onConfirm,
    label = "Deslize para confirmar",
    confirmLabel = "Confirmado!",
    disabled = false,
    variant = "default",
}: SwipeToConfirmProps) {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const x = useMotionValue(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const progress = useTransform(x, [0, 240], [0, 1]);
    const backgroundOpacity = useTransform(x, [0, 200], [0.3, 1]);

    const handleDragEnd = (event: any, info: PanInfo) => {
        if (info.point.x > 240 && !disabled) {
            setIsConfirmed(true);
            haptic.success();
            onConfirm();
        }
    };

    const bgColor = variant === "danger" ? "bg-destructive" : "bg-success";
    const thumbColor = variant === "danger" ? "bg-destructive" : "bg-success";

    if (isConfirmed) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`h-14 ${bgColor} rounded-xl flex items-center justify-center text-white font-medium`}
            >
                <Check className="w-5 h-5 mr-2" />
                {confirmLabel}
            </motion.div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="relative h-14 bg-muted/50 rounded-xl overflow-hidden"
        >
            {/* Background fill */}
            <motion.div
                className={`absolute inset-0 ${bgColor}`}
                style={{ opacity: backgroundOpacity }}
            />

            {/* Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-sm text-muted-foreground font-medium">
                    {label}
                </span>
            </div>

            {/* Draggable thumb */}
            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 240 }}
                dragElastic={0}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className={`absolute top-1 left-1 h-12 w-12 ${thumbColor} rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg`}
            >
                <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    <Check className="w-5 h-5 text-white" />
                </motion.div>
            </motion.div>
        </div>
    );
}

// ==========================================
// SWIPE CARDS (Tinder-like)
// ==========================================
interface SwipeCardProps {
    children: ReactNode;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    leftLabel?: string;
    rightLabel?: string;
}

export function SwipeCard({
    children,
    onSwipeLeft,
    onSwipeRight,
    leftLabel = "Não",
    rightLabel = "Sim",
}: SwipeCardProps) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const leftLabelOpacity = useTransform(x, [-100, 0], [1, 0]);
    const rightLabelOpacity = useTransform(x, [0, 100], [0, 1]);

    const handleDragEnd = (event: any, info: PanInfo) => {
        if (info.offset.x > 150 && onSwipeRight) {
            haptic.success();
            onSwipeRight();
        } else if (info.offset.x < -150 && onSwipeLeft) {
            haptic.light();
            onSwipeLeft();
        }
    };

    return (
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            style={{ x, rotate }}
            className="relative cursor-grab active:cursor-grabbing"
        >
            {/* Left label (swipe left = no) */}
            <motion.div
                className="absolute top-4 right-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-bold"
                style={{ opacity: leftLabelOpacity }}
            >
                {leftLabel}
            </motion.div>

            {/* Right label (swipe right = yes) */}
            <motion.div
                className="absolute top-4 left-4 bg-success text-success-foreground px-3 py-1 rounded-full text-sm font-bold"
                style={{ opacity: rightLabelOpacity }}
            >
                {rightLabel}
            </motion.div>

            {children}
        </motion.div>
    );
}

export default SwipeableRow;
