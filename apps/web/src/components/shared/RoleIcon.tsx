/**
 * Shared Role Icon component.
 *
 * Maps Lucide icon names (stored in DB) to actual Lucide React components.
 * Used across Colaboradores, Permissoes, Profile, etc.
 *
 * Usage:
 *   <RoleIcon name="ShieldCheck" className="w-4 h-4" />
 *   <RoleIcon name={role.icon} className="w-4 h-4 text-primary" />
 */
import {
    ShieldCheck,
    PenSquare,
    Newspaper,
    Smartphone,
    BarChart3,
    Shield,
    Eye,
    UserCheck,
    type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
    ShieldCheck,
    PenSquare,
    Newspaper,
    Smartphone,
    BarChart3,
    Shield,
    Eye,
    UserCheck,
};

interface RoleIconProps {
    name?: string;
    className?: string;
}

export function RoleIcon({ name, className }: RoleIconProps) {
    const Icon = (name && iconMap[name]) || Shield;
    return <Icon className={className} />;
}

/**
 * Get the Lucide component for a role icon name.
 * Useful when you need the component reference rather than JSX.
 */
export function getRoleIconComponent(name?: string): LucideIcon {
    return (name && iconMap[name]) || Shield;
}

export default RoleIcon;
