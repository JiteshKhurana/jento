"use client";

import { useEffect, useRef, useState } from "react";

export function useMapProjection(map: google.maps.Map | null) {
  const projectionRef = useRef<google.maps.MapCanvasProjection | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!map) {
      projectionRef.current = null;
      return;
    }

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setRevision((value) => value + 1);
      });
    };

    class ProjectionOverlay extends google.maps.OverlayView {
      onAdd() {}

      draw() {
        projectionRef.current = this.getProjection() ?? null;
        schedule();
      }

      onRemove() {
        projectionRef.current = null;
      }
    }

    const overlay = new ProjectionOverlay();
    overlay.setMap(map);

    const listeners = [
      map.addListener("bounds_changed", schedule),
      map.addListener("zoom_changed", schedule),
      map.addListener("center_changed", schedule),
      map.addListener("resize", schedule),
      map.addListener("idle", schedule),
    ];

    schedule();

    return () => {
      cancelAnimationFrame(frame);
      overlay.setMap(null);
      projectionRef.current = null;
      listeners.forEach((listener) => google.maps.event.removeListener(listener));
    };
  }, [map]);

  return { projection: projectionRef.current, revision };
}

export function latLngToContainerPoint(
  projection: google.maps.MapCanvasProjection,
  lat: number,
  lng: number,
): { x: number; y: number } {
  const point = projection.fromLatLngToContainerPixel(
    new google.maps.LatLng(lat, lng),
  );
  return { x: point?.x ?? 0, y: point?.y ?? 0 };
}

export function latLngToPagePoint(
  map: google.maps.Map,
  projection: google.maps.MapCanvasProjection,
  lat: number,
  lng: number,
): { x: number; y: number } {
  const container = latLngToContainerPoint(projection, lat, lng);
  const rect = map.getDiv().getBoundingClientRect();
  return {
    x: rect.left + container.x,
    y: rect.top + container.y,
  };
}
