export const PROPERTY_MEDIA_PLACEHOLDER =
  "https://placehold.co/600x400/e2e8f0/94a3b8?text=Property";

export function parsePropertyImages(images: unknown): string[] {
  if (Array.isArray(images)) {
    return images.filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0
    );
  }

  if (typeof images !== "string" || !images.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0
      );
    }

    if (typeof parsed === "string" && parsed.trim()) {
      return [parsed.trim()];
    }
  } catch {
    if (images.includes(",")) {
      return images
        .split(",")
        .map(value => value.trim())
        .filter(Boolean);
    }

    return [images.trim()];
  }

  return [];
}

export function getPropertyVideoUrl(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

export function getPropertyCoverMedia(property: { images?: unknown; videoUrl?: unknown }) {
  const images = parsePropertyImages(property.images);
  const videoUrl = getPropertyVideoUrl(property.videoUrl);

  if (images[0]) {
    return { kind: "image" as const, src: images[0] };
  }

  if (videoUrl) {
    return { kind: "video" as const, src: videoUrl };
  }

  return { kind: "placeholder" as const, src: PROPERTY_MEDIA_PLACEHOLDER };
}
