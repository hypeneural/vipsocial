// Cobertura VIP - Photo Gallery Management Types

import { LucideIcon } from "lucide-react";

/**
 * Status da galeria
 */
export type GalleryStatus = 'rascunho' | 'ativa' | 'arquivada';

export const GALLERY_STATUS_CONFIG: Record<GalleryStatus, { label: string; color: string; icon: string }> = {
    rascunho: { label: 'Rascunho', color: 'bg-gray-500', icon: 'file-edit' },
    ativa: { label: 'Ativa', color: 'bg-green-500', icon: 'check-circle' },
    arquivada: { label: 'Arquivada', color: 'bg-orange-500', icon: 'archive' },
};

/**
 * Banner da galeria
 */
export interface GalleryBanner {
    id: number;
    url: string;
    ordem: number;
    created_at: string;
}

/**
 * Foto na galeria
 */
export interface GalleryPhoto {
    id: number;
    url: string;
    thumbnail_url?: string;
    titulo?: string;
    descricao?: string;
    ordem: number;
    views: number;
    downloads: number;
    created_at: string;
}

/**
 * Grupo WhatsApp vinculado
 */
export interface LinkedWhatsAppGroup {
    id: number;
    nome: string;
    membros: number;
    link_enviado_em?: string;
}

/**
 * Métricas da galeria
 */
export interface GalleryMetrics {
    total_views: number;
    unique_visitors: number;
    total_downloads: number;
    avg_time_on_gallery: string;
    top_photos: Array<{ photo_id: number; views: number }>;
    views_by_day: Array<{ date: string; views: number }>;
    views_by_source: Array<{ source: string; views: number }>;
}

/**
 * Galeria de fotos
 */
export interface PhotoGallery {
    id: number;
    titulo: string;
    descricao?: string;
    slug: string;

    banners: GalleryBanner[];
    fotos: GalleryPhoto[];
    grupos_whatsapp: LinkedWhatsAppGroup[];

    status: GalleryStatus;

    evento_data?: string;

    metrics?: GalleryMetrics;

    created_at: string;
    updated_at: string;
    published_at?: string;
}

/**
 * Helper: Gera link público da galeria
 */
export const generateGalleryUrl = (slug: string): string => {
    return `https://galeria.vipsocial.com.br/${slug}`;
};

/**
 * Helper: Gera mensagem WhatsApp com link da galeria
 */
export const generateWhatsAppShareMessage = (gallery: PhotoGallery): string => {
    const url = generateGalleryUrl(gallery.slug);
    return encodeURIComponent(
        `${gallery.titulo}\n\n` +
        `${gallery.descricao || 'Confira as fotos!'}\n\n` +
        `Acesse: ${url}`
    );
};
