import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Link2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import PollPlacementsManager from "@/components/enquetes/PollPlacementsManager";
import { usePoll } from "@/hooks/useEnquetes";

const EnquetePlacements = () => {
  const { id } = useParams<{ id: string }>();
  const pollId = Number(id);
  const isValidPollId = Number.isInteger(pollId) && pollId > 0;
  const pollQuery = usePoll(isValidPollId ? pollId : undefined);
  const poll = pollQuery.data?.data;

  if (!isValidPollId) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
          Identificador de enquete invalido.
        </div>
      </AppShell>
    );
  }

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

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-primary">
              <Link2 className="h-4 w-4" />
              Placements e embed
            </div>
            <h1 className="text-xl font-bold md:text-2xl">
              {poll ? `Placements de ${poll.title}` : "Placements da enquete"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Cadastre paginas, artigos e URLs canonicas onde o widget sera incorporado.
            </p>
          </div>

          <div className="flex gap-2">
            <Link to={`/engajamento/enquetes/${pollId}/editar`}>
              <Button variant="outline" className="rounded-xl">
                Voltar para edicao
              </Button>
            </Link>
            <Link to={`/engajamento/enquetes/${pollId}/resultados`}>
              <Button className="rounded-xl">Ver resultados</Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {pollQuery.isLoading && !poll ? (
        <div className="rounded-2xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
          Carregando enquete...
        </div>
      ) : pollQuery.isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
          Nao foi possivel carregar a enquete para gerenciar placements.
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <PollPlacementsManager pollId={pollId} />
        </motion.div>
      )}
    </AppShell>
  );
};

export default EnquetePlacements;
