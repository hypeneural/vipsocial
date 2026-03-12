import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useGalleryDiscovery } from '@/queries/gallery';

function formatEventDate(value?: string | null): string {
  if (!value) {
    return 'Cobertura em andamento';
  }

  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const Index = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useGalleryDiscovery();

  useEffect(() => {
    if (data?.totalActive === 1 && data.autoOpenSlug) {
      navigate(`/${data.autoOpenSlug}`, { replace: true });
    }
  }, [data, navigate]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.16),_transparent_35%),linear-gradient(180deg,_#fffaf5_0%,_#ffffff_100%)]">
      <AppHeader title="Cobertura VIP" subtitle="Escolha a galeria que esta ao vivo agora" />

      <main className="mx-auto max-w-3xl px-4 pb-10 pt-4">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-3xl border bg-card p-3 shadow-sm">
                <div className="flex gap-3">
                  <div className="h-24 w-24 shrink-0 rounded-2xl bg-muted skeleton-shimmer-card" />
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-4 w-2/3 rounded-full bg-muted skeleton-shimmer-card" />
                    <div className="h-3 w-1/2 rounded-full bg-muted skeleton-shimmer-card" />
                    <div className="h-3 w-1/3 rounded-full bg-muted skeleton-shimmer-card" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <ErrorState
            title="Nao foi possivel abrir a Cobertura VIP"
            description="Falha ao consultar a lista publica das galerias ativas."
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && (data?.totalActive || 0) === 0 && (
          <EmptyState
            title="Nenhuma cobertura ativa agora"
            description="Quando houver fotos publicadas em uma galeria ativa, ela aparece aqui automaticamente."
          />
        )}

        {!isLoading && !isError && (data?.totalActive || 0) > 1 && (
          <section className="space-y-4">
            <div className="rounded-3xl border bg-card/90 p-4 shadow-sm">
              <p className="text-sm font-semibold text-foreground">{data?.totalActive} galerias disponiveis</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Toque em uma cobertura para abrir a grade de fotos.
              </p>
            </div>

            <div className="space-y-3">
              {data?.galleries.map((gallery, index) => (
                <motion.button
                  key={gallery.slug}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => navigate(`/${gallery.slug}`)}
                  className="flex w-full items-center gap-3 rounded-3xl border bg-card p-3 text-left shadow-sm transition-transform active:scale-[0.99]"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
                    {gallery.coverImageUrl ? (
                      <img
                        src={gallery.coverImageUrl}
                        alt={gallery.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                      {gallery.totalPhotos} fotos
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-foreground">{gallery.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {gallery.subtitle || 'Cobertura VIP ao vivo'}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>{formatEventDate(gallery.eventDate)}</span>
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;
