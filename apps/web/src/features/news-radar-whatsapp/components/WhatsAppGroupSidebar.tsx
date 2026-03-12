import { MessageSquareText, RadioTower, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserWhatsAppNewsGroup } from "@/features/news-radar-whatsapp/types";
import {
    formatWhatsAppDateTime,
    truncateText,
} from "@/features/news-radar-whatsapp/utils/formatters";
import { cn } from "@/lib/utils";

interface WhatsAppGroupSidebarProps {
    groups: UserWhatsAppNewsGroup[];
    selectedGroupFk: string | null;
    isLoading: boolean;
    isRefreshing: boolean;
    onRefresh: () => void;
    onSelectGroup: (groupFk: string) => void;
}

export function WhatsAppGroupSidebar({
    groups,
    selectedGroupFk,
    isLoading,
    isRefreshing,
    onRefresh,
    onSelectGroup,
}: WhatsAppGroupSidebarProps) {
    return (
        <Card className="rounded-3xl border-border/60">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <CardTitle className="text-base">Grupos monitorados</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">
                            A timeline principal nasce daqui.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-xl"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {isLoading ? (
                    <>
                        <Skeleton className="h-24 rounded-2xl" />
                        <Skeleton className="h-24 rounded-2xl" />
                        <Skeleton className="h-24 rounded-2xl" />
                    </>
                ) : groups.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                        Nenhum grupo monitorado foi habilitado para a sua timeline ainda.
                    </div>
                ) : (
                    groups.map((item) => {
                        const label =
                            item.label_override ||
                            item.group?.default_label ||
                            item.group?.name ||
                            "Grupo sem nome";

                        return (
                            <button
                                key={item.whatsapp_group_fk}
                                type="button"
                                className={cn(
                                    "w-full rounded-2xl border p-4 text-left transition-all",
                                    item.whatsapp_group_fk === selectedGroupFk
                                        ? "border-success/40 bg-success/10 shadow-sm"
                                        : "border-border/50 bg-card hover:border-success/30 hover:bg-success/5",
                                )}
                                onClick={() => onSelectGroup(item.whatsapp_group_fk)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <RadioTower className="h-4 w-4 text-success" />
                                            <p className="truncate text-sm font-semibold text-foreground">
                                                {label}
                                            </p>
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {formatWhatsAppDateTime(item.stats.latest_event_at)}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "rounded-full",
                                            item.stats.unread_count > 0 &&
                                                "border-success/30 bg-success/10 text-success",
                                        )}
                                    >
                                        {item.stats.unread_count} nova(s)
                                    </Badge>
                                </div>

                                <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                                    {truncateText(
                                        item.stats.latest_event_preview || "Sem preview recente",
                                        110,
                                    )}
                                </p>

                                <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                                    <MessageSquareText className="h-3.5 w-3.5" />
                                    <span>Ordenacao {item.sort_order}</span>
                                </div>
                            </button>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}
