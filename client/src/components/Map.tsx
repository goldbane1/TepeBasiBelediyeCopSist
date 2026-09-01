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
      // Zoom sınırı: maxZoom 18 ve minZoom 10 ile beyaz ekrana düşmeyi kesin olarak engeller
      const map = L.map(mapContainer.current, {
        center: [initialCenter.lat, initialCenter.lng],
        zoom: initialZoom,
        minZoom: 10,
        maxZoom: 18,
        zoomControl: true,
      });

      // 1. OpenStreetMap Standart - VARSAYILAN AÇILIŞ KATMANI
      const osm = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          minZoom: 10,
          maxZoom: 18,
          maxNativeZoom: 18,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
        }
      );

      // 2. Google Haritalar - Market / İşletme isimleri kaldırılmış sade yol ve bina görünümü
      const googleClean = L.tileLayer(
        "https://mt1.google.com/vt/lyrs=m&apistyle=s.t:33|p.v:off&x={x}&y={y}&z={z}",
        {
          minZoom: 10,
          maxZoom: 18,
          maxNativeZoom: 18,
          attribution: "&copy; Google Maps",
        }
      );

      // Varsayılan olarak OpenStreetMap (OSM) açılır
      osm.addTo(map);

      // Sağ üste sadece OSM ve Google seçenekleri konur (Yandex ve Uydu kaldırıldı)
      L.control
        .layers(
          {
            "Açık Harita (OSM)": osm,
            "Google Haritalar (Sade)": googleClean,
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
