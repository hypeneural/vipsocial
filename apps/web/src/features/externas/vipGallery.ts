import type {
    VipGalleryGroupOption,
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
export const VIP_NO_LOGO_SENTINEL = "__none__";

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
