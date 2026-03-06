import { Suspense, lazy, useMemo, useState, type ElementType } from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Eye,
  MapPin,
  ExternalLink,
  Instagram,
  Youtube,
  Facebook,
  MessageCircle,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BirthdayWidget } from "@/components/dashboard/BirthdayWidget";
import { ScrapingFeed } from "@/components/dashboard/ScrapingFeed";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { cn } from "@/lib/utils";
import {
  useAnalyticsCities,
  useAnalyticsOverview,
  useAnalyticsTopPages,
} from "@/hooks/useAnalytics";
import type {
  AnalyticsCitiesData,
  AnalyticsTopPageItem,
  AnalyticsTopPagesData,
} from "@/services/analytics.service";

const compactFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatCompactNumber = (value?: number) => {
  if (typeof value !== "number") return "--";
  return compactFormatter.format(value);
};

const formatSecondsToClock = (seconds?: number) => {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) return "--:--";
  const rounded = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const formatHourMinute = (iso?: string) => {
  if (!iso) return "--:--";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "--:--";

  return parsed.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

type DashboardPeriod = "24h" | "7d" | "30d" | "custom";

const resolvePeriodQuery = (
  period: DashboardPeriod,
  customStart: string,
  customEnd: string,
) => {
  if (period === "24h") {
    return { date_preset: "today" as const };
  }

  if (period === "7d") {
    return { date_preset: "last_7_days" as const };
  }

  if (period === "30d") {
    return { date_preset: "last_30_days" as const };
  }

  return {
    date_preset: "custom" as const,
    start_date: customStart,
    end_date: customEnd,
  };
};

const normalizeUrl = (value: string): string => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  if (value.startsWith("/")) {
    return value;
  }

  return `https://${value}`;
};

const buildArticleUrl = (article: AnalyticsTopPageItem): string | null => {
  if (article.full_url) {
    return normalizeUrl(article.full_url);
  }

  if (article.host_name && article.path) {
    return normalizeUrl(`${article.host_name}${article.path}`);
  }

  if (article.path && article.path.startsWith("http")) {
    return article.path;
  }

  return null;
};

const TrafficTrendWidget = lazy(() => import("@/components/dashboard/TrafficTrendWidget"));

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  comparison?: string;
  icon: ElementType;
  trend?: { value: number; isPositive: boolean };
  color?: string;
  delay?: number;
}

const KPICard = ({ title, value, subtitle, comparison, icon: Icon, trend, color = "primary", delay = 0 }: KPICardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-card rounded-xl border p-4 hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div className={cn("p-2 rounded-lg", `bg-${color}/10`)}>
        <Icon className={cn("w-5 h-5", `text-${color}`)} />
      </div>
      {trend && (
        <Badge variant={trend.isPositive ? "default" : "destructive"} className="text-xs">
          {trend.isPositive ? "+" : ""}
          {trend.value}%
        </Badge>
      )}
    </div>
    <div className="mt-3">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      {comparison && (
        <p className="text-xs text-muted-foreground mt-1 pt-1 border-t border-dashed">
          {comparison}
        </p>
      )}
    </div>
  </motion.div>
);

interface SocialCardProps {
  platform: string;
  icon: ElementType;
  followers: string;
  change: string;
  color: string;
  delay?: number;
}

const SocialCard = ({ platform, icon: Icon, followers, change, color, delay = 0 }: SocialCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-card rounded-xl border p-4 flex items-center gap-4"
  >
    <div className={cn("p-3 rounded-xl", color)}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="flex-1">
      <p className="text-lg font-bold">{followers}</p>
      <p className="text-sm text-muted-foreground">{platform}</p>
    </div>
    <Badge variant="outline" className="text-green-500">
      {change}
    </Badge>
  </motion.div>
);

const whatsappGroups = [
  { name: "TV Jornal Principal", members: 256 },
  { name: "Comercial VIP", members: 189 },
  { name: "Redacao Urgente", members: 45 },
  { name: "Parceiros Imprensa", members: 312 },
  { name: "Plantao Noticias", members: 128 },
  { name: "Equipe Externa", members: 34 },
];

const WhatsAppGroupsWidget = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className="bg-card rounded-xl border p-4"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-green-500" />
        Grupos WhatsApp
      </h3>
      <Badge variant="outline">{whatsappGroups.length} grupos</Badge>
    </div>
    <div className="space-y-2">
      {whatsappGroups.map((group, index) => (
        <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <span className="text-sm font-medium">{group.name}</span>
          <span className="text-xs text-muted-foreground">{group.members} membros</span>
        </div>
      ))}
    </div>
  </motion.div>
);

const upcomingEvents = [
  {
    title: "Cobertura Casamento Silva",
    date: "25/01 14:00",
    category: "Evento Social",
    team: ["Maria Santos", "Joao Silva"],
  },
  {
    title: "Entrevista Secretario Saude",
    date: "22/01 09:00",
    category: "Entrevista",
    team: ["Carlos Oliveira"],
  },
  {
    title: "Reportagem Obras BR-101",
    date: "23/01 08:00",
    category: "Reportagem",
    team: ["Carlos Oliveira", "Joao Silva"],
  },
];

const UpcomingEventsWidget = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-xl border p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Proximos Eventos
        </h3>
        <Button variant="ghost" size="sm" onClick={() => navigate("/externas")}>
          Ver todos
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      <div className="space-y-3">
        {upcomingEvents.map((event, index) => (
          <div
            key={index}
            className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => navigate("/externas")}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.category}</p>
              </div>
              <Badge variant="outline">{event.date}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{event.team.join(", ")}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

interface TopArticlesWidgetProps {
  initialData?: AnalyticsTopPagesData;
  initialLoading?: boolean;
  analyticsSource?: "ga4" | "cache";
  analyticsStale?: boolean;
}

const TopArticlesWidget = ({ initialData, initialLoading = false, analyticsSource, analyticsStale = false }: TopArticlesWidgetProps) => {
  const [period, setPeriod] = useState<DashboardPeriod>("24h");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const canLoadCustom = customStart !== "" && customEnd !== "";
  const shouldUseInitial = period === "24h" && !!initialData;

  const topPagesParams = useMemo(() => {
    const baseParams = { limit: 10, path_prefix: "/noticia/" };
    if (period === "custom" && !canLoadCustom) {
      return { ...baseParams, date_preset: "last_7_days" as const };
    }

    return {
      ...baseParams,
      ...resolvePeriodQuery(period, customStart, customEnd),
    };
  }, [period, customStart, customEnd, canLoadCustom]);

  const shouldFetchTopPages = (period !== "24h" || !initialData) && (period !== "custom" || canLoadCustom);

  const { data: topPagesResponse, isLoading: topPagesLoading } = useAnalyticsTopPages(
    topPagesParams,
    shouldFetchTopPages,
    { staleTime: 300000 }
  );

  const resolvedTopPages = shouldUseInitial ? initialData : topPagesResponse?.data;
  const articles = resolvedTopPages?.items ?? [];
  const totalViews = resolvedTopPages?.total_views ?? 0;
  const isLoadingArticles = shouldUseInitial ? initialLoading && !initialData : topPagesLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-card rounded-xl border p-4"
    >
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Materias Mais Acessadas
        </h3>
        <Select value={period} onValueChange={(value) => setPeriod(value as DashboardPeriod)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Ultimas 24h</SelectItem>
            <SelectItem value="7d">Ultimos 7 dias</SelectItem>
            <SelectItem value="30d">Ultimos 30 dias</SelectItem>
            <SelectItem value="custom">Periodo especifico</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {period === "custom" && (
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <Input
              type="date"
              value={customStart}
              onChange={(event) => setCustomStart(event.target.value)}
              className="h-8 text-xs"
              placeholder="Inicio"
            />
          </div>
          <div className="flex-1">
            <Input
              type="date"
              value={customEnd}
              onChange={(event) => setCustomEnd(event.target.value)}
              className="h-8 text-xs"
              placeholder="Fim"
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {period === "custom" && !canLoadCustom && (
          <div className="text-sm text-muted-foreground p-2">
            Selecione inicio e fim para carregar o historico.
          </div>
        )}

        {isLoadingArticles && (
          <div className="text-sm text-muted-foreground p-2">
            Carregando materias...
          </div>
        )}

        {!isLoadingArticles && (period !== "custom" || canLoadCustom) && articles.length === 0 && (
          <div className="text-sm text-muted-foreground p-2">
            Nenhuma materia encontrada neste periodo.
          </div>
        )}

        {!isLoadingArticles && articles.map((article) => {
          const articleUrl = buildArticleUrl(article);

          return (
            <a
              key={`${article.rank}-${article.path}`}
              href={articleUrl ?? undefined}
              target={articleUrl ? "_blank" : undefined}
              rel={articleUrl ? "noopener noreferrer" : undefined}
              onClick={(event) => {
                if (!articleUrl) {
                  event.preventDefault();
                }
              }}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-colors",
                articleUrl ? "hover:bg-muted/50 cursor-pointer" : "opacity-80 cursor-default",
              )}
            >
              <span className="text-lg font-bold text-muted-foreground w-6">{article.rank}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{article.title || article.path}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  <span>{formatCompactNumber(article.views)} views</span>
                  <span>{article.percentage_of_total.toFixed(1)}%</span>
                </div>
              </div>
              {articleUrl && (
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
            </a>
          );
        })}

        {!isLoadingArticles && articles.length > 0 && (
          <div className="pt-2 mt-2 border-t text-xs text-muted-foreground">
            Total do periodo: {formatCompactNumber(totalViews)} views
          </div>
        )}

        {period === "24h" && !!initialData && (
          <div className="text-[11px] text-muted-foreground">
            Fonte: {analyticsSource === "cache" ? "Cache" : "GA4"}{analyticsStale ? " (stale)" : ""}
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface TopCitiesWidgetProps {
  initialData?: AnalyticsCitiesData;
  initialLoading?: boolean;
  analyticsSource?: "ga4" | "cache";
  analyticsStale?: boolean;
}

const TopCitiesWidget = ({ initialData, initialLoading = false, analyticsSource, analyticsStale = false }: TopCitiesWidgetProps) => {
  const [period, setPeriod] = useState<DashboardPeriod>("24h");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const canLoadCustom = customStart !== "" && customEnd !== "";
  const shouldUseInitial = period === "24h" && !!initialData;

  const citiesParams = useMemo(() => {
    const baseParams = { limit: 10 };

    if (period === "custom" && !canLoadCustom) {
      return { ...baseParams, date_preset: "last_7_days" as const };
    }

    return {
      ...baseParams,
      ...resolvePeriodQuery(period, customStart, customEnd),
    };
  }, [period, customStart, customEnd, canLoadCustom]);

  const shouldFetchCities = (period !== "24h" || !initialData) && (period !== "custom" || canLoadCustom);

  const { data: citiesResponse, isLoading: citiesLoading } = useAnalyticsCities(
    citiesParams,
    shouldFetchCities,
    { staleTime: 600000 }
  );

  const resolvedCities = shouldUseInitial ? initialData : citiesResponse?.data;
  const cities = resolvedCities?.items ?? [];
  const totalPageviews = resolvedCities?.total_pageviews ?? 0;
  const isLoadingCities = shouldUseInitial ? initialLoading && !initialData : citiesLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="bg-card rounded-xl border p-4"
    >
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Cidades Mais Ativas
        </h3>
        <Select value={period} onValueChange={(value) => setPeriod(value as DashboardPeriod)}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Ultimas 24h</SelectItem>
            <SelectItem value="7d">Ultimos 7 dias</SelectItem>
            <SelectItem value="30d">Ultimos 30 dias</SelectItem>
            <SelectItem value="custom">Periodo especifico</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {period === "custom" && (
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <Input
              type="date"
              value={customStart}
              onChange={(event) => setCustomStart(event.target.value)}
              className="h-8 text-xs"
              placeholder="Inicio"
            />
          </div>
          <div className="flex-1">
            <Input
              type="date"
              value={customEnd}
              onChange={(event) => setCustomEnd(event.target.value)}
              className="h-8 text-xs"
              placeholder="Fim"
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {period === "custom" && !canLoadCustom && (
          <div className="text-sm text-muted-foreground p-2">
            Selecione inicio e fim para carregar o historico.
          </div>
        )}

        {isLoadingCities && (
          <div className="text-sm text-muted-foreground p-2">
            Carregando cidades...
          </div>
        )}

        {!isLoadingCities && (period !== "custom" || canLoadCustom) && cities.length === 0 && (
          <div className="text-sm text-muted-foreground p-2">
            Nenhuma cidade encontrada neste periodo.
          </div>
        )}

        {!isLoadingCities && cities.map((cityItem) => (
          <div key={`${cityItem.rank}-${cityItem.city}`} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-muted-foreground w-6">{cityItem.rank}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{cityItem.city}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span>{formatCompactNumber(cityItem.pageviews)} views</span>
                  <span>{formatCompactNumber(cityItem.users)} usuarios</span>
                  <span>{cityItem.share_pageviews_pct.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-primary/80 rounded-full"
                style={{ width: `${Math.min(cityItem.share_pageviews_pct, 100)}%` }}
              />
            </div>
          </div>
        ))}

        {!isLoadingCities && cities.length > 0 && (
          <div className="pt-2 mt-2 border-t text-xs text-muted-foreground">
            Total do periodo: {formatCompactNumber(totalPageviews)} views
          </div>
        )}

        {period === "24h" && !!initialData && (
          <div className="text-[11px] text-muted-foreground">
            Fonte: {analyticsSource === "cache" ? "Cache" : "GA4"}{analyticsStale ? " (stale)" : ""}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const overviewParams = useMemo(
    () => ({
      date_preset: "today" as const,
      compare: "previous_period" as const,
      include: "kpis,realtime,top_pages,cities",
      limit: 10,
      path_prefix: "/noticia/",
    }),
    []
  );

  const { data: overviewResponse, isLoading: overviewLoading } = useAnalyticsOverview(
    overviewParams,
    true,
    { staleTime: 20000, refetchInterval: 30000 }
  );

  const totals = overviewResponse?.data?.kpis?.totals;
  const comparison = overviewResponse?.data?.kpis?.comparison;
  const realtimeUsers = overviewResponse?.data?.realtime?.active_users_30m;
  const initialTopPages = overviewResponse?.data?.top_pages;
  const initialCities = overviewResponse?.data?.cities;
  const overviewMeta = overviewResponse?.meta;

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Bem-vindo de volta! Aqui esta o resumo do dia.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {overviewMeta?.source && (
            <Badge variant="outline">
              Fonte: {overviewMeta.source === "cache" ? "Cache" : "GA4"}
            </Badge>
          )}
          {overviewMeta?.stale && (
            <Badge variant="destructive">
              Dados em contingencia
            </Badge>
          )}
          {overviewMeta?.generated_at && (
            <span>Atualizado as {formatHourMinute(overviewMeta.generated_at)}</span>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Visitantes Hoje"
          value={overviewLoading ? "..." : formatCompactNumber(totals?.users)}
          subtitle="Site principal"
          icon={Users}
          trend={comparison ? { value: Math.abs(comparison.users_pct), isPositive: comparison.users_pct >= 0 } : undefined}
          delay={0}
        />
        <KPICard
          title="Pageviews"
          value={overviewLoading ? "..." : formatCompactNumber(totals?.pageviews)}
          subtitle="Hoje"
          icon={Eye}
          trend={comparison ? { value: Math.abs(comparison.pageviews_pct), isPositive: comparison.pageviews_pct >= 0 } : undefined}
          delay={0.1}
        />
        <KPICard
          title="Ativos Agora"
          value={overviewLoading ? "..." : formatCompactNumber(realtimeUsers)}
          subtitle="Ultimos 30 min"
          icon={Users}
          delay={0.2}
        />
        <KPICard
          title="Tempo Medio"
          value={overviewLoading ? "..." : formatSecondsToClock(totals?.avg_engagement_time_sec)}
          subtitle={`Engajamento: ${totals?.engagement_rate?.toFixed(1) ?? "--"}%`}
          icon={TrendingUp}
          delay={0.3}
        />
      </div>

      <Suspense
        fallback={(
          <div className="bg-card rounded-xl border p-4 mb-6 h-[420px] flex items-center justify-center text-sm text-muted-foreground">
            Carregando grafico...
          </div>
        )}
      >
        <TrafficTrendWidget />
      </Suspense>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <h2 className="text-lg font-semibold mb-4">Redes Sociais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SocialCard
            platform="Instagram"
            icon={Instagram}
            followers="125.8k"
            change="+2.3%"
            color="bg-gradient-to-br from-purple-500 to-pink-500"
            delay={0.25}
          />
          <SocialCard
            platform="YouTube"
            icon={Youtube}
            followers="89.4k"
            change="+1.8%"
            color="bg-red-500"
            delay={0.3}
          />
          <SocialCard
            platform="Facebook"
            icon={Facebook}
            followers="234.1k"
            change="+0.9%"
            color="bg-blue-600"
            delay={0.35}
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <UpcomingEventsWidget />
        </div>
        <div>
          <BirthdayWidget />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TopArticlesWidget
          initialData={initialTopPages}
          initialLoading={overviewLoading}
          analyticsSource={overviewMeta?.source}
          analyticsStale={overviewMeta?.stale}
        />
        <TopCitiesWidget
          initialData={initialCities}
          initialLoading={overviewLoading}
          analyticsSource={overviewMeta?.source}
          analyticsStale={overviewMeta?.stale}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20 md:mb-0">
        <div className="lg:col-span-2">
          <ScrapingFeed />
        </div>
        <div>
          <WhatsAppGroupsWidget />
        </div>
      </div>

      <FloatingActionButton />
    </AppShell>
  );
};

export default Dashboard;
