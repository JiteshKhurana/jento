"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
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
  const photosSignature = useMemo(() => photos.join("|"), [photos]);

  const [carouselState, setCarouselState] = useState(() => ({
    photosSignature,
    availablePhotosSignature: "",
    loadedUrls: new Set<string>(),
    failedUrls: new Set<string>(),
    selectedIndex: 0,
  }));

  const availablePhotos = useMemo(
    () => photos.filter((url) => !carouselState.failedUrls.has(url)),
    [photos, carouselState.failedUrls],
  );

  const availablePhotosSignature = useMemo(
    () => availablePhotos.join("|"),
    [availablePhotos],
  );

  if (
    carouselState.photosSignature !== photosSignature ||
    carouselState.availablePhotosSignature !== availablePhotosSignature
  ) {
    const photosChanged = carouselState.photosSignature !== photosSignature;
    setCarouselState({
      photosSignature,
      availablePhotosSignature,
      loadedUrls: photosChanged ? new Set() : carouselState.loadedUrls,
      failedUrls: photosChanged ? new Set() : carouselState.failedUrls,
      selectedIndex: 0,
    });
  }

  const { loadedUrls, selectedIndex } = carouselState;

  const hasMultiplePhotos = availablePhotos.length > 1;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: hasMultiplePhotos,
    align: "start",
    containScroll: "trimSnaps",
  });

  const scrollPrev = useCallback(
    (event?: React.MouseEvent) => {
      event?.stopPropagation();
      if (!emblaApi) return;
      emblaApi.scrollPrev();
      onNavigate?.();
    },
    [emblaApi, onNavigate],
  );

  const scrollNext = useCallback(
    (event?: React.MouseEvent) => {
      event?.stopPropagation();
      if (!emblaApi) return;
      emblaApi.scrollNext();
      onNavigate?.();
    },
    [emblaApi, onNavigate],
  );

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit({ loop: hasMultiplePhotos });
    emblaApi.scrollTo(0, true);
  }, [availablePhotosSignature, emblaApi, hasMultiplePhotos]);

  useEffect(() => {
    if (!emblaApi) return;

    const updateSelectedIndex = () => {
      setCarouselState((current) => ({
        ...current,
        selectedIndex: emblaApi.selectedScrollSnap(),
      }));
    };

    emblaApi.on("select", updateSelectedIndex);
    emblaApi.on("reInit", updateSelectedIndex);

    const frameId = requestAnimationFrame(updateSelectedIndex);

    return () => {
      cancelAnimationFrame(frameId);
      emblaApi.off("select", updateSelectedIndex);
      emblaApi.off("reInit", updateSelectedIndex);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || !onNavigate) return;

    let initialized = false;
    const handleSelect = () => {
      if (!initialized) {
        initialized = true;
        return;
      }
      onNavigate();
    };

    emblaApi.on("select", handleSelect);
    return () => {
      emblaApi.off("select", handleSelect);
    };
  }, [emblaApi, onNavigate]);

  useEffect(() => {
    const images: HTMLImageElement[] = [];

    photos.forEach((url) => {
      const img = new Image();
      img.onload = () => {
        setCarouselState((current) => ({
          ...current,
          loadedUrls: new Set(current.loadedUrls).add(url),
        }));
      };
      img.onerror = () => {
        setCarouselState((current) => ({
          ...current,
          failedUrls: new Set(current.failedUrls).add(url),
        }));
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

  function handleImageError(url: string) {
    setCarouselState((current) => ({
      ...current,
      failedUrls: new Set(current.failedUrls).add(url),
    }));
  }

  if (availablePhotos.length === 0) {
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
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full touch-pan-y">
          {availablePhotos.map((photo) => {
            const isLoading = !loadedUrls.has(photo);

            return (
              <div
                key={photo}
                className="relative min-w-0 shrink-0 grow-0 basis-full"
              >
                {isLoading && (
                  <Skeleton className="absolute inset-0 rounded-none" />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt={title}
                  draggable={false}
                  className={cn(
                    "h-full w-full object-cover transition-opacity duration-150 select-none",
                    isLoading ? "opacity-0" : "opacity-100",
                    imageClassName,
                  )}
                  onLoad={() => {
                    setCarouselState((current) => ({
                      ...current,
                      loadedUrls: new Set(current.loadedUrls).add(photo),
                    }));
                  }}
                  onError={() => handleImageError(photo)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {hasMultiplePhotos && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-sm transition-opacity hover:bg-white max-md:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/95 text-neutral-700 shadow-sm transition-opacity hover:bg-white max-md:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            aria-label="Next photo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1">
            {availablePhotos.map((photo, index) => (
              <span
                key={photo}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  index === selectedIndex ? "bg-white" : "bg-white/50",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
