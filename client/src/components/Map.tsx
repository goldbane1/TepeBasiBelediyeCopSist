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
  initialZoom = 16,
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

      // 1. Yandex Haritalar (Türkiye Kapı Numaraları & Binalar - %100 Ücretsiz, Hesap Gerekmez)
      const yandex = L.tileLayer(
        "https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&scale=1&lang=tr_TR",
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://yandex.com.tr/harita" target="_blank" rel="noreferrer">Yandex Haritalar</a>',
        }
      );

      // 2. Google Haritalar (Yol Görünümü)
      const googleStreets = L.tileLayer(
        "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        {
          maxZoom: 20,
          attribution: "&copy; Google Maps",
        }
      );

      // 3. OpenStreetMap Standart
      const osm = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 20,
          maxNativeZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
        }
      );

      // Varsayılan olarak Yandex Haritalar açılır (Kapı numaraları için)
      yandex.addTo(map);

      // Sağ üstten katman değiştirme (Uydu kaldırıldı)
      L.control
        .layers(
          {
            "Yandex Haritalar (Kapı Nolu)": yandex,
            "Google Haritalar": googleStreets,
            "Açık Harita (OSM)": osm,
          },
          undefined,
          { position: "topright" }
        )
        .addTo(map);

      mapInstance.current = map;

      // Render uyumu için
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
