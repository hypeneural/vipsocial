import { useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useDeletePollOptionImage,
  useUploadPollOptionImage,
} from "@/hooks/useEnquetes";
import type { PollOption } from "@/services/enquete.service";

interface PollOptionImageManagerProps {
  optionId?: number;
  imageUrl?: string | null;
  imageThumbUrl?: string | null;
  onUpdated?: (option: PollOption) => void;
}

export function PollOptionImageManager({
  optionId,
  imageUrl,
  imageThumbUrl,
  onUpdated,
}: PollOptionImageManagerProps) {
  const uploadMutation = useUploadPollOptionImage();
  const deleteMutation = useDeletePollOptionImage();
  const [inputKey, setInputKey] = useState(0);

  const isBusy = uploadMutation.isPending || deleteMutation.isPending;

  const handleFileChange = async (file?: File | null) => {
    if (!optionId || !file) return;

    const response = await uploadMutation.mutateAsync({ optionId, file });
    onUpdated?.(response.data);
    setInputKey((current) => current + 1);
  };

  const handleDelete = async () => {
    if (!optionId) return;

    const response = await deleteMutation.mutateAsync(optionId);
    onUpdated?.(response.data);
    setInputKey((current) => current + 1);
  };

  if (!optionId) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">
        Salve a enquete primeiro para enviar a imagem desta opcao.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/40">
          {imageThumbUrl || imageUrl ? (
            <img
              src={imageThumbUrl || imageUrl || ""}
              alt="Preview da opcao"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-medium">Imagem da opcao</p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG ou WEBP. Maximo de 2 MB.
            </p>
          </div>

          <div className="grid gap-2 md:grid-cols-[1fr,auto]">
            <div className="space-y-1">
              <Label htmlFor={`option-image-${optionId}`} className="text-xs">
                Selecionar arquivo
              </Label>
              <Input
                key={inputKey}
                id={`option-image-${optionId}`}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="rounded-xl"
                disabled={isBusy}
                onChange={(event) => handleFileChange(event.target.files?.[0])}
              />
            </div>

            {imageUrl ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl md:self-end"
                onClick={handleDelete}
                disabled={isBusy}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Remover
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PollOptionImageManager;
