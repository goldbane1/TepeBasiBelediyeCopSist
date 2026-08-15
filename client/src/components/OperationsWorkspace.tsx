import OperationsMap, { type MapOperation, type MapOperationCategory } from "@/components/OperationsMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { Archive, AlertTriangle, CheckCircle2, ClipboardCheck, FileBarChart, Gauge, LocateFixed, Map, MapPin, Plus, Truck, Wrench, Recycle } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { Role } from "@/pages/Home";
import FleetOperations from "@/components/FleetOperations";
import FieldOperations from "@/components/FieldOperations";
import ManagementOperations from "@/components/ManagementOperations";

export type AppView =
  | "dashboard"
  | "mesai"
  | "harita"
  | "damperlik-çözüm"
  | "araçlar"
  | "araç-arızaları"
  | "konteyner"
  | "şikayetler"
  | "raporlar"
  | "personel";

type Props = { role: Role; view: AppView; onNavigate: (view: AppView) => void };

const EMPTY_SUMMARY = { vehicleCount: 0, activeShiftCount: 0, pendingWasteCount: 0, overdueComplaintCount: 0 };

export default function OperationsWorkspace({ role, view, onNavigate }: Props) {
  const isDriver = role === "şoför";
  const isManager = role === "yönetim";
  const utils = trpc.useUtils();
  const summary = trpc.operations.summary.useQuery();
  const vehicles = trpc.operations.vehicles.list.useQuery();
  const faults = trpc.operations.vehicleFaults.list.useQuery(undefined, { enabled: isDriver || role === "kademe personeli" || isManager });
  const waste = trpc.operations.bulkWaste.list.useQuery(undefined, { enabled: isDriver || isManager });
  const containers = trpc.operations.containerFaults.list.useQuery(undefined, { enabled: isDriver || role === "kaynak personeli" || isManager });
  const complaints = trpc.operations.complaints.list.useQuery(undefined, { enabled: isDriver || isManager });
  const shifts = trpc.operations.shifts.list.useQuery(undefined, { enabled: isManager });
  const logs = trpc.operations.reports.auditLogs.useQuery(undefined, { enabled: isManager });
  const users = trpc.operations.users.list.useQuery(undefined, { enabled: isManager });

  const refresh = () => {
    void utils.operations.summary.invalidate();
    void utils.operations.vehicles.list.invalidate();
    void utils.operations.vehicleFaults.list.invalidate();
    void utils.operations.bulkWaste.list.invalidate();
    void utils.operations.containerFaults.list.invalidate();
    void utils.operations.complaints.list.invalidate();
    void utils.operations.shifts.list.invalidate();
    void utils.operations.reports.auditLogs.invalidate();
  };

  const mapOperations = useMemo<MapOperation[]>(() => [
    ...(waste.data ?? [])
      .filter(item => item.status === "bekliyor")
      .map(item => ({
        id: item.id,
        category: "Damperlik atık" as const,
        title: `${item.wasteType} · ${item.neighborhood}`,
        description: item.description,
        latitude: item.latitude,
        longitude: item.longitude,
        dueAt: item.dueAt,
        status: item.status,
      })),
    ...(containers.data ?? [])
      .filter(item => item.status === "bekliyor")
      .map(item => ({
        id: item.id,
        category: "Konteyner arızası" as const,
        title: `${item.faultType} arızası · ${item.neighborhood}`,
        description: item.description,
        latitude: item.latitude,
        longitude: item.longitude,
        status: item.status,
      })),
    ...(complaints.data ?? [])
      .filter(item => item.status === "açık")
      .map(item => ({
        id: item.id,
        category: "Vatandaş şikayeti" as const,
        title: `Şikayet · ${item.neighborhood}`,
        description: item.description,
        latitude: item.latitude,
        longitude: item.longitude,
        dueAt: item.dueAt,
        status: item.status,
      })),
  ], [waste.data, containers.data, complaints.data]);

  if (view === "dashboard")
    return (
      <Dashboard
        role={role}
        summary={summary.data ?? EMPTY_SUMMARY}
        openFaults={(faults.data ?? []).filter(fault => fault.status === "kademe_onayı_bekliyor").length}
        onNavigate={onNavigate}
      />
    );

  if (view === "mesai") return <ShiftPanel role={role} vehicles={vehicles.data ?? []} refresh={refresh} />;

  if (view === "harita")
    return <MapPanel role={role} operations={mapOperations} vehicles={vehicles.data ?? []} refresh={refresh} filterCategory="tümü" />;

  if (view === "damperlik-çözüm")
    return <BulkWasteSolutionPanel role={role} operations={mapOperations} wasteList={waste.data ?? []} vehicles={vehicles.data ?? []} refresh={refresh} />;

  if (view === "araçlar" || view === "araç-arızaları")
    return <FleetOperations role={role} view={view} vehicles={vehicles.data ?? []} faults={faults.data ?? []} refresh={refresh} />;

  if (view === "konteyner" || view === "şikayetler")
    return <FieldOperations role={role} view={view} containers={containers.data ?? []} complaints={complaints.data ?? []} refresh={refresh} />;

  return (
    <ManagementOperations
      view={view}
      role={role}
      shifts={shifts.data ?? []}
      complaints={complaints.data ?? []}
      logs={logs.data ?? []}
      users={users.data ?? []}
      refresh={refresh}
    />
  );
}

function Dashboard({ role, summary, openFaults, onNavigate }: { role: Role; summary: typeof EMPTY_SUMMARY; openFaults: number; onNavigate: Props["onNavigate"] }) {
  const cards = [
    { label: "Kayıtlı araç", value: summary.vehicleCount, icon: Truck, tone: "text-emerald-700 bg-emerald-50" },
    { label: "Açık mesai", value: summary.activeShiftCount, icon: Gauge, tone: "text-sky-700 bg-sky-50" },
    { label: "Bekleyen damperlik atık", value: summary.pendingWasteCount, icon: Archive, tone: "text-amber-700 bg-amber-50" },
    { label: "Günü geçen şikayet", value: summary.overdueComplaintCount, icon: AlertTriangle, tone: "text-red-700 bg-red-50" },
  ];
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-emerald-800 via-emerald-700 to-[#0d5e43] p-6 text-white shadow-xl shadow-emerald-950/10 md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Badge className="bg-white/15 text-emerald-50 hover:bg-white/15">{role}</Badge>
            <h2 className="mt-4 max-w-xl font-display text-3xl font-bold leading-tight">Sahadaki operasyonları tek ekrandan yönetin.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100">
              Bildirilen atıklar, konteyner arızaları ve şikayetler operasyon haritasında canlı izlenir.
            </p>
          </div>
          <Button onClick={() => onNavigate(role === "şoför" ? "mesai" : "harita")} className="bg-white text-emerald-800 hover:bg-emerald-50">
            {role === "şoför" ? <ClipboardCheck className="mr-2 h-4 w-4" /> : <Map className="mr-2 h-4 w-4" />}
            {role === "şoför" ? "Mesai işlemleri" : "Haritayı aç"}
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => (
          <Card key={card.label} className="border-0 bg-white shadow-sm">
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-2 font-display text-3xl font-bold text-slate-900">{card.value}</p>
              </div>
              <div className={cn("grid h-10 w-10 place-items-center rounded-xl", card.tone)}>
                <card.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Quick icon={Map} label="Operasyon Haritası" onClick={() => onNavigate("harita")} />
        <Quick icon={Archive} label="Damperlik Atık Çözümü" onClick={() => onNavigate("damperlik-çözüm")} />
        <Quick icon={Recycle} label="Konteyner Arıza Çözümü" onClick={() => onNavigate("konteyner")} />
        <Quick icon={AlertTriangle} label="Vatandaş Şikayetleri" onClick={() => onNavigate("şikayetler")} />
      </section>
    </div>
  );
}

function Quick({ icon: Icon, label, onClick, disabled }: { icon: typeof Map; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 text-left transition hover:border-emerald-100 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-45 shadow-sm"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-50 text-emerald-700">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </button>
  );
}

function ShiftPanel({ role, vehicles, refresh }: { role: Role; vehicles: any[]; refresh: () => void }) {
  const [form, setForm] = useState({ vehicleId: "", region: "", neighborhood: "", vehicleType: "çöp kamyonu" as "çöp kamyonu" | "damperli kamyon", startKm: "", startFullness: "boş" as "boş" | "dolu" });
  const [endForm, setEndForm] = useState({ endKm: "", endFullness: "boş" as "boş" | "dolu", tonnage: "", faultReported: false, tonnageReceipt: undefined as string | undefined });
  const current = trpc.operations.shifts.current.useQuery(undefined, { enabled: role === "şoför" });
  const start = trpc.operations.shifts.start.useMutation({ onSuccess: () => { toast.success("Mesai başarıyla başlatıldı."); refresh(); void current.refetch(); }, onError: error => toast.error(error.message) });
  const finish = trpc.operations.shifts.finish.useMutation({ onSuccess: () => { toast.success("Mesai sonlandırıldı."); refresh(); void current.refetch(); setEndForm({ endKm: "", endFullness: "boş", tonnage: "", faultReported: false, tonnageReceipt: undefined }); }, onError: error => toast.error(error.message) });
  if (role !== "şoför") return <AccessNotice title="Mesai detayları sadece yönetim tarafından görüntülenebilir." />;
  const available = vehicles.filter(vehicle => vehicle.type === form.vehicleType);
  const submit = (event: FormEvent) => { event.preventDefault(); if (!form.vehicleId) return toast.error("Lütfen araç plakası seçin."); start.mutate({ vehicleId: Number(form.vehicleId), region: form.region, neighborhood: form.neighborhood, vehicleType: form.vehicleType, startKm: Number(form.startKm), startFullness: form.startFullness }); };
  const readReceipt = (file: File | null) => { if (!file) return; if (!file.type.startsWith("image/")) return toast.error("Yalnızca görsel dosyası yükleyebilirsiniz."); const reader = new FileReader(); reader.onload = () => setEndForm(currentForm => ({ ...currentForm, tonnageReceipt: String(reader.result) })); reader.readAsDataURL(file); };
  const submitFinish = (event: FormEvent) => { event.preventDefault(); if (!current.data) return; finish.mutate({ shiftId: current.data.id, endKm: Number(endForm.endKm), endFullness: endForm.endFullness, tonnage: endForm.tonnage || undefined, faultReported: endForm.faultReported, tonnageReceipt: endForm.tonnageReceipt }); };
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-display">Mesai başlat</CardTitle>
            <p className="text-sm text-slate-500">Bölge, araç ve kilometre bilgilerini kaydederek mesaiye başlayın.</p>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
              <Field label="Bölge"><Input required value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} placeholder="Örn. Tepebaşı" /></Field>
              <Field label="Mahalle"><Input required value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} placeholder="Örn. Hoşnudiye" /></Field>
              <Field label="Araç tipi">
                <select value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value as typeof form.vehicleType, vehicleId: "" })} className="input-native">
                  <option value="çöp kamyonu">çöp kamyonu</option>
                  <option value="damperli kamyon">damperli kamyon</option>
                </select>
              </Field>
              <Field label="Araç plakası">
                <select required value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })} className="input-native">
                  <option value="">Araç seçin</option>
                  {available.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} · {vehicle.brand} ({vehicle.status})</option>
                  ))}
                </select>
              </Field>
              <Field label="Başlangıç km"><Input required min="0" type="number" value={form.startKm} onChange={e => setForm({ ...form, startKm: e.target.value })} /></Field>
              <Field label="Araç doluluk durumu">
                <select value={form.startFullness} onChange={e => setForm({ ...form, startFullness: e.target.value as "boş" | "dolu" })} className="input-native">
                  <option value="boş">boş</option>
                  <option value="dolu">dolu</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Button disabled={start.isPending || Boolean(current.data)} className="w-full bg-emerald-700 hover:bg-emerald-800">
                  {current.data ? "Açık mesai bulundu" : start.isPending ? "Kaydediliyor..." : "Mesaiyi başlat"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        <Card className="border-0 bg-emerald-950 text-white shadow-xl">
          <CardContent className="p-6">
            <ClipboardCheck className="h-7 w-7 text-emerald-300" />
            <h3 className="mt-5 font-display text-xl font-bold">Mesai güvenlik kuralı</h3>
            <p className="mt-3 text-sm leading-6 text-emerald-100">Arızalı veya kademe onayı bekleyen arıza kaydı bulunan araçlar mesaiye başlatılamaz.</p>
            <div className="mt-6 rounded-xl border border-white/10 bg-white/10 p-4 text-sm text-emerald-100">Mesai bitişinde tonaj fişi fotoğrafı, doluluk ve arıza durumu kayıt altına alınır.</div>
          </CardContent>
        </Card>
      </div>

      {current.data && (
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-display">Açık mesaiyi sonlandır</CardTitle>
            <p className="text-sm text-slate-500">Mesai #{current.data.id} · {current.data.neighborhood} · başlangıç {current.data.startKm} km</p>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submitFinish}>
              <Field label="Bitiş km"><Input required type="number" min={current.data.startKm} value={endForm.endKm} onChange={e => setEndForm({ ...endForm, endKm: e.target.value })} /></Field>
              <Field label="Bitiş doluluk">
                <select className="input-native" value={endForm.endFullness} onChange={e => setEndForm({ ...endForm, endFullness: e.target.value as "boş" | "dolu" })}>
                  <option value="boş">boş</option>
                  <option value="dolu">dolu</option>
                </select>
              </Field>
              <Field label="Tonaj"><Input value={endForm.tonnage} onChange={e => setEndForm({ ...endForm, tonnage: e.target.value })} placeholder="Örn. 4,25" /></Field>
              <Field label="Tonaj fişi fotoğrafı"><Input required type="file" accept="image/*" onChange={e => readReceipt(e.target.files?.[0] ?? null)} /></Field>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 lg:col-span-2">
                <input type="checkbox" checked={endForm.faultReported} onChange={e => setEndForm({ ...endForm, faultReported: e.target.checked })} />
                Mesai sırasında araç arızası oluştu
              </label>
              <div className="lg:col-span-2">
                <Button disabled={finish.isPending || !endForm.tonnageReceipt} className="w-full bg-emerald-700 hover:bg-emerald-800">
                  {finish.isPending ? "Kaydediliyor..." : "Mesaiyi sonlandır"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MapPanel({
  role,
  operations,
  vehicles,
  refresh,
  filterCategory = "tümü",
}: {
  role: Role;
  operations: MapOperation[];
  vehicles: any[];
  refresh: () => void;
  filterCategory?: "tümü" | MapOperationCategory;
}) {
  const [form, setForm] = useState({ region: "Tepebaşı", neighborhood: "", wasteType: "mobilya", description: "", latitude: "39.7767", longitude: "30.5206", dueAt: "" });
  const [containerForm, setContainerForm] = useState({ region: "Tepebaşı", neighborhood: "", faultType: "kol" as "kol" | "ayak" | "gövde" | "kapak" | "diğer", description: "", latitude: "39.7767", longitude: "30.5206" });

  const [locationState, setLocationState] = useState<"idle" | "loading" | "ready">("idle");
  const [resolvedAddress, setResolvedAddress] = useState("");

  const currentShift = trpc.operations.shifts.current.useQuery(undefined, { enabled: role === "şoför" });
  const createWaste = trpc.operations.bulkWaste.create.useMutation({ onSuccess: () => { toast.success("Damperlik atık bildirimi eklendi."); refresh(); }, onError: e => toast.error(e.message) });
  const createContainerFault = trpc.operations.containerFaults.create.useMutation({
    onSuccess: () => {
      toast.success("Konteyner arızası bildirimi eklendi.");
      refresh();
      setContainerForm({ region: "Tepebaşı", neighborhood: "", faultType: "kol", description: "", latitude: "39.7767", longitude: "30.5206" });
    },
    onError: e => toast.error(e.message),
  });

  const canReport = (role === "şoför" && currentShift.data?.vehicleType === "çöp kamyonu") || role === "yönetim" || role === "kaynak personeli" || role === "kademe personeli";

  const submitWaste = (event: FormEvent) => {
    event.preventDefault();
    if (!form.neighborhood.trim()) return toast.error("Lütfen mahalle adı girin.");
    if (!form.dueAt) return toast.error("Lütfen son işlem zamanı seçin.");
    createWaste.mutate({ ...form, latitude: Number(form.latitude), longitude: Number(form.longitude), dueAt: new Date(form.dueAt) });
  };

  const submitContainer = (event: FormEvent) => {
    event.preventDefault();
    if (!containerForm.neighborhood.trim()) return toast.error("Lütfen mahalle adı girin.");
    if (!containerForm.description.trim()) return toast.error("Lütfen arıza açıklaması girin.");
    createContainerFault.mutate({ ...containerForm, latitude: Number(containerForm.latitude), longitude: Number(containerForm.longitude) });
  };

  const resolveAddress = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { "User-Agent": "TepebasiTemizlikApp/1.0" } }
      );
      if (!response.ok) {
        toast.message("Adres bulunamadı; bölge ve mahalle alanlarını manuel doldurabilirsiniz.");
        return;
      }
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const region = addr.city || addr.town || addr.district || addr.county || addr.state_district || addr.province || "Tepebaşı";
        const neighborhood = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.village || addr.road || "";
        setForm(current => ({
          ...current,
          region: region || current.region,
          neighborhood: neighborhood || current.neighborhood,
        }));
        setContainerForm(current => ({
          ...current,
          region: region || current.region,
          neighborhood: neighborhood || current.neighborhood,
        }));
        setResolvedAddress(data.display_name || `${latitude}, ${longitude}`);
        toast.success("Konumdan bölge ve mahalle alanları dolduruldu.");
      } else {
        toast.message("Adres bulunamadı; bölge ve mahalle alanlarını manuel doldurabilirsiniz.");
      }
    } catch {
      toast.message("Adres servisi yanıt vermedi; bölge ve mahalle alanlarını manuel doldurabilirsiniz.");
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error("Bu cihaz konum bilgisini desteklemiyor.");
    setLocationState("loading");
    navigator.geolocation.getCurrentPosition(
      position => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setForm(current => ({ ...current, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) }));
        setContainerForm(current => ({ ...current, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) }));
        setLocationState("ready");
        resolveAddress(latitude, longitude);
      },
      error => {
        setLocationState("idle");
        const message = error.code === error.PERMISSION_DENIED ? "Konum izni verilmedi. Enlem ve boylamı manuel girebilirsiniz." : "Konum alınamadı. Lütfen tekrar deneyin veya manuel giriş yapın.";
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 }
    );
  };

  return (
    <div className="space-y-6">
      <OperationsMap operations={operations} initialCategoryFilter={filterCategory} />

      {canReport && (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Form 1: Damperlik Atık Bildirimi */}
          <Card className="border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Archive className="h-5 w-5 text-amber-600" />
                Damperlik Atık Bildirimi
              </CardTitle>
              <p className="text-sm text-slate-500">Mobilya, hafriyat ve büyük atıkları konumuyla haritaya kaydedin.</p>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitWaste}>
                <Field label="Bölge"><Input required value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} /></Field>
                <Field label="Mahalle"><Input required value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} placeholder="Örn. Hoşnudiye" /></Field>
                <Field label="Atık cinsi"><Input required value={form.wasteType} onChange={e => setForm({ ...form, wasteType: e.target.value })} placeholder="Örn. Eski Koltuk" /></Field>
                <Field label="Son işlem zamanı"><Input required type="datetime-local" value={form.dueAt} onChange={e => setForm({ ...form, dueAt: e.target.value })} /></Field>
                
                <div className="sm:col-span-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <p className="text-sm font-medium text-emerald-800">Konum tek seferlik alınır; adres otomatik doldurulur.</p>
                    <Button type="button" size="sm" disabled={locationState === "loading"} onClick={useCurrentLocation} className="bg-emerald-700 hover:bg-emerald-800">
                      <LocateFixed className="mr-1.5 h-4 w-4" />
                      {locationState === "loading" ? "Konum alınıyor" : locationState === "ready" ? "Konum güncelle" : "Anlık konumu kullan"}
                    </Button>
                  </div>
                  {resolvedAddress && <p className="mt-2 text-xs leading-5 text-emerald-700">Algılanan adres: {resolvedAddress}</p>}
                </div>

                <Field label="Enlem"><Input required type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} /></Field>
                <Field label="Boylam"><Input required type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} /></Field>
                <div className="sm:col-span-2"><Field label="Açıklama"><Input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Atık detay ve konum tarifi" /></Field></div>
                <div className="sm:col-span-2"><Button disabled={createWaste.isPending} className="w-full bg-emerald-700 hover:bg-emerald-800"><Plus className="mr-2 h-4 w-4" />Damperlik atık bildirimi oluştur</Button></div>
              </form>
            </CardContent>
          </Card>

          {/* Form 2: Konteyner Arızası Bildirimi */}
          <Card className="border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Recycle className="h-5 w-5 text-emerald-600" />
                Konteyner Arızası Bildirimi
              </CardTitle>
              <p className="text-sm text-slate-500">Saha konteynerlerindeki kol, kapak ve gövde arızalarını konumuyla haritaya kaydedin.</p>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitContainer}>
                <Field label="Bölge"><Input required value={containerForm.region} onChange={e => setContainerForm({ ...containerForm, region: e.target.value })} /></Field>
                <Field label="Mahalle"><Input required value={containerForm.neighborhood} onChange={e => setContainerForm({ ...containerForm, neighborhood: e.target.value })} placeholder="Örn. Eskibağlar" /></Field>
                <Field label="Arıza türü">
                  <select className="input-native" value={containerForm.faultType} onChange={e => setContainerForm({ ...containerForm, faultType: e.target.value as typeof containerForm.faultType })}>
                    <option value="kol">kol</option>
                    <option value="ayak">ayak</option>
                    <option value="gövde">gövde</option>
                    <option value="kapak">kapak</option>
                    <option value="diğer">diğer</option>
                  </select>
                </Field>
                <div className="hidden sm:block" />

                <div className="sm:col-span-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <p className="text-sm font-medium text-emerald-800">Konum tek seferlik alınır; adres otomatik doldurulur.</p>
                    <Button type="button" size="sm" disabled={locationState === "loading"} onClick={useCurrentLocation} className="bg-emerald-700 hover:bg-emerald-800">
                      <LocateFixed className="mr-1.5 h-4 w-4" />
                      {locationState === "loading" ? "Konum alınıyor" : locationState === "ready" ? "Konum güncelle" : "Anlık konumu kullan"}
                    </Button>
                  </div>
                  {resolvedAddress && <p className="mt-2 text-xs leading-5 text-emerald-700">Algılanan adres: {resolvedAddress}</p>}
                </div>

                <Field label="Enlem"><Input required type="number" step="any" value={containerForm.latitude} onChange={e => setContainerForm({ ...containerForm, latitude: e.target.value })} /></Field>
                <Field label="Boylam"><Input required type="number" step="any" value={containerForm.longitude} onChange={e => setContainerForm({ ...containerForm, longitude: e.target.value })} /></Field>
                <div className="sm:col-span-2">
                  <Field label="Arıza açıklaması">
                    <Textarea required value={containerForm.description} onChange={e => setContainerForm({ ...containerForm, description: e.target.value })} placeholder="Konteynerdeki kırık veya hasar detayı" />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Button disabled={createContainerFault.isPending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                    <Recycle className="mr-2 h-4 w-4" />
                    {createContainerFault.isPending ? "Kaydediliyor..." : "Konteyner arızasını bildir"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function BulkWasteSolutionPanel({
  role,
  operations,
  wasteList,
  vehicles,
  refresh,
}: {
  role: Role;
  operations: MapOperation[];
  wasteList: any[];
  vehicles: any[];
  refresh: () => void;
}) {
  const currentShift = trpc.operations.shifts.current.useQuery(undefined, { enabled: role === "şoför" });
  const collect = trpc.operations.bulkWaste.collect.useMutation({
    onSuccess: () => {
      toast.success("Damperlik atık toplama kaydı işlendi ve haritadan kaldırıldı.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const canCollectWaste = (role === "şoför" && currentShift.data?.vehicleType === "damperli kamyon") || role === "yönetim" || role === "kademe personeli";
  const activeDamper = vehicles.find(vehicle => vehicle.id === currentShift.data?.vehicleId && vehicle.type === "damperli kamyon");
  const pendingWaste = useMemo(() => wasteList.filter(item => item.status === "bekliyor"), [wasteList]);

  const mapOperations = useMemo<MapOperation[]>(
    () =>
      pendingWaste.map(item => ({
        id: item.id,
        category: "Damperlik atık" as const,
        title: `${item.wasteType} · ${item.neighborhood}`,
        description: item.description,
        latitude: item.latitude,
        longitude: item.longitude,
        dueAt: item.dueAt,
        status: item.status,
      })),
    [pendingWaste]
  );

  return (
    <div className="space-y-6">
      {/* Dedicated Bulk Waste Map Header */}
      <Card className="border-0 bg-white shadow-sm p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Damperlik Atık Çözümü & Haritası</h2>
            <p className="text-xs text-slate-500">Bildirilen damperlik atıkların harita konumları ve toplama kayıtları bu ekrandan yönetilir.</p>
          </div>
          <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">
            {pendingWaste.length} Toplanması Bekleyen Atık
          </Badge>
        </div>
        <OperationsMap operations={mapOperations} initialCategoryFilter="Damperlik atık" showCategoryTabs={false} />
      </Card>

      {/* Toplama Kayıtları Listesi */}
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <Archive className="h-5 w-5 text-amber-600" />
              Damperli Atık Toplama Kayıtları
            </CardTitle>
            <p className="text-sm text-slate-500">Toplanan atıkları kaydet butonuna basarak haritadan ve listeden temizleyin.</p>
          </div>
          <Badge variant="outline" className="text-slate-600">
            Toplam {wasteList.length} Kayıt
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {wasteList.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Henüz bildirilmiş damperlik atık kaydı bulunmuyor.</p>
          ) : (
            wasteList.map(waste => {
              const isPending = waste.status === "bekliyor";
              const damperId = activeDamper?.id ?? vehicles.find(v => v.type === "damperli kamyon")?.id;

              return (
                <div
                  key={waste.id}
                  className={`rounded-2xl border p-4 transition ${
                    isPending ? "border-amber-200/80 bg-amber-50/20" : "border-emerald-100 bg-emerald-50/10"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">
                          {waste.wasteType} · {waste.neighborhood}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            isPending
                              ? "border-amber-200 bg-amber-50 text-amber-700 font-semibold"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold"
                          }
                        >
                          {isPending ? "Toplanma Bekliyor" : "Toplandı & Temizlendi"}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{waste.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {waste.latitude}, {waste.longitude}
                        </span>
                        <span>·</span>
                        <span>Bölge: {waste.region}</span>
                      </div>
                    </div>

                    {canCollectWaste && isPending && (
                      <Button
                        size="sm"
                        disabled={!damperId || collect.isPending}
                        onClick={() => damperId && collect.mutate({ id: waste.id, vehicleId: damperId })}
                        className="bg-emerald-700 hover:bg-emerald-800 text-xs shrink-0"
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                        Toplandı Olarak Kaydet & Kapat
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export function AccessNotice({ title }: { title: string }) {
  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardContent className="grid min-h-40 place-items-center p-6 text-center">
        <div>
          <Map className="mx-auto h-7 w-7 text-emerald-700" />
          <p className="mt-3 font-semibold text-slate-800">{title}</p>
          <p className="mt-1 text-sm text-slate-500">Görev tanımınıza uygun ekranlardan işlemlere devam edebilirsiniz.</p>
        </div>
      </CardContent>
    </Card>
  );
}
