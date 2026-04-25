import Image from "next/image";
import { cn } from "@/lib/utils";
import type { LandingPhoto } from "./photo-assets";

type PhotoPanelProps = {
  photo: LandingPhoto;
  className?: string;
  imageClassName?: string;
  sizes: string;
  priority?: boolean;
  caption?: boolean;
};

export function PhotoPanel({
  photo,
  className,
  imageClassName,
  sizes,
  priority = false,
  caption = false,
}: PhotoPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm ring-1 ring-black/5",
        className,
      )}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        preload={priority}
        className={cn("object-cover", imageClassName)}
        style={{ objectPosition: photo.position ?? "center" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-white/10" />
      {caption ? (
        <div className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-[10px] font-medium text-white/85 backdrop-blur-md">
          {photo.credit}
        </div>
      ) : null}
    </div>
  );
}
