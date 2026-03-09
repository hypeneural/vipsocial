export type PixelCrop = {
    x: number;
    y: number;
    width: number;
    height: number;
};

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", reject);
        image.src = url;
    });
}

export async function getCroppedImageBlob(
    imageSrc: string,
    crop: PixelCrop,
    outputSize = 512,
    mimeType: "image/jpeg" | "image/webp" = "image/jpeg",
    quality = 0.9
): Promise<Blob> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Nao foi possivel criar o canvas para recortar a imagem.");
    }

    canvas.width = outputSize;
    canvas.height = outputSize;

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        outputSize,
        outputSize
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("Falha ao gerar a imagem cortada."));
                    return;
                }

                resolve(blob);
            },
            mimeType,
            quality
        );
    });
}
