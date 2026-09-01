import { useEffect, useRef } from "react";
import L from "leaflet";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";

interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapReady?: (map: L.Map) => void;
  onMapError?: () => void;
}

export function MapView({
  className,
  initialCenter = { lat: 39.7767, lng: 30.5206 }, // Default Tepebaşı, Eskişehir
  initialZoom = 13,
  onMapReady,
  onMapError,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  const initMap = usePersistFn(() => {
    if (!mapContainer.current) return;
    if (mapInstance.current) return;

    try {
      const map = L.map(mapContainer.current, {
        center: [initialCenter.lat, initialCenter.lng],
        zoom: initialZoom,
        zoomControl: true,
        maxZoom: 20,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 20,
        maxNativeZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> katkıda bulunanlar',
      }).addTo(map);

      mapInstance.current = map;

      // Invalidate size shortly after render to ensure proper tile loading in flex containers
      setTimeout(() => {
        map.invalidateSize();
      }, 200);

      if (onMapReady) {
        onMapReady(map);
      }
    } catch (err) {
      console.error("OpenStreetMap loading error:", err);
      if (onMapError) {
        onMapError();
      }
    }
  });

  useEffect(() => {
    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [initMap]);

  return (
    <div
      ref={mapContainer}
      className={cn("w-full h-[500px] z-0 rounded-[1.4rem]", className)}
    />
  );
}
