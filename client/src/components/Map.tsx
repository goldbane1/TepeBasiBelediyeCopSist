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
  initialCenter = { lat: 39.7767, lng: 30.5206 }, // Tepebaşı, Eskişehir
  initialZoom = 15,
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
        maxZoom: 20,
        zoomControl: true,
      });

      // 1. OpenStreetMap Standart - %100 Ücretsiz, Sıfır Filigran
      const osm = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 20,
          maxNativeZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
        }
      );

      // 2. OpenStreetMap France - Bina ve sokak hatlarını koyu çizen %100 Ücretsiz Katman
      const osmFr = L.tileLayer(
        "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
        {
          maxZoom: 20,
          maxNativeZoom: 19,
          attribution:
            '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }
      );

      // Standart temiz OSM katmanı varsayılan olarak eklenir (Kesinlikle filigran YOK)
      osm.addTo(map);

      // Sağ üste temiz katman değiştirici
      L.control
        .layers(
          {
            "Standart Harita": osm,
            "Detaylı Sokak & Kapı No (OSM-FR)": osmFr,
          },
          undefined,
          { position: "topright" }
        )
        .addTo(map);

      mapInstance.current = map;

      // Boyut geçersiz kılma (render uyumu için)
      setTimeout(() => {
        map.invalidateSize();
      }, 200);

      if (onMapReady) {
        onMapReady(map);
      }
    } catch (err) {
      console.error("Harita yükleme hatası:", err);
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
