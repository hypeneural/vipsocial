import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, FileText, Vote, MessageCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const actions = [
  { icon: FileText, label: "Criar Roteiro", color: "bg-info" },
  { icon: Vote, label: "Criar Enquete", color: "bg-success" },
  { icon: MessageCircle, label: "Enviar Alerta", color: "bg-warning" },
];

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-50 md:hidden">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Action buttons */}
            <div className="absolute bottom-16 right-0 space-y-3">
              {actions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 bg-card shadow-xl rounded-full pl-4 pr-2 py-2 border border-border"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white", action.color)}>
                    <action.icon className="w-5 h-5" />
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-colors",
          isOpen ? "bg-foreground text-background" : "bg-primary text-primary-foreground"
        )}
        style={{
          boxShadow: isOpen ? "0 8px 30px rgba(0,0,0,0.3)" : "0 8px 30px rgba(255,128,0,0.4)",
        }}
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.div>
      </motion.button>
    </div>
  );
}
