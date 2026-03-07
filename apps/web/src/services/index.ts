// ==========================================
// BARREL EXPORT FOR ALL SERVICES
// ==========================================

// API Core
export { default as api, getToken, setToken, clearAuth } from "./api";
export * from "./types";

// Auth
export { default as authService } from "./auth.service";
export type { AuthResponse, RegisterData, PasswordResetRequest, PasswordResetConfirm } from "./auth.service";

// Users
export { default as userService } from "./user.service";
export type { CreateUserDTO, UpdateUserDTO, UserFilters } from "./user.service";

// Alertas
export {
    destinationService,
    alertService,
    alertLogService,
    alertDashboardService
} from "./alerta.service";
export type {
    CreateDestinationDTO,
    UpdateDestinationDTO,
    CreateAlertDTO,
    UpdateAlertDTO,
    DestinationFilters,
    AlertFilters,
    LogFilters
} from "./alerta.service";

// Roteiros
export { roteiroService, gavetaService, categoriaService } from "./roteiro.service";
export type {
    CreateRoteiroDTO,
    UpdateRoteiroDTO,
    CreateMateriaDTO,
    UpdateMateriaDTO,
    ReorderMateriaItemDTO,
    CreateGavetaDTO,
    UpdateGavetaDTO,
    CreateNoticiaGavetaDTO,
    UpdateNoticiaGavetaDTO,
    RoteiroFilters,
    GavetaFilters,
    CategoriaFilters,
    CreateCategoriaDTO,
    UpdateCategoriaDTO,
} from "./roteiro.service";

// Distribuição
export { default as distributionService } from "./distribution.service";
export type {
    DistributionFilters,
    DistributionStats,
    ChannelStatus,
    UpdateMessageDTO,
} from "./distribution.service";

// Enquetes
export { default as enqueteService } from "./enquete.service";
export type {
    Poll,
    PollOption,
    PollStatus,
    CreatePollDTO,
    UpdatePollDTO,
    PollFilters,
    PollStats,
} from "./enquete.service";
