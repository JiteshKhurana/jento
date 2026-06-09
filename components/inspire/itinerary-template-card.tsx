import Image from "next/image";
import { Clock, MapPin } from "lucide-react";
import type { ItineraryTemplate } from "@/lib/inspire/templates";
import type { UnsplashPhoto } from "@/lib/unsplash/photos";

type ItineraryTemplateCardProps = {
  template: ItineraryTemplate;
  photo: UnsplashPhoto | null;
  onPlanTrip: (message: string, destinationName: string) => void;
};

const CATEGORY_COLORS: Record<string, string> = {
  beach: "bg-cyan-100 text-cyan-800",
  city: "bg-violet-100 text-violet-800",
  adventure: "bg-neutral-100 text-neutral-800",
  culture: "bg-amber-100 text-amber-800",
  food: "bg-rose-100 text-rose-800",
  all: "bg-neutral-100 text-neutral-700",
};

export function ItineraryTemplateCard({ template, photo, onPlanTrip }: ItineraryTemplateCardProps) {
  return (
    <div className="card-photo group overflow-hidden rounded-2xl border border-neutral-200/80 bg-white">
      {/* Photo */}
      <div className="relative aspect-video overflow-hidden bg-neutral-100">
        {photo ? (
          <Image
            src={photo.url}
            alt={template.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-neutral-300 to-neutral-500" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

        {/* Duration badge */}
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          <Clock className="h-3 w-3" />
          {template.duration} {template.duration === 1 ? "day" : "days"}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <h3 className="font-semibold leading-snug text-neutral-900">{template.title}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
              <MapPin className="h-3 w-3" />
              {template.destination}, {template.country}
            </p>
          </div>
        </div>

        {/* Category tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {template.categories.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${CATEGORY_COLORS[cat] ?? "bg-neutral-100 text-neutral-700"}`}
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Highlights */}
        <div className="mt-3 space-y-1">
          {template.highlights.map((highlight) => (
            <div key={highlight} className="flex items-center gap-2 text-xs text-neutral-600">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-500" />
              {highlight}
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => onPlanTrip(template.initialMessage, template.destination)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Plan this trip
        </button>
      </div>
    </div>
  );
}
