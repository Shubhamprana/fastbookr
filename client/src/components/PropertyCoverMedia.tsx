import { getPropertyCoverMedia } from "@/lib/propertyMedia";

type PropertyCoverMediaProps = {
  property: {
    images?: unknown;
    videoUrl?: unknown;
    title?: string;
  };
  className: string;
};

export function PropertyCoverMedia({ property, className }: PropertyCoverMediaProps) {
  const cover = getPropertyCoverMedia(property);

  if (cover.kind === "video") {
    return (
      <video
        src={cover.src}
        muted
        playsInline
        autoPlay
        loop
        preload="metadata"
        className={className}
      />
    );
  }

  return <img src={cover.src} alt={property.title || "Property"} className={className} />;
}
