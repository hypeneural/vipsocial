import { Copy, MoveDown, MoveUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DAY_NAMES_FULL } from "@/types/alertas";

export interface AlertScheduleRuleDraft {
    client_id: string;
    schedule_type: "weekly" | "specific_date";
    day_of_week: number | null;
    specific_date: string | null;
    time_hhmm: string;
    active: boolean;
}

interface AlertScheduleRulesBuilderProps {
    value: AlertScheduleRuleDraft[];
    onChange: (value: AlertScheduleRuleDraft[]) => void;
    disabled?: boolean;
}

const createDraftId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }

    return `rule-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createWeeklyRuleDraft = (dayOfWeek = 1, time = "12:00"): AlertScheduleRuleDraft => ({
    client_id: createDraftId(),
    schedule_type: "weekly",
    day_of_week: dayOfWeek,
    specific_date: null,
    time_hhmm: time,
    active: true,
});

export const createSpecificDateRuleDraft = (date = "", time = "12:00"): AlertScheduleRuleDraft => ({
    client_id: createDraftId(),
    schedule_type: "specific_date",
    day_of_week: null,
    specific_date: date,
    time_hhmm: time,
    active: true,
});

export const AlertScheduleRulesBuilder = ({
    value,
    onChange,
    disabled = false,
}: AlertScheduleRulesBuilderProps) => {
    const updateRule = (clientId: string, patch: Partial<AlertScheduleRuleDraft>) => {
        onChange(
            value.map((rule) =>
                rule.client_id === clientId
                    ? {
                          ...rule,
                          ...patch,
                      }
                    : rule
            )
        );
    };

    const removeRule = (clientId: string) => {
        onChange(value.filter((rule) => rule.client_id !== clientId));
    };

    const duplicateRule = (clientId: string) => {
        const index = value.findIndex((rule) => rule.client_id === clientId);
        if (index === -1) return;

        const original = value[index];
        const clone: AlertScheduleRuleDraft = {
            ...original,
            client_id: createDraftId(),
        };

        const next = [...value];
        next.splice(index + 1, 0, clone);
        onChange(next);
    };

    const moveRule = (clientId: string, direction: -1 | 1) => {
        const index = value.findIndex((rule) => rule.client_id === clientId);
        const nextIndex = index + direction;

        if (index === -1 || nextIndex < 0 || nextIndex >= value.length) {
            return;
        }

        const next = [...value];
        const [item] = next.splice(index, 1);
        next.splice(nextIndex, 0, item);
        onChange(next);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => onChange([...value, createWeeklyRuleDraft()])}
                    disabled={disabled}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Regra semanal
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => onChange([...value, createSpecificDateRuleDraft()])}
                    disabled={disabled}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Data especifica
                </Button>
            </div>

            <div className="space-y-3">
                {value.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                        Nenhuma regra configurada.
                    </div>
                ) : null}

                {value.map((rule, index) => (
                    <div
                        key={rule.client_id}
                        className="rounded-2xl border border-border/50 bg-background p-4"
                    >
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium">Regra {index + 1}</p>
                                <p className="text-xs text-muted-foreground">
                                    Defina dia/data, horario e se a regra esta ativa.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Label htmlFor={`rule-active-${rule.client_id}`} className="text-xs">
                                    Ativa
                                </Label>
                                <Switch
                                    id={`rule-active-${rule.client_id}`}
                                    checked={rule.active}
                                    onCheckedChange={(checked) => updateRule(rule.client_id, { active: checked })}
                                    disabled={disabled}
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-[180px_1fr_120px]">
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <select
                                    value={rule.schedule_type}
                                    onChange={(event) => {
                                        const scheduleType = event.target.value as "weekly" | "specific_date";
                                        updateRule(rule.client_id, {
                                            schedule_type: scheduleType,
                                            day_of_week: scheduleType === "weekly" ? 1 : null,
                                            specific_date: scheduleType === "specific_date" ? rule.specific_date : null,
                                        });
                                    }}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    disabled={disabled}
                                >
                                    <option value="weekly">Semanal</option>
                                    <option value="specific_date">Data especifica</option>
                                </select>
                            </div>

                            {rule.schedule_type === "weekly" ? (
                                <div className="space-y-2">
                                    <Label>Dia da semana</Label>
                                    <select
                                        value={rule.day_of_week ?? 1}
                                        onChange={(event) =>
                                            updateRule(rule.client_id, {
                                                day_of_week: Number(event.target.value),
                                                specific_date: null,
                                            })
                                        }
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        disabled={disabled}
                                    >
                                        {DAY_NAMES_FULL.map((label, dayOfWeek) => (
                                            <option key={label} value={dayOfWeek}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Data</Label>
                                    <Input
                                        type="date"
                                        value={rule.specific_date ?? ""}
                                        onChange={(event) =>
                                            updateRule(rule.client_id, {
                                                specific_date: event.target.value || null,
                                                day_of_week: null,
                                            })
                                        }
                                        disabled={disabled}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Horario</Label>
                                <Input
                                    type="time"
                                    value={rule.time_hhmm}
                                    onChange={(event) =>
                                        updateRule(rule.client_id, {
                                            time_hhmm: event.target.value,
                                        })
                                    }
                                    disabled={disabled}
                                />
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => duplicateRule(rule.client_id)}
                                disabled={disabled}
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicar
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => moveRule(rule.client_id, -1)}
                                disabled={disabled || index === 0}
                            >
                                <MoveUp className="mr-2 h-4 w-4" />
                                Subir
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => moveRule(rule.client_id, 1)}
                                disabled={disabled || index === value.length - 1}
                            >
                                <MoveDown className="mr-2 h-4 w-4" />
                                Descer
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeRule(rule.client_id)}
                                disabled={disabled || value.length === 1}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
