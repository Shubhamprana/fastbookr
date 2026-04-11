import { MAX_PROPERTY_IMAGE_UPLOAD_BYTES } from "@shared/const";

const MAX_IMAGE_DIMENSION = 1600;
const JPEG_MIME_TYPE = "image/jpeg";
const MIN_QUALITY = 0.55;
const QUALITY_STEP = 0.08;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image for compression."));
    image.src = dataUrl;
  });
}

function calculateTargetSize(width: number, height: number) {
  const longestSide = Math.max(width, height);

  if (longestSide <= MAX_IMAGE_DIMENSION) {
    return { width, height };
  }

  const scale = MAX_IMAGE_DIMENSION / longestSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Failed to compress image."));
      },
      JPEG_MIME_TYPE,
      quality
    );
  });
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const base64 = dataUrl.split(",")[1];
      resolve(base64 ?? "");
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed to prepare image upload."));
    reader.readAsDataURL(blob);
  });
}

export async function prepareImageForUpload(file: File) {
  if (file.size <= MAX_PROPERTY_IMAGE_UPLOAD_BYTES) {
    const base64 = await blobToBase64(file);
    return {
      base64,
      contentType: file.type || JPEG_MIME_TYPE,
      didOptimize: false,
    };
  }

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const { width, height } = calculateTargetSize(image.naturalWidth, image.naturalHeight);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image compression is not supported on this device.");
  }

  context.drawImage(image, 0, 0, width, height);

  let quality = 0.9;
  let compressedBlob = await canvasToBlob(canvas, quality);

  while (compressedBlob.size > MAX_PROPERTY_IMAGE_UPLOAD_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
    compressedBlob = await canvasToBlob(canvas, quality);
  }

  if (compressedBlob.size > MAX_PROPERTY_IMAGE_UPLOAD_BYTES) {
    throw new Error("Image is still too large after optimization. Please use a smaller photo.");
  }

  return {
    base64: await blobToBase64(compressedBlob),
    contentType: JPEG_MIME_TYPE,
    didOptimize: true,
  };
}
