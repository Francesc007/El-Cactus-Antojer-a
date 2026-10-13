import { REVIEW_IMAGE_MAX_EDGE, REVIEW_IMAGE_TARGET_BYTES } from "@/lib/reviews";

type BitmapHandle = {
  source: CanvasImageSource;
  width: number;
  height: number;
  orientation: number;
  close: () => void;
};

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: "image/webp" | "image/jpeg",
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function loadHtmlImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    image.src = url;
  });
}

function jpegOrientation(bytes: Uint8Array): number {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return 1;
  }
  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      break;
    }
    const marker = bytes[offset + 1] ?? 0;
    const size = ((bytes[offset + 2] ?? 0) << 8) | (bytes[offset + 3] ?? 0);
    if (marker === 0xe1) {
      return parseExifOrientation(bytes, offset + 4, size - 2);
    }
    if (marker === 0xda || size < 2) {
      break;
    }
    offset += 2 + size;
  }
  return 1;
}

function parseExifOrientation(bytes: Uint8Array, start: number, length: number): number {
  const end = Math.min(bytes.length, start + length);
  if (start + 14 > end) {
    return 1;
  }
  if (
    bytes[start] !== 0x45 ||
    bytes[start + 1] !== 0x78 ||
    bytes[start + 2] !== 0x69 ||
    bytes[start + 3] !== 0x66 ||
    bytes[start + 4] !== 0x00 ||
    bytes[start + 5] !== 0x00
  ) {
    return 1;
  }
  const tiff = start + 6;
  const little = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49;
  const read16 = (at: number): number => {
    if (at + 1 >= end) {
      return 0;
    }
    return little
      ? (bytes[at] ?? 0) | ((bytes[at + 1] ?? 0) << 8)
      : ((bytes[at] ?? 0) << 8) | (bytes[at + 1] ?? 0);
  };
  const read32 = (at: number): number => {
    if (at + 3 >= end) {
      return 0;
    }
    return little
      ? (bytes[at] ?? 0) |
          ((bytes[at + 1] ?? 0) << 8) |
          ((bytes[at + 2] ?? 0) << 16) |
          ((bytes[at + 3] ?? 0) << 24)
      : ((bytes[at] ?? 0) << 24) |
          ((bytes[at + 1] ?? 0) << 16) |
          ((bytes[at + 2] ?? 0) << 8) |
          (bytes[at + 3] ?? 0);
  };
  if (read16(tiff + 2) !== 0x002a) {
    return 1;
  }
  const ifd = tiff + read32(tiff + 4);
  const entries = read16(ifd);
  for (let i = 0; i < entries; i += 1) {
    const entry = ifd + 2 + i * 12;
    if (read16(entry) === 0x0112) {
      const value = read16(entry + 8);
      if (value >= 1 && value <= 8) {
        return value;
      }
      return 1;
    }
  }
  return 1;
}

async function decodeImage(file: File): Promise<BitmapHandle> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        orientation: 1,
        close: () => bitmap.close(),
      };
    } catch {
      // Algunos celulares no decodifican HEIC u otros formatos con esta API.
    }
  }

  const image = await loadHtmlImage(file);
  let orientation = 1;
  if (file.type === "image/jpeg" || file.name.toLowerCase().endsWith(".jpg") || file.name.toLowerCase().endsWith(".jpeg")) {
    const bytes = new Uint8Array(await file.slice(0, 64 * 1024).arrayBuffer());
    orientation = jpegOrientation(bytes);
  }
  return {
    source: image,
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
    orientation,
    close: () => undefined,
  };
}

function applyExif(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  orientation: number
): void {
  switch (orientation) {
    case 2:
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      break;
    case 3:
      ctx.translate(width, height);
      ctx.rotate(Math.PI);
      break;
    case 4:
      ctx.translate(0, height);
      ctx.scale(1, -1);
      break;
    case 5:
      ctx.rotate(0.5 * Math.PI);
      ctx.scale(1, -1);
      break;
    case 6:
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(0, -height);
      break;
    case 7:
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(width, -height);
      ctx.scale(-1, 1);
      break;
    case 8:
      ctx.rotate(-0.5 * Math.PI);
      ctx.translate(-width, 0);
      break;
    default:
      break;
  }
}

function drawToCanvas(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  orientation: number,
  maxEdge: number
): HTMLCanvasElement {
  const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight));
  const drawWidth = Math.max(1, Math.round(sourceWidth * scale));
  const drawHeight = Math.max(1, Math.round(sourceHeight * scale));
  const swap = orientation >= 5;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? drawHeight : drawWidth;
  canvas.height = swap ? drawWidth : drawHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo preparar la captura.");
  }
  applyExif(ctx, drawWidth, drawHeight, orientation);
  ctx.drawImage(source, 0, 0, drawWidth, drawHeight);
  return canvas;
}

function scaleCanvas(source: HTMLCanvasElement, factor: number): HTMLCanvasElement {
  const width = Math.max(1, Math.round(source.width * factor));
  const height = Math.max(1, Math.round(source.height * factor));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo reducir la captura.");
  }
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

async function encodeCanvas(canvas: HTMLCanvasElement): Promise<{ blob: Blob; name: string }> {
  let type: "image/webp" | "image/jpeg" = "image/webp";
  let quality = 0.82;
  let blob = await canvasToBlob(canvas, type, quality);
  if (!blob || blob.type !== "image/webp") {
    type = "image/jpeg";
    blob = await canvasToBlob(canvas, type, quality);
  }
  if (!blob) {
    throw new Error("No se pudo comprimir la captura.");
  }

  let current = canvas;
  for (let step = 0; step < 8 && blob.size > REVIEW_IMAGE_TARGET_BYTES; step += 1) {
    if (quality > 0.5) {
      quality = Math.max(0.5, quality - 0.08);
    } else if (Math.min(current.width, current.height) > 640) {
      current = scaleCanvas(current, 0.85);
      quality = 0.72;
    } else {
      break;
    }
    const next = await canvasToBlob(current, type, quality);
    if (next) {
      blob = next;
    }
  }

  const name = type === "image/webp" ? "evidencia.webp" : "evidencia.jpg";
  return { blob, name };
}

export async function compressReviewImage(file: File): Promise<File> {
  const allowed =
    file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp";
  if (allowed && file.size <= REVIEW_IMAGE_TARGET_BYTES) {
    return file;
  }

  const decoded = await decodeImage(file);
  try {
    if (decoded.width < 8 || decoded.height < 8) {
      throw new Error("La captura es demasiado pequeña.");
    }
    const canvas = drawToCanvas(
      decoded.source,
      decoded.width,
      decoded.height,
      decoded.orientation,
      REVIEW_IMAGE_MAX_EDGE
    );
    const encoded = await encodeCanvas(canvas);
    if (allowed && encoded.blob.size >= file.size && file.size <= REVIEW_IMAGE_TARGET_BYTES) {
      return file;
    }
    return new File([encoded.blob], encoded.name, {
      type: encoded.blob.type,
      lastModified: Date.now(),
    });
  } finally {
    decoded.close();
  }
}
