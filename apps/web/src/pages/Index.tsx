import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Eye,
  FileText,
  Instagram,
  Youtube,
  Facebook,
  MessageCircle,
  Calendar,
  ChevronRight,
  CalendarDays,
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

// ==========================================
// KPI CARD COMPONENT
// ==========================================
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  comparison?: string;
  icon: React.ElementType;
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
          {trend.isPositive ? "+" : ""}{trend.value}%
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

// ==========================================
// SOCIAL MEDIA CARD
// ==========================================
interface SocialCardProps {
  platform: string;
  icon: React.ElementType;
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

// ==========================================
// WHATSAPP GROUPS WIDGET
// ==========================================
const whatsappGroups = [
  { name: "TV Jornal Principal", members: 256 },
  { name: "Comercial VIP", members: 189 },
  { name: "Redação Urgente", members: 45 },
  { name: "Parceiros Imprensa", members: 312 },
  { name: "Plantão Notícias", members: 128 },
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
      {whatsappGroups.map((group, i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <span className="text-sm font-medium">{group.name}</span>
          <span className="text-xs text-muted-foreground">{group.members} membros</span>
        </div>
      ))}
    </div>
  </motion.div>
);

// ==========================================
// UPCOMING EVENTS WIDGET
// ==========================================
const upcomingEvents = [
  {
    title: "Cobertura Casamento Silva",
    date: "25/01 14:00",
    category: "Evento Social",
    team: ["Maria Santos", "João Silva"]
  },
  {
    title: "Entrevista Secretário Saúde",
    date: "22/01 09:00",
    category: "Entrevista",
    team: ["Carlos Oliveira"]
  },
  {
    title: "Reportagem Obras BR-101",
    date: "23/01 08:00",
    category: "Reportagem",
    team: ["Carlos Oliveira", "João Silva"]
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
          Próximos Eventos
        </h3>
        <Button variant="ghost" size="sm" onClick={() => navigate("/externas")}>
          Ver todos
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      <div className="space-y-3">
        {upcomingEvents.map((event, i) => (
          <div
            key={i}
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
              <span className="text-xs text-muted-foreground">
                {event.team.join(", ")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ==========================================
// TOP ARTICLES WIDGET
// ==========================================
const topArticlesData: Record<string, Array<{ title: string; views: string; trend: string }>> = {
  "24h": [
    { title: "Prefeito anuncia novo pacote de obras", views: "12.5k", trend: "+45%" },
    { title: "Chuvas causam alagamentos na região", views: "8.3k", trend: "+32%" },
    { title: "Festival de música atrai milhares", views: "6.1k", trend: "+18%" },
    { title: "Novo shopping será inaugurado", views: "4.8k", trend: "+12%" },
  ],
  "7d": [
    { title: "Operação policial prende 15 suspeitos", views: "45.2k", trend: "+120%" },
    { title: "Prefeito anuncia novo pacote de obras", views: "38.1k", trend: "+85%" },
    { title: "Acidente na BR-101 deixa 3 feridos", views: "29.4k", trend: "+67%" },
    { title: "Time local vence campeonato estadual", views: "24.8k", trend: "+54%" },
  ],
  "30d": [
    { title: "Eleições 2026: candidatos confirmados", views: "156.3k", trend: "+340%" },
    { title: "Operação policial prende 15 suspeitos", views: "98.7k", trend: "+180%" },
    { title: "Novo hospital será construído", views: "87.2k", trend: "+145%" },
    { title: "Prefeito anuncia novo pacote de obras", views: "72.1k", trend: "+98%" },
  ],
};

const TopArticlesWidget = () => {
  const [period, setPeriod] = useState("24h");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const articles = topArticlesData[period] || topArticlesData["24h"];
  const periodLabels: Record<string, string> = {
    "24h": "Últimas 24h",
    "7d": "Últimos 7 dias",
    "30d": "Últimos 30 dias",
    "custom": "Período específico",
  };

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
          Matérias Mais Acessadas
        </h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Últimas 24h</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="custom">Período específico</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {period === "custom" && (
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-8 text-xs"
              placeholder="Início"
            />
          </div>
          <div className="flex-1">
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-8 text-xs"
              placeholder="Fim"
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {articles.map((article, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <span className="text-lg font-bold text-muted-foreground w-6">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{article.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Eye className="w-3 h-3" />
                <span>{article.views} views</span>
                <span className="text-green-500">{article.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ==========================================
// MAIN DASHBOARD
// ==========================================
const Dashboard = () => {
  return (
    <AppShell>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Bem-vindo de volta! Aqui está o resumo do dia.
        </p>
      </motion.div>

      {/* Website KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Visitantes Hoje"
          value="15.2k"
          subtitle="Site principal"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          delay={0}
        />
        <KPICard
          title="Pageviews"
          value="45.8k"
          subtitle="Últimas 24h"
          icon={Eye}
          trend={{ value: 8, isPositive: true }}
          delay={0.1}
        />
        <KPICard
          title="Matérias Publicadas"
          value="28"
          subtitle="Hoje"
          comparison="Média mensal: 24/dia"
          icon={FileText}
          trend={{ value: 17, isPositive: true }}
          delay={0.2}
        />
        <KPICard
          title="Tempo Médio"
          value="3:24"
          subtitle="Minutos no site"
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
          delay={0.3}
        />
      </div>

      {/* Social Media KPIs */}
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Upcoming Events - Takes 2 columns */}
        <div className="lg:col-span-2">
          <UpcomingEventsWidget />
        </div>

        {/* Birthdays Widget */}
        <div>
          <BirthdayWidget />
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Articles */}
        <TopArticlesWidget />

        {/* WhatsApp Groups */}
        <WhatsAppGroupsWidget />
      </div>

      {/* Scraping Feed */}
      <div className="mb-20 md:mb-0">
        <ScrapingFeed />
      </div>

      {/* Mobile FAB */}
      <FloatingActionButton />
    </AppShell>
  );
};

export default Dashboard;
