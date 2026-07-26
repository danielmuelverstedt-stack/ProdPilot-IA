export class InvalidImageFileError extends Error {}

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.82;

/**
 * Redimensionne et recompresse une image côté client avant de la convertir en data URL,
 * pour éviter que des photos de plusieurs mégaoctets (typiquement issues d'un smartphone)
 * ne saturent le quota localStorage utilisé par les Réglages.
 */
export function readImageFileAsCompressedDataUrl(file: File, options?: { maxDimension?: number; quality?: number }): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new InvalidImageFileError("Ce fichier n’est pas reconnu comme une image (JPEG, PNG, WEBP…)."));
  }
  const maxDimension = options?.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options?.quality ?? DEFAULT_QUALITY;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire ce fichier."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Ce fichier n’a pas pu être ouvert comme une image."));
      image.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) { reject(new Error("Le navigateur ne permet pas de traiter cette image.")); return; }
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
