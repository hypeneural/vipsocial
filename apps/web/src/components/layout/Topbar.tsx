import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  Vote,
  FileText,
  MessageCircle,
  User,
  LogOut,
  Settings,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifications] = useState(3);

  const handleLogout = async () => {
    await logout();
  };

  const userName = user?.name || "Usuário";
  const userEmail = user?.email || "";
  const userInitials = user?.name ? getInitials(user.name) : "US";

  return (
    <header className="h-16 bg-card/80 backdrop-blur-xl border-b border-border/50 hidden md:flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar notícias, usuários, roteiros..."
            className="pl-10 bg-secondary/50 border-0 focus:bg-secondary focus:ring-2 focus:ring-primary/20 transition-all rounded-xl"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30">
              <Plus className="w-4 h-4 mr-2" />
              Novo
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem onClick={() => navigate("/roteiros/novo")} className="cursor-pointer rounded-lg">
              <FileText className="w-4 h-4 mr-2" />
              Criar Roteiro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/engajamento/enquetes")} className="cursor-pointer rounded-lg">
              <Vote className="w-4 h-4 mr-2" />
              Criar Enquete
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/alertas/novo")} className="cursor-pointer rounded-lg">
              <MessageCircle className="w-4 h-4 mr-2" />
              Enviar Alerta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-xl hover:bg-secondary"
        >
          <Bell className="w-5 h-5 text-muted-foreground" />
          {notifications > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-destructive text-destructive-foreground text-xs font-bold rounded-full"
            >
              {notifications}
            </motion.span>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 rounded-xl hover:bg-secondary"
            >
              <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground text-sm font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
            <DropdownMenuItem onClick={() => navigate("/perfil")} className="cursor-pointer rounded-lg mt-1">
              <User className="w-4 h-4 mr-2" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/perfil/editar")} className="cursor-pointer rounded-lg">
              <Edit className="w-4 h-4 mr-2" />
              Editar Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/perfil/preferencias")} className="cursor-pointer rounded-lg">
              <Settings className="w-4 h-4 mr-2" />
              Preferências
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive rounded-lg">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
