import { toast as sonnerToast } from "sonner";

interface ToastOptions {
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export const toast = {
    success: (message: string, options?: ToastOptions) => {
        sonnerToast.success(message, {
            duration: options?.duration ?? 4000,
            action: options?.action
                ? { label: options.action.label, onClick: options.action.onClick }
                : undefined,
        });
    },

    error: (message: string, options?: ToastOptions) => {
        sonnerToast.error(message, {
            duration: options?.duration ?? 6000,
            action: options?.action
                ? { label: options.action.label, onClick: options.action.onClick }
                : undefined,
        });
    },

    warning: (message: string, options?: ToastOptions) => {
        sonnerToast.warning(message, {
            duration: options?.duration ?? 5000,
            action: options?.action
                ? { label: options.action.label, onClick: options.action.onClick }
                : undefined,
        });
    },

    info: (message: string, options?: ToastOptions) => {
        sonnerToast.info(message, {
            duration: options?.duration ?? 4000,
            action: options?.action
                ? { label: options.action.label, onClick: options.action.onClick }
                : undefined,
        });
    },

    loading: (message: string) => {
        return sonnerToast.loading(message);
    },

    dismiss: (toastId?: string | number) => {
        sonnerToast.dismiss(toastId);
    },

    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string;
            error: string;
        }
    ) => {
        return sonnerToast.promise(promise, {
            loading: messages.loading,
            success: messages.success,
            error: messages.error,
        });
    },
};

// Alias for backward compatibility
export const showToast = toast;

// API Error handler helper
export const handleApiError = (
    error: unknown,
    fallbackMessage = "Ocorreu um erro inesperado"
) => {
    let message = fallbackMessage;

    if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === "string") {
        message = error;
    } else if (error && typeof error === "object" && "message" in error) {
        message = String((error as { message: unknown }).message);
    }

    toast.error(message, {
        action: {
            label: "Tentar novamente",
            onClick: () => window.location.reload(),
        },
    });

    console.error("API Error:", error);
};

export default toast;


