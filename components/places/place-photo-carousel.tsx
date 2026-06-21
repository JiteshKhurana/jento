"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PlacePhotoCarouselProps = {
  photos: string[];
  title: string;
  FallbackIcon: LucideIcon;
  className?: string;
  imageClassName?: string;
  onNavigate?: () => void;
};

export function PlacePhotoCarousel({
  photos,
  title,
  FallbackIcon,
  className,
  imageClassName,
  onNavigate,
}: PlacePhotoCarouselProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(() => new Set());
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());

  const availablePhotos = useMemo(
    () => photos.filter((url) => !failedUrls.has(url)),
    [photos, failedUrls],
  );

  const clampedIndex =
    availablePhotos.length === 0
      ? 0
      : Math.min(photoIndex, availablePhotos.length - 1);

  useEffect(() => {
    setPhotoIndex(0);
    setLoadedUrls(new Set());
    setFailedUrls(new Set());
  }, [photos.join("|")]);

  useEffect(() => {
    const images: HTMLImageElement[] = [];

    photos.forEach((url) => {
      const img = new Image();
      img.onload = () => {
        setLoadedUrls((current) => new Set(current).add(url));
      };
      img.onerror = () => {
        setFailedUrls((current) => new Set(current).add(url));
      };
      img.src = url;
      images.push(img);
    });

    return () => {
      images.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [photos]);

  const activePhoto = availablePhotos[clampedIndex];
  const isLoading = Boolean(activePhoto && !loadedUrls.has(activePhoto));
  const hasMultiplePhotos = availablePhotos.length > 1;

  function goToPhoto(nextIndex: number, event?: React.MouseEvent) {
    event?.stopPropagation();
    if (availablePhotos.length <= 1) return;
    setPhotoIndex(
      (nextIndex + availablePhotos.length) % availablePhotos.length,
    );
    onNavigate?.();
  }

  function handleImageError(url: string) {
    setFailedUrls((current) => new Set(current).add(url));
  }

  if (!activePhoto) {
    return (
      <div
        className={cn(
          "flex aspect-4/3 items-center justify-center bg-linear-to-br from-neutral-100 to-neutral-200/70",
          className,
        )}
      >
        <FallbackIcon className="h-10 w-10 text-neutral-300" />
      </div>
    );
  }

  return (
    <div className={cn("group relative aspect-4/3 bg-neutral-100", className)}>
      {isLoading && <Skeleton className="absolute inset-0 rounded-none" />}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={activePhoto}
        src={activePhoto}
        alt={title}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-150",
          isLoading ? "opacity-0" : "opacity-100",
          imageClassName,
        )}
        onLoad={() => {
          setLoadedUrls((current) => new Set(current).add(activePhoto));
        }}
        onError={() => handleImageError(activePhoto)}
      />

      {hasMultiplePhotos && (
        <>
          <button
            type="button"
            onClick={(event) => goToPhoto(clampedIndex - 1, event)}
            className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/95 text-neutral-700 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(event) => goToPhoto(clampedIndex + 1, event)}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/95 text-neutral-700 opacity-0 shadow-sm transition-opacity hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
            aria-label="Next photo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {availablePhotos.map((photo, index) => (
              <span
                key={photo}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  index === clampedIndex ? "bg-white" : "bg-white/50",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
