import Image from "next/image";
import { cn } from "@/lib/utils";

export type IllustrationVariant = "ideas" | "saved" | "documents" | "itinerary";

const ILLUSTRATIONS: Record<
  IllustrationVariant,
  { light: string; dark: string; alt: string }
> = {
  ideas: {
    light: "/illustrations/Ideas.png",
    dark: "/illustrations/Ideas.png",
    alt: "No ideas yet",
  },
  saved: {
    light: "/illustrations/Saved.png",
    dark: "/illustrations/Saved.png",
    alt: "No saved places yet",
  },
  documents: {
    light: "/illustrations/Documents.png",
    dark: "/illustrations/Documents.png",
    alt: "No documents yet",
  },
  itinerary: {
    light: "/illustrations/Itinerary.png",
    dark: "/illustrations/Itinerary.png",
    alt: "No itinerary yet",
  },
};

type ThemeIllustrationProps = {
  variant: IllustrationVariant;
  className?: string;
  size?: number;
};

const DEFAULT_ILLUSTRATION_SIZE = 260;

export function ThemeIllustration({
  variant,
  className,
  size,
}: ThemeIllustrationProps) {
  const { light, dark, alt } = ILLUSTRATIONS[variant];
  const imageSize = size ?? DEFAULT_ILLUSTRATION_SIZE;

  return (
    <div
      className={cn(
        "relative mx-auto shrink-0",
        size ? undefined : "size-[240px] md:size-[260px]",
        className,
      )}
      style={size ? { width: size, height: size } : undefined}
    >
      <Image
        src={light}
        alt={alt}
        width={imageSize}
        height={imageSize}
        className="h-full w-full object-contain dark:hidden"
      />
      <Image
        src={dark}
        alt={alt}
        width={imageSize}
        height={imageSize}
        className="hidden h-full w-full object-contain dark:block"
      />
    </div>
  );
}
