import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoVipsocial from "@/assets/logo-vipsocial.png";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email) {
            setError("Informe seu email");
            return;
        }

        setIsLoading(true);

        // TODO: Call API
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setIsLoading(false);
        setIsSuccess(true);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-background to-muted">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Card */}
                <div className="bg-card rounded-3xl shadow-2xl p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <img
                            src={logoVipsocial}
                            alt="VipSocial"
                            className="h-10 mx-auto mb-6"
                        />

                        {isSuccess ? (
                            <>
                                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-success" />
                                </div>
                                <h1 className="text-2xl font-bold text-foreground">Email enviado!</h1>
                                <p className="text-muted-foreground mt-2">
                                    Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                                </p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-2xl font-bold text-foreground">Recuperar senha</h1>
                                <p className="text-muted-foreground mt-2">
                                    Informe seu email para receber as instruções
                                </p>
                            </>
                        )}
                    </div>

                    {isSuccess ? (
                        <div className="space-y-4">
                            <Link to="/auth/login">
                                <Button className="w-full h-12 rounded-xl">
                                    Voltar para o Login
                                </Button>
                            </Link>
                            <p className="text-center text-sm text-muted-foreground">
                                Não recebeu?{" "}
                                <button
                                    onClick={() => setIsSuccess(false)}
                                    className="text-primary hover:underline"
                                >
                                    Tentar novamente
                                </button>
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-sm"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        className="pl-11 h-12 rounded-xl"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl text-base font-medium"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    "Enviar instruções"
                                )}
                            </Button>

                            {/* Back to login */}
                            <Link
                                to="/auth/login"
                                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar para o Login
                            </Link>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
