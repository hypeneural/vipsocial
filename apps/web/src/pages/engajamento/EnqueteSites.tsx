import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Globe } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import PollSitesManager from "@/components/enquetes/PollSitesManager";

const EnqueteSites = () => {
  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Link
          to="/engajamento/enquetes"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Enquetes
        </Link>

        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-primary">
              <Globe className="h-4 w-4" />
              Dominios permitidos
            </div>
            <h1 className="text-xl font-bold md:text-2xl">Sites e parceiros</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie os sites autorizados e os dominios aceitos para embed das enquetes.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <PollSitesManager />
      </motion.div>
    </AppShell>
  );
};

export default EnqueteSites;
