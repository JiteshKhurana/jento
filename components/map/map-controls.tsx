"use client";

import { useState } from "react";
import { Layers, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type MapType = "roadmap" | "satellite";

type MapControlsProps = {
  map: google.maps.Map;
  className?: string;
};

export function MapControls({ map, className }: MapControlsProps) {
  const [mapType, setMapType] = useState<MapType>("roadmap");

  function toggleMapType() {
    const next: MapType = mapType === "roadmap" ? "satellite" : "roadmap";
    map.setMapTypeId(next);
    setMapType(next);
  }

  function zoomIn() {
    const zoom = map.getZoom();
    if (zoom != null) map.setZoom(zoom + 1);
  }

  function zoomOut() {
    const zoom = map.getZoom();
    if (zoom != null) map.setZoom(zoom - 1);
  }

  return (
    <div
      className={cn(
        "pointer-events-auto absolute bottom-5 right-4 z-20 flex flex-col items-center gap-2",
        className,
      )}
    >
      <button
        type="button"
        onClick={toggleMapType}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 shadow-md transition-colors hover:bg-neutral-50",
          mapType === "satellite" && "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800",
        )}
        aria-label={
          mapType === "roadmap" ? "Switch to satellite view" : "Switch to map view"
        }
      >
        <Layers className="h-5 w-5" />
      </button>

      <div className="overflow-hidden rounded-full border border-neutral-200 bg-white shadow-md">
        <button
          type="button"
          onClick={zoomIn}
          className="flex h-10 w-10 items-center justify-center text-neutral-900 transition-colors hover:bg-neutral-50"
          aria-label="Zoom in"
        >
          <Plus className="h-5 w-5" />
        </button>
        <div className="h-px bg-neutral-200" />
        <button
          type="button"
          onClick={zoomOut}
          className="flex h-10 w-10 items-center justify-center text-neutral-900 transition-colors hover:bg-neutral-50"
          aria-label="Zoom out"
        >
          <Minus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
