import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PrefetchLink } from "@/components/PrefetchLink";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Newspaper,
  BarChart3,
  MessageCircle,
  Zap,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Vote,
  Workflow,
  FileText,
  Clock,
  Bot,
  Rss,
  Filter,
  UserCheck,
  Shield,
  Cake,
  Plug,
  FileSearch,
  Sliders,
  MapPin,
  Package,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoVipsocial from "@/assets/logo-vipsocial.png";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  children?: MenuItem[];
  requiredPermission?: string;
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", requiredPermission: "dashboard.view" },
  {
    icon: Newspaper,
    label: "Pauta do Dia",
    path: "/pauta",
    requiredPermission: "roteiros.view",
    children: [
      { icon: FileText, label: "Roteiros", path: "/pauta/roteiros" },
    ],
  },
  {
    icon: MapPin,
    label: "Externas",
    path: "/externas",
    requiredPermission: "externas.view",
    children: [
      { icon: Calendar, label: "Agenda", path: "/externas" },
      { icon: FileText, label: "Novo Evento", path: "/externas/novo" },
    ],
  },
  {
    icon: FileText,
    label: "Cobertura VIP",
    path: "/cobertura-vip",
    requiredPermission: "galerias.view",
    children: [
      { icon: LayoutDashboard, label: "Galerias", path: "/cobertura-vip" },
      { icon: FileText, label: "Nova Galeria", path: "/cobertura-vip/novo" },
    ],
  },
  {
    icon: BarChart3,
    label: "Engajamento",
    path: "/engajamento",
    requiredPermission: "enquetes.view",
    children: [
      { icon: Vote, label: "Enquetes", path: "/engajamento/enquetes" },
      { icon: BarChart3, label: "Relatórios", path: "/engajamento/relatorios" },
    ],
  },
  {
    icon: Zap,
    label: "Alertas WhatsApp",
    path: "/alertas",
    requiredPermission: "alertas.view",
    children: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/alertas" },
      { icon: MessageCircle, label: "Destinos", path: "/alertas/destinos" },
      { icon: FileText, label: "Alertas", path: "/alertas/lista" },
      { icon: FileSearch, label: "Logs", path: "/alertas/logs" },
    ],
  },
  {
    icon: Workflow,
    label: "Distribuição",
    path: "/distribuicao",
    requiredPermission: "distribuicao.view",
    children: [
      { icon: LayoutDashboard, label: "Central", path: "/distribuicao" },
      { icon: FileText, label: "Notícias", path: "/distribuicao/noticias" },
      { icon: Newspaper, label: "Publicações", path: "/distribuicao/publicacoes" },
    ],
  },
  {
    icon: Bot,
    label: "Automação",
    path: "/automacao",
    requiredPermission: "publicacoes.view",
    children: [
      { icon: MessageCircle, label: "Grupos WhatsApp", path: "/automacao/grupos" },
      { icon: FileText, label: "Templates", path: "/automacao/templates" },
      { icon: Clock, label: "Campanhas", path: "/automacao/campanhas" },
      { icon: FileSearch, label: "Logs", path: "/automacao/logs" },
      { icon: Clock, label: "Status Conexão", path: "/automacao/status" },
    ],
  },
  {
    icon: Bot,
    label: "Raspagem",
    path: "/raspagem",
    requiredPermission: "raspagem.view",
    children: [
      { icon: Rss, label: "Feed ao Vivo", path: "/raspagem/feed" },
      { icon: Plug, label: "Fontes", path: "/raspagem/fontes" },
      { icon: Filter, label: "Filtros", path: "/raspagem/filtros" },
    ],
  },
  {
    icon: Users,
    label: "Pessoas",
    path: "/pessoas",
    requiredPermission: "pessoas.view",
    children: [
      { icon: UserCheck, label: "Colaboradores", path: "/pessoas/colaboradores" },
      { icon: Shield, label: "Permissões", path: "/pessoas/permissoes" },
      { icon: Cake, label: "Aniversários", path: "/pessoas/aniversarios" },
    ],
  },
  {
    icon: Settings,
    label: "Configurações",
    path: "/config",
    requiredPermission: "users.view",
    children: [
      { icon: Package, label: "Equipamentos", path: "/config/equipamentos" },
      { icon: Plug, label: "Integrações", path: "/config/integracoes" },
      { icon: FileSearch, label: "Auditoria", path: "/config/auditoria" },
      { icon: Sliders, label: "Parâmetros", path: "/config/parametros" },
    ],
  },
];

interface DesktopSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function DesktopSidebar({ collapsed, onToggle }: DesktopSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Filter menu items based on user permissions
  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";
  const filteredMenuItems = menuItems.filter((item) => {
    if (isAdmin) return true; // Admin sees everything
    if (!item.requiredPermission) return true; // No permission required (Dashboard)
    return userPermissions.includes(item.requiredPermission);
  });

  const toggleExpanded = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: MenuItem) =>
    item.children?.some((child) => location.pathname.startsWith(child.path));

  const handleLogout = async () => {
    await logout();
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-primary to-primary-dark hidden md:flex flex-col shadow-2xl"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-white/10 px-4">
        <AnimatePresence mode="wait">
          {collapsed ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg"
            >
              <span className="text-primary font-bold text-xl">V</span>
            </motion.div>
          ) : (
            <motion.img
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={logoVipsocial}
              alt="VipSocial"
              className="h-10 object-contain"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 no-scrollbar">
        {filteredMenuItems.map((item) => (
          <div key={item.path} className="mb-1">
            {item.children ? (
              <>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => !collapsed && toggleExpanded(item.path)}
                      className={cn(
                        "sidebar-item w-full",
                        isParentActive(item) && "active"
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          <motion.div
                            animate={{
                              rotate: expandedItems.includes(item.path) ? 90 : 0,
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </motion.div>
                        </>
                      )}
                    </button>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
                <AnimatePresence>
                  {!collapsed && expandedItems.includes(item.path) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 mt-1 space-y-1 border-l border-white/20 pl-3">
                        {item.children.map((child) => (
                          <PrefetchLink
                            key={child.path}
                            to={child.path}
                            className={cn(
                              "flex items-center gap-2 py-2 px-3 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all",
                              isActive(child.path) &&
                              "bg-white/20 text-white font-medium"
                            )}
                          >
                            <child.icon className="w-4 h-4" />
                            <span>{child.label}</span>
                          </PrefetchLink>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <PrefetchLink
                    to={item.path}
                    className={cn(
                      "sidebar-item",
                      isActive(item.path) && "active"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </PrefetchLink>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </div>
        ))}
      </nav>

      {/* User Section */}
      {user && (
        <div className="border-t border-white/10">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate("/perfil")}
                className="flex items-center gap-3 w-full px-3 py-3 text-white/80 hover:text-white hover:bg-white/10 transition-all"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-white/20 text-white text-xs font-bold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-[10px] text-white/50 truncate">{user.email}</p>
                  </div>
                )}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="font-medium">
                {user.name}
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      )}

      {/* Bottom: Logout + Collapse */}
      <div className="flex border-t border-white/10">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center h-12 flex-1 text-white/60 hover:text-red-300 hover:bg-white/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span className="text-xs ml-2">Sair</span>}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="font-medium">Sair</TooltipContent>
          )}
        </Tooltip>
        <button
          onClick={onToggle}
          className="flex items-center justify-center h-12 flex-1 border-l border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all touch-btn"
        >
          <motion.div
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.div>
        </button>
      </div>
    </motion.aside>
  );
}
