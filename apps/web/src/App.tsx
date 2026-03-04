import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ShimmerPage } from "@/components/Shimmer";

// Critical pages (loaded immediately)
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";

// System Components
import ErrorBoundary from "./components/ErrorBoundary";
import { LoadingProvider } from "./contexts/LoadingContext";
import { AuthProvider } from "./contexts/AuthContext";
import OfflineIndicator from "./components/OfflineIndicator";

// ==========================================
// LAZY LOADED PAGES
// ==========================================

// Raspagem
const RaspagemFeed = lazy(() => import("./pages/raspagem/Feed"));
const RaspagemFontes = lazy(() => import("./pages/raspagem/Fontes"));
const RaspagemFiltros = lazy(() => import("./pages/raspagem/Filtros"));

// Pessoas
const PessoasColaboradores = lazy(() => import("./pages/pessoas/Colaboradores"));
const PessoasAniversarios = lazy(() => import("./pages/pessoas/Aniversarios"));
const PessoasPermissoes = lazy(() => import("./pages/pessoas/Permissoes"));

// Engajamento
const Enquetes = lazy(() => import("./pages/engajamento/Enquetes"));
const EnqueteResultados = lazy(() => import("./pages/engajamento/EnqueteResultados"));
const EnqueteForm = lazy(() => import("./pages/engajamento/EnqueteForm"));
const Relatorios = lazy(() => import("./pages/engajamento/Relatorios"));

// Automacao
const AutomacaoGrupos = lazy(() => import("./pages/automacao/Grupos"));
const AutomacaoTemplates = lazy(() => import("./pages/automacao/Templates"));
const AutomacaoStatusConexao = lazy(() => import("./pages/automacao/StatusConexao"));
const AutomacaoDistribuicao = lazy(() => import("./pages/automacao/Distribuicao"));
const AutomacaoCampanhas = lazy(() => import("./pages/automacao/Campanhas"));
const AutomacaoLogsEnvio = lazy(() => import("./pages/automacao/LogsEnvio"));

// Roteiros
const RoteirosDashboard = lazy(() => import("./pages/roteiros/Dashboard"));
const GavetasCreate = lazy(() => import("./pages/roteiros/GavetasCreate"));
const GavetasManage = lazy(() => import("./pages/roteiros/GavetasManage"));
const GavetaEdit = lazy(() => import("./pages/roteiros/GavetaEdit"));


// Alertas
const AlertasDashboard = lazy(() => import("./pages/alertas/Dashboard"));
const AlertasDestinationsList = lazy(() => import("./pages/alertas/DestinationsList"));
const AlertasDestinationForm = lazy(() => import("./pages/alertas/DestinationForm"));
const AlertasList = lazy(() => import("./pages/alertas/AlertsList"));
const AlertasForm = lazy(() => import("./pages/alertas/AlertForm"));
const AlertasLogs = lazy(() => import("./pages/alertas/Logs"));

// Distribution
const DistributionDashboard = lazy(() => import("./pages/distribution/Dashboard"));
const DistributedNewsList = lazy(() => import("./pages/distribution/NewsList"));
const PublicacaoNoticias = lazy(() => import("./pages/distribuicao/PublicacaoNoticias"));

// Auth
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));

// Profile
const Profile = lazy(() => import("./pages/profile/Profile"));
const ProfileEdit = lazy(() => import("./pages/profile/ProfileEdit"));
const Preferences = lazy(() => import("./pages/profile/Preferences"));

// Users
const UsersList = lazy(() => import("./pages/users/UsersList"));
const UserForm = lazy(() => import("./pages/users/UserForm"));

// Config
const AuditLog = lazy(() => import("./pages/config/AuditLog"));
const Parametros = lazy(() => import("./pages/config/Parametros"));
const Integracoes = lazy(() => import("./pages/config/Integracoes"));
const EquipmentInventory = lazy(() => import("./pages/config/EquipmentInventory"));

// Externas (Agenda de Externas)
const ExternasDashboard = lazy(() => import("./pages/externas/Dashboard"));
const ExternasEventForm = lazy(() => import("./pages/externas/EventForm"));
const ExternasEventDetail = lazy(() => import("./pages/externas/EventDetail"));

// Cobertura VIP (Photo Galleries)
const CoberturaVipDashboard = lazy(() => import("./pages/cobertura-vip/Dashboard"));
const CoberturaVipGalleryForm = lazy(() => import("./pages/cobertura-vip/GalleryForm"));
const CoberturaVipGalleryDetail = lazy(() => import("./pages/cobertura-vip/GalleryDetail"));

// ==========================================
// QUERY CLIENT CONFIG
// ==========================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ==========================================
// APP COMPONENT
// ==========================================
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OfflineIndicator />
          <BrowserRouter>
            <AuthProvider>
              <Suspense fallback={<ShimmerPage />}>
                <Routes>
                  <Route path="/" element={<Index />} />

                  {/* Roteiros Routes */}
                  <Route path="/roteiros" element={<RoteirosDashboard />} />
                  <Route path="/roteiros/gavetas" element={<GavetasManage />} />
                  <Route path="/roteiros/gavetas/criar" element={<GavetasCreate />} />
                  <Route path="/roteiros/gavetas/:id/editar" element={<GavetaEdit />} />

                  {/* Alias Routes for /pauta/* */}
                  <Route path="/pauta/roteiros" element={<RoteirosDashboard />} />

                  {/* Alertas WhatsApp Routes */}
                  <Route path="/alertas" element={<AlertasDashboard />} />
                  <Route path="/alertas/destinos" element={<AlertasDestinationsList />} />
                  <Route path="/alertas/destinos/novo" element={<AlertasDestinationForm />} />
                  <Route path="/alertas/destinos/:id/editar" element={<AlertasDestinationForm />} />
                  <Route path="/alertas/lista" element={<AlertasList />} />
                  <Route path="/alertas/novo" element={<AlertasForm />} />
                  <Route path="/alertas/:id/editar" element={<AlertasForm />} />
                  <Route path="/alertas/logs" element={<AlertasLogs />} />

                  {/* Distribution Routes */}
                  <Route path="/distribuicao" element={<DistributionDashboard />} />
                  <Route path="/distribuicao/noticias" element={<DistributedNewsList />} />
                  <Route path="/distribuicao/publicacoes" element={<PublicacaoNoticias />} />

                  {/* Engajamento Routes */}
                  <Route path="/engajamento/enquetes" element={<Enquetes />} />
                  <Route path="/engajamento/enquetes/nova" element={<EnqueteForm />} />
                  <Route path="/engajamento/enquetes/:id/editar" element={<EnqueteForm />} />
                  <Route path="/engajamento/enquetes/:id/resultados" element={<EnqueteResultados />} />
                  <Route path="/engajamento/relatorios" element={<Relatorios />} />

                  {/* Automacao Routes */}
                  <Route path="/automacao/grupos" element={<AutomacaoGrupos />} />
                  <Route path="/automacao/templates" element={<AutomacaoTemplates />} />
                  <Route path="/automacao/status" element={<AutomacaoStatusConexao />} />
                  <Route path="/automacao/distribuicao" element={<AutomacaoDistribuicao />} />
                  <Route path="/automacao/campanhas" element={<AutomacaoCampanhas />} />
                  <Route path="/automacao/logs" element={<AutomacaoLogsEnvio />} />

                  {/* Raspagem Routes */}
                  <Route path="/raspagem/feed" element={<RaspagemFeed />} />
                  <Route path="/raspagem/fontes" element={<RaspagemFontes />} />
                  <Route path="/raspagem/filtros" element={<RaspagemFiltros />} />

                  {/* Pessoas Routes */}
                  <Route path="/pessoas/colaboradores" element={<PessoasColaboradores />} />
                  <Route path="/pessoas/aniversarios" element={<PessoasAniversarios />} />
                  <Route path="/pessoas/permissoes" element={<PessoasPermissoes />} />

                  {/* Auth Routes */}
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/auth/recuperar-senha" element={<ForgotPassword />} />

                  {/* Profile Routes */}
                  <Route path="/perfil" element={<Profile />} />
                  <Route path="/perfil/editar" element={<ProfileEdit />} />
                  <Route path="/perfil/preferencias" element={<Preferences />} />

                  {/* Users Routes */}
                  <Route path="/usuarios" element={<UsersList />} />
                  <Route path="/usuarios/novo" element={<UserForm />} />
                  <Route path="/usuarios/:id/editar" element={<UserForm />} />

                  {/* Config Routes */}
                  <Route path="/config/auditoria" element={<AuditLog />} />
                  <Route path="/config/parametros" element={<Parametros />} />
                  <Route path="/config/integracoes" element={<Integracoes />} />
                  <Route path="/config/equipamentos" element={<EquipmentInventory />} />

                  {/* Externas Routes */}
                  <Route path="/externas" element={<ExternasDashboard />} />
                  <Route path="/externas/novo" element={<ExternasEventForm />} />
                  <Route path="/externas/:id" element={<ExternasEventDetail />} />
                  <Route path="/externas/:id/editar" element={<ExternasEventForm />} />

                  {/* Cobertura VIP Routes */}
                  <Route path="/cobertura-vip" element={<CoberturaVipDashboard />} />
                  <Route path="/cobertura-vip/novo" element={<CoberturaVipGalleryForm />} />
                  <Route path="/cobertura-vip/:id" element={<CoberturaVipGalleryDetail />} />
                  <Route path="/cobertura-vip/:id/editar" element={<CoberturaVipGalleryForm />} />
                  <Route path="/cobertura-vip/:id/metricas" element={<CoberturaVipGalleryDetail />} />

                  {/* Pauta Routes */}

                  <Route path="/pauta/roteiros" element={<RoteirosDashboard />} />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
