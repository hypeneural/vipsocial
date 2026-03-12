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
  Camera,
  Cake,
  Plug,
  FileSearch,
  Sliders,
  MapPin,
  Package,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoVipsocial from "@/assets/logo-vipsocial.png";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      { icon: Camera, label: "Cobertura VIP", path: "/externas/cobertura-vip" },
      { icon: FileText, label: "Novo Evento", path: "/externas/novo" },
    ],
  },
  {
    icon: BarChart3,
    label: "Engajamento",
    path: "/engajamento",
    requiredPermission: "enquetes.view",
    children: [
      { icon: Vote, label: "Enquetes", path: "/engajamento/enquetes" },
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
      { icon: Clock, label: "Status", path: "/alertas/status" },
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
    label: "Raspagem",
    path: "/raspagem",
    requiredPermission: "raspagem.view",
    children: [
      { icon: Rss, label: "Feed ao Vivo", path: "/raspagem/feed" },
      { icon: Plug, label: "Fontes", path: "/raspagem/fontes" },
      { icon: Filter, label: "Filtros", path: "/raspagem/filtros" },
      { icon: Sparkles, label: "Prompts I.A.", path: "/raspagem/config/prompts-ia", requiredPermission: "ai_prompts.view" },
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

  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";
  const canAccessItem = (item: MenuItem) => {
    if (isAdmin) return true;
    if (!item.requiredPermission) return true;
    return userPermissions.includes(item.requiredPermission);
  };
  const filteredMenuItems = menuItems.filter((item) => {
    if (!canAccessItem(item)) return false;
    if (!item.children?.length) return true;
    return item.children.some(canAccessItem);
  });

  const toggleExpanded = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((itemPath) => itemPath !== path) : [...prev, path]
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
      className="fixed left-0 top-0 z-40 hidden h-screen flex-col bg-gradient-to-b from-primary to-primary-dark shadow-2xl md:flex"
    >
      <div className="flex h-16 items-center justify-center border-b border-white/10 px-4">
        <AnimatePresence mode="wait">
          {collapsed ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg"
            >
              <span className="text-xl font-bold text-primary">V</span>
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

      <nav className="no-scrollbar flex-1 overflow-y-auto px-2 py-4">
        {filteredMenuItems.map((item) => (
          <div key={item.path} className="mb-1">
            {item.children ? (
              <>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => !collapsed && toggleExpanded(item.path)}
                      className={cn("sidebar-item w-full", isParentActive(item) && "active")}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          <motion.div
                            animate={{ rotate: expandedItems.includes(item.path) ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="h-4 w-4" />
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
                        {item.children.filter(canAccessItem).map((child) => (
                          <PrefetchLink
                            key={child.path}
                            to={child.path}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-all hover:bg-white/10 hover:text-white",
                              isActive(child.path) && "bg-white/20 font-medium text-white"
                            )}
                          >
                            <child.icon className="h-4 w-4" />
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
                  <PrefetchLink to={item.path} className={cn("sidebar-item", isActive(item.path) && "active")}>
                    <item.icon className="h-5 w-5 flex-shrink-0" />
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

      {user && (
        <div className="border-t border-white/10">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => navigate("/perfil")}
                className="flex w-full items-center gap-3 px-3 py-3 text-white/80 transition-all hover:bg-white/10 hover:text-white"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user.avatar_thumb_url ?? user.avatar_url ?? undefined} alt={user.name} className="object-cover" />
                  <AvatarFallback className="bg-white/20 text-xs font-bold text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-[10px] text-white/50">{user.email}</p>
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

      <div className="flex border-t border-white/10">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className="flex h-12 flex-1 items-center justify-center text-white/60 transition-all hover:bg-white/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2 text-xs">Sair</span>}
            </button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right" className="font-medium">
              Sair
            </TooltipContent>
          )}
        </Tooltip>

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={onToggle}
              className="flex h-12 w-12 items-center justify-center border-l border-white/10 text-white/60 transition-all hover:bg-white/10 hover:text-white"
            >
              <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight className="h-4 w-4" />
              </motion.div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {collapsed ? "Expandir" : "Recolher"}
          </TooltipContent>
        </Tooltip>
      </div>
    </motion.aside>
  );
}
