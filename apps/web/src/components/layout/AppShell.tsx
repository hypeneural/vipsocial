import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { DesktopSidebar } from "./DesktopSidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { FAB, useFABActions } from "@/components/FAB";
import { PageTransition } from "@/components/PageTransition";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fabActions = useFABActions();
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-secondary/30">
        <MobileNav />
        <main className="pt-14 pb-20 px-4">
          <PageTransition key={location.pathname}>
            {children}
          </PageTransition>
        </main>
        <FAB actions={fabActions} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/50 via-background to-secondary/30">
      <DesktopSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <Topbar />
        <main className="p-6 lg:p-8">
          <PageTransition key={location.pathname}>
            {children}
          </PageTransition>
        </main>
      </motion.div>
    </div>
  );
}
