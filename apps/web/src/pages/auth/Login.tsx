import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import logoVipsocial from "@/assets/logo-vipsocial.png";

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Preencha todos os campos");
            return;
        }

        setIsLoading(true);

        try {
            const success = await login({ email, password });
            if (success) {
                navigate("/");
            } else {
                setError("Email ou senha incorretos");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Erro ao fazer login. Verifique a conexão.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <img
                            src={logoVipsocial}
                            alt="VipSocial"
                            className="h-12 mx-auto mb-4"
                        />
                        <h1 className="text-2xl font-bold text-foreground">Bem-vindo de volta!</h1>
                        <p className="text-muted-foreground">
                            Entre com suas credenciais para acessar o painel
                        </p>
                    </div>

                    {/* Form */}
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

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-11 pr-11 h-12 rounded-xl"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember + Forgot */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    checked={rememberMe}
                                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                                />
                                <span className="text-sm">Lembrar de mim</span>
                            </label>
                            <Link
                                to="/auth/recuperar-senha"
                                className="text-sm text-primary hover:underline"
                            >
                                Esqueceu a senha?
                            </Link>
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
                                    Entrando...
                                </>
                            ) : (
                                "Entrar"
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-sm text-muted-foreground mt-8">
                        Problemas para acessar?{" "}
                        <a href="mailto:suporte@vipsocial.com.br" className="text-primary hover:underline">
                            Contate o suporte
                        </a>
                    </p>
                </motion.div>
            </div>

            {/* Right Panel - Hero */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary-dark items-center justify-center p-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center text-white max-w-lg"
                >
                    <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                        <span className="text-5xl font-bold">V</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">
                        Painel Administrativo
                    </h2>
                    <p className="text-white/80 text-lg">
                        Gerencie notícias, alertas, distribuição e muito mais em um só lugar.
                    </p>

                    {/* Features */}
                    <div className="mt-12 grid grid-cols-2 gap-4 text-left">
                        {[
                            "Roteiros em tempo real",
                            "Alertas WhatsApp",
                            "Distribuição multi-canal",
                            "Enquetes interativas",
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-3"
                            >
                                <div className="w-2 h-2 bg-white rounded-full" />
                                <span className="text-sm">{feature}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
