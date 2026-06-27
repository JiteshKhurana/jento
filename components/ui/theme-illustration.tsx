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

export function ThemeIllustration({
  variant,
  className,
  size = 220,
}: ThemeIllustrationProps) {
  const { light, dark, alt } = ILLUSTRATIONS[variant];

  return (
    <div
      className={cn("relative mx-auto shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src={light}
        alt={alt}
        width={size}
        height={size}
        className="h-full w-full object-contain dark:hidden"
      />
      <Image
        src={dark}
        alt={alt}
        width={size}
        height={size}
        className="hidden h-full w-full object-contain dark:block"
      />
    </div>
  );
}
