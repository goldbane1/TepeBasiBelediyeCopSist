import { MapView } from "@/components/Map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import L from "leaflet";
import { AlertTriangle, Archive, CheckCircle2, Image as ImageIcon, MapPin, Navigation, Recycle, Wrench, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Role } from "@/pages/Home";

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
  className,
  initialCategoryFilter = "tümü",
  showCategoryTabs = true,
  role,
  selectedOperationId,
  onResolveOperation,
}: {
  operations: MapOperation[];
  className?: string;
  initialCategoryFilter?: "tümü" | MapOperationCategory;
  showCategoryTabs?: boolean;
  role?: Role;
  selectedOperationId?: number | null;
  onResolveOperation?: (op: MapOperation) => void;
}) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [selected, setSelected] = useState<MapOperation | null>(null);
  const [activeCategory, setActiveCategory] = useState<"tümü" | MapOperationCategory>(initialCategoryFilter);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [optimisticResolvedKeys, setOptimisticResolvedKeys] = useState<Set<string>>(new Set());
  const markersRef = useRef<L.Marker[]>([]);

  // Filter items by category if selected and exclude optimistically resolved items
  const filteredOperations = useMemo(() => {
    const activeList = operations.filter(op => !optimisticResolvedKeys.has(`${op.category}-${op.id}`));
    if (activeCategory === "tümü") return activeList;
    return activeList.filter(op => op.category === activeCategory);
  }, [operations, activeCategory, optimisticResolvedKeys]);

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
      const match = operations.find(o => o.id === selectedOperationId && !optimisticResolvedKeys.has(`${o.category}-${o.id}`));
      if (match) {
        setSelected(match);
        if (map && Number.isFinite(Number(match.latitude)) && Number.isFinite(Number(match.longitude))) {
          map.setView([Number(match.latitude), Number(match.longitude)], 16, { animate: true });
        }
      }
    }
  }, [selectedOperationId, operations, map, optimisticResolvedKeys]);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Create Leaflet custom markers
    markersRef.current = items.map(operation => {
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
        pinClass = operation.status === "onay_bekliyor"
          ? "operations-map-pin--pending-approval"
          : isOverdue(operation)
          ? "operations-map-pin--overdue"
          : "operations-map-pin--sikayet";
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
  const selectedResolver = selected?.status !== "açık" ? selected?.extra?.resolverName : undefined;
  const selectedResolutionPhoto = selected?.status !== "açık" ? selected?.extra?.resolutionPhotoUrl : undefined;


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
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">D</span> Damperlik Atık (Aktif)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white animate-pulse">D</span> Damperlik Atık (Günü Geçmiş)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">K</span> Konteyner Arızası
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white">V</span> Vatandaş Şikayeti (Açık)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white animate-pulse">V</span> Onay Sürecinde
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
                      ? "bg-purple-100 text-purple-900 border border-purple-300 animate-pulse"
                      : isOverdue(selected)
                      ? "bg-red-100 text-red-700"
                      : "bg-sky-100 text-sky-800"
                  )}
                >
                  {selected.status === "onay_bekliyor"
                    ? "⏳ Yönetici Onayı Bekliyor"
                    : isOverdue(selected)
                    ? "Günü Geçmiş (Acil)"
                    : "Müdahale Bekliyor"}
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
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
