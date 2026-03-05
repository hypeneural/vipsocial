import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Newspaper,
  BarChart3,
  Zap,
  Users,
  Menu,
  X,
  ChevronRight,
  Bot,
  Settings,
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
  children?: { label: string; path: string }[];
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
    icon: BarChart3,
    label: "Engajamento",
    path: "/engajamento",
    requiredPermission: "enquetes.view",
    children: [
      { label: "Enquetes", path: "/engajamento/enquetes" },
      { label: "Relatórios", path: "/engajamento/relatorios" },
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
    ],
  },
  {
    icon: Settings,
    label: "Configurações",
    path: "/config",
    requiredPermission: "users.view",
    children: [
      { label: "Integrações", path: "/config/integracoes" },
      { label: "Auditoria", path: "/config/auditoria" },
    ],
  },
];

const bottomNavItems = [
  { icon: LayoutDashboard, label: "Home", path: "/" },
  { icon: Newspaper, label: "Pauta", path: "/pauta/roteiros" },
  { icon: BarChart3, label: "Enquetes", path: "/engajamento/enquetes" },
  { icon: Zap, label: "Alertas", path: "/alertas" },
];

export function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Filter menu items based on user permissions
  const userPermissions = user?.permissions || [];
  const isAdmin = user?.role === "admin";
  const filteredNavItems = navItems.filter((item) => {
    if (isAdmin) return true;
    if (!item.requiredPermission) return true;
    return userPermissions.includes(item.requiredPermission);
  });

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: NavItem) =>
    item.children?.some((child) => location.pathname.startsWith(child.path)) ||
    location.pathname === item.path;

  return (
    <>
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-primary z-50 flex items-center justify-between px-4 safe-top">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 touch-btn"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[85%] max-w-[320px] p-0 bg-primary border-none"
          >
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="h-16 flex items-center justify-center border-b border-white/10">
                <img
                  src={logoVipsocial}
                  alt="VipSocial"
                  className="h-10 object-contain"
                />
              </div>

              {/* Nav Items */}
              <nav className="flex-1 overflow-y-auto py-4 px-3 no-scrollbar">
                {filteredNavItems.map((item) => (
                  <div key={item.path} className="mb-1">
                    {item.children ? (
                      <>
                        <button
                          onClick={() =>
                            setExpandedItem(
                              expandedItem === item.path ? null : item.path
                            )
                          }
                          className={cn(
                            "sidebar-item w-full",
                            isParentActive(item) && "active"
                          )}
                        >
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span className="flex-1 text-left font-medium">
                            {item.label}
                          </span>
                          <motion.div
                            animate={{
                              rotate: expandedItem === item.path ? 90 : 0,
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="w-4 h-4" />
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
                                {item.children.map((child) => (
                                  <Link
                                    key={child.path}
                                    to={child.path}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                      "block py-2.5 px-3 rounded-lg text-sm text-white/70 transition-colors",
                                      isActive(child.path) &&
                                      "bg-white/20 text-white font-medium"
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
                        className={cn(
                          "sidebar-item",
                          isActive(item.path) && "active"
                        )}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </nav>

              {/* Version */}
              <div className="p-4 border-t border-white/10">
                <p className="text-xs text-white/50 text-center">
                  VipSocial Admin v1.0
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <img
          src={logoVipsocial}
          alt="VipSocial"
          className="h-8 object-contain"
        />

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 touch-btn"
        >
          <div className="relative">
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-primary text-[10px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        </Button>
      </header>

      {/* Bottom Navigation */}
      <nav className="bottom-nav md:hidden">
        {bottomNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "bottom-nav-item",
              isActive(item.path) && "active"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
        <button className="bottom-nav-item text-muted-foreground">
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </nav>
    </>
  );
}
