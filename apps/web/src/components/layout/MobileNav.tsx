import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Newspaper,
  BarChart3,
  Zap,
  Users,
  Menu,
  ChevronRight,
  Bot,
  Settings,
  MapPin,
  Vote,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoVipsocial from "@/assets/logo-vipsocial.png";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  requiredPermission?: string;
  children?: { label: string; path: string; requiredPermission?: string }[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", requiredPermission: "dashboard.view" },
  {
    icon: Newspaper,
    label: "Pauta do Dia",
    path: "/pauta",
    requiredPermission: "roteiros.view",
    children: [
      { label: "Roteiros", path: "/pauta/roteiros" },
    ],
  },
  {
    icon: MapPin,
    label: "Externas",
    path: "/externas",
    requiredPermission: "externas.view",
    children: [
      { label: "Agenda", path: "/externas" },
      { label: "Cobertura VIP", path: "/externas/cobertura-vip" },
      { label: "Novo Evento", path: "/externas/novo" },
    ],
  },
  {
    icon: Sparkles,
    label: "Festa do Divino",
    path: "/festa-divino",
    requiredPermission: "festa-divino.view",
    children: [
      { label: "Painel", path: "/festa-divino" },
      { label: "Edicao", path: "/festa-divino/edicao" },
      { label: "Programacao", path: "/festa-divino/programacao" },
      { label: "Cardapio", path: "/festa-divino/cardapio" },
      { label: "Conteudo", path: "/festa-divino/conteudo" },
      { label: "Midia", path: "/festa-divino/midia" },
      { label: "FAQ", path: "/festa-divino/faq" },
      { label: "Brinquedos", path: "/festa-divino/brinquedos" },
      { label: "Auditoria", path: "/festa-divino/auditoria", requiredPermission: "festa-divino.audit.view" },
      { label: "Health", path: "/festa-divino/health" },
    ],
  },
  {
    icon: BarChart3,
    label: "Engajamento",
    path: "/engajamento",
    requiredPermission: "enquetes.view",
    children: [
      { label: "Enquetes", path: "/engajamento/enquetes" },
    ],
  },
  {
    icon: Zap,
    label: "Alertas WhatsApp",
    path: "/alertas",
    requiredPermission: "alertas.view",
    children: [
      { label: "Dashboard", path: "/alertas" },
      { label: "Destinos", path: "/alertas/destinos" },
      { label: "Alertas", path: "/alertas/lista" },
      { label: "Status", path: "/alertas/status" },
      { label: "Logs", path: "/alertas/logs" },
    ],
  },
  {
    icon: BarChart3,
    label: "Distribuição",
    path: "/distribuicao",
    requiredPermission: "distribuicao.view",
    children: [
      { label: "Central", path: "/distribuicao" },
      { label: "Notícias", path: "/distribuicao/noticias" },
      { label: "Publicações", path: "/distribuicao/publicacoes" },
    ],
  },
  {
    icon: Bot,
    label: "Raspagem",
    path: "/raspagem",
    requiredPermission: "raspagem.view",
    children: [
      { label: "Feed ao Vivo", path: "/raspagem/feed" },
      { label: "Fontes", path: "/raspagem/fontes" },
      { label: "Filtros", path: "/raspagem/filtros" },
      { label: "Prompts I.A.", path: "/raspagem/config/prompts-ia", requiredPermission: "ai_prompts.view" },
    ],
  },
  {
    icon: Users,
    label: "Pessoas",
    path: "/pessoas",
    requiredPermission: "pessoas.view",
    children: [
      { label: "Colaboradores", path: "/pessoas/colaboradores" },
      { label: "Permissões", path: "/pessoas/permissoes" },
      { label: "Aniversários", path: "/pessoas/aniversarios" },
    ],
  },
  {
    icon: Settings,
    label: "Configurações",
    path: "/config",
    requiredPermission: "users.view",
    children: [
      { label: "Equipamentos", path: "/config/equipamentos" },
      { label: "Auditoria", path: "/config/auditoria" },
      { label: "Parâmetros", path: "/config/parametros" },
    ],
  },
];

const bottomNavItems = [
  { icon: LayoutDashboard, label: "Home", path: "/" },
  { icon: MapPin, label: "Externas", path: "/externas" },
  { icon: Vote, label: "Enquetes", path: "/engajamento/enquetes" },
  { icon: Zap, label: "Alertas", path: "/alertas" },
];

export function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";
  const canAccessItem = (item: { requiredPermission?: string }) => {
    if (isAdmin) return true;
    if (!item.requiredPermission) return true;
    return userPermissions.includes(item.requiredPermission);
  };
  const filteredNavItems = navItems.filter((item) => {
    if (!canAccessItem(item)) return false;
    if (!item.children?.length) return true;
    return item.children.some(canAccessItem);
  });

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: NavItem) =>
    item.children?.some((child) => location.pathname.startsWith(child.path)) ||
    location.pathname === item.path;

  return (
    <>
      <header className="safe-top fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between bg-primary px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="touch-btn text-white hover:bg-white/10">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85%] max-w-[320px] border-none bg-primary p-0">
            <div className="flex h-full flex-col">
              <div className="flex h-16 items-center justify-center border-b border-white/10">
                <img src={logoVipsocial} alt="VipSocial" className="h-10 object-contain" />
              </div>

              <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
                {filteredNavItems.map((item) => (
                  <div key={item.path} className="mb-1">
                    {item.children ? (
                      <>
                        <button
                          onClick={() => setExpandedItem(expandedItem === item.path ? null : item.path)}
                          className={cn("sidebar-item w-full", isParentActive(item) && "active")}
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <span className="flex-1 text-left font-medium">{item.label}</span>
                          <motion.div
                            animate={{ rotate: expandedItem === item.path ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </motion.div>
                        </button>
                        <AnimatePresence>
                          {expandedItem === item.path && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-6 mt-1 space-y-1 border-l border-white/20 pl-3">
                                {item.children.filter(canAccessItem).map((child) => (
                                  <Link
                                    key={child.path}
                                    to={child.path}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                      "block rounded-lg px-3 py-2.5 text-sm text-white/70 transition-colors",
                                      isActive(child.path) && "bg-white/20 font-medium text-white"
                                    )}
                                  >
                                    {child.label}
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link
                        to={item.path}
                        onClick={() => setOpen(false)}
                        className={cn("sidebar-item", isActive(item.path) && "active")}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </nav>

              <div className="border-t border-white/10 p-4">
                <p className="text-center text-xs text-white/50">VipSocial Admin v1.0</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <img src={logoVipsocial} alt="VipSocial" className="h-8 object-contain" />

        <Button variant="ghost" size="icon" className="touch-btn text-white hover:bg-white/10">
          <div className="relative">
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary">
              3
            </span>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        </Button>
      </header>

      <nav className="bottom-nav md:hidden">
        {bottomNavItems.map((item) => (
          <Link key={item.path} to={item.path} className={cn("bottom-nav-item", isActive(item.path) && "active")}>
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
