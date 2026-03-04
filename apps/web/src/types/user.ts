// User Management Types

// ==========================================
// ROLES & PERMISSIONS
// ==========================================
export type UserRole = 'admin' | 'editor' | 'journalist' | 'media' | 'analyst' | 'viewer';

export interface Permission {
    id: string;
    name: string;
    description: string;
}

export const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bgColor: string; icon: string }> = {
    admin: {
        label: 'Administrador',
        color: 'text-red-600',
        bgColor: 'bg-red-500/10',
        icon: 'ShieldCheck',
    },
    editor: {
        label: 'Editor',
        color: 'text-blue-600',
        bgColor: 'bg-blue-500/10',
        icon: 'PenSquare',
    },
    journalist: {
        label: 'Jornalista',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-500/10',
        icon: 'Newspaper',
    },
    media: {
        label: 'Mídias',
        color: 'text-amber-600',
        bgColor: 'bg-amber-500/10',
        icon: 'Smartphone',
    },
    analyst: {
        label: 'Analista',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-500/10',
        icon: 'BarChart3',
    },
    viewer: {
        label: 'Visualizador',
        color: 'text-gray-600',
        bgColor: 'bg-gray-500/10',
        icon: 'Eye',
    },
};

// ==========================================
// USER
// ==========================================
export interface User {
    user_id: number;
    name: string;
    email: string;
    avatar_url?: string;
    role: UserRole;
    phone?: string;
    department?: string;
    active: boolean;
    last_login_at?: string;
    created_at: string;
    updated_at: string;
    permissions?: string[];
}

// ==========================================
// PREFERENCES
// ==========================================
export interface UserPreferences {
    user_id: number;
    theme: 'light' | 'dark' | 'system';
    language: 'pt-BR' | 'en-US';
    notifications_email: boolean;
    notifications_push: boolean;
    notifications_whatsapp: boolean;
    sidebar_collapsed: boolean;
    dashboard_widgets: string[];
}

// ==========================================
// AUTH
// ==========================================
export interface LoginCredentials {
    email: string;
    password: string;
    remember_me?: boolean;
}

export interface AuthResponse {
    success: boolean;
    token?: string;
    user?: User;
    error?: string;
}

export interface PasswordResetRequest {
    email: string;
}

export interface PasswordResetConfirm {
    token: string;
    password: string;
    password_confirmation: string;
}

// ==========================================
// HELPERS
// ==========================================

/**
 * Formata nome do usuário para exibição (iniciais)
 */
export const getUserInitials = (name: string): string => {
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
};

/**
 * Formata última atividade
 */
export const formatLastActivity = (dateString?: string): string => {
    if (!dateString) return 'Nunca';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 5) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    return date.toLocaleDateString('pt-BR');
};

/**
 * Cores de avatar baseadas no nome
 */
export const getAvatarColor = (name: string): string => {
    const colors = [
        'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
        'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
};
