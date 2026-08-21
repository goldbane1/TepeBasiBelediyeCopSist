import OperationsMap, { type MapOperation, type MapOperationCategory } from "@/components/OperationsMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  Archive,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  FileBarChart,
  Gauge,
  History,
  Image as ImageIcon,
  LocateFixed,
  Map,
  MapPin,
  MessageSquareWarning,
  Plus,
  Search,
  Truck,
  Wrench,
  Recycle,
  User,
  ShieldCheck,
  Eye,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { Role } from "@/pages/Home";
import FleetOperations from "@/components/FleetOperations";
import FieldOperations from "@/components/FieldOperations";
import ManagementOperations from "@/components/ManagementOperations";
import { compressImageFile } from "@/lib/imageCompress";


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
  | "personel"
  | "mahalleler";

type Props = { role: Role; view: AppView; onNavigate: (view: AppView) => void };

const EMPTY_SUMMARY = { vehicleCount: 0, activeShiftCount: 0, pendingWasteCount: 0, overdueComplaintCount: 0 };

export const WASTE_TYPES = [
  "Hafriyat / Moloz",
  "Mobilya / Koltuk",
  "Budama / Bahçe Atığı",
  "Cam / Metal",
  "Elektronik / Beyaz Eşya",
  "Diğer Büyük Atık",
] as const;

export const SHIFT_HOURS = [
  "08:00 - 16:00",
  "16:00 - 00:00",
  "00:00 - 08:00",
] as const;

export default function OperationsWorkspace({ role, view, onNavigate }: Props) {
  const isDriver = role === "şoför";
  const isManager = role === "yönetim";
  const utils = trpc.useUtils();
  const summary = trpc.operations.summary.useQuery();
  const vehicles = trpc.operations.vehicles.list.useQuery();
  const faults = trpc.operations.vehicleFaults.list.useQuery(undefined, { enabled: isDriver || role === "kademe personeli" || isManager });
  const waste = trpc.operations.bulkWaste.list.useQuery();
  const containers = trpc.operations.containerFaults.list.useQuery();
  const complaints = trpc.operations.complaints.list.useQuery();
  const currentShift = trpc.operations.shifts.current.useQuery(undefined, { enabled: isDriver });
  const shifts = trpc.operations.shifts.list.useQuery(undefined, { enabled: isDriver || isManager });
  const neighborhoods = trpc.operations.neighborhoods.list.useQuery();
  const logs = trpc.operations.reports.auditLogs.useQuery(undefined, { enabled: isManager });
  const users = trpc.operations.users.list.useQuery(undefined, { enabled: isManager });

  const [focusOpId, setFocusOpId] = useState<number | null>(null);

  const refresh = () => {
    void utils.operations.summary.invalidate();
    void utils.operations.vehicles.list.invalidate();
    void utils.operations.vehicleFaults.list.invalidate();
    void utils.operations.bulkWaste.list.invalidate();
    void utils.operations.containerFaults.list.invalidate();
    void utils.operations.complaints.list.invalidate();
    void utils.operations.shifts.list.invalidate();
    void utils.operations.shifts.driverHistory.invalidate();
    void utils.operations.neighborhoods.list.invalidate();
    void utils.operations.reports.auditLogs.invalidate();
    void utils.operations.shifts.current.invalidate();
  };

  const driverActiveComplaints = useMemo(() => {
    const shiftData = currentShift.data as any;
    if (!shiftData || !shiftData.neighborhood || !complaints.data) return [];
    return complaints.data.filter(
      c => c.status === "açık" && c.neighborhood.toLowerCase().trim() === shiftData.neighborhood.toLowerCase().trim()
    );
  }, [currentShift.data, complaints.data]);

  const mapOperations = useMemo<MapOperation[]>(() => {
    const result: MapOperation[] = [];

    (waste.data ?? [])
      .filter(item => item.status === "bekliyor")
      .forEach(item => {
        result.push({
          id: item.id,
          category: "Damperlik atık",
          title: `${item.wasteType} · ${item.neighborhood}`,
          description: item.description,
          latitude: item.latitude,
          longitude: item.longitude,
          photoUrl: item.photoUrl,
          dueAt: item.dueAt,
          status: item.status,
          reporterName: item.reporterName,
          requiresExcavator: Boolean(item.requiresExcavator),
          extra: item,
        });
      });

    (containers.data ?? [])
      .filter(item => item.status === "bekliyor")
      .forEach(item => {
        result.push({
          id: item.id,
          category: "Konteyner arızası",
          title: `${item.faultType} arızası · ${item.neighborhood}`,
          description: item.description,
          latitude: item.latitude,
          longitude: item.longitude,
          photoUrl: item.photoUrl,
          status: item.status,
          reporterName: item.reporterName,
          extra: item,
        });
      });

    (complaints.data ?? [])
      .filter(item => item.status === "açık" || item.status === "onay_bekliyor")
      .forEach(item => {
        result.push({
          id: item.id,
          category: "Vatandaş şikayeti",
          title: `Şikayet · ${item.neighborhood}`,
          description: item.description,
          latitude: item.latitude,
          longitude: item.longitude,
          photoUrl: item.photoUrl,
          dueAt: item.dueAt,
          status: item.status,
          reporterName: item.reporterName,
          extra: item,
        });
      });


    return result;
  }, [waste.data, containers.data, complaints.data]);

  const openFaultCount = useMemo(() => (faults.data ?? []).filter(f => f.status === "kademe_onayı_bekliyor").length, [faults.data]);

  const navigateToMapItem = (id: number) => {
    setFocusOpId(id);
    onNavigate("harita");
  };

  const resolveCollectWaste = trpc.operations.bulkWaste.collect.useMutation({
    onSuccess: () => {
      toast.success("Damperlik atık toplandı olarak kaydedildi ve kapatıldı.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const resolveRepairContainer = trpc.operations.containerFaults.repair.useMutation({
    onSuccess: () => {
      toast.success("Konteyner onarımı tamamlandı ve kapatıldı.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const resolveAcknowledgeComplaint = trpc.operations.complaints.acknowledge.useMutation({
    onSuccess: () => {
      toast.success("Vatandaş şikayeti çözüldü olarak kapatıldı.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const handleResolveFromMap = (op: MapOperation) => {
    if (op.category === "Damperlik atık") {
      const currentShiftData = currentShift.data as any;
      if (role === "şoför") {
        if (!currentShiftData || currentShiftData.vehicleType !== "damperli kamyon") {
          toast.error("Damperlik atık toplamak için aktif bir damperli kamyon mesainiz olmalıdır.");
          return;
        }
      }
      const activeDamper = (vehicles.data ?? []).find(v => v.type === "damperli kamyon");
      const vehicleId = currentShiftData?.vehicleId || activeDamper?.id;
      if (!vehicleId) {
        toast.error("Toplama için aktif bir damperli kamyon mesaisi gereklidir.");
        return;
      }
      resolveCollectWaste.mutate({ id: op.id, vehicleId });
    } else if (op.category === "Konteyner arızası") {
      resolveRepairContainer.mutate({ id: op.id, note: "Harita üzerinden doğrudan onarım tamamlandı." });
    } else if (op.category === "Vatandaş şikayeti") {
      resolveAcknowledgeComplaint.mutate({ id: op.id });
    }
  };


  if (view === "dashboard")
    return (
      <Dashboard
        role={role}
        summary={summary.data ?? EMPTY_SUMMARY}
        openFaults={openFaultCount}
        activeShift={currentShift.data}
        driverActiveComplaints={driverActiveComplaints}
        complaintsList={complaints.data ?? []}
        onNavigate={onNavigate}
      />
    );

  if (view === "mesai")
    return (
      <ShiftPanel
        role={role}
        vehicles={vehicles.data ?? []}
        shifts={shifts.data ?? []}
        neighborhoodsList={neighborhoods.data ?? []}
        users={users.data ?? []}
        refresh={refresh}
      />
    );

  if (view === "harita")
    return (
      <MapPanel
        role={role}
        activeVehicleType={(currentShift.data as any)?.vehicleType}
        operations={mapOperations}
        vehicles={vehicles.data ?? []}
        refresh={refresh}
        filterCategory="tümü"
        selectedOperationId={focusOpId}
        onResolveOperation={handleResolveFromMap}
      />
    );


  if (view === "damperlik-çözüm")
    return (
      <BulkWasteSolutionPanel
        role={role}
        wasteList={waste.data ?? []}
        vehicles={vehicles.data ?? []}
        neighborhoodsList={neighborhoods.data ?? []}
        refresh={refresh}
        onFocusOnMap={navigateToMapItem}
      />
    );

  if (view === "araçlar" || view === "araç-arızaları")
    return <FleetOperations role={role} view={view} vehicles={vehicles.data ?? []} faults={faults.data ?? []} refresh={refresh} />;

  if (view === "konteyner" || view === "şikayetler")
    return (
      <FieldOperations
        role={role}
        view={view}
        containers={containers.data ?? []}
        complaints={complaints.data ?? []}
        neighborhoodsList={neighborhoods.data ?? []}
        refresh={refresh}
        onFocusOnMap={navigateToMapItem}
      />
    );

  return (
    <ManagementOperations
      view={view}
      role={role}
      shifts={shifts.data ?? []}
      wasteList={waste.data ?? []}
      containers={containers.data ?? []}
      complaints={complaints.data ?? []}
      neighborhoodsList={neighborhoods.data ?? []}
      logs={logs.data ?? []}
      users={users.data ?? []}
      refresh={refresh}
      onNavigate={onNavigate}
    />
  );
}

function Dashboard({
  role,
  summary,
  openFaults,
  activeShift,
  driverActiveComplaints,
  complaintsList,
  onNavigate,
}: {
  role: Role;
  summary: typeof EMPTY_SUMMARY;
  openFaults: number;
  activeShift?: any;
  driverActiveComplaints: any[];
  complaintsList: any[];
  onNavigate: Props["onNavigate"];
}) {
  const cards = [
    { label: "Kayıtlı araç", value: summary.vehicleCount, icon: Truck, tone: "text-emerald-700 bg-emerald-50" },
    { label: "Açık mesai", value: summary.activeShiftCount, icon: Gauge, tone: "text-sky-700 bg-sky-50" },
    { label: "Bekleyen damperlik atık", value: summary.pendingWasteCount, icon: Archive, tone: "text-amber-700 bg-amber-50" },
    { label: "Günü geçen şikayet", value: summary.overdueComplaintCount, icon: AlertTriangle, tone: "text-red-700 bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Şoför Aktif Bölge Şikayet Uyarısı Banner */}
      {role === "şoför" && activeShift && driverActiveComplaints.length > 0 && (
        <div className="rounded-2xl border-2 border-red-300 bg-red-50/95 p-5 shadow-lg shadow-red-950/10">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="rounded-2xl bg-red-600 p-3 text-white shrink-0 shadow-md">
              <AlertTriangle className="h-7 w-7 animate-bounce" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display font-bold text-red-950 text-lg leading-snug">
                  🚨 GÖREV BÖLGENİZDE ({activeShift.neighborhood.toUpperCase()}) {driverActiveComplaints.length} AÇIK VATANDAŞ ŞİKAYETİ BULUNUYOR!
                </h3>
                <Badge className="bg-red-600 text-white font-bold hover:bg-red-700 px-3 py-1 text-xs">
                  ACİL ŞİKAYET UYARISI
                </Badge>
              </div>
              <p className="text-sm text-red-800 leading-relaxed font-medium">
                Şu an aktif mesai yaptığınız <strong>{activeShift.neighborhood} ({activeShift.region})</strong> bölgesine ait bildirilmiş vatandaş şikayetleri bulunmaktadır. Lütfen bölgedeki temizlik ve müdahaleyi tamamlayarak şikayeti kapatın.
              </p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1">
                {driverActiveComplaints.map(complaint => (
                  <div key={complaint.id} className="rounded-xl border border-red-200 bg-white p-3.5 shadow-sm flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{complaint.neighborhood} Şikayeti</span>
                        <span className="text-[11px] font-semibold text-red-600 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                          <Clock className="h-3 w-3" />
                          {new Date(complaint.dueAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{complaint.description}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onNavigate("şikayetler")}
                      className="w-full bg-red-600 hover:bg-red-700 text-white text-xs h-8 font-semibold shadow-sm"
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Şikayeti İncele & Gider
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className={cn("grid h-12 w-12 place-items-center rounded-2xl", card.tone)}>
                <card.icon className="h-6 w-6" />
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

      {/* Aktif Vatandaş Şikayetleri Genel Özeti */}
      <Card className="border-0 bg-white shadow-sm overflow-hidden rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3 bg-slate-50/70 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-sky-100 text-sky-700 font-bold">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Aktif Vatandaş Şikayetleri</CardTitle>
              <p className="text-xs text-slate-500">İlçe genelinde müdahale ve onay bekleyen bildirimler</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-200 font-bold">
            {complaintsList.filter(c => c.status !== "onaylandı").length} Aktif Şikayet
          </Badge>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {complaintsList.filter(c => c.status !== "onaylandı").length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-500 bg-slate-50 rounded-xl">
              Şu anda bekleyen aktif bir vatandaş şikayeti bulunmuyor.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {complaintsList
                .filter(c => c.status !== "onaylandı")
                .map(comp => {
                  const isOverdue = comp.dueAt && new Date(comp.dueAt).getTime() < Date.now();
                  const isPendingApproval = comp.status === "onay_bekliyor";

                  return (
                    <div
                      key={comp.id}
                      className={cn(
                        "rounded-xl border p-3.5 flex flex-col justify-between gap-3 transition",
                        isOverdue
                          ? "border-red-200 bg-red-50/40"
                          : isPendingApproval
                          ? "border-purple-200 bg-purple-50/40"
                          : "border-slate-200 bg-white"
                      )}
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 text-sm truncate">
                            {comp.neighborhood} Mahallesi
                          </span>
                          <Badge
                            className={cn(
                              "text-[10px] font-bold shrink-0",
                              isPendingApproval
                                ? "bg-purple-100 text-purple-900 border-purple-300"
                                : isOverdue
                                ? "bg-red-100 text-red-700 border-red-300"
                                : "bg-sky-100 text-sky-800 border-sky-200"
                            )}
                          >
                            {isPendingApproval ? "⏳ Onayda" : isOverdue ? "Acil" : "Açık"}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 break-words">
                          {comp.description}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                          <span>📍 {comp.region}</span>
                          <span>·</span>
                          <span>📅 {new Date(comp.createdAt).toLocaleDateString("tr-TR")}</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onNavigate("şikayetler");
                        }}
                        className="w-full h-8 text-xs font-semibold bg-white border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 shadow-2xs"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                        Haritada Gör / İncele
                      </Button>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
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

function ShiftPanel({
  role,
  vehicles,
  shifts,
  neighborhoodsList,
  users,
  refresh,
}: {
  role: Role;
  vehicles: any[];
  shifts: any[];
  neighborhoodsList: any[];
  users: any[];
  refresh: () => void;
}) {
  const isManager = role === "yönetim";
  const [form, setForm] = useState({
    driverId: "",
    vehicleId: "",
    region: "Tepebaşı",
    neighborhood: "",
    vehicleType: "çöp kamyonu" as "çöp kamyonu" | "damperli kamyon",
    shiftHours: "08:00 - 16:00" as "08:00 - 16:00" | "16:00 - 00:00" | "00:00 - 08:00",
    startKm: "",
    startFullness: "boş" as "boş" | "dolu",
  });

  const [endForm, setEndForm] = useState({
    endKm: "",
    endFullness: "boş" as "boş" | "dolu",
    tonnage: "",
    faultReported: false,
    tonnageReceipts: [] as string[],
  });

  const [adminEndKmValues, setAdminEndKmValues] = useState<Record<number, string>>({});

  const current = trpc.operations.shifts.current.useQuery(undefined, { enabled: role === "şoför" });
  const driverHistory = trpc.operations.shifts.driverHistory.useQuery(undefined, { enabled: role === "şoför" });

  const start = trpc.operations.shifts.start.useMutation({
    onSuccess: () => {
      toast.success("Mesai başarıyla başlatıldı.");
      refresh();
      if (current.refetch) void current.refetch();
      if (driverHistory.refetch) void driverHistory.refetch();
      setForm({
        driverId: "",
        vehicleId: "",
        region: "Tepebaşı",
        neighborhood: "",
        vehicleType: "çöp kamyonu",
        shiftHours: "08:00 - 16:00",
        startKm: "",
        startFullness: "boş",
      });
    },
    onError: error => toast.error(error.message),
  });

  const finish = trpc.operations.shifts.finish.useMutation({
    onSuccess: () => {
      toast.success("Mesai sonlandırıldı.");
      refresh();
      if (current.refetch) void current.refetch();
      if (driverHistory.refetch) void driverHistory.refetch();
      setEndForm({ endKm: "", endFullness: "boş", tonnage: "", faultReported: false, tonnageReceipts: [] });
    },
    onError: error => toast.error(error.message),
  });

  const availableVehicles = vehicles.filter(vehicle => vehicle.type === form.vehicleType);
  const activeShifts = useMemo(() => shifts.filter(shift => shift.status === "açık"), [shifts]);
  const selectedVehicle = useMemo(() => vehicles.find(v => String(v.id) === String(form.vehicleId)), [vehicles, form.vehicleId]);

  // Handle neighborhood change and auto-set region if defined in neighborhoodsList
  const handleNeighborhoodSelect = (name: string) => {
    const matched = neighborhoodsList.find(n => n.name === name);
    setForm(prev => ({
      ...prev,
      neighborhood: name,
      region: matched?.region || prev.region || "Tepebaşı",
    }));
  };

  const submitDriverStart = (event: FormEvent) => {
    event.preventDefault();
    if (!form.neighborhood) return toast.error("Lütfen mahalle seçin.");
    if (!form.vehicleId) return toast.error("Lütfen araç plakası seçin.");
    start.mutate({
      vehicleId: Number(form.vehicleId),
      region: form.region || "Tepebaşı",
      neighborhood: form.neighborhood,
      vehicleType: form.vehicleType,
      shiftHours: form.shiftHours,
      startKm: Number(form.startKm),
      startFullness: form.startFullness,
    });
  };

  const submitAdminStart = (event: FormEvent) => {
    event.preventDefault();
    if (!form.driverId) return toast.error("Lütfen mesai başlatılacak şoförü seçin.");
    if (!form.neighborhood) return toast.error("Lütfen mahalle seçin.");
    if (!form.vehicleId) return toast.error("Lütfen araç seçin.");
    start.mutate({
      driverId: Number(form.driverId),
      vehicleId: Number(form.vehicleId),
      region: form.region || "Tepebaşı",
      neighborhood: form.neighborhood,
      vehicleType: form.vehicleType,
      shiftHours: form.shiftHours,
      startKm: Number(form.startKm),
      startFullness: form.startFullness,
    });
  };

  const handleAdminFinish = (shift: any) => {
    const endKm = Number(adminEndKmValues[shift.id] || shift.startKm);
    finish.mutate({
      shiftId: shift.id,
      endKm,
      endFullness: "boş",
      faultReported: false,
    });
  };

  const readReceipts = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(f => f.type.startsWith("image/"));
    if (validFiles.length === 0) return toast.error("Yalnızca görsel dosyası yükleyebilirsiniz.");

    const promises = validFiles.map(file => compressImageFile(file, 1280, 0.75));
    const results = await Promise.all(promises);
    const validResults = results.filter(Boolean);

    setEndForm(currentForm => ({
      ...currentForm,
      tonnageReceipts: [...(currentForm.tonnageReceipts || []), ...validResults],
    }));
  };


  const removeReceipt = (index: number) => {
    setEndForm(currentForm => ({
      ...currentForm,
      tonnageReceipts: (currentForm.tonnageReceipts || []).filter((_, i) => i !== index),
    }));
  };

  const submitFinish = (event: FormEvent) => {
    event.preventDefault();
    const currentData = current.data as any;
    if (!currentData) return;
    if (!endForm.tonnage || !endForm.tonnage.trim()) {
      return toast.error("Lütfen mesai tonaj bilgisini girin.");
    }
    finish.mutate({
      shiftId: currentData.id,
      endKm: Number(endForm.endKm),
      endFullness: endForm.endFullness,
      tonnage: endForm.tonnage.trim(),
      faultReported: endForm.faultReported,
      tonnageReceipt: endForm.tonnageReceipts.length > 0 ? endForm.tonnageReceipts : undefined,
    });
  };

  // YÖNETİCİ MESAİ YÖNETİMİ VE KONTROL EKRANI
  if (isManager) {
    return (
      <div className="space-y-5">
        {/* 1. Devam Eden Açık Mesailer Kontrol Paneli */}
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="font-display flex items-center gap-2 text-base text-slate-900">
              <ClipboardCheck className="h-5 w-5 text-emerald-700" />
              Devam Eden Açık Mesailer
            </CardTitle>
            <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-50 font-bold text-xs">{activeShifts.length} Aktif Mesai</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeShifts.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-500">
                Şu anda sahada aktif açık mesai bulunmuyor.
              </p>
            ) : (
              activeShifts.map(shift => (
                <div key={shift.id} className="rounded-2xl border border-sky-150 bg-sky-50/40 p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-sky-300">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{shift.driverName || `Şoför #${shift.driverId}`}</span>
                      <Badge variant="outline" className="border-sky-200 bg-sky-100/70 text-sky-800 text-xs">
                        @{shift.driverUsername || "yerel_hesap"}
                      </Badge>
                      <Badge className="bg-emerald-600 text-white text-[10px]">Açık Mesai #{shift.id}</Badge>
                      <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                        Vardiya: {shift.shiftHours || "08:00 - 16:00"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-700">
                      📍 Görev Bölgesi: <strong>{shift.region} / {shift.neighborhood}</strong> · Araç: <strong>{shift.vehiclePlate || `#${shift.vehicleId}`} ({shift.vehicleType})</strong>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      🚀 Başlangıç Km: <strong>{shift.startKm} km</strong> · Başlangıç Zamanı: <strong>{new Date(shift.startedAt).toLocaleString("tr-TR")}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-sky-200/60">
                    <Input
                      type="number"
                      placeholder={`Bitiş km (${shift.startKm})`}
                      value={adminEndKmValues[shift.id] || ""}
                      onChange={e => setAdminEndKmValues({ ...adminEndKmValues, [shift.id]: e.target.value })}
                      className="bg-white text-xs h-9 w-36"
                    />
                    <Button
                      size="sm"
                      disabled={finish.isPending}
                      onClick={() => handleAdminFinish(shift)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs h-9 font-semibold shadow-sm"
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4" />
                      Mesaiyi Sonlandır
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 2. Yönetici Şoför Adına Mesai Başlatma Formu */}
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Plus className="h-5 w-5 text-emerald-700" />
              Yeni Mesai Başlat (Şoför Adına)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submitAdminStart}>
              <Field label="Şoför Seçin">
                <select
                  required
                  value={form.driverId}
                  onChange={e => setForm({ ...form, driverId: e.target.value })}
                  className="input-native"
                >
                  <option value="">Şoför seçin</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.username} (@{u.username || u.openId})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Görev Mahallesi (Dinamik)">
                <select
                  required
                  value={form.neighborhood}
                  onChange={e => handleNeighborhoodSelect(e.target.value)}
                  className="input-native"
                >
                  <option value="">Mahalle seçin</option>
                  {neighborhoodsList.map(n => (
                    <option key={n.id} value={n.name}>
                      {n.name} ({n.region})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Vardiya Seçimi">
                <select
                  value={form.shiftHours}
                  onChange={e => setForm({ ...form, shiftHours: e.target.value as any })}
                  className="input-native font-semibold text-emerald-900"
                >
                  {SHIFT_HOURS.map(h => (
                    <option key={h} value={h}>
                      ⏰ {h}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Araç Tipi">
                <select
                  value={form.vehicleType}
                  onChange={e => setForm({ ...form, vehicleType: e.target.value as typeof form.vehicleType, vehicleId: "" })}
                  className="input-native"
                >
                  <option value="çöp kamyonu">çöp kamyonu</option>
                  <option value="damperli kamyon">damperli kamyon</option>
                </select>
              </Field>

              <Field label="Araç Plakası">
                <select required value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })} className="input-native">
                  <option value="">Araç seçin</option>
                  {availableVehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} · {vehicle.brand} ({vehicle.status}){vehicle.nextOilMaintenanceKm ? ` [🛢️ ${Number(vehicle.nextOilMaintenanceKm).toLocaleString('tr-TR')} KM]` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Başlangıç Km">
                <Input required min="0" type="number" value={form.startKm} onChange={e => setForm({ ...form, startKm: e.target.value })} />
              </Field>

              {selectedVehicle?.nextOilMaintenanceKm && (
                <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 flex items-center gap-3 text-amber-950 text-xs shadow-xs">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl">
                    🛢️
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-amber-900 text-xs">Araç Yağ Bakım Bilgilendirmesi</p>
                    <p className="text-amber-800 text-xs">
                      Seçilen <strong>{selectedVehicle.plate}</strong> ({selectedVehicle.brand}) plakalı aracın{" "}
                      <span className="font-bold text-amber-950 underline">{Number(selectedVehicle.nextOilMaintenanceKm).toLocaleString("tr-TR")} KM</span>'de yağ bakımı bulunmaktadır.
                    </p>
                  </div>
                </div>
              )}

              <div className="sm:col-span-2 lg:col-span-3">
                <Button disabled={start.isPending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  {start.isPending ? "Kaydediliyor..." : "Seçili Şoför Adına Mesai Başlat"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ŞOFÖR KULLANICI MESAİ EKRANI
  return (
    <div className="space-y-5">
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base">Yeni Mesai Başlat</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submitDriverStart}>
            <Field label="Görev Mahallesi">
              <select
                required
                value={form.neighborhood}
                onChange={e => handleNeighborhoodSelect(e.target.value)}
                className="input-native"
              >
                <option value="">Mahalle seçin</option>
                {neighborhoodsList.map(n => (
                  <option key={n.id} value={n.name}>
                    {n.name} ({n.region})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Vardiya">
              <select
                value={form.shiftHours}
                onChange={e => setForm({ ...form, shiftHours: e.target.value as any })}
                className="input-native font-semibold text-emerald-900"
              >
                {SHIFT_HOURS.map(h => (
                  <option key={h} value={h}>
                    ⏰ {h}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Araç Tipi">
              <select
                value={form.vehicleType}
                onChange={e => setForm({ ...form, vehicleType: e.target.value as typeof form.vehicleType, vehicleId: "" })}
                className="input-native"
              >
                <option value="çöp kamyonu">çöp kamyonu</option>
                <option value="damperli kamyon">damperli kamyon</option>
              </select>
            </Field>

            <Field label="Araç Plakası">
              <select required value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })} className="input-native">
                <option value="">Araç seçin</option>
                {availableVehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} · {vehicle.brand} ({vehicle.status}){vehicle.nextOilMaintenanceKm ? ` [🛢️ ${Number(vehicle.nextOilMaintenanceKm).toLocaleString('tr-TR')} KM]` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Başlangıç Km">
              <Input required min="0" type="number" value={form.startKm} onChange={e => setForm({ ...form, startKm: e.target.value })} />
            </Field>

            <Field label="Doluluk">
              <select value={form.startFullness} onChange={e => setForm({ ...form, startFullness: e.target.value as "boş" | "dolu" })} className="input-native">
                <option value="boş">boş</option>
                <option value="dolu">dolu</option>
              </select>
            </Field>

            {selectedVehicle?.nextOilMaintenanceKm && (
              <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 flex items-center gap-3 text-amber-950 text-xs shadow-xs animate-fadeIn">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-xl">
                  🛢️
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-900 text-xs">Araç Yağ Bakım Bilgilendirmesi</p>
                  <p className="text-amber-800 text-xs">
                    Seçilen <strong>{selectedVehicle.plate}</strong> ({selectedVehicle.brand}) plakalı aracın{" "}
                    <span className="font-bold text-amber-950 underline">{Number(selectedVehicle.nextOilMaintenanceKm).toLocaleString("tr-TR")} KM</span>'de yağ bakımı bulunmaktadır.
                  </p>
                </div>
              </div>
            )}

            <div className="sm:col-span-2 lg:col-span-3 pt-1">
              <Button disabled={start.isPending || Boolean(current.data)} className="w-full bg-emerald-700 hover:bg-emerald-800">
                {current.data ? "Açık mesainiz bulunuyor" : start.isPending ? "Kaydediliyor..." : "Mesaiyi Başlat"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Açık Mesai Sonlandırma Formu */}
      {Boolean(current.data) && (
        <Card className="border-2 border-emerald-300 bg-white shadow-md">
          <CardHeader className="bg-emerald-50/70 border-b border-emerald-100 py-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display text-emerald-950 flex items-center gap-2 text-base">
                  <Gauge className="h-5 w-5 text-emerald-700" />
                  Aktif Mesaiyi Sonlandır
                </CardTitle>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Mesai #{(current.data as any).id} · {(current.data as any).neighborhood} · Başlangıç: {(current.data as any).startKm} km · Vardiya: {(current.data as any).shiftHours || "08:00 - 16:00"}
                </p>
              </div>
              <Badge className="bg-emerald-700 text-white text-xs">Devam Ediyor</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submitFinish}>
              <Field label="Bitiş Km">
                <Input required type="number" min={(current.data as any).startKm} value={endForm.endKm} onChange={e => setEndForm({ ...endForm, endKm: e.target.value })} />
              </Field>
              <Field label="Bitiş Doluluk">
                <select className="input-native" value={endForm.endFullness} onChange={e => setEndForm({ ...endForm, endFullness: e.target.value as "boş" | "dolu" })}>
                  <option value="boş">boş</option>
                  <option value="dolu">dolu</option>
                </select>
              </Field>
              <Field label="Tonaj (Zorunlu)">
                <Input required value={endForm.tonnage} onChange={e => setEndForm({ ...endForm, tonnage: e.target.value })} placeholder="Örn. 4,25 veya 4250" />
              </Field>
              <Field label="Tonaj Fişi (İsteğe Bağlı)">
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={e => readReceipts(e.target.files)}
                />
              </Field>

              {endForm.tonnageReceipts.length > 0 && (
                <div className="lg:col-span-4 space-y-2">
                  <p className="text-xs font-bold text-slate-700">Yüklenen Fiş Fotoğrafları ({endForm.tonnageReceipts.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {endForm.tonnageReceipts.map((src, index) => (
                      <div key={index} className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 shadow-2xs">
                        <img src={src} alt={`Fiş ${index + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeReceipt(index)}
                          className="absolute top-0.5 right-0.5 grid h-4 w-4 place-items-center rounded-full bg-red-600 text-white text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 lg:col-span-2">
                <input type="checkbox" checked={endForm.faultReported} onChange={e => setEndForm({ ...endForm, faultReported: e.target.checked })} />
                Mesai sırasında araç arızası oluştu
              </label>
              <div className="lg:col-span-2">
                <Button disabled={finish.isPending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                  {finish.isPending ? "Kaydediliyor..." : "Mesaiyi Sonlandır & Kaydet"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Şoför Geçmiş 10 Mesaisi Tablosu */}
      <Card className="border-0 bg-white shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="font-display flex items-center gap-2 text-base text-slate-900">
            <History className="h-5 w-5 text-emerald-700" />
            Geçmiş Mesailerim (Son 10)
          </CardTitle>
          <Badge variant="outline" className="text-slate-600 text-xs">
            {driverHistory.data?.length || 0} Kayıt
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {!driverHistory.data || driverHistory.data.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-500">Henüz geçmiş mesai kaydınız bulunmuyor.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Tarih & Vardiya</th>
                    <th className="px-5 py-3">Mahalle</th>
                    <th className="px-5 py-3">Araç</th>
                    <th className="px-5 py-3">Km</th>
                    <th className="px-5 py-3">Tonaj</th>
                    <th className="px-5 py-3">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {driverHistory.data.map(item => (
                    <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-800">{new Date(item.startedAt).toLocaleDateString("tr-TR")}</p>
                        <p className="text-xs text-purple-700 font-medium">{item.shiftHours || "08:00 - 16:00"}</p>
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-700">{item.neighborhood}</td>
                      <td className="px-5 py-3 text-slate-700 font-medium">{item.vehiclePlate || `#${item.vehicleId}`}</td>
                      <td className="px-5 py-3 text-slate-700 text-xs">
                        <span className="font-mono">{item.startKm}</span> → <span className="font-mono">{item.endKm ?? "—"}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">
                        {item.tonnage ? `${item.tonnage} Ton` : "—"}
                        {item.tonnageReceiptUrl && (
                          <span className="block text-[10px] text-emerald-600 font-semibold">📸 Fiş</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          variant="outline"
                          className={
                            item.status === "açık"
                              ? "border-sky-200 bg-sky-50 text-sky-700 text-[10px]"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]"
                          }
                        >
                          {item.status === "açık" ? "Açık" : "Tamamlandı"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MapPanel({
  role,
  activeVehicleType,
  operations,
  vehicles,
  refresh,
  filterCategory = "tümü",
  selectedOperationId,
  onResolveOperation,
}: {
  role: Role;
  activeVehicleType?: "çöp kamyonu" | "damperli kamyon" | null;
  operations: MapOperation[];
  vehicles: any[];
  refresh: () => void;
  filterCategory?: "tümü" | MapOperationCategory;
  selectedOperationId?: number | null;
  onResolveOperation?: (op: MapOperation) => void;
}) {
  const [selectedPinId, setSelectedPinId] = useState<number | null>(selectedOperationId || null);

  return (
    <div className="space-y-5">
      {/* 1. Operasyon Haritası */}
      <OperationsMap
        operations={operations}
        initialCategoryFilter={filterCategory}
        role={role}
        activeVehicleType={activeVehicleType}
        selectedOperationId={selectedPinId}
        onResolveOperation={onResolveOperation}
      />


      {/* 2. Harita Altındaki Genel Şikayetler & Bildirimler Listesi */}
      <Card className="border-0 bg-white shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="font-display text-base text-slate-900">
            Genel Bildirim ve Şikayet Listesi
          </CardTitle>
          <Badge variant="outline" className="text-slate-600 text-xs">
            {operations.length} Bildirim
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {operations.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-500">Henüz aktif bildirim bulunmuyor.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[700px]">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Tür</th>
                    <th className="px-5 py-3">Mahalle & Başlık</th>
                    <th className="px-5 py-3">Açıklama</th>
                    <th className="px-5 py-3">Konum</th>
                    <th className="px-5 py-3">Durum</th>
                    <th className="px-5 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map(op => {
                    const isPending = !["toplandı", "onarım_tamamlandı", "onaylandı"].includes(op.status);
                    return (
                      <tr key={`${op.category}-${op.id}`} className="border-t border-slate-100 hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3">
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs font-semibold",
                              op.category === "Damperlik atık"
                                ? "bg-amber-50 text-amber-800"
                                : op.category === "Konteyner arızası"
                                ? "bg-purple-50 text-purple-800"
                                : "bg-red-50 text-red-800"
                            )}
                          >
                            {op.category}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{op.title}</td>
                        <td className="px-5 py-3 text-xs text-slate-600 max-w-xs truncate">{op.description}</td>
                        <td className="px-5 py-3 text-xs font-mono text-slate-500">
                          {op.latitude}, {op.longitude}
                        </td>
                        <td className="px-5 py-3">
                          <Badge
                            variant="outline"
                            className={
                              isPending
                                ? "border-amber-200 bg-amber-50/60 text-amber-700 text-[10px]"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px]"
                            }
                          >
                            {isPending ? "Bekliyor" : "Tamamlandı"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPinId(op.id);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="text-xs h-8 text-slate-700 hover:bg-slate-100"
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                            Haritada Gör
                          </Button>

                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BulkWasteSolutionPanel({
  role,
  wasteList,
  vehicles,
  neighborhoodsList,
  refresh,
  onFocusOnMap,
}: {
  role: Role;
  wasteList: any[];
  vehicles: any[];
  neighborhoodsList: any[];
  refresh: () => void;
  onFocusOnMap: (id: number) => void;
}) {
  const currentShift = trpc.operations.shifts.current.useQuery(undefined, { enabled: role === "şoför" });
  const [selectedPinId, setSelectedPinId] = useState<number | null>(null);
  const [form, setForm] = useState({
    region: "Tepebaşı",
    neighborhood: "",
    wasteType: "Hafriyat / Moloz",
    description: "",
    latitude: "39.7767",
    longitude: "30.5206",
    requiresExcavator: false,
    photo: "",
  });
  const [durationHours, setDurationHours] = useState<24 | 48>(48);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [locationState, setLocationState] = useState<"idle" | "loading" | "ready">("idle");
  const [resolvedAddress, setResolvedAddress] = useState("");

  const createWaste = trpc.operations.bulkWaste.create.useMutation({
    onSuccess: () => {
      toast.success("Damperlik atık bildirimi kaydedildi.");
      refresh();
      setForm({
        region: "Tepebaşı",
        neighborhood: "",
        wasteType: "Hafriyat / Moloz",
        description: "",
        latitude: "39.7767",
        longitude: "30.5206",
        requiresExcavator: false,
        photo: "",
      });
      setDurationHours(48);
      setSearchQuery("");
      setResolvedAddress("");
    },
    onError: e => toast.error(e.message),
  });

  const removeWaste = trpc.operations.bulkWaste.remove.useMutation({
    onSuccess: () => {
      toast.success("Damperlik atık kaydı silindi.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const collect = trpc.operations.bulkWaste.collect.useMutation({
    onSuccess: () => {
      toast.success("Damperlik atık toplandı.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const canReportWaste = (role === "şoför" && (currentShift.data as any)?.vehicleType === "çöp kamyonu") || role === "yönetim";
  const canCollectWaste = (role === "şoför" && (currentShift.data as any)?.vehicleType === "damperli kamyon") || role === "yönetim" || role === "kademe personeli";
  const activeDamper = vehicles.find(vehicle => vehicle.id === (currentShift.data as any)?.vehicleId && vehicle.type === "damperli kamyon");
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
        photoUrl: item.photoUrl,
        dueAt: item.dueAt,
        status: item.status,
        reporterName: item.reporterName,
        requiresExcavator: Boolean(item.requiresExcavator),
        extra: item,
      })),
    [pendingWaste]
  );

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

        setForm(prev => ({
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
        setForm(current => ({ ...current, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) }));
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
        setForm(current => ({
          ...current,
          region: region || current.region,
          neighborhood: neighborhood || current.neighborhood,
        }));
        setResolvedAddress(data.display_name || `${latitude}, ${longitude}`);
        toast.success("Konum adresi tespit edildi.");
      }
    } catch {
      // Geocoding fallback
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
    setForm(prev => ({ ...prev, photo: compressed }));
  };


  const submitWaste = (event: FormEvent) => {
    event.preventDefault();
    if (!form.neighborhood.trim()) return toast.error("Lütfen mahalle seçin veya girin.");
    createWaste.mutate({
      region: form.region,
      neighborhood: form.neighborhood,
      wasteType: form.wasteType,
      description: form.description || "",
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      durationHours: durationHours,
      requiresExcavator: form.requiresExcavator,
      photo: form.photo || undefined,
    });
  };

  return (
    <div className="space-y-5">
      {/* 1. Sadece Damperlik Atıkları Gösteren Özel Harita */}
      <Card className="border-0 bg-white shadow-sm p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
            <Archive className="h-5 w-5 text-amber-600" />
            Damperlik Atık Haritası
          </h2>
          <Badge className="bg-amber-50 text-amber-800 border-amber-200 font-bold">
            {pendingWaste.length} Bekleyen Atık
          </Badge>
        </div>
        <OperationsMap
          operations={mapOperations}
          initialCategoryFilter="Damperlik atık"
          showCategoryTabs={false}
          role={role}
          activeVehicleType={(currentShift.data as any)?.vehicleType}
          selectedOperationId={selectedPinId}
          onResolveOperation={op => {
            if (role === "şoför" && (currentShift.data as any)?.vehicleType !== "damperli kamyon") {
              toast.error("Damperlik atık toplamak için aktif bir damperli kamyon mesainiz olmalıdır.");
              return;
            }
            const damperId = (currentShift.data as any)?.vehicleId ?? activeDamper?.id ?? vehicles.find(v => v.type === "damperli kamyon")?.id;
            if (damperId) {
              collect.mutate({ id: op.id, vehicleId: damperId });
            } else {
              toast.error("Toplama için aktif damperli kamyon tanımlı olmalıdır.");
            }
          }}
        />

      </Card>

      {/* 2. Damperlik Atık Bildirim Formu */}
      {canReportWaste && (
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Plus className="h-5 w-5 text-emerald-700" />
              Yeni Damperlik Atık Bildir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={submitWaste}>
              <Field label="Atık Türü">
                <select
                  value={form.wasteType}
                  onChange={e => setForm({ ...form, wasteType: e.target.value })}
                  className="input-native font-semibold"
                >
                  {WASTE_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Mahalle">
                <select
                  value={form.neighborhood}
                  onChange={e => {
                    const matched = neighborhoodsList.find(n => n.name === e.target.value);
                    setForm({ ...form, neighborhood: e.target.value, region: matched?.region || form.region });
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
                <Input required value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} />
              </Field>

              <Field label="Müdahale Süresi">
                <div className="flex gap-1.5 h-10">
                  <button
                    type="button"
                    onClick={() => setDurationHours(24)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1 rounded-lg border text-xs font-semibold transition px-2",
                      durationHours === 24
                        ? "border-amber-600 bg-amber-500 text-white shadow-sm font-bold"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    Acil (24s)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationHours(48)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1 rounded-lg border text-xs font-semibold transition px-2",
                      durationHours === 48
                        ? "border-emerald-700 bg-emerald-700 text-white shadow-sm font-bold"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    Standart (48s)
                  </button>
                </div>
              </Field>

              {/* Kepçe Gereksinimi Seçimi */}
              <div className="sm:col-span-2 lg:col-span-4">
                <Field label="Kepçe İhtiyacı Durumu">
                  <div className="grid grid-cols-2 gap-2 max-w-md">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, requiresExcavator: false }))}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition",
                        !form.requiresExcavator
                          ? "border-emerald-700 bg-emerald-50 text-emerald-800 font-bold shadow-2xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      🚜 Kepçe Gerekli Değil
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, requiresExcavator: true }))}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition",
                        form.requiresExcavator
                          ? "border-amber-500 bg-amber-500 text-white font-bold shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      🚜 Kepçe Gerekli
                    </button>
                  </div>
                </Field>
              </div>

              {/* Konum Arama & GPS Buton Alanı */}
              <div className="sm:col-span-2 lg:col-span-4 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 space-y-2 min-w-0 max-w-full overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Adres veya sokak yazarak arayın..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          searchAddressLocation();
                        }
                      }}
                      className="pl-9 text-xs bg-white h-9 w-full min-w-0"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSearching}
                      onClick={searchAddressLocation}
                      className="h-9 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white flex-1 sm:flex-initial"
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
                      className="h-9 text-xs bg-white text-emerald-800 hover:bg-emerald-100 border-emerald-300 flex-1 sm:flex-initial shadow-2xs"
                    >
                      <LocateFixed className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                      {locationState === "loading" ? "Alınıyor..." : "Anlık Konum"}
                    </Button>
                  </div>
                </div>

                {resolvedAddress && (
                  <p className="text-[11px] font-medium text-emerald-800 bg-white/90 rounded-lg px-2.5 py-1 border border-emerald-200/60 truncate max-w-full overflow-hidden">
                    📍 <strong>Adres:</strong> {resolvedAddress}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-emerald-200/50 text-[11px]">
                  <span className="text-slate-600 font-mono truncate">
                    📍 {form.latitude}, {form.longitude}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 min-w-0 w-full sm:col-span-2 lg:col-span-2">
                <Field label="Enlem">
                  <Input required type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} className="w-full min-w-0 text-xs h-9" />
                </Field>
                <Field label="Boylam">
                  <Input required type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} className="w-full min-w-0 text-xs h-9" />
                </Field>
              </div>


              <div className="sm:col-span-2 lg:col-span-2">
                <Field label="Fotoğraf (İsteğe Bağlı)">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="text-xs"
                    />
                    {form.photo && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => setForm({ ...form, photo: "" })} className="text-red-600 px-2 h-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Field>
              </div>

              {form.photo && (
                <div className="sm:col-span-2 lg:col-span-4">
                  <img src={form.photo} alt="Önizleme" className="h-20 w-28 rounded-lg object-cover border border-slate-200" />
                </div>
              )}

              <div className="sm:col-span-2 lg:col-span-4">
                <Field label="Açıklama & Adres Tarifi (İsteğe Bağlı)">
                  <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Atığın bulunduğu nokta veya detaylar (isteğe bağlı)..." />
                </Field>
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <Button disabled={createWaste.isPending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                  <Plus className="mr-2 h-4 w-4" />
                  {createWaste.isPending ? "Kaydediliyor..." : "Damperlik Atık Bildirimini Kaydet"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 3. Toplama Kayıtları Listesi */}
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="font-display flex items-center gap-2 text-base">
            <Archive className="h-5 w-5 text-amber-600" />
            Damperli Atık Listesi
          </CardTitle>
          <Badge variant="outline" className="text-slate-600 text-xs font-bold">
            {pendingWaste.length} Bekleyen Atık
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingWaste.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-500">Henüz bildirilmiş bekleyen damperlik atık kaydı bulunmuyor.</p>
          ) : (
            pendingWaste.map(waste => {
              const isPending = waste.status === "bekliyor";
              const damperId = activeDamper?.id ?? vehicles.find(v => v.type === "damperli kamyon")?.id;

              return (
                <div
                  key={waste.id}
                  className={`rounded-xl border p-3.5 transition ${
                    isPending ? "border-amber-200 bg-amber-50/30" : "border-emerald-100 bg-emerald-50/15"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {waste.wasteType} · {waste.neighborhood}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            isPending
                              ? "border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-bold"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold"
                          }
                        >
                          {isPending ? "Toplanma Bekliyor" : "Toplandı"}
                        </Badge>
                        {waste.requiresExcavator && (
                          <Badge className="bg-amber-500 text-white border-amber-600 text-[10px] font-bold">
                            🚜 Kepçe Gerekli
                          </Badge>
                        )}
                        {waste.photoUrl && (
                          <Badge className="bg-white text-slate-700 border border-slate-200 text-[10px]">
                            📸 Fotoğraflı
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 break-words line-clamp-3 max-w-full overflow-hidden">{waste.description}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">

                        <span>📍 {waste.region}</span>
                        <span>·</span>
                        <span>📅 {new Date(waste.createdAt).toLocaleDateString("tr-TR")}</span>
                        {waste.reporterName && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/70">
                              👤 Bildiren: {waste.reporterName}
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
                          setSelectedPinId(waste.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50"
                        title="Bu sayfadaki haritada göster"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                        Haritada Gör
                      </Button>

                      {canCollectWaste && isPending && (
                        <Button
                          size="sm"
                          disabled={!damperId || collect.isPending}
                          onClick={() => damperId && collect.mutate({ id: waste.id, vehicleId: damperId })}
                          className="bg-emerald-700 hover:bg-emerald-800 text-xs h-8"
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Toplandı
                        </Button>
                      )}

                      {role === "yönetim" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={removeWaste.isPending}
                          onClick={() => {
                            if (confirm(`Damperlik atık #${waste.id} kaydını silmek istiyor musunuz?`)) {
                              removeWaste.mutate({ id: waste.id });
                            }
                          }}
                          className="text-xs h-8 text-slate-400 hover:text-red-600 px-2"
                          title="Kaydı Sil"
                        >
                          <Trash2 className="h-4 w-4" />
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
