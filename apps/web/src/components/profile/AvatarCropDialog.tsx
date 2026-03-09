import { useCallback, useEffect, useMemo, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Loader2, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { getCroppedImageBlob } from "@/lib/image-crop";

type AvatarCropDialogProps = {
    open: boolean;
    imageSrc: string | null;
    onClose: () => void;
    onConfirm: (file: File, previewUrl: string) => Promise<void> | void;
};

export function AvatarCropDialog({
    open,
    imageSrc,
    onClose,
    onConfirm,
}: AvatarCropDialogProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!open) {
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setCroppedAreaPixels(null);
        }
    }, [open]);

    const handleCropComplete = useCallback((_area: Area, pixels: Area) => {
        setCroppedAreaPixels(pixels);
    }, []);

    const zoomValue = useMemo(() => [zoom], [zoom]);
    const disabled = !imageSrc || !croppedAreaPixels || isSaving;

    const handleSave = useCallback(async () => {
        if (!imageSrc || !croppedAreaPixels) {
            return;
        }

        try {
            setIsSaving(true);

            const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, 512, "image/jpeg", 0.9);
            const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
            const previewUrl = URL.createObjectURL(blob);

            await onConfirm(file, previewUrl);
            onClose();
        } catch {
            // O fluxo externo ja trata o erro. Mantemos o modal aberto para permitir nova tentativa.
        } finally {
            setIsSaving(false);
        }
    }, [croppedAreaPixels, imageSrc, onClose, onConfirm]);

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
            <DialogContent className="max-w-2xl overflow-hidden rounded-3xl p-0">
                <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/50 p-6">
                    <DialogHeader className="mb-5 space-y-2">
                        <DialogTitle>Ajustar foto de perfil</DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Ajuste a imagem no enquadramento 1:1. O arquivo final sera salvo em 512x512.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5">
                        <div className="relative h-[320px] w-full overflow-hidden rounded-3xl bg-black sm:h-[420px]">
                            {imageSrc && (
                                <Cropper
                                    image={imageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    cropShape="round"
                                    showGrid={false}
                                    objectFit="cover"
                                    onCropChange={setCrop}
                                    onZoomChange={setZoom}
                                    onCropComplete={handleCropComplete}
                                />
                            )}
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
                            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                                <ZoomIn className="h-4 w-4 text-primary" />
                                Zoom
                            </div>
                            <Slider
                                value={zoomValue}
                                min={1}
                                max={3}
                                step={0.01}
                                onValueChange={(value) => setZoom(value[0] ?? 1)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-6 gap-2 sm:justify-end">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                            Cancelar
                        </Button>
                        <Button type="button" onClick={handleSave} disabled={disabled}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando foto...
                                </>
                            ) : (
                                "Salvar foto"
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
