import { useState } from "react";
import logoVipsocial from "@/assets/logo-vipsocial.png";
import { Link, useLocation } from "react-router-dom";
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
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  {
    icon: Newspaper,
    label: "Pauta do Dia",
    path: "/roteiros",
    children: [
      { icon: FileText, label: "Roteiros", path: "/roteiros" },
      { icon: FileText, label: "Gavetas", path: "/roteiros/gavetas" },
    ],
  },
  {
    icon: Bell,
    label: "Alertas WhatsApp",
    path: "/alertas",
    children: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/alertas" },
      { icon: MessageCircle, label: "Destinos", path: "/alertas/destinos" },
      { icon: Bell, label: "Alertas", path: "/alertas/lista" },
      { icon: FileSearch, label: "Logs", path: "/alertas/logs" },
    ],
  },
  {
    icon: Workflow,
    label: "Distribuição",
    path: "/distribuicao",
    children: [
      { icon: LayoutDashboard, label: "Central", path: "/distribuicao" },
      { icon: FileText, label: "Notícias", path: "/distribuicao/noticias" },
    ],
  },
  {
    icon: BarChart3,
    label: "Engajamento",
    path: "/engajamento",
    children: [
      { icon: Vote, label: "Enquetes", path: "/engajamento/enquetes" },
      { icon: BarChart3, label: "Relatórios", path: "/engajamento/relatorios" },
    ],
  },
  {
    icon: Zap,
    label: "Automação",
    path: "/automacao",
    children: [
      { icon: MessageCircle, label: "Grupos WhatsApp", path: "/automacao/grupos" },
      { icon: FileText, label: "Templates", path: "/automacao/templates" },
      { icon: Bell, label: "Campanhas", path: "/automacao/campanhas" },
      { icon: Workflow, label: "Distribuição", path: "/automacao/distribuicao" },
      { icon: FileSearch, label: "Logs", path: "/automacao/logs" },
      { icon: Clock, label: "Status Conexão", path: "/automacao/status" },
    ],
  },
  {
    icon: Bot,
    label: "Raspagem",
    path: "/raspagem",
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
    children: [
      { icon: Plug, label: "Integrações", path: "/config/integracoes" },
      { icon: FileSearch, label: "Auditoria", path: "/config/auditoria" },
      { icon: Sliders, label: "Parâmetros", path: "/config/parametros" },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (path: string) => {
    setExpandedItems((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: MenuItem) =>
    item.children?.some((child) => location.pathname.startsWith(child.path));

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-primary transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-white/10">
        {collapsed ? (
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-primary font-bold text-lg">V</span>
          </div>
        ) : (
          <img
            src={logoVipsocial}
            alt="VipSocial"
            className="h-10 object-contain"
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {menuItems.map((item) => (
          <div key={item.path} className="mb-1">
            {item.children ? (
              <>
                <button
                  onClick={() => toggleExpanded(item.path)}
                  className={cn(
                    "sidebar-item w-full",
                    isParentActive(item) && "active"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 transition-transform",
                          expandedItems.includes(item.path) && "rotate-90"
                        )}
                      />
                    </>
                  )}
                </button>
                {!collapsed && expandedItems.includes(item.path) && (
                  <div className="ml-4 mt-1 space-y-1 animate-fade-in">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={cn(
                          "sidebar-item pl-6",
                          isActive(child.path) && "active"
                        )}
                      >
                        <child.icon className="w-4 h-4" />
                        <span className="text-sm">{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                to={item.path}
                className={cn("sidebar-item", isActive(item.path) && "active")}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Collapse Button */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-12 border-t border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>
    </aside>
  );
}
