import OperationsMap, { type MapOperation } from "@/components/OperationsMap";
import { AccessNotice, Field, type AppView } from "@/components/OperationsWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  Camera,
  CheckCircle2,
  Eye,
  Image as ImageIcon,
  LocateFixed,
  MapPin,
  MessageSquareWarning,
  Plus,
  Recycle,
  Search,
  Trash2,
  Wrench,
  X,
  Clock,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import type { Role } from "@/pages/Home";
import { compressImageFile } from "@/lib/imageCompress";


export default function FieldOperations({
  role,
  view,
  containers,
  complaints,
  neighborhoodsList = [],
  refresh,
  onFocusOnMap,
}: {
  role: Role;
  view: AppView;
  containers: any[];
  complaints: any[];
  neighborhoodsList?: any[];
  refresh: () => void;
  onFocusOnMap: (id: number) => void;
}) {
  if (view === "konteyner")
    return (
      <ContainerPanel
        role={role}
        records={containers}
        neighborhoodsList={neighborhoodsList}
        refresh={refresh}
        onFocusOnMap={onFocusOnMap}
      />
    );
  return (
    <ComplaintPanel
      role={role}
      records={complaints}
      neighborhoodsList={neighborhoodsList}
      refresh={refresh}
      onFocusOnMap={onFocusOnMap}
    />
  );
}

function ContainerPanel({
  role,
  records,
  neighborhoodsList,
  refresh,
  onFocusOnMap,
}: {
  role: Role;
  records: any[];
  neighborhoodsList: any[];
  refresh: () => void;
  onFocusOnMap: (id: number) => void;
}) {
  const canRepair = role === "kaynak personeli" || role === "yönetim";
  const [repairNotes, setRepairNotes] = useState<Record<number, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<number | null>(null);

  // Bildirim formu state'i
  const [containerForm, setContainerForm] = useState({
    region: "Tepebaşı",
    neighborhood: "",
    faultType: "kol" as "kol" | "ayak" | "gövde" | "kapak" | "diğer",
    description: "",
    latitude: "39.7767",
    longitude: "30.5206",
    photo: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [locationState, setLocationState] = useState<"idle" | "loading" | "ready">("idle");
  const [resolvedAddress, setResolvedAddress] = useState("");

  const createContainerFault = trpc.operations.containerFaults.create.useMutation({
    onSuccess: () => {
      toast.success("Konteyner arızası bildirimi kaydedildi.");
      refresh();
      setContainerForm({
        region: "Tepebaşı",
        neighborhood: "",
        faultType: "kol",
        description: "",
        latitude: "39.7767",
        longitude: "30.5206",
        photo: "",
      });
      setSearchQuery("");
      setResolvedAddress("");
    },
    onError: e => toast.error(e.message),
  });

  const repair = trpc.operations.containerFaults.repair.useMutation({
    onSuccess: () => {
      toast.success("Konteyner onarımı kaydedildi.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const handleRepair = (id: number) => {
    const note = repairNotes[id]?.trim() || "Kaynak ve parça onarımı tamamlandı.";
    repair.mutate({ id, note });
  };

  // Konum / Adres Arayarak Enlem & Boylam Bulma (Forward Geocoding)
  const searchAddressLocation = async () => {
    const query = searchQuery.trim();
    if (!query) return toast.error("Lütfen aranacak bir adres veya konum yazın.");
    setIsSearching(true);
    try {
      const fullQuery = query.toLowerCase().includes("eskişehir") || query.toLowerCase().includes("tepebaşı")
        ? query
        : `${query}, Tepebaşı, Eskişehir`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&addressdetails=1&limit=1`,
        { headers: { "User-Agent": "TepebasiTemizlikApp/1.0" } }
      );
      if (!response.ok) throw new Error("Arama servisine ulaşılamadı.");
      const data = await response.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        const addr = item.address || {};
        const region = addr.district || addr.county || addr.town || addr.city || "Tepebaşı";
        const neighborhood = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.village || "";

        setContainerForm(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lon.toFixed(6),
          region: region || prev.region,
          neighborhood: neighborhood || prev.neighborhood,
        }));
        setResolvedAddress(item.display_name);
        toast.success(`Konum bulundu: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      } else {
        toast.error("Aradığınız adres için koordinat bulunamadı. Lütfen sokak veya mahalle adını netleştirin.");
      }
    } catch (err: any) {
      toast.error("Adres koordinatı alınamadı: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error("Bu cihaz konum bilgisini desteklemiyor.");
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setContainerForm(current => ({ ...current, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) }));
        setLocationState("ready");
        resolveAddress(latitude, longitude);
      },
      error => {
        setLocationState("idle");
        const message = error.code === error.PERMISSION_DENIED ? "Konum izni verilmedi." : "Hassas konum alınamadı.";
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
    );
  };

  const resolveAddress = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { "User-Agent": "TepebasiTemizlikApp/1.0" } }
      );
      if (!response.ok) return;
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const region = addr.district || addr.county || addr.town || addr.city || "Tepebaşı";
        const neighborhood = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.village || "";
        setContainerForm(current => ({
          ...current,
          region: region || current.region,
          neighborhood: neighborhood || current.neighborhood,
        }));
        setResolvedAddress(data.display_name || `${latitude}, ${longitude}`);
        toast.success("Konum adresi tespit edildi.");
      }
    } catch {
      // Ignored
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen geçerli bir resim seçin.");
      return;
    }
    const compressed = await compressImageFile(file, 1280, 0.75);
    setContainerForm(prev => ({ ...prev, photo: compressed }));
  };


  const submitContainer = (event: FormEvent) => {
    event.preventDefault();
    if (!containerForm.neighborhood.trim()) return toast.error("Lütfen mahalle seçin veya girin.");
    createContainerFault.mutate({
      region: containerForm.region,
      neighborhood: containerForm.neighborhood,
      faultType: containerForm.faultType,
      description: containerForm.description || "",
      latitude: Number(containerForm.latitude),
      longitude: Number(containerForm.longitude),
      photo: containerForm.photo || undefined,
    });
  };

  const openRecords = useMemo(() => records.filter(r => r.status === "bekliyor"), [records]);

  const mapOperations = useMemo<MapOperation[]>(
    () =>
      openRecords.map(record => ({
        id: record.id,
        category: "Konteyner arızası" as const,
        title: `${record.faultType} arızası · ${record.neighborhood}`,
        description: record.description,
        latitude: record.latitude,
        longitude: record.longitude,
        photoUrl: record.photoUrl,
        status: record.status,
        reporterName: record.reporterName,
        extra: record,
      })),
    [openRecords]
  );

  return (
    <div className="space-y-5">
      {/* 1. Sadece Konteyner Arızalarını Gösteren Harita */}
      <Card className="border-0 bg-white shadow-sm p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
            <Recycle className="h-5 w-5 text-emerald-700" />
            Konteyner Arıza Haritası
          </h2>
          <Badge className="bg-amber-50 text-amber-800 border-amber-200 font-bold">
            {openRecords.length} Arıza Bekliyor
          </Badge>
        </div>
        <OperationsMap
          operations={mapOperations}
          initialCategoryFilter="Konteyner arızası"
          showCategoryTabs={false}
          role={role}
          selectedOperationId={selectedPinId}
          onResolveOperation={op => repair.mutate({ id: op.id, note: "Harita üzerinden doğrudan onarıldı." })}
        />
      </Card>

      {/* 2. Konteyner Arızası Bildirim Formu */}
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="font-display flex items-center gap-2 text-base">
            <Plus className="h-5 w-5 text-emerald-700" />
            Yeni Konteyner Arızası Bildir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submitContainer}>
            <Field label="Arıza Türü">
              <select
                className="input-native font-semibold"
                value={containerForm.faultType}
                onChange={e => setContainerForm({ ...containerForm, faultType: e.target.value as typeof containerForm.faultType })}
              >
                <option value="kol">Kaldırma Kolu Arızası</option>
                <option value="ayak">Tekerlek / Ayak Kırığı</option>
                <option value="gövde">Gövde / Sac Delinmesi</option>
                <option value="kapak">Kapak Hasarı</option>
                <option value="diğer">Diğer Kaynak / Boya</option>
              </select>
            </Field>

            <Field label="Mahalle">
              <select
                value={containerForm.neighborhood}
                onChange={e => {
                  const matched = neighborhoodsList.find(n => n.name === e.target.value);
                  setContainerForm({ ...containerForm, neighborhood: e.target.value, region: matched?.region || containerForm.region });
                }}
                className="input-native"
              >
                <option value="">Mahalle seçin</option>
                {neighborhoodsList.map(n => (
                  <option key={n.id} value={n.name}>
                    {n.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Bölge">
              <Input required value={containerForm.region} onChange={e => setContainerForm({ ...containerForm, region: e.target.value })} />
            </Field>

            {/* Konum Arama & GPS Buton Alanı */}
            <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 space-y-2 min-w-0 max-w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Adres veya sokak arayın..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        searchAddressLocation();
                      }
                    }}
                    className="bg-white pl-9 text-xs h-9 w-full min-w-0"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSearching}
                    onClick={searchAddressLocation}
                    className="bg-emerald-700 hover:bg-emerald-800 text-xs h-9 font-semibold text-white flex-1 sm:flex-initial"
                  >
                    <Search className="mr-1.5 h-3.5 w-3.5" />
                    {isSearching ? "Aranıyor..." : "Adresi Bul"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={locationState === "loading"}
                    onClick={useCurrentLocation}
                    className="border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs h-9 bg-white shadow-2xs flex-1 sm:flex-initial"
                  >
                    <LocateFixed className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                    {locationState === "loading" ? "Alınıyor..." : "Anlık Konum"}
                  </Button>
                </div>
              </div>
              {resolvedAddress && (
                <p className="text-[11px] text-emerald-800 font-medium truncate max-w-full overflow-hidden bg-white/90 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                  📍 <strong>Adres:</strong> {resolvedAddress}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 min-w-0 w-full sm:col-span-2 lg:col-span-2">
              <Field label="Enlem">
                <Input required type="number" step="any" value={containerForm.latitude} onChange={e => setContainerForm({ ...containerForm, latitude: e.target.value })} className="w-full min-w-0 text-xs h-9" />
              </Field>
              <Field label="Boylam">
                <Input required type="number" step="any" value={containerForm.longitude} onChange={e => setContainerForm({ ...containerForm, longitude: e.target.value })} className="w-full min-w-0 text-xs h-9" />
              </Field>
            </div>


            <Field label="Fotoğraf (İsteğe Bağlı)">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="text-xs"
                />
                {containerForm.photo && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setContainerForm({ ...containerForm, photo: "" })} className="text-red-600 px-2 h-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Field>

            {containerForm.photo && (
              <div className="sm:col-span-2 lg:col-span-3">
                <img src={containerForm.photo} alt="Önizleme" className="h-20 w-28 rounded-lg object-cover border border-slate-200" />
              </div>
            )}

            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Arıza Açıklaması (İsteğe Bağlı)">
                <Textarea value={containerForm.description} onChange={e => setContainerForm({ ...containerForm, description: e.target.value })} placeholder="Konteynerdeki hasar veya detaylar (isteğe bağlı)..." />
              </Field>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <Button disabled={createContainerFault.isPending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                <Plus className="mr-2 h-4 w-4" />
                {createContainerFault.isPending ? "Kaydediliyor..." : "Arıza Bildirimini Kaydet"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 3. Onarım Bekleyen Kayıtlar Listesi */}
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="font-display flex items-center gap-2 text-base">
            <Wrench className="h-5 w-5 text-amber-600" />
            Konteyner Arıza & Onarım Listesi
          </CardTitle>
          <Badge variant="outline" className="text-slate-600 text-xs font-bold">
            {openRecords.length} Bekleyen Arıza
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {openRecords.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-500">Henüz bildirilmiş bekleyen konteyner arıza kaydı bulunmuyor.</p>
          ) : (
            openRecords.map(record => {
              const isPending = record.status === "bekliyor";

              return (
                <div
                  key={record.id}
                  className={`rounded-xl border p-3.5 transition ${
                    isPending ? "border-amber-200 bg-amber-50/30" : "border-emerald-100 bg-emerald-50/15"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {record.faultType} Arızası · {record.neighborhood}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            isPending
                              ? "border-amber-200 bg-amber-50 text-amber-700 text-[10px]"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]"
                          }
                        >
                          {isPending ? "Onarım Bekliyor" : "Onarım Tamamlandı"}
                        </Badge>
                        {record.photoUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(record.photoUrl)}
                            className="flex items-center gap-1 bg-white text-slate-700 hover:bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-semibold border border-slate-200"
                          >
                            <ImageIcon className="h-3 w-3 text-emerald-700" /> Fotoğraf
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 break-words line-clamp-3 max-w-full overflow-hidden">{record.description}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">

                        <span>📍 {record.region}</span>
                        <span>·</span>
                        <span>📅 {new Date(record.createdAt).toLocaleDateString("tr-TR")}</span>
                        {record.reporterName && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/70">
                              👤 Bildiren: {record.reporterName}
                            </span>
                          </>
                        )}
                        {record.repairNote && <span className="text-emerald-700 font-medium">· 🔧 {record.repairNote}</span>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPinId(record.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50"
                        title="Bu sayfadaki haritada göster"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                        Haritada Gör
                      </Button>

                      {canRepair && isPending && (
                        <div className="flex items-center gap-1.5">
                          <Input
                            placeholder="Onarım notu"
                            value={repairNotes[record.id] || ""}
                            onChange={e => setRepairNotes({ ...repairNotes, [record.id]: e.target.value })}
                            className="h-8 text-xs w-36 bg-white"
                          />
                          <Button
                            size="sm"
                            disabled={repair.isPending}
                            onClick={() => handleRepair(record.id)}
                            className="bg-emerald-700 hover:bg-emerald-800 text-xs h-8"
                          >
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            Tamamla
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Lightbox modal - Top level portal with z-[99999] */}
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
                  Konteyner Görseli
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
                <img src={previewImage} alt="Fotoğraf" className="max-h-[78vh] w-auto max-w-full rounded-lg object-contain shadow-xs" />
              </div>
              <div className="mt-2.5 flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setPreviewImage(null)} className="h-8 text-xs font-semibold px-4">
                  Kapat
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function ComplaintPanel({
  role,
  records,
  neighborhoodsList,
  refresh,
  onFocusOnMap,
}: {
  role: Role;
  records: any[];
  neighborhoodsList: any[];
  refresh: () => void;
  onFocusOnMap: (id: number) => void;
}) {
  const isDriver = role === "şoför";
  const isManager = role === "yönetim";
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<number | null>(null);
  const [resolvingComplaint, setResolvingComplaint] = useState<any | null>(null);
  const [resolutionPhoto, setResolutionPhoto] = useState<string>("");

  const [complaintForm, setComplaintForm] = useState({
    region: "Tepebaşı",
    neighborhood: "",
    description: "",
    latitude: "39.7767",
    longitude: "30.5206",
    photo: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [locationState, setLocationState] = useState<"idle" | "loading" | "ready">("idle");
  const [resolvedAddress, setResolvedAddress] = useState("");

  const createComplaint = trpc.operations.complaints.create.useMutation({
    onSuccess: () => {
      toast.success("Vatandaş şikayeti kaydedildi.");
      refresh();
      setComplaintForm({
        region: "Tepebaşı",
        neighborhood: "",
        description: "",
        latitude: "39.7767",
        longitude: "30.5206",
        photo: "",
      });
      setSearchQuery("");
      setResolvedAddress("");
    },
    onError: e => toast.error(e.message),
  });

  const resolveComplaint = trpc.operations.complaints.resolve.useMutation({
    onSuccess: () => {
      toast.success("Şikayet çözümü fotoğrafla kaydedildi. Yönetici onayı bekleniyor.");
      setResolvingComplaint(null);
      setResolutionPhoto("");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const approveComplaint = trpc.operations.complaints.approve.useMutation({
    onSuccess: () => {
      toast.success("Vatandaş şikayeti onaylandı ve kapatıldı.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const rejectComplaint = trpc.operations.complaints.reject.useMutation({
    onSuccess: () => {
      toast.success("Şikayet reddedildi, tekrar açık duruma getirildi.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  // Konum / Adres Arayarak Enlem & Boylam Bulma (Forward Geocoding)
  const searchAddressLocation = async () => {
    const query = searchQuery.trim();
    if (!query) return toast.error("Lütfen aranacak bir adres veya konum yazın.");
    setIsSearching(true);
    try {
      const fullQuery = query.toLowerCase().includes("eskişehir") || query.toLowerCase().includes("tepebaşı")
        ? query
        : `${query}, Tepebaşı, Eskişehir`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&addressdetails=1&limit=1`,
        { headers: { "User-Agent": "TepebasiTemizlikApp/1.0" } }
      );
      if (!response.ok) throw new Error("Arama servisine ulaşılamadı.");
      const data = await response.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        const addr = item.address || {};
        const region = addr.district || addr.county || addr.town || addr.city || "Tepebaşı";
        const neighborhood = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.village || "";

        setComplaintForm(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lon.toFixed(6),
          region: region || prev.region,
          neighborhood: neighborhood || prev.neighborhood,
        }));
        setResolvedAddress(item.display_name);
        toast.success(`Konum bulundu: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      } else {
        toast.error("Aradığınız adres için koordinat bulunamadı. Lütfen sokak veya mahalle adını netleştirin.");
      }
    } catch (err: any) {
      toast.error("Adres koordinatı alınamadı: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error("Bu cihaz konum bilgisini desteklemiyor.");
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setComplaintForm(current => ({ ...current, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) }));
        setLocationState("ready");
        resolveAddress(latitude, longitude);
      },
      error => {
        setLocationState("idle");
        const message = error.code === error.PERMISSION_DENIED ? "Konum izni verilmedi." : "Konum alınamadı.";
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
    );
  };

  const resolveAddress = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { "User-Agent": "TepebasiTemizlikApp/1.0" } }
      );
      if (!response.ok) return;
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const region = addr.district || addr.county || addr.town || addr.city || "Tepebaşı";
        const neighborhood = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.village || "";
        setComplaintForm(current => ({
          ...current,
          region: region || current.region,
          neighborhood: neighborhood || current.neighborhood,
        }));
        setResolvedAddress(data.display_name || `${latitude}, ${longitude}`);
        toast.success("Konum adresi tespit edildi.");
      }
    } catch {
      // Ignored
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen geçerli bir resim seçin.");
      return;
    }
    const compressed = await compressImageFile(file, 1280, 0.75);
    setComplaintForm(prev => ({ ...prev, photo: compressed }));
  };

  const handleResolutionPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen geçerli bir resim seçin.");
      return;
    }
    const compressed = await compressImageFile(file, 1280, 0.75);
    setResolutionPhoto(compressed);
  };


  const submitComplaint = (event: FormEvent) => {
    event.preventDefault();
    if (!complaintForm.neighborhood.trim()) return toast.error("Lütfen mahalle seçin veya girin.");
    if (!complaintForm.description.trim()) return toast.error("Lütfen şikayet detayını girin.");
    createComplaint.mutate({
      region: complaintForm.region,
      neighborhood: complaintForm.neighborhood,
      description: complaintForm.description,
      latitude: Number(complaintForm.latitude),
      longitude: Number(complaintForm.longitude),
      photo: complaintForm.photo || undefined,
    });
  };

  const openComplaints = useMemo(() => records.filter(c => c.status === "açık"), [records]);
  const pendingApprovalCount = useMemo(() => records.filter(c => c.status === "onay_bekliyor").length, [records]);
  const activeComplaints = useMemo(() => records.filter(c => c.status === "açık" || c.status === "onay_bekliyor"), [records]);

  const mapOperations = useMemo<MapOperation[]>(
    () =>
      records
        .filter(c => c.status === "açık" || c.status === "onay_bekliyor")
        .map(record => ({
          id: record.id,
          category: "Vatandaş şikayeti" as const,
          title: `Şikayet · ${record.neighborhood}`,
          description: record.description,
          latitude: record.latitude,
          longitude: record.longitude,
          photoUrl: record.photoUrl,
          dueAt: record.dueAt,
          status: record.status,
          reporterName: record.reporterName,
          extra: record,
        })),
    [records]
  );

  return (
    <div className="space-y-5">
      {/* 1. Sadece Vatandaş Şikayetlerini Gösteren Harita */}
      <Card className="border-0 bg-white shadow-sm p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquareWarning className="h-5 w-5 text-red-600" />
            Vatandaş Şikayetleri Haritası
          </h2>
          <div className="flex items-center gap-2">
            {pendingApprovalCount > 0 && (
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold">
                ⏳ {pendingApprovalCount} Onay Bekliyor
              </Badge>
            )}
            <Badge className="bg-red-50 text-red-700 border-red-200 font-bold">
              {openComplaints.length} Açık Şikayet
            </Badge>
          </div>
        </div>
        <OperationsMap
          operations={mapOperations}
          initialCategoryFilter="Vatandaş şikayeti"
          showCategoryTabs={false}
          role={role}
          selectedOperationId={selectedPinId}
          onResolveOperation={op => {
            if (isManager && op.status === "onay_bekliyor") {
              approveComplaint.mutate({ id: op.id });
            } else {
              setResolvingComplaint(op.extra || op);
            }
          }}
        />
      </Card>

      {/* 2. Yeni Vatandaş Şikayeti Kayıt Formu - SADECE YÖNETİM İÇİN */}
      {role === "yönetim" && (
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Plus className="h-5 w-5 text-emerald-700" />
              Yeni Vatandaş Şikayeti Kaydet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submitComplaint}>
              <Field label="Mahalle">
                <select
                  value={complaintForm.neighborhood}
                  onChange={e => {
                    const matched = neighborhoodsList.find(n => n.name === e.target.value);
                    setComplaintForm({ ...complaintForm, neighborhood: e.target.value, region: matched?.region || complaintForm.region });
                  }}
                  className="input-native"
                >
                  <option value="">Mahalle seçin</option>
                  {neighborhoodsList.map(n => (
                    <option key={n.id} value={n.name}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Bölge">
                <Input required value={complaintForm.region} onChange={e => setComplaintForm({ ...complaintForm, region: e.target.value })} />
              </Field>

              {/* Konum Arama & GPS Buton Alanı */}
              <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 space-y-2 min-w-0 max-w-full overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Adres veya sokak arayın..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          searchAddressLocation();
                        }
                      }}
                      className="bg-white pl-9 text-xs h-9 w-full min-w-0"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSearching}
                      onClick={searchAddressLocation}
                      className="bg-emerald-700 hover:bg-emerald-800 text-xs h-9 font-semibold text-white flex-1 sm:flex-initial"
                    >
                      <Search className="mr-1.5 h-3.5 w-3.5" />
                      {isSearching ? "Aranıyor..." : "Adresi Bul"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={locationState === "loading"}
                      onClick={useCurrentLocation}
                      className="border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs h-9 bg-white shadow-2xs flex-1 sm:flex-initial"
                    >
                      <LocateFixed className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                      {locationState === "loading" ? "Alınıyor..." : "Anlık Konum"}
                    </Button>
                  </div>
                </div>
                {resolvedAddress && (
                  <p className="text-[11px] text-emerald-800 font-medium truncate max-w-full overflow-hidden bg-white/90 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                    📍 <strong>Adres:</strong> {resolvedAddress}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 min-w-0 w-full sm:col-span-2 lg:col-span-2">
                <Field label="Enlem">
                  <Input required type="number" step="any" value={complaintForm.latitude} onChange={e => setComplaintForm({ ...complaintForm, latitude: e.target.value })} className="w-full min-w-0 text-xs h-9" />
                </Field>
                <Field label="Boylam">
                  <Input required type="number" step="any" value={complaintForm.longitude} onChange={e => setComplaintForm({ ...complaintForm, longitude: e.target.value })} className="w-full min-w-0 text-xs h-9" />
                </Field>
              </div>


              <Field label="Fotoğraf (İsteğe Bağlı)">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="text-xs"
                  />
                  {complaintForm.photo && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => setComplaintForm({ ...complaintForm, photo: "" })} className="text-red-600 px-2 h-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Field>

              {complaintForm.photo && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <img src={complaintForm.photo} alt="Önizleme" className="h-20 w-28 rounded-lg object-cover border border-slate-200" />
                </div>
              )}

              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Şikayet Açıklaması & Sokak Tarifi">
                  <Textarea required value={complaintForm.description} onChange={e => setComplaintForm({ ...complaintForm, description: e.target.value })} placeholder="Vatandaşın bildirdiği durum ve adres tarifi..." />
                </Field>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <Button disabled={createComplaint.isPending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                  <Plus className="mr-2 h-4 w-4" />
                  {createComplaint.isPending ? "Kaydediliyor..." : "Şikayeti Kaydet"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 3. Şikayetler Listesi */}
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="font-display flex items-center gap-2 text-base">
            <MessageSquareWarning className="h-5 w-5 text-red-600" />
            Vatandaş Şikayet Listesi
          </CardTitle>
          <div className="flex items-center gap-2">
            {pendingApprovalCount > 0 && (
              <Badge className="bg-amber-500 text-white font-bold text-xs animate-pulse">
                {pendingApprovalCount} Onay Bekleyen
              </Badge>
            )}
            <Badge variant="outline" className="text-slate-600 text-xs font-bold">
              {activeComplaints.length} Aktif Şikayet
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeComplaints.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-500">Henüz bildirilmiş aktif vatandaş şikayeti bulunmuyor.</p>
          ) : (
            activeComplaints.map(complaint => {
              const isOpen = complaint.status === "açık";
              const isPendingApproval = complaint.status === "onay_bekliyor";
              const isResolved = complaint.status === "onaylandı";
              const isOverdue = isOpen && new Date(complaint.dueAt).getTime() < Date.now();

              return (
                <div
                  key={complaint.id}
                  className={`rounded-xl border p-3.5 transition ${
                    isOverdue
                      ? "border-red-200 bg-red-50/30"
                      : isPendingApproval
                      ? "border-amber-300 bg-amber-50/40"
                      : isOpen
                      ? "border-amber-200 bg-amber-50/20"
                      : "border-emerald-100 bg-emerald-50/15"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {complaint.neighborhood} Şikayeti #{complaint.id}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            isOverdue
                              ? "border-red-300 bg-red-100 text-red-800 text-[10px] font-bold"
                              : isPendingApproval
                              ? "border-amber-400 bg-amber-100 text-amber-900 text-[10px] font-bold"
                              : isOpen
                              ? "border-slate-200 bg-slate-100 text-slate-700 text-[10px]"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold"
                          }
                        >
                          {isOverdue
                            ? "Acil Günü Geçmiş"
                            : isPendingApproval
                            ? "⏳ Yönetici Onayı Bekliyor"
                            : isOpen
                            ? "Müdahale Bekliyor"
                            : "✅ Onaylandı & Kapatıldı"}
                        </Badge>
                        {complaint.photoUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(complaint.photoUrl)}
                            className="flex items-center gap-1 bg-white text-slate-700 hover:bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-semibold border border-slate-200"
                          >
                            <ImageIcon className="h-3 w-3 text-emerald-700" /> Şikayet Fotoğrafı
                          </button>
                        )}
                        {!isOpen && complaint.resolutionPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(complaint.resolutionPhotoUrl)}
                            className="flex items-center gap-1 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 px-2 py-0.5 rounded-md text-[11px] font-bold border border-emerald-300 shadow-2xs"
                          >
                            <Camera className="h-3 w-3 text-emerald-700" /> 📸 Çözüm Fotoğrafı
                          </button>
                        )}

                      </div>
                      <p className="text-xs text-slate-600 break-words line-clamp-3 max-w-full overflow-hidden">{complaint.description}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span>📍 {complaint.region}</span>
                        <span>·</span>
                        <span>📅 {new Date(complaint.createdAt).toLocaleDateString("tr-TR")}</span>
                        {complaint.reporterName && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/70">
                              👤 Bildiren: {complaint.reporterName}
                            </span>
                          </>
                        )}
                        {complaint.resolverName && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              🧹 Çözen Şoför: {complaint.resolverName}
                            </span>
                          </>
                        )}
                        {complaint.acknowledgedByName && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                              🛡️ Onaylayan: {complaint.acknowledgedByName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPinId(complaint.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50"
                        title="Bu sayfadaki haritada göster"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                        Haritada Gör
                      </Button>

                      {/* Şoför Çözüm Butonu (Fotoğraf Yükleme Zorunlu) */}
                      {isDriver && isOpen && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setResolvingComplaint(complaint);
                            setResolutionPhoto("");
                          }}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8 shadow-xs"
                        >
                          <Camera className="mr-1.5 h-3.5 w-3.5" />
                          Çözüm Fotoğrafı Yükle & Kapat
                        </Button>
                      )}

                      {/* Yönetici Onay ve Red Butonları */}
                      {isManager && isPendingApproval && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            disabled={approveComplaint.isPending}
                            onClick={() => approveComplaint.mutate({ id: complaint.id })}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8 font-bold shadow-xs"
                          >
                            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                            Onayla & Kapat
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={rejectComplaint.isPending}
                            onClick={() => rejectComplaint.mutate({ id: complaint.id })}
                            className="border-red-200 text-red-700 hover:bg-red-50 text-xs h-8"
                          >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                            Reddet
                          </Button>
                        </div>
                      )}

                      {/* Yönetici Doğrudan Kapatma (Açık Şikayetler İçin) */}
                      {isManager && isOpen && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setResolvingComplaint(complaint);
                            setResolutionPhoto("");
                          }}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8 shadow-xs"
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Çözümü Tamamla
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* ŞOFÖR ŞİKAYET ÇÖZÜMÜ FOTOĞRAF YÜKLEME MODALI (REACT PORTAL) */}
      {resolvingComplaint && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 popup-transition border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Camera className="h-5 w-5 text-emerald-700" />
                Şikayet Çözüm Fotoğrafı Ekle #{resolvingComplaint.id}
              </h3>
              <button onClick={() => setResolvingComplaint(null)}><X className="h-5 w-5 text-slate-500" /></button>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1 text-xs">
              <p className="font-bold text-slate-800">📍 {resolvingComplaint.neighborhood} ({resolvingComplaint.region})</p>
              <p className="text-slate-600">{resolvingComplaint.description}</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-4 text-center space-y-2">
                <p className="text-xs font-bold text-emerald-950">
                  📸 Temizlik ve Çözüm Sonrası Fotoğraf (Zorunlu)
                </p>
                <p className="text-[11px] text-slate-600 leading-snug">
                  Şikayetin giderildiğini doğrulamak için sahada yapılan müdahalenin fotoğrafını çekin veya yükleyin.
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  required
                  onChange={handleResolutionPhotoUpload}
                  className="bg-white text-xs"
                />
              </div>

              {resolutionPhoto && (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm max-h-56">
                  <img src={resolutionPhoto} alt="Çözüm Önizleme" className="w-full h-48 object-cover" />
                  <button
                    type="button"
                    onClick={() => setResolutionPhoto("")}
                    className="absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-white text-xs shadow-md"
                  >
                    ✕
                  </button>
                </div>
              )}

              <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                ⚠️ Fotoğraf yüklendikten sonra şikayet <strong>yönetici onayına</strong> sunulacak ve yönetici inceleyip onaylayınca tamamen kapatılacaktır.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setResolvingComplaint(null)}>İptal</Button>
                <Button
                  disabled={!resolutionPhoto || resolveComplaint.isPending}
                  onClick={() => resolveComplaint.mutate({ id: resolvingComplaint.id, photo: resolutionPhoto })}
                  className="bg-emerald-700 hover:bg-emerald-800 font-bold"
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  {resolveComplaint.isPending ? "Kaydediliyor..." : "Çözümü Onaya Gönder"}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Lightbox modal - Top level portal with z-[99999] */}
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
                  Şikayet Görseli
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
                <img src={previewImage} alt="Fotoğraf" className="max-h-[78vh] w-auto max-w-full rounded-lg object-contain shadow-xs" />
              </div>
              <div className="mt-2.5 flex justify-end">
                <Button size="sm" variant="outline" onClick={() => setPreviewImage(null)} className="h-8 text-xs font-semibold px-4">
                  Kapat
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
