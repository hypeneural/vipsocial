import api from "./api";
import { ApiResponse, PaginatedResponse, ListParams, FilterParams } from "./types";
import { PhotoGallery, GalleryPhoto, GalleryStatus, GalleryMetrics, LinkedWhatsAppGroup } from "@/types/galeria";

// ==========================================
// GALLERY TYPES
// ==========================================
export interface CreateGalleryDTO {
    titulo: string;
    descricao?: string;
    evento_nome?: string;
    evento_data?: string;
    cliente_nome?: string;
    cliente_whatsapp?: string;
    is_public?: boolean;
    senha?: string;
}

export interface UpdateGalleryDTO {
    titulo?: string;
    descricao?: string;
    capa_url?: string;
    evento_nome?: string;
    evento_data?: string;
    cliente_nome?: string;
    cliente_whatsapp?: string;
    is_public?: boolean;
    senha?: string;
    status?: GalleryStatus;
}

export interface GalleryFilters extends FilterParams {
    status?: GalleryStatus;
    is_public?: boolean;
}

// ==========================================
// GALLERY SERVICE
// ==========================================
export const galeriaService = {
    // Gallery CRUD
    getAll: async (params?: ListParams & GalleryFilters): Promise<PaginatedResponse<PhotoGallery>> => {
        const { data } = await api.get<PaginatedResponse<PhotoGallery>>("/galerias", { params });
        return data;
    },

    getById: async (id: number): Promise<ApiResponse<PhotoGallery>> => {
        const { data } = await api.get<ApiResponse<PhotoGallery>>(`/galerias/${id}`);
        return data;
    },

    getBySlug: async (slug: string): Promise<ApiResponse<PhotoGallery>> => {
        const { data } = await api.get<ApiResponse<PhotoGallery>>(`/galerias/slug/${slug}`);
        return data;
    },

    create: async (dto: CreateGalleryDTO): Promise<ApiResponse<PhotoGallery>> => {
        const { data } = await api.post<ApiResponse<PhotoGallery>>("/galerias", dto);
        return data;
    },

    update: async (id: number, dto: UpdateGalleryDTO): Promise<ApiResponse<PhotoGallery>> => {
        const { data } = await api.put<ApiResponse<PhotoGallery>>(`/galerias/${id}`, dto);
        return data;
    },

    delete: async (id: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/galerias/${id}`);
        return data;
    },

    updateStatus: async (id: number, status: GalleryStatus): Promise<ApiResponse<PhotoGallery>> => {
        const { data } = await api.patch<ApiResponse<PhotoGallery>>(`/galerias/${id}/status`, { status });
        return data;
    },

    // Photos
    addPhotos: async (galleryId: number, files: File[]): Promise<ApiResponse<GalleryPhoto[]>> => {
        const formData = new FormData();
        files.forEach((file) => formData.append('fotos', file));
        const { data } = await api.post<ApiResponse<GalleryPhoto[]>>(`/galerias/${galleryId}/fotos`, formData);
        return data;
    },

    removePhoto: async (galleryId: number, photoId: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/galerias/${galleryId}/fotos/${photoId}`);
        return data;
    },

    reorderPhotos: async (galleryId: number, photoIds: number[]): Promise<ApiResponse<void>> => {
        const { data } = await api.patch<ApiResponse<void>>(`/galerias/${galleryId}/fotos/reorder`, { photoIds });
        return data;
    },

    setCover: async (galleryId: number, photoId: number): Promise<ApiResponse<PhotoGallery>> => {
        const { data } = await api.patch<ApiResponse<PhotoGallery>>(`/galerias/${galleryId}/capa`, { photoId });
        return data;
    },

    // WhatsApp Groups
    linkWhatsAppGroup: async (galleryId: number, groupId: number): Promise<ApiResponse<LinkedWhatsAppGroup>> => {
        const { data } = await api.post<ApiResponse<LinkedWhatsAppGroup>>(`/galerias/${galleryId}/whatsapp/${groupId}`);
        return data;
    },

    unlinkWhatsAppGroup: async (galleryId: number, groupId: number): Promise<ApiResponse<void>> => {
        const { data } = await api.delete<ApiResponse<void>>(`/galerias/${galleryId}/whatsapp/${groupId}`);
        return data;
    },

    sendToWhatsApp: async (galleryId: number, groupIds: number[]): Promise<ApiResponse<void>> => {
        const { data } = await api.post<ApiResponse<void>>(`/galerias/${galleryId}/enviar`, { groupIds });
        return data;
    },

    // Metrics
    getMetrics: async (galleryId: number, period?: string): Promise<ApiResponse<GalleryMetrics>> => {
        const { data } = await api.get<ApiResponse<GalleryMetrics>>(`/galerias/${galleryId}/metricas`, {
            params: { period }
        });
        return data;
    },
};

export default galeriaService;
