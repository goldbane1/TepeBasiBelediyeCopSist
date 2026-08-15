import { MapView } from "@/components/Map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import L from "leaflet";
import { AlertTriangle, Archive, MapPin, Navigation, Recycle, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type MapOperationCategory =
  | "Damperlik atık"
  | "Konteyner arızası"
  | "Vatandaş şikayeti";

export type MapOperation = {
  id: number;
  category: MapOperationCategory;
  title: string;
  description: string;
  latitude: string;
  longitude: string;
  dueAt?: Date;
  status: string;
};

function isOverdue(operation: MapOperation) {
  return Boolean(
    operation.dueAt &&
      new Date(operation.dueAt).getTime() < Date.now() &&
      !["toplandı", "onarım_tamamlandı", "onaylandı"].includes(operation.status)
  );
}

export default function OperationsMap({
  operations,
  className,
  initialCategoryFilter = "tümü",
  showCategoryTabs = true,
}: {
  operations: MapOperation[];
  className?: string;
  initialCategoryFilter?: "tümü" | MapOperationCategory;
  showCategoryTabs?: boolean;
}) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [selected, setSelected] = useState<MapOperation | null>(null);
  const [activeCategory, setActiveCategory] = useState<"tümü" | MapOperationCategory>(initialCategoryFilter);
  const markersRef = useRef<L.Marker[]>([]);

  // Filter items by category if selected
  const filteredOperations = useMemo(() => {
    if (activeCategory === "tümü") return operations;
    return operations.filter(op => op.category === activeCategory);
  }, [operations, activeCategory]);

  const items = useMemo(
    () =>
      filteredOperations.filter(
        item =>
          Number.isFinite(Number(item.latitude)) &&
          Number.isFinite(Number(item.longitude))
      ),
    [filteredOperations]
  );

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Create open source Leaflet custom markers
    markersRef.current = items.map(operation => {
      const overdue = isOverdue(operation);
      let pinClass = "operations-map-pin--active";
      let categorySymbol = "•";

      if (overdue) {
        pinClass = "operations-map-pin--overdue";
      } else if (operation.category === "Damperlik atık") {
        pinClass = "operations-map-pin--damper";
        categorySymbol = "D";
      } else if (operation.category === "Konteyner arızası") {
        pinClass = "operations-map-pin--ariza";
        categorySymbol = "K";
      } else if (operation.category === "Vatandaş şikayeti") {
        pinClass = "operations-map-pin--sikayet";
        categorySymbol = "Ş";
      }

      const pinHtml = `<button type="button" class="operations-map-pin ${pinClass}" aria-label="${operation.category}: ${operation.title}"><span>${categorySymbol}</span></button>`;

      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: pinHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker(
        [Number(operation.latitude), Number(operation.longitude)],
        {
          icon: customIcon,
          title: operation.title,
        }
      );

      marker.on("click", () => setSelected(operation));
      marker.addTo(map);
      return marker;
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [map, items]);

  const openRoute = () => {
    if (!selected) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${selected.latitude},${selected.longitude}`)}&travelmode=driving`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const categories = [
    { key: "tümü", label: "Tüm Harita", count: operations.length, icon: MapPin },
    { key: "Damperlik atık", label: "Damperlik Atık", count: operations.filter(o => o.category === "Damperlik atık").length, icon: Archive },
    { key: "Konteyner arızası", label: "Konteyner Arızaları", count: operations.filter(o => o.category === "Konteyner arızası").length, icon: Recycle },
    { key: "Vatandaş şikayeti", label: "Vatandaş Şikayetleri", count: operations.filter(o => o.category === "Vatandaş şikayeti").length, icon: AlertTriangle },
  ] as const;

  return (
    <div className={cn("space-y-3", className)}>
      {showCategoryTabs && (
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const Icon = cat.icon;
            const active = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.key);
                  setSelected(null);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition shadow-sm border",
                  active
                    ? "bg-emerald-700 text-white border-emerald-800 shadow-emerald-900/10"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  )}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="relative overflow-hidden rounded-[1.4rem] border border-slate-200 bg-slate-100">
        <MapView
          initialCenter={{ lat: 39.7767, lng: 30.5206 }}
          initialZoom={13}
          className="h-[490px]"
          onMapReady={setMap}
          onMapError={() => setMapFailed(true)}
        />

        <div className="absolute left-4 top-4 z-10 rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <i className="legend-dot legend-dot--green" /> Günü geçmemiş / Aktif
            </span>
            <span className="flex items-center gap-1.5">
              <i className="legend-dot legend-dot--red" /> Günü geçmiş
            </span>
          </div>
        </div>

        {selected && (
          <aside className="absolute bottom-4 left-4 right-4 z-10 max-w-md rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl backdrop-blur md:left-auto">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              aria-label="Detayı kapat"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-2 flex items-center gap-2 pr-7">
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                {selected.category}
              </Badge>
              <span className="text-xs text-slate-400">Kayıt #{selected.id}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">{selected.title}</h3>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              {selected.description}
            </p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span
                className={cn(
                  "text-xs font-semibold",
                  isOverdue(selected) ? "text-red-600" : "text-emerald-700"
                )}
              >
                {isOverdue(selected) ? "Günü geçmiş" : "İşlem bekliyor / Aktif"}
              </span>
              <Button
                size="sm"
                onClick={openRoute}
                className="bg-emerald-700 hover:bg-emerald-800"
              >
                <Navigation className="mr-1.5 h-3.5 w-3.5" />
                Rota aç
              </Button>
            </div>
          </aside>
        )}

        {mapFailed ? (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/10 p-6 text-center">
            <div className="max-w-sm rounded-2xl bg-white/95 p-5 text-sm font-medium text-slate-600 shadow-lg">
              Harita hizmeti yüklenemedi. Konumlar ve rota yönlendirmesi bağlantı
              sağlandığında görünür.
            </div>
          </div>
        ) : (
          items.length === 0 && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center">
              <div className="rounded-2xl bg-white/95 p-5 text-sm font-medium text-slate-600 shadow-lg">
                Seçili kategoride gösterilecek harita kaydı bulunmuyor.
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
