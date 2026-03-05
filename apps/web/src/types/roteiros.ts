// Roteiros module type definitions

export type RoteiroStatus =
    | "rascunho"
    | "em_producao"
    | "revisao"
    | "aprovado"
    | "publicado"
    | "arquivado";

export type MateriaStatus = string;

// Fallback config used when API statuses are not yet loaded
// 'icon' values are Lucide icon names (lowercase-kebab)
export const MATERIA_STATUS_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    pendente: { label: "Pendente", icon: "circle", color: "text-zinc-400" },
    em_producao: { label: "Em produção", icon: "loader", color: "text-yellow-500" },
    pronto: { label: "Pronto", icon: "check-circle-2", color: "text-blue-500" },
    aprovado: { label: "Aprovado", icon: "shield-check", color: "text-violet-500" },
    no_ar: { label: "No ar", icon: "radio", color: "text-green-500" },
};

export const MATERIA_STATUS_ORDER: MateriaStatus[] = [
    "pendente",
    "em_producao",
    "pronto",
    "aprovado",
    "no_ar",
];

export interface StatusMateria {
    id: number;
    nome: string;
    slug: string;
    icone: string;
    cor: string | null;
    ordem: number;
    active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Categoria {
    id: number;
    nome: string;
    slug?: string;
    cor?: string | null;
    active?: boolean;
    materias_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Materia {
    id: number;
    roteiro_id: number;
    shortcut: string | null;
    titulo: string;
    descricao: string | null;
    duracao: string | null;
    status: MateriaStatus;
    creditos_gc: string | null;
    ordem: number;
    categoria?: Pick<Categoria, "id" | "nome" | "cor">;
    created_at: string;
    updated_at: string;
}

export interface Roteiro {
    id: number;
    titulo: string;
    data: string;
    programa: string | null;
    status: RoteiroStatus;
    observacoes: string | null;
    total_materias?: number;
    duracao_total?: string;
    materias?: Materia[];
    created_at: string;
    updated_at: string;
}

export interface NoticiaGaveta {
    id: number;
    titulo: string;
    conteudo: string | null;
    ordem: number;
    is_checked: boolean;
    created_at: string;
    updated_at: string;
}

export interface Gaveta {
    id: number;
    nome: string;
    descricao: string | null;
    active: boolean;
    noticias?: NoticiaGaveta[];
    noticias_count?: number;
    created_at: string;
    updated_at: string;
}

// UI-only shapes consumed by current components
export interface NewsItem {
    id: number;
    date: string;
    shortcut: string;
    title: string;
    description: string;
    duration: string;
    status: MateriaStatus;
    categoria_id?: number;
    categoria?: Categoria;
    creditos_gc?: string;
    priority: number;
    created_at: string;
    updated_at: string;
}

export interface NewsDraft {
    id: number;
    gaveta_id: number;
    gaveta_nome: string;
    title: string;
    author: string;
    is_checked: 0 | 1;
    created_at: string;
}

export interface EditionPickerProps {
    currentDate: string;
    onVisualize: (date: string) => void;
    onEdit: (date: string) => void;
}

export interface EditableCellProps {
    value: string;
    field: "title" | "description" | "shortcut" | "duration" | "priority";
    type: "text" | "richtext" | "time" | "number";
    onSave: (value: string) => Promise<void>;
    className?: string;
}

export interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
}

export const PROGRAM_DURATION_SECONDS = 30 * 60;
export const PROGRAM_DURATION_DISPLAY = "30:00";

export const durationToSeconds = (duration: string): number => {
    const normalized = duration?.trim();

    if (!normalized) return 0;

    if (/^\d{1,2}:\d{2}$/.test(normalized)) {
        const [minutes, seconds] = normalized.split(":").map(Number);
        return (minutes || 0) * 60 + (seconds || 0);
    }

    const [hours, minutes, seconds] = normalized.split(":").map(Number);
    return (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
};

export const secondsToDuration = (totalSeconds: number): string => {
    const sign = totalSeconds < 0 ? "-" : "";
    const absSeconds = Math.abs(totalSeconds);
    const m = Math.floor(absSeconds / 60);
    const s = absSeconds % 60;

    return `${sign}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export const calculateTimeRemaining = (totalDuration: string): {
    display: string;
    seconds: number;
    isOver: boolean;
} => {
    const totalSeconds = durationToSeconds(totalDuration);
    const difference = PROGRAM_DURATION_SECONDS - totalSeconds;

    return {
        display: secondsToDuration(difference),
        seconds: difference,
        isOver: difference < 0,
    };
};

export const formatEdition = (date: string): string => {
    const [year, month, day] = date.split("-");
    return `EDICAO ${day}/${month}/${year.slice(2)}`;
};

export const formatFullDate = (date: Date): string => {
    return date.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "long",
    });
};
