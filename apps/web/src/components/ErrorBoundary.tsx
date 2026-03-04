import React, { Component, ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        window.location.href = "/";
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-background">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md w-full text-center"
                    >
                        {/* Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                            className="w-20 h-20 mx-auto mb-6 bg-destructive/10 rounded-full flex items-center justify-center"
                        >
                            <AlertTriangle className="w-10 h-10 text-destructive" />
                        </motion.div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-foreground mb-2">
                            Ops! Algo deu errado
                        </h1>
                        <p className="text-muted-foreground mb-6">
                            Ocorreu um erro inesperado. Tente recarregar a página ou voltar para o início.
                        </p>

                        {/* Error details (only in dev) */}
                        {process.env.NODE_ENV === "development" && this.state.error && (
                            <div className="mb-6 p-4 bg-muted/30 rounded-xl text-left overflow-auto max-h-40">
                                <p className="text-xs font-mono text-destructive">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 justify-center">
                            <Button
                                variant="outline"
                                onClick={this.handleGoHome}
                                className="rounded-xl"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Ir para Início
                            </Button>
                            <Button
                                onClick={this.handleReload}
                                className="rounded-xl"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Recarregar
                            </Button>
                        </div>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
