import { MapView } from "@/components/Map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import L from "leaflet";
import { AlertTriangle, Archive, CheckCircle2, Image as ImageIcon, LocateFixed, MapPin, Navigation, Recycle, Wrench, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
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
  activeVehicleType,
  selectedOperationId,
  onResolveOperation,
}: {
  operations: MapOperation[];
  className?: string;
  initialCategoryFilter?: "tümü" | MapOperationCategory;
  showCategoryTabs?: boolean;
  role?: Role;
  activeVehicleType?: "çöp kamyonu" | "damperli kamyon" | null;
  selectedOperationId?: number | null;
  onResolveOperation?: (op: MapOperation) => void;
}) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [mapFailed, setMapFailed] = useState(false);
  const [selected, setSelected] = useState<MapOperation | null>(null);
  const [activeCategory, setActiveCategory] = useState<"tümü" | MapOperationCategory>(initialCategoryFilter);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const locateUser = () => {
    if (!navigator.geolocation) {
      toast.error("Cihazınız konum servisini desteklemiyor.");
      return;
    }
    if (!map) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;

        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
        }

        const userPinHtml = `
          <div class="relative flex items-center justify-center">
            <div class="absolute h-8 w-8 rounded-full bg-sky-500/30 animate-ping"></div>
            <div class="h-6 w-6 rounded-full bg-sky-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-xs font-black">
              🚚
            </div>
          </div>
        `;

        const userIcon = L.divIcon({
          className: "custom-user-marker",
          html: userPinHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([latitude, longitude], { icon: userIcon, title: "Sizin Konumunuz" });
        marker.bindPopup("<div class='text-xs font-bold text-slate-800 p-1'>📍 Şu Anki Konumunuz (Siz)</div>");
        marker.addTo(map);
        userMarkerRef.current = marker;

        map.setView([latitude, longitude], 16, { animate: true });
        toast.success("Konumunuz haritada işaretlendi!");
      },
      err => {
        setIsLocating(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Konum izni verilmedi. Lütfen tarayıcı/cihaz konum iznini açın."
            : "Anlık GPS konumu alınamadı. Lütfen açık alanda tekrar deneyin."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

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

  // Sync selectedOperationId prop: Center map on coordinates without auto-opening popup
  useEffect(() => {
    if (selectedOperationId) {
      const match = operations.find(o => o.id === selectedOperationId);
      if (match && map && Number.isFinite(Number(match.latitude)) && Number.isFinite(Number(match.longitude))) {
        setSelected(null);
        map.setView([Number(match.latitude), Number(match.longitude)], 16, { animate: true });
      }
    }
  }, [selectedOperationId, operations, map]);



  // Haritadaki boş alana dokunulduğunda açık olan detay kartını kapat
  useEffect(() => {
    if (!map) return;
    const handleMapClick = () => setSelected(null);
    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [map]);

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
        iconSize: [28, 28],
        iconAnchor: [14, 14],
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
    if (selected.category === "Damperlik atık") {
      return role === "şoför" && activeVehicleType === "damperli kamyon";
    }
    if (selected.category === "Konteyner arızası" && role === "kaynak personeli") return true;
    if (selected.category === "Vatandaş şikayeti") {
      if (selected.status === "açık" && role === "şoför") return true;
    }
    return false;
  }, [selected, role, activeVehicleType]);




  const selectedReporter = selected?.reporterName || selected?.extra?.reporterName;
  const selectedNeedsExcavator = selected?.requiresExcavator || selected?.extra?.requiresExcavator;
  const selectedResolver = selected?.status !== "açık" ? selected?.extra?.resolverName : undefined;
  const selectedResolutionPhoto = selected?.status !== "açık" ? selected?.extra?.resolutionPhotoUrl : undefined;

  return (
    <div className="space-y-4">
      {/* Category filter tabs */}
      {showCategoryTabs && role !== "kaynak personeli" && (
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
                  "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition shadow-2xs",
                  active
                    ? "bg-emerald-700 text-white shadow-emerald-950/20"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{cat.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                    active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
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
          className="h-[400px] sm:h-[490px]"
          onMapReady={setMap}
          onMapError={() => setMapFailed(true)}
        />

        <div className="absolute left-2 top-2 sm:left-4 sm:top-4 z-10 rounded-xl border border-white/80 bg-white/95 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-medium text-slate-600 shadow-sm backdrop-blur max-w-[calc(100%-1rem)]">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {role === "kaynak personeli" ? (
              <span className="flex items-center gap-1.5 font-bold text-amber-900">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">K</span> Konteyner Arızası (Onarım Bekliyor)
              </span>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>



        {selected && (
          <aside className="popup-transition absolute bottom-2 sm:bottom-4 left-2 right-2 sm:left-4 sm:right-4 z-[400] max-w-md rounded-2xl border border-white/90 bg-white/98 shadow-2xl backdrop-blur-md md:left-auto max-h-[58vh] sm:max-h-[75vh] flex flex-col overflow-hidden">
            {/* 1. Sabit Üst Başlık & Kapatma Butonu (Asla Kaybolmaz ve Kaymaz) */}
            <div className="flex items-center justify-between p-3.5 pb-2.5 border-b border-slate-100/90 bg-white shrink-0">
              <div className="flex items-center gap-2 flex-wrap min-w-0 pr-2">
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                  {selected.category}
                </Badge>
                <span className="text-xs text-slate-400">#{selected.id}</span>
                {selected.category === "Damperlik atık" ? (
                  <span
                    className={cn(
                      "text-[11px] font-bold px-2 py-0.5 rounded-full",
                      isOverdue(selected) ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {isOverdue(selected) ? "Günü Geçmiş" : "İşlem Bekliyor"}
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
                      ? "⏳ Onay Bekliyor"
                      : isOverdue(selected)
                      ? "Acil"
                      : "Müdahale Bekliyor"}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    İşlem Bekliyor
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="h-8 w-8 shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 flex items-center justify-center transition shadow-2xs active:scale-90"
                aria-label="Detayı kapat"
                title="Pini Kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 2. Kaydırılabilir İçerik Alanı */}
            <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 space-y-3">
              <h3 className="text-base font-bold text-slate-900 leading-snug">{selected.title}</h3>
              <p className="text-sm leading-5 text-slate-600 break-words line-clamp-3">
                {selected.description}
              </p>



              {/* Bildiren Şoför / Personel & Kepçe Rozeti & Çözen Bilgisi */}
              {(selectedReporter || selectedNeedsExcavator || selectedResolver) && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
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
                <div className="grid gap-2 sm:grid-cols-2">
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
                          <ImageIcon className="h-3 w-3" /> Fotoğrafı Aç
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

              {/* Alt Aksiyon Butonları */}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openRoute}
                    className="text-emerald-950 bg-white hover:bg-emerald-50 hover:text-emerald-900 border-emerald-300 font-bold text-xs h-8.5 shadow-2xs"
                  >
                    <Navigation className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                    Yol Tarifi Al
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelected(null)}
                    className="text-slate-500 hover:bg-slate-100 text-xs h-8.5 px-2.5"
                  >
                    Kapat
                  </Button>
                </div>

                {canCloseSelected && onResolveOperation && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const target = selected;
                      setSelected(null);
                      onResolveOperation(target);
                    }}
                    className="bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm text-xs h-8.5 font-bold"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    {selected.category === "Damperlik atık"
                      ? "Atığı Topla"
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
          </aside>
        )}

        {/* Floating GPS Button: Pin açıkken çakışmaması için pin açıkken gizlenir */}
        {!selected && (
          <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 z-[400] transition-all">
            <Button
              type="button"
              size="sm"
              disabled={isLocating}
              onClick={locateUser}
              className="rounded-2xl bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300/80 shadow-xl px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 ring-2 ring-emerald-700/10"
            >
              <LocateFixed className={cn("h-4 w-4 text-emerald-700", isLocating && "animate-spin")} />
              <span>{isLocating ? "Konum Alınıyor..." : "Şu Anki Konumumu Göster"}</span>
            </Button>
          </div>
        )}





        {/* Lightbox photo modal - Top level portal with z-[99999] above everything */}
        {previewImage &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
              onClick={() => setPreviewImage(null)}
            >
              <div
                className="relative max-h-[92vh] max-w-3xl overflow-hidden rounded-2xl bg-white p-3 shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-emerald-700" />
                    Görsel İnceleme
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 h-8 w-8 text-slate-700 flex items-center justify-center transition shadow-2xs active:scale-95"
                    title="Kapat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="overflow-auto max-h-[80vh] flex items-center justify-center bg-slate-950/5 rounded-xl p-1">
                  <img
                    src={previewImage}
                    alt="Bildirim Fotoğrafı"
                    className="max-h-[78vh] w-auto max-w-full rounded-lg object-contain shadow-xs"
                  />
                </div>
                <div className="mt-2.5 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewImage(null)}
                    className="h-8 text-xs font-semibold px-4"
                  >
                    Kapat
                  </Button>
                </div>
              </div>
            </div>,
            document.body
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
