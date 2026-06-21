"use client";

import {
  Clock,
  Copy,
  Check,
  DollarSign,
  Globe,
  MapPin,
  Navigation,
  Phone,
  Star,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { buildStaticMapUrl } from "@/lib/places/utils";

export type PlaceReview = {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
};

export type PlaceInfoData = {
  name: string;
  address?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  phone?: string | null;
  website?: string | null;
  openingHours?: unknown;
  priceLevel?: string | null;
  reviews?: PlaceReview[];
  latitude?: number | null;
  longitude?: number | null;
};

type PlaceInfoSectionsProps = {
  info: PlaceInfoData;
  activeTab: "overview" | "reviews" | "location";
  destination: string;
  overrideDescription?: string | null;
  mapsUrl?: string | null;
  categoryLabel?: string;
};

const PRICE_LEVEL_MAP: Record<string, string> = {
  PRICE_LEVEL_FREE: "Free",
  PRICE_LEVEL_INEXPENSIVE: "Inexpensive",
  PRICE_LEVEL_MODERATE: "Moderate",
  PRICE_LEVEL_EXPENSIVE: "Expensive",
  PRICE_LEVEL_VERY_EXPENSIVE: "Very expensive",
};

function parseOpeningHours(hours: unknown): string[] {
  if (!Array.isArray(hours)) return [];
  return hours.filter((h): h is string => typeof h === "string");
}

function StarDisplay({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < full
              ? "fill-amber-400 text-amber-400"
              : i === full && half
                ? "fill-amber-400/50 text-amber-400"
                : "fill-neutral-200 text-neutral-200",
          )}
        />
      ))}
    </span>
  );
}

function InfoRow({
  icon,
  children,
  align = "center",
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center";
}) {
  return (
    <div
      className={cn(
        "flex gap-3",
        align === "start" ? "items-start" : "items-center",
      )}
    >
      <span
        className={cn(
          "shrink-0 text-neutral-400",
          align === "start" && "mt-0.5",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 text-sm text-neutral-700">{children}</div>
    </div>
  );
}

function OverviewSection({
  info,
  overrideDescription,
  destination,
  categoryLabel,
}: {
  info: PlaceInfoData;
  overrideDescription?: string | null;
  destination: string;
  categoryLabel?: string;
}) {
  const description = overrideDescription;
  const hours = parseOpeningHours(info.openingHours);
  const priceLabel = info.priceLevel ? PRICE_LEVEL_MAP[info.priceLevel] : null;
  const hasInfoRows =
    priceLabel || info.phone || info.website || hours.length > 0;

  const websiteDisplay = info.website
    ? (() => {
        try {
          return new URL(info.website).hostname.replace(/^www\./, "");
        } catch {
          return info.website;
        }
      })()
    : null;

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-neutral-600">
        {description ??
          `Discover ${info.name} in ${destination}.${categoryLabel ? ` A popular ${categoryLabel.toLowerCase()} worth visiting on your trip.` : ""}`}
      </p>

      {hasInfoRows && (
        <div className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50/70 px-4 py-3.5">
          {priceLabel && (
            <InfoRow icon={<DollarSign className="h-4 w-4" />}>
              <span className="font-medium text-neutral-900">{priceLabel}</span>
            </InfoRow>
          )}

          {info.phone && (
            <InfoRow icon={<Phone className="h-4 w-4" />}>
              <a
                href={`tel:${info.phone}`}
                className="transition-colors hover:text-teal-700"
              >
                {info.phone}
              </a>
            </InfoRow>
          )}

          {info.website && websiteDisplay && (
            <InfoRow icon={<Globe className="h-4 w-4" />}>
              <a
                href={info.website}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-teal-700 hover:underline"
              >
                {websiteDisplay}
              </a>
            </InfoRow>
          )}

          {hours.length > 0 && (
            <InfoRow icon={<Clock className="h-4 w-4" />} align="start">
              <p className="font-medium text-neutral-900">Hours</p>
              <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                {hours.map((h, i) => {
                  const [day, ...rest] = h.split(": ");
                  return (
                    <li key={i} className="flex gap-2">
                      <span className="w-24 shrink-0 font-medium text-neutral-700">
                        {day}
                      </span>
                      <span>{rest.join(": ") || "Closed"}</span>
                    </li>
                  );
                })}
              </ul>
            </InfoRow>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewsSection({
  reviews,
  rating,
  reviewCount,
}: {
  reviews: PlaceReview[];
  rating?: number | null;
  reviewCount?: number | null;
}) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-neutral-400">No reviews available yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      {rating != null && (
        <div className="flex items-center gap-4 rounded-xl bg-neutral-50 px-4 py-3.5">
          <span className="text-4xl font-bold tracking-tight text-neutral-900">
            {rating.toFixed(1)}
          </span>
          <div className="space-y-1">
            <StarDisplay rating={rating} />
            {reviewCount != null && (
              <p className="text-xs text-neutral-500">
                {reviewCount.toLocaleString()} reviews on Google Maps
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((review, i) => (
          <div
            key={i}
            className="border-b border-neutral-100 pb-4 last:border-0"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600">
                  {review.author.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-medium text-neutral-900">
                  {review.author}
                </p>
              </div>
              <span className="text-xs text-neutral-400">
                {review.relativeTime}
              </span>
            </div>
            <div className="mt-1.5 ml-9">
              <StarDisplay rating={review.rating} />
              {review.text && (
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                  {review.text}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LocationSection({
  info,
  mapsUrl,
}: {
  info: PlaceInfoData;
  mapsUrl?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  function handleCopy() {
    if (!info.address) return;
    navigator.clipboard.writeText(info.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-4">
      {info.latitude != null && info.longitude != null && mapsKey && (
        <a
          href={mapsUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-xl bg-neutral-100"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={buildStaticMapUrl(
              info.latitude,
              info.longitude,
              mapsKey,
              800,
              320,
            )}
            alt={`Map of ${info.name}`}
            className="h-44 w-full object-cover transition-opacity hover:opacity-90"
          />
        </a>
      )}

      {info.address ? (
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-neutral-700">{info.address}</p>
            <button
              type="button"
              onClick={handleCopy}
              className="mt-1 flex items-center gap-1 text-xs text-neutral-400 transition-colors hover:text-neutral-600 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-teal-600" />
                  <span className="text-teal-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy address
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-neutral-400">No address on file.</p>
      )}

      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 transition-colors hover:text-teal-800"
        >
          <Navigation className="h-4 w-4" />
          Open in Google Maps
        </a>
      )}
    </div>
  );
}

export function PlaceInfoSections({
  info,
  activeTab,
  destination,
  overrideDescription,
  mapsUrl,
  categoryLabel,
}: PlaceInfoSectionsProps) {
  if (activeTab === "overview") {
    return (
      <OverviewSection
        info={info}
        overrideDescription={overrideDescription}
        destination={destination}
        categoryLabel={categoryLabel}
      />
    );
  }

  if (activeTab === "reviews") {
    return (
      <ReviewsSection
        reviews={info.reviews ?? []}
        rating={info.rating}
        reviewCount={info.reviewCount}
      />
    );
  }

  return <LocationSection info={info} mapsUrl={mapsUrl} />;
}
