import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface CreateWhatsAppBundleDialogProps {
    open: boolean;
    groupName?: string;
    selectedCount: number;
    isSubmitting: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (title: string) => Promise<void> | void;
}

export function CreateWhatsAppBundleDialog({
    open,
    groupName,
    selectedCount,
    isSubmitting,
    onOpenChange,
    onSubmit,
}: CreateWhatsAppBundleDialogProps) {
    const [title, setTitle] = useState("");

    useEffect(() => {
        if (!open) {
            setTitle("");
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-2xl sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Criar agrupamento editorial</DialogTitle>
                    <DialogDescription>
                        {selectedCount} mensagem(ns) selecionada(s)
                        {groupName ? ` em ${groupName}` : ""}. O titulo e opcional nesta etapa.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="bundle-title">
                        Titulo inicial
                    </label>
                    <Input
                        id="bundle-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        className="rounded-xl"
                        placeholder="Ex.: Acidente na BR-101 em Palhoca"
                    />
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        className="rounded-xl"
                        onClick={() => onSubmit(title)}
                        disabled={isSubmitting || selectedCount === 0}
                    >
                        {isSubmitting ? "Criando..." : "Criar agrupamento"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
