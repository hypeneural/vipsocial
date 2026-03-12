import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  backTo?: string;
}

export function AppHeader({ title, subtitle, backTo }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/50 bg-background/90 backdrop-blur-xl safe-top">
      <div className="mx-auto flex min-h-16 max-w-3xl items-center gap-3 px-4 py-3">
        {backTo ? (
          <Link
            to={backTo}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <img
              src="/images/logo-vipsocial.png"
              alt="VipSocial"
              className="h-6 object-contain"
              loading="eager"
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{title || 'Cobertura VIP'}</p>
          <p className="truncate text-xs text-muted-foreground">
            {subtitle || 'Galeria mobile-first com atualizacao ao vivo'}
          </p>
        </div>
      </div>
    </header>
  );
}
