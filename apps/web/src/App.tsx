import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { ShimmerPage } from "@/components/Shimmer";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import ErrorBoundary from "./components/ErrorBoundary";
import { LoadingProvider } from "./contexts/LoadingContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import OfflineIndicator from "./components/OfflineIndicator";

const RaspagemFeed = lazy(() => import("./pages/raspagem/Feed"));
const RaspagemFontes = lazy(() => import("./pages/raspagem/Fontes"));
const RaspagemFiltros = lazy(() => import("./pages/raspagem/Filtros"));
const FeedStreaming = lazy(() => import("./pages/raspagem/streaming/FeedStreaming"));
const RaspagemAiPromptsManager = lazy(() => import("./pages/raspagem/AiPromptsManager"));

const PessoasColaboradores = lazy(() => import("./pages/pessoas/Colaboradores"));
const PessoasAniversarios = lazy(() => import("./pages/pessoas/Aniversarios"));
const PessoasPermissoes = lazy(() => import("./pages/pessoas/Permissoes"));

const Enquetes = lazy(() => import("./pages/engajamento/Enquetes"));
const EnqueteResultados = lazy(() => import("./pages/engajamento/EnqueteResultados"));
const EnqueteForm = lazy(() => import("./pages/engajamento/EnqueteForm"));
const EnqueteSites = lazy(() => import("./pages/engajamento/EnqueteSites"));
const EnquetePlacements = lazy(() => import("./pages/engajamento/EnquetePlacements"));
const EngajamentoSorteador = lazy(() => import("./pages/engajamento/Sorteador"));

const AutomacaoStatusConexao = lazy(() => import("./pages/automacao/StatusConexao"));

const RoteirosDashboard = lazy(() => import("./pages/roteiros/Dashboard"));
const GavetasCreate = lazy(() => import("./pages/roteiros/GavetasCreate"));
const GavetasManage = lazy(() => import("./pages/roteiros/GavetasManage"));
const GavetaEdit = lazy(() => import("./pages/roteiros/GavetaEdit"));

const AlertasDashboard = lazy(() => import("./pages/alertas/Dashboard"));
const AlertasDestinationsList = lazy(() => import("./pages/alertas/DestinationsList"));
const AlertasDestinationForm = lazy(() => import("./pages/alertas/DestinationForm"));
const AlertasList = lazy(() => import("./pages/alertas/AlertsList"));
const AlertasForm = lazy(() => import("./pages/alertas/AlertForm"));
const AlertasLogs = lazy(() => import("./pages/alertas/Logs"));

const DistributionDashboard = lazy(() => import("./pages/distribution/Dashboard"));
const DistributedNewsList = lazy(() => import("./pages/distribution/NewsList"));
const PublicacaoNoticias = lazy(() => import("./pages/distribuicao/PublicacaoNoticias"));

const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));

const Profile = lazy(() => import("./pages/profile/Profile"));
const ProfileEdit = lazy(() => import("./pages/profile/ProfileEdit"));
const Preferences = lazy(() => import("./pages/profile/Preferences"));

const UsersList = lazy(() => import("./pages/users/UsersList"));
const UserForm = lazy(() => import("./pages/users/UserForm"));

const AuditLog = lazy(() => import("./pages/config/AuditLog"));
const Parametros = lazy(() => import("./pages/config/Parametros"));
const EquipmentInventory = lazy(() => import("./pages/config/EquipmentInventory"));

const ExternasDashboard = lazy(() => import("./pages/externas/Dashboard"));
const ExternasEventForm = lazy(() => import("./pages/externas/EventForm"));
const ExternasEventDetail = lazy(() => import("./pages/externas/EventDetail"));
const ExternasVipCoverageDashboard = lazy(() => import("./pages/externas/VipCoverageDashboard"));
const ExternasVipCoverageLogs = lazy(() => import("./pages/externas/VipCoverageLogs"));
const SlideshowPage = lazy(() => import("./pages/public/SlideshowPage"));
const FestaDivinoPage = lazy(() => import("./pages/festa-divino/FestaDivinoPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const LegacyVipEventRedirect = ({ edit = false }: { edit?: boolean }) => {
  const { id } = useParams();
  const target = edit ? `/externas/${id}/editar` : `/externas/${id}`;

  return <Navigate to={target} replace />;
};

const RouteAwareOfflineIndicator = () => {
  const location = useLocation();

  if (location.pathname.startsWith("/slideshow/") || location.pathname === "/engajamento/sorteador") {
    return null;
  }

  return <OfflineIndicator />;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteAwareOfflineIndicator />
            <AuthProvider>
              <Suspense fallback={<ShimmerPage />}>
                <Routes>
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/auth/recuperar-senha" element={<ForgotPassword />} />
                  <Route path="/slideshow/:code" element={<SlideshowPage />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Index />} />

                    <Route path="/roteiros" element={<RoteirosDashboard />} />
                    <Route path="/roteiros/gavetas" element={<GavetasManage />} />
                    <Route path="/roteiros/gavetas/criar" element={<GavetasCreate />} />
                    <Route path="/roteiros/gavetas/:id/editar" element={<GavetaEdit />} />
                    <Route path="/pauta/roteiros" element={<RoteirosDashboard />} />

                    <Route path="/alertas" element={<AlertasDashboard />} />
                    <Route path="/alertas/destinos" element={<AlertasDestinationsList />} />
                    <Route path="/alertas/destinos/novo" element={<AlertasDestinationForm />} />
                    <Route path="/alertas/destinos/:id/editar" element={<AlertasDestinationForm />} />
                    <Route path="/alertas/lista" element={<AlertasList />} />
                    <Route path="/alertas/novo" element={<AlertasForm />} />
                    <Route path="/alertas/:id/editar" element={<AlertasForm />} />
                    <Route path="/alertas/status" element={<AutomacaoStatusConexao />} />
                    <Route path="/alertas/logs" element={<AlertasLogs />} />

                    <Route path="/distribuicao" element={<DistributionDashboard />} />
                    <Route path="/distribuicao/noticias" element={<DistributedNewsList />} />
                    <Route path="/distribuicao/publicacoes" element={<PublicacaoNoticias />} />

                    <Route path="/engajamento/enquetes" element={<Enquetes />} />
                    <Route path="/engajamento/enquetes/nova" element={<EnqueteForm />} />
                    <Route path="/engajamento/enquetes/sites" element={<EnqueteSites />} />
                    <Route path="/engajamento/enquetes/:id/editar" element={<EnqueteForm />} />
                    <Route path="/engajamento/enquetes/:id/placements" element={<EnquetePlacements />} />
                    <Route path="/engajamento/enquetes/:id/resultados" element={<EnqueteResultados />} />
                    <Route path="/engajamento/sorteador" element={<EngajamentoSorteador />} />

                    <Route path="/engajamento/relatorios" element={<Navigate to="/engajamento/enquetes" replace />} />
                    <Route path="/automacao/grupos" element={<Navigate to="/alertas" replace />} />
                    <Route path="/automacao/templates" element={<Navigate to="/alertas" replace />} />
                    <Route path="/automacao/status" element={<Navigate to="/alertas/status" replace />} />
                    <Route path="/automacao/distribuicao" element={<Navigate to="/distribuicao" replace />} />
                    <Route path="/automacao/campanhas" element={<Navigate to="/alertas" replace />} />
                    <Route path="/automacao/logs" element={<Navigate to="/alertas/logs" replace />} />

                    <Route path="/raspagem/feed/streaming" element={<FeedStreaming />} />
                    <Route path="/raspagem/feed" element={<RaspagemFeed />} />
                    <Route path="/raspagem/fontes" element={<RaspagemFontes />} />
                    <Route path="/raspagem/filtros" element={<RaspagemFiltros />} />
                    <Route path="/raspagem/config/prompts-ia" element={<RaspagemAiPromptsManager />} />

                    <Route path="/pessoas/colaboradores" element={<PessoasColaboradores />} />
                    <Route path="/pessoas/aniversarios" element={<PessoasAniversarios />} />
                    <Route path="/pessoas/permissoes" element={<PessoasPermissoes />} />

                    <Route path="/perfil" element={<Profile />} />
                    <Route path="/perfil/editar" element={<ProfileEdit />} />
                    <Route path="/perfil/preferencias" element={<Preferences />} />

                    <Route path="/usuarios" element={<UsersList />} />
                    <Route path="/usuarios/novo" element={<UserForm />} />
                    <Route path="/usuarios/:id/editar" element={<UserForm />} />

                    <Route path="/config/auditoria" element={<AuditLog />} />
                    <Route path="/config/parametros" element={<Parametros />} />
                    <Route path="/config/equipamentos" element={<EquipmentInventory />} />
                    <Route path="/config/integracoes" element={<Navigate to="/config/parametros" replace />} />

                    <Route path="/externas" element={<ExternasDashboard />} />
                    <Route path="/externas/cobertura-vip" element={<ExternasVipCoverageDashboard />} />
                    <Route path="/externas/cobertura-vip/logs" element={<ExternasVipCoverageLogs />} />
                    <Route path="/externas/novo" element={<ExternasEventForm />} />
                    <Route path="/externas/:id" element={<ExternasEventDetail />} />
                    <Route path="/externas/:id/editar" element={<ExternasEventForm />} />

                    <Route path="/festa-divino" element={<FestaDivinoPage section="dashboard" />} />
                    <Route path="/festa-divino/edicao" element={<FestaDivinoPage section="edicao" />} />
                    <Route path="/festa-divino/programacao" element={<FestaDivinoPage section="programacao" />} />
                    <Route path="/festa-divino/cardapio" element={<FestaDivinoPage section="cardapio" />} />
                    <Route path="/festa-divino/conteudo" element={<FestaDivinoPage section="conteudo" />} />
                    <Route path="/festa-divino/midia" element={<FestaDivinoPage section="midia" />} />
                    <Route path="/festa-divino/faq" element={<FestaDivinoPage section="faq" />} />
                    <Route path="/festa-divino/brinquedos" element={<FestaDivinoPage section="brinquedos" />} />
                    <Route path="/festa-divino/auditoria" element={<FestaDivinoPage section="auditoria" />} />
                    <Route path="/festa-divino/health" element={<FestaDivinoPage section="health" />} />

                    <Route path="/cobertura-vip" element={<Navigate to="/externas/cobertura-vip" replace />} />
                    <Route path="/cobertura-vip/novo" element={<Navigate to="/externas/novo" replace />} />
                    <Route path="/cobertura-vip/:id" element={<LegacyVipEventRedirect />} />
                    <Route path="/cobertura-vip/:id/editar" element={<LegacyVipEventRedirect edit />} />
                    <Route path="/cobertura-vip/:id/metricas" element={<LegacyVipEventRedirect />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LoadingProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
