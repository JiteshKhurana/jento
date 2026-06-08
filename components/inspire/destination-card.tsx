import Image from "next/image";
import type { FeaturedDestination } from "@/lib/inspire/templates";
import type { UnsplashPhoto } from "@/lib/unsplash/photos";

type DestinationCardProps = {
  destination: FeaturedDestination;
  photo: UnsplashPhoto | null;
  onPlanTrip: (message: string, destinationName: string) => void;
};

export function DestinationCard({ destination, photo, onPlanTrip }: DestinationCardProps) {
  const GRADIENTS: Record<string, string> = {
    tokyo: "from-rose-400 to-orange-500",
    bali: "from-teal-400 to-emerald-600",
    paris: "from-violet-400 to-purple-600",
    santorini: "from-blue-400 to-cyan-600",
    "new-york": "from-neutral-600 to-neutral-900",
    "machu-picchu": "from-amber-500 to-lime-600",
    amalfi: "from-orange-400 to-rose-500",
    kyoto: "from-pink-400 to-rose-600",
    safari: "from-amber-600 to-orange-700",
    maldives: "from-cyan-400 to-blue-500",
    barcelona: "from-orange-400 to-red-500",
    iceland: "from-indigo-500 to-violet-700",
  };

  const gradient = GRADIENTS[destination.id] ?? "from-orange-400 to-rose-500";

  return (
    <button
      type="button"
      onClick={() => onPlanTrip(destination.initialMessage, destination.name)}
      className="card-photo group block w-full text-left"
    >
      <div className="relative overflow-hidden rounded-2xl bg-neutral-200">
        <div className="relative aspect-4/5">
          {photo ? (
            <Image
              src={photo.url}
              alt={destination.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className={`absolute inset-0 bg-linear-to-br ${gradient}`} />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/15 to-transparent" />

          {/* Country badge */}
          <div className="absolute left-3 top-3">
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              {destination.country}
            </span>
          </div>

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-xl font-bold leading-tight text-white">
              {destination.name}
            </h3>
            <p className="mt-0.5 text-xs text-white/70">{destination.tagline}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {destination.categories.slice(0, 2).map((cat) => (
                <span
                  key={cat}
                  className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium capitalize text-white backdrop-blur-sm"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
