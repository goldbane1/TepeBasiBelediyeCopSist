import { MapView } from "@/components/Map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import L from "leaflet";
import { AlertTriangle, Archive, CheckCircle2, Image as ImageIcon, MapPin, Navigation, Recycle, Truck, Wrench, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Role } from "@/pages/Home";

export const NEIGHBORHOOD_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Batıkent Mahallesi": { lat: 39.8015, lng: 30.4855 },
  "Çamlıca Mahallesi": { lat: 39.7860, lng: 30.4720 },
  "Şirintepe Mahallesi": { lat: 39.7970, lng: 30.5050 },
  "Uluönder Mahallesi": { lat: 39.8030, lng: 30.5120 },
  "Ertuğrulgazi Mahallesi": { lat: 39.7750, lng: 30.4900 },
  "Bahçelievler Mahallesi": { lat: 39.7820, lng: 30.5080 },
  "Eskibağlar Mahallesi": { lat: 39.7850, lng: 30.5180 },
  "Yenibağlar Mahallesi": { lat: 39.7910, lng: 30.5150 },
  "Güllük Mahallesi": { lat: 39.7800, lng: 30.5220 },
  "Hacı Seyit Mahallesi": { lat: 39.7780, lng: 30.5250 },
  "Işıklar Mahallesi": { lat: 39.7850, lng: 30.5280 },
  "Mamure Mahallesi": { lat: 39.7800, lng: 30.5320 },
  "Mustafa Kemal Paşa Mahallesi": { lat: 39.7750, lng: 30.5150 },
  "Ömerağa Mahallesi": { lat: 39.7720, lng: 30.5250 },
  "Sümer Mahallesi": { lat: 39.7650, lng: 30.5150 },
  "Fatih Mahallesi": { lat: 39.8020, lng: 30.5350 },
  "Kumlubel Mahallesi": { lat: 39.7950, lng: 30.5380 },
  "Sütlüce Mahallesi": { lat: 39.8140, lng: 30.5380 },
  "Tunalı Mahallesi": { lat: 39.7840, lng: 30.5350 },
  "Yeşiltepe Mahallesi": { lat: 39.8090, lng: 30.5250 },
  "Zafer Mahallesi": { lat: 39.7900, lng: 30.5450 },
  "Aşağı Söğütönü Mahallesi": { lat: 39.8250, lng: 30.4600 },
  "Yukarı Söğütönü Mahallesi": { lat: 39.8350, lng: 30.4400 },
  "Keskin Mahallesi": { lat: 39.8700, lng: 30.4800 },
  "Satılmışoğlu Mahallesi": { lat: 39.8900, lng: 30.5400 },
};

export function getNeighborhoodCoordinates(name: string): { lat: number; lng: number } {
  if (NEIGHBORHOOD_COORDINATES[name]) return NEIGHBORHOOD_COORDINATES[name];
  const cleaned = name.replace(/Mahallesi|Mah\.|Mah/gi, "").trim().toLowerCase();
  for (const [key, coords] of Object.entries(NEIGHBORHOOD_COORDINATES)) {
    const keyCleaned = key.replace(/Mahallesi|Mah\.|Mah/gi, "").trim().toLowerCase();
    if (keyCleaned.includes(cleaned) || cleaned.includes(keyCleaned)) {
      return coords;
    }
  }
  return { lat: 39.7767, lng: 30.5206 };
}

export type MapOperationCategory =
  | "Damperlik atık"
  | "Konteyner arızası"
  | "Vatandaş şikayeti"
  | "Aktif mesai";

export type MapOperation = {
  id: number;
  category: MapOperationCategory;
  title: string;
  description: string;
  latitude: string;
  longitude: string;
  photoUrl?: string | null;
  dueAt?: Date | string;
  status: string;
  reporterName?: string | null;
  requiresExcavator?: boolean;
  extra?: Record<string, any>;
};

function isOverdue(operation: MapOperation) {
  if (["toplandı", "onarım_tamamlandı", "onaylandı"].includes(operation.status)) return false;
  if (!operation.dueAt) return false;
  return new Date(operation.dueAt).getTime() < Date.now();
}

export default function OperationsMap({
  operations,
  activeShifts = [],
  className,
  initialCategoryFilter = "tümü",
  showCategoryTabs = true,
  role,
  selectedOperationId,
  onResolveOperation,
}: {
  operations: MapOperation[];
  activeShifts?: any[];
  className?: string;
  initialCategoryFilter?: "tümü" | MapOperationCategory | "mesailer";
  showCategoryTabs?: boolean;
  role?: Role;
  selectedOperationId?: number | null;
  onResolveOperation?: (op: MapOperation) => void;
}) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [selected, setSelected] = useState<MapOperation | null>(null);
  const [activeCategory, setActiveCategory] = useState<"tümü" | MapOperationCategory | "mesailer">(initialCategoryFilter);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [optimisticResolvedKeys, setOptimisticResolvedKeys] = useState<Set<string>>(new Set());
  const markersRef = useRef<L.Marker[]>([]);
  const circlesRef = useRef<L.Circle[]>([]);

  // Convert activeShifts to MapOperations
  const shiftOperations = useMemo<MapOperation[]>(() => {
    return activeShifts.map((shift: any) => {
      const coords = getNeighborhoodCoordinates(shift.neighborhood || "");
      return {
        id: -Number(shift.id || 1),
        category: "Aktif mesai" as MapOperationCategory,
        title: `${shift.neighborhood || "Mahalle"} (Aktif Mesai)`,
        description: `Şoför: ${shift.driverName || "Şoför"} · Araç: ${shift.vehiclePlate || "—"} (${shift.vehicleType || "Kamyon"}) · Vardiya: ${shift.shiftHours || "08:00 - 16:00"}`,
        latitude: coords.lat.toString(),
        longitude: coords.lng.toString(),
        status: "açık",
        extra: shift,
      };
    });
  }, [activeShifts]);

  // Combine regular operations and shift operations
  const allMapItems = useMemo(() => {
    return [...operations, ...shiftOperations];
  }, [operations, shiftOperations]);

  // Filter items by category if selected and exclude optimistically resolved items
  const filteredOperations = useMemo(() => {
    const activeList = allMapItems.filter(op => !optimisticResolvedKeys.has(`${op.category}-${op.id}`));
    if (activeCategory === "tümü") return activeList;
    if (activeCategory === "mesailer" || activeCategory === "Aktif mesai") {
      return activeList.filter(op => op.category === "Aktif mesai");
    }
    return activeList.filter(op => op.category === activeCategory);
  }, [allMapItems, activeCategory, optimisticResolvedKeys]);

  const items = useMemo(
    () =>
      filteredOperations.filter(
        item =>
          Number.isFinite(Number(item.latitude)) &&
          Number.isFinite(Number(item.longitude))
      ),
    [filteredOperations]
  );

  // Sync selectedOperationId prop
  useEffect(() => {
    if (selectedOperationId) {
      const match = allMapItems.find(o => o.id === selectedOperationId && !optimisticResolvedKeys.has(`${o.category}-${o.id}`));
      if (match) {
        setSelected(match);
        if (map && Number.isFinite(Number(match.latitude)) && Number.isFinite(Number(match.longitude))) {
          map.setView([Number(match.latitude), Number(match.longitude)], 16, { animate: true });
        }
      }
    }
  }, [selectedOperationId, allMapItems, map, optimisticResolvedKeys]);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers & circles
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    circlesRef.current.forEach(circle => circle.remove());
    circlesRef.current = [];

    // Create Leaflet custom markers and circles
    markersRef.current = items.map(operation => {
      const isShift = operation.category === "Aktif mesai";

      if (isShift) {
        // Draw green halo circle around neighborhood
        const circle = L.circle(
          [Number(operation.latitude), Number(operation.longitude)],
          {
            radius: 600,
            color: "#059669",
            fillColor: "#10b981",
            fillOpacity: 0.16,
            weight: 2.5,
            dashArray: "5, 8",
          }
        ).addTo(map);
        circlesRef.current.push(circle);

        const shiftHtml = `
          <div class="relative flex flex-col items-center cursor-pointer pointer-events-auto">
            <div class="operations-map-pin operations-map-pin--shift shadow-xl flex items-center justify-center">
              🚚
            </div>
            <div class="mt-1 whitespace-nowrap rounded-lg bg-emerald-950/95 px-2 py-0.5 text-[10.5px] font-bold text-white shadow-md border border-emerald-400/50 backdrop-blur-xs flex items-center gap-1.5">
              <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>${operation.extra?.neighborhood || operation.title.split("(")[0].trim()}</span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: "custom-leaflet-marker",
          html: shiftHtml,
          iconSize: [40, 50],
          iconAnchor: [20, 20],
        });

        const marker = L.marker(
          [Number(operation.latitude), Number(operation.longitude)],
          {
            icon: customIcon,
            title: operation.title,
            zIndexOffset: 1000,
          }
        );

        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          setSelected(operation);
          map.panTo([Number(operation.latitude), Number(operation.longitude)], { animate: true });
        });
        marker.addTo(map);
        return marker;
      }

      let pinClass = "operations-map-pin--active";
      let categorySymbol = "•";

      if (operation.category === "Damperlik atık") {
        categorySymbol = "D";
        pinClass = isOverdue(operation)
          ? "operations-map-pin--overdue"
          : "operations-map-pin--damper";
      } else if (operation.category === "Konteyner arızası") {
        categorySymbol = "K";
        pinClass = "operations-map-pin--ariza";
      } else if (operation.category === "Vatandaş şikayeti") {
        categorySymbol = "V";
        pinClass = "operations-map-pin--sikayet";
      }

      const pinHtml = `<div class="operations-map-pin ${pinClass}">${categorySymbol}</div>`;

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

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        setSelected(operation);
        map.panTo([Number(operation.latitude), Number(operation.longitude)], { animate: true });
      });
      marker.addTo(map);
      return marker;
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      circlesRef.current.forEach(circle => circle.remove());
      circlesRef.current = [];
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
    { key: "tümü", label: "Tüm Harita", count: allMapItems.length, icon: MapPin },
    ...(shiftOperations.length > 0
      ? [{ key: "mesailer", label: "Aktif Mesailer", count: shiftOperations.length, icon: Truck }]
      : []),
    { key: "Damperlik atık", label: "Damperlik Atık", count: operations.filter(o => o.category === "Damperlik atık").length, icon: Archive },
    { key: "Konteyner arızası", label: "Konteyner Arızaları", count: operations.filter(o => o.category === "Konteyner arızası").length, icon: Recycle },
    { key: "Vatandaş şikayeti", label: "Vatandaş Şikayetleri", count: operations.filter(o => o.category === "Vatandaş şikayeti").length, icon: AlertTriangle },
  ] as const;

  const canCloseSelected = useMemo(() => {
    if (!selected) return false;
    const isPending = !["toplandı", "onarım_tamamlandı", "onaylandı"].includes(selected.status);
    if (!isPending) return false;
    if (role === "yönetim") return true;
    if (selected.category === "Damperlik atık" && (role === "şoför" || role === "kademe personeli")) return true;
    if (selected.category === "Konteyner arızası" && (role === "kaynak personeli" || role === "şoför" || role === "kademe personeli")) return true;
    if (selected.category === "Vatandaş şikayeti") {
      if (selected.status === "açık" && role === "şoför") return true;
    }
    return false;
  }, [selected, role]);

  const selectedReporter = selected?.reporterName || selected?.extra?.reporterName;
  const selectedNeedsExcavator = selected?.requiresExcavator || selected?.extra?.requiresExcavator;
  const selectedResolver = selected?.extra?.resolverName;
  const selectedResolutionPhoto = selected?.extra?.resolutionPhotoUrl;

  return (
    <div className={cn("space-y-3", className)}>
      {showCategoryTabs && (
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => {
            const Icon = cat.icon;
            const active = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.key as any);
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
            <span className="flex items-center gap-1.5 font-semibold text-emerald-950 bg-emerald-50/80 px-2 py-0.5 rounded-lg border border-emerald-200">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-bold text-white">🚚</span> Aktif Mesai Sürdürülen Mahalle
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">D</span> Damperlik Atık
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white animate-pulse">D</span> Damperlik Atık (Acil)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">K</span> Konteyner Arızası
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">V</span> Vatandaş Şikayeti
            </span>
          </div>
        </div>

        {selected && (
          <aside className="popup-transition absolute bottom-4 left-4 right-4 z-10 max-w-md rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl backdrop-blur md:left-auto">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              aria-label="Detayı kapat"
            >
              <X className="h-4 w-4" />
            </button>

            {selected.category === "Aktif mesai" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-700 text-white font-bold text-xs flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5" />
                    Aktif Temizlik Mesaisi
                  </Badge>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping" />
                    Saha Görevi Sürüyor
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{selected.extra?.neighborhood || selected.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">Tepebaşı Belediyesi Temizlik İşleri Sahası</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Görevli Şoför</span>
                    <span className="font-bold text-slate-800">{selected.extra?.driverName || "Şoför"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Görevli Araç</span>
                    <span className="font-bold text-slate-800">{selected.extra?.vehiclePlate || "—"} ({selected.extra?.vehicleType || "Kamyon"})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Vardiya</span>
                    <span className="font-bold text-slate-800">{selected.extra?.shiftHours || "08:00 - 16:00"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Başlangıç KM</span>
                    <span className="font-bold text-slate-800">{selected.extra?.startKm ? `${selected.extra?.startKm} km` : "—"}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openRoute}
                    className="text-slate-700 hover:bg-slate-100 w-full"
                  >
                    <Navigation className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    Mahalleye Yol Tarifi Al
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-2 flex items-center gap-2 pr-7">
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                    {selected.category}
                  </Badge>
                  <span className="text-xs text-slate-400">Kayıt #{selected.id}</span>
                  {selected.category === "Damperlik atık" ? (
                    <span
                      className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full",
                        isOverdue(selected) ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                      )}
                    >
                      {isOverdue(selected) ? "Günü Geçmiş (Acil)" : "İşlem Bekliyor"}
                    </span>
                  ) : selected.category === "Vatandaş şikayeti" ? (
                    <span
                      className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full",
                        selected.status === "onay_bekliyor"
                          ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                          : isOverdue(selected)
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {selected.status === "onay_bekliyor"
                        ? "⏳ Yönetici Onayı Bekliyor"
                        : isOverdue(selected)
                        ? "Günü Geçmiş (Acil)"
                        : "Müdahale Bekliyor"}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      İşlem Bekliyor
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900">{selected.title}</h3>
                <p className="mt-1 text-sm leading-5 text-slate-600">
                  {selected.description}
                </p>

                {/* Bildiren Şoför / Personel & Kepçe Rozeti & Çözen Bilgisi */}
                {(selectedReporter || selectedNeedsExcavator || selectedResolver) && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                    {selectedReporter && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 border border-slate-200/80">
                        👤 Bildiren: {selectedReporter}
                      </span>
                    )}
                    {selectedNeedsExcavator && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 font-bold text-amber-900 border border-amber-300">
                        🚜 Kepçe Gerekli
                      </span>
                    )}
                    {selectedResolver && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-900 border border-emerald-300">
                        🧹 Çözen: {selectedResolver}
                      </span>
                    )}
                  </div>
                )}

                {/* Photo previews if available */}
                {(selected.photoUrl || selectedResolutionPhoto) && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {selected.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(selected.photoUrl || null)}
                        className="group relative block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left"
                      >
                        <img
                          src={selected.photoUrl}
                          alt={selected.title}
                          className="h-28 w-full object-cover transition group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                          <span className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-semibold text-white">
                            <ImageIcon className="h-3 w-3" /> Şikayet Foto
                          </span>
                        </div>
                      </button>
                    )}
                    {selectedResolutionPhoto && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(selectedResolutionPhoto || null)}
                        className="group relative block w-full overflow-hidden rounded-xl border border-emerald-300 bg-emerald-50 text-left"
                      >
                        <img
                          src={selectedResolutionPhoto}
                          alt="Çözüm Fotoğrafı"
                          className="h-28 w-full object-cover transition group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                          <span className="flex items-center gap-1.5 rounded-lg bg-emerald-900/80 px-2 py-1 text-[11px] font-bold text-white">
                            📸 Çözüm Foto
                          </span>
                        </div>
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openRoute}
                    className="text-slate-700 hover:bg-slate-100"
                  >
                    <Navigation className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                    Navigasyon Rota
                  </Button>

                  {canCloseSelected && onResolveOperation && (
                    <Button
                      size="sm"
                      onClick={() => {
                        const target = selected;
                        setSelected(null);
                        setOptimisticResolvedKeys(prev => new Set(prev).add(`${target.category}-${target.id}`));
                        onResolveOperation(target);
                      }}
                      className="bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm"
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      {selected.category === "Damperlik atık"
                        ? "Atığı Topla & Kapat"
                        : selected.category === "Konteyner arızası"
                        ? "Onarımı Tamamla"
                        : selected.status === "onay_bekliyor"
                        ? "Onayla & Kapat"
                        : role === "şoför"
                        ? "Çözüm Fotoğrafı Yükle"
                        : "Şikayeti Kapat"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Lightbox photo modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl bg-white p-2">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black"
              >
                <X className="h-5 w-5" />
              </button>
              <img
                src={previewImage}
                alt="Bildirim Fotoğrafı"
                className="max-h-[80vh] w-auto rounded-xl object-contain"
              />
            </div>
          </div>
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
