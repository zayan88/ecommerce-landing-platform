/** Browser-side image shrinking (canvas → WebP, JPEG fallback). Shared by the admin uploader and the customer receipt upload. */


/** Loads a File into something drawable (createImageBitmap with an <img> fallback for old browsers). */
async function loadBitmap(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close?: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file);
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("decode"));
      i.src = url;
    });
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

/**
 * Shrinks a phone photo (often 4-8 MB) to max 1600px WebP (~100-300 KB) in the browser, so uploads are
 * fast on mobile data and storage/bandwidth stay tiny. Falls back to JPEG where WebP encoding is missing.
 */
export async function compressImage(file: File, maxSide = 1600, maxBytes = 1_400_000): Promise<Blob> {
  const { source, width, height, close } = await loadBitmap(file);
  try {
    const scale = Math.min(1, maxSide / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.fillStyle = "#ffffff"; // only visible if we fall back to JPEG (no transparency)
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(source, 0, 0, w, h);

    for (const q of [0.82, 0.7, 0.55]) {
      let blob = await canvasToBlob(canvas, "image/webp", q);
      if (!blob || blob.type !== "image/webp") blob = await canvasToBlob(canvas, "image/jpeg", Math.min(0.9, q + 0.05));
      if (blob && blob.size <= maxBytes) return blob;
    }
    const last = await canvasToBlob(canvas, "image/jpeg", 0.5);
    if (last) return last;
    throw new Error("encode");
  } finally {
    close?.();
  }
}
