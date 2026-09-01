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
  initialZoom = 16, // Doğrudan sokak ve bina seviyesinde başlar
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

      // 1. CartoDB Voyager: Binaları ve cadde isimlerini en net çizen katman
      const voyager = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 20,
          subdomains: "abcd",
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        }
      );

      // 2. OpenStreetMap Standart
      const osm = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 20,
          maxNativeZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> katkıda bulunanlar',
        }
      );

      // 3. OpenStreetMap France (Bina kapı numaralarını ekstra koyu çizen stil)
      const osmFr = L.tileLayer(
        "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
        {
          maxZoom: 20,
          attribution:
            '&copy; OpenStreetMap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }
      );

      // Varsayılan olarak binaları en net gösteren Voyager eklenir
      voyager.addTo(map);

      // Sağ üste tek tıkla katman değiştirme kontrolü
      L.control
        .layers(
          {
            "Detaylı Binalar (Voyager)": voyager,
            "Kapı No Odaklı (OSM-FR)": osmFr,
            "Standart Harita (OSM)": osm,
          },
          undefined,
          { position: "topright" }
        )
        .addTo(map);

      mapInstance.current = map;

      // Boyut geçersiz kılma (flex kutuları için)
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
