import type {
    VipGalleryGroupOption,
    VipLogoAnchor,
    VipGalleryStatus,
    VipLogoMode,
} from "@/types/externas";

export const VIP_GALLERY_STATUS_LABELS: Record<VipGalleryStatus, string> = {
    draft: "Rascunho",
    active: "Ativa",
    paused: "Pausada",
    archived: "Arquivada",
};

export const FALLBACK_VIP_GROUPS: VipGalleryGroupOption[] = [
    { value: "120363423950458112-group", label: "Galeria 1" },
    { value: "120363425148164142-group", label: "Galeria 2" },
    { value: "120363408092361361-group", label: "Galeria 3" },
];

export const DEFAULT_VIP_DELETE_KEYWORDS = "Deletar,Apagar,Excluir";
export const DEFAULT_VIP_PAUSE_KEYWORDS = "Parar,Pausar";
export const VIP_NO_LOGO_SENTINEL = "__none__";
export const DEFAULT_VIP_LOGO_ANCHOR: VipLogoAnchor = "bottom_center";
export const DEFAULT_VIP_LOGO_OFFSET_PERCENT = 3;
export const DEFAULT_VIP_LOGO_SAFE_AREA_PERCENT = 2;
export const DEFAULT_VIP_LOGO_SIZE_PERCENT = 12;
export const VIP_LOGO_ANCHOR_PRESETS: Array<{ value: VipLogoAnchor; label: string }> = [
    { value: "top_left", label: "Superior esquerdo" },
    { value: "top_center", label: "Superior centro" },
    { value: "top_right", label: "Superior direito" },
    { value: "center_left", label: "Centro esquerdo" },
    { value: "center", label: "Centro" },
    { value: "center_right", label: "Centro direito" },
    { value: "bottom_left", label: "Inferior esquerdo" },
    { value: "bottom_center", label: "Inferior centro" },
    { value: "bottom_right", label: "Inferior direito" },
];

export function vipGalleryStatusLabel(status?: VipGalleryStatus | null): string {
    return VIP_GALLERY_STATUS_LABELS[status || "draft"];
}

export function deriveVipLogoMode(
    customLogoPath?: string | null,
    noLogoSentinel: string = VIP_NO_LOGO_SENTINEL
): VipLogoMode {
    const normalizedPath = (customLogoPath || "").trim();

    if (normalizedPath === noLogoSentinel) {
        return "none";
    }

    if (normalizedPath !== "") {
        return "custom";
    }

    return "default";
}

export function vipGroupLabel(
    groupId?: string | null,
    groups: VipGalleryGroupOption[] = FALLBACK_VIP_GROUPS
): string {
    if (!groupId) {
        return "Grupo não informado";
    }

    return groups.find((group) => group.value === groupId)?.label || groupId;
}

export function suggestVipGallerySlug(title?: string | null): string {
    const normalized = (title || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    return normalized;
}
