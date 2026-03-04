// ==========================================
// API RESPONSE TYPES
// ==========================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    meta?: PaginationMeta;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    meta: PaginationMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

/**
 * API Error response
 */
export interface ApiError {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
    code?: string;
}

/**
 * Validation error response
 */
export interface ValidationError {
    field: string;
    message: string;
}

// ==========================================
// QUERY PARAMS
// ==========================================

/**
 * Common list query parameters
 */
export interface ListParams {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: string;
    sort_order?: "asc" | "desc";
}

/**
 * Filter params for different modules
 */
export interface FilterParams {
    status?: string;
    active?: boolean;
    start_date?: string;
    end_date?: string;
    tags?: string[];
}

// ==========================================
// CRUD OPERATIONS
// ==========================================

/**
 * Generic CRUD operations interface
 */
export interface CrudService<T, CreateDTO, UpdateDTO> {
    getAll: (params?: ListParams & FilterParams) => Promise<PaginatedResponse<T>>;
    getById: (id: number | string) => Promise<ApiResponse<T>>;
    create: (data: CreateDTO) => Promise<ApiResponse<T>>;
    update: (id: number | string, data: UpdateDTO) => Promise<ApiResponse<T>>;
    delete: (id: number | string) => Promise<ApiResponse<void>>;
}

// ==========================================
// UTILITY TYPES
// ==========================================

/**
 * Make all properties optional for updates
 */
export type PartialUpdate<T> = Partial<Omit<T, "id" | "created_at" | "updated_at">>;

/**
 * Create DTO - omit auto-generated fields
 */
export type CreateDTO<T> = Omit<T, "id" | "created_at" | "updated_at">;

/**
 * ID type for resources
 */
export type ResourceId = number | string;
