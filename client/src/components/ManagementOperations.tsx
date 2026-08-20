import { AccessNotice, Field, type AppView } from "@/components/OperationsWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  Archive,
  ArrowUpDown,
  Calendar,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Eye,
  FileBarChart,
  Filter,
  Image as ImageIcon,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Recycle,
  RotateCcw,
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  TrendingUp,
  Truck,
  User,
  UserCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import type { Role } from "@/pages/Home";

export default function ManagementOperations({
  role,
  view,
  shifts,
  wasteList = [],
  containers = [],
  complaints,
  neighborhoodsList = [],
  logs,
  users,
  refresh,
  onNavigate,
}: {
  role: Role;
  view: AppView;
  shifts: any[];
  wasteList?: any[];
  containers?: any[];
  complaints: any[];
  neighborhoodsList?: any[];
  logs: any[];
  users: any[];
  refresh: () => void;
  onNavigate: (view: AppView) => void;
}) {
  if (role !== "yönetim") return <AccessNotice title="Bu ekran yalnızca yönetim rolü için kullanılabilir." />;

  if (view === "mahalleler") {
    return <NeighborhoodManagement neighborhoods={neighborhoodsList} refresh={refresh} />;
  }

  if (view === "raporlar") {
    return (
      <ReportsAndManagement
        shifts={shifts}
        wasteList={wasteList}
        containers={containers}
        complaints={complaints}
        neighborhoodsList={neighborhoodsList}
        logs={logs}
        users={users}
        refresh={refresh}
      />
    );
  }

  return <Personnel users={users} refresh={refresh} />;
}

// -----------------------------------------------------------------------------
// 1. MAHALLE YÖNETİMİ PANELİ
// -----------------------------------------------------------------------------
function NeighborhoodManagement({ neighborhoods, refresh }: { neighborhoods: any[]; refresh: () => void }) {
  const [region, setRegion] = useState("Batı Bölgesi");
  const [name, setName] = useState("");
  const [editingItem, setEditingItem] = useState<{ id: number; region: string; name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const createMutation = trpc.operations.neighborhoods.create.useMutation({
    onSuccess: () => {
      toast.success("Yeni mahalle eklendi.");
      setName("");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const updateMutation = trpc.operations.neighborhoods.update.useMutation({
    onSuccess: () => {
      toast.success("Mahalle bilgisi güncellendi.");
      setEditingItem(null);
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const removeMutation = trpc.operations.neighborhoods.remove.useMutation({
    onSuccess: () => {
      toast.success("Mahalle silindi.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Lütfen mahalle adı girin.");
    createMutation.mutate({ region, name: name.trim() });
  };

  const handleUpdate = (e: FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    updateMutation.mutate({ id: editingItem.id, region: editingItem.region, name: editingItem.name.trim() });
  };

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return neighborhoods;
    return neighborhoods.filter(
      n =>
        n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.region.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [neighborhoods, searchTerm]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Ekleme Formu */}
      <Card className="border-0 bg-white shadow-sm h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="font-display flex items-center gap-2 text-base">
            <Plus className="h-5 w-5 text-emerald-700" />
            Yeni Mahalle Ekle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Bölge / Kısım">
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="input-native"
              >
                <option value="Batı Bölgesi">Batı Bölgesi</option>
                <option value="Merkez Bölgesi">Merkez Bölgesi</option>
                <option value="Kuzey Bölgesi">Kuzey Bölgesi</option>
                <option value="Doğu Bölgesi">Doğu Bölgesi</option>
                <option value="Güney Bölgesi">Güney Bölgesi</option>
                <option value="Kırsal / Dış Bölge">Kırsal / Dış Bölge</option>
              </select>
            </Field>

            <Field label="Mahalle Adı">
              <Input
                required
                placeholder="Örn. Batıkent Mahallesi"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </Field>

            <Button disabled={createMutation.isPending} className="w-full bg-emerald-700 hover:bg-emerald-800">
              <Plus className="mr-1.5 h-4 w-4" />
              {createMutation.isPending ? "Ekleniyor..." : "Mahalleyi Kaydet"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Liste */}
      <Card className="border-0 bg-white shadow-sm lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="font-display text-base">Tanımlı Mahalleler</CardTitle>
            <Badge variant="outline" className="text-xs">{neighborhoods.length}</Badge>
          </div>
          <div className="w-56">
            <Input
              placeholder="Mahalle veya bölge ara..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="text-xs h-8"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-500">Kayıtlı mahalle bulunamadı.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Bölge</th>
                    <th className="px-5 py-3">Mahalle Adı</th>
                    <th className="px-5 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-5 py-3">
                        <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
                          {item.region}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingItem({ id: item.id, region: item.region, name: item.name })}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={removeMutation.isPending}
                            onClick={() => {
                              if (confirm(`"${item.name}" mahallesini silmek istediğinize emin misiniz?`)) {
                                removeMutation.mutate({ id: item.id });
                              }
                            }}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Düzenleme Modalı */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Mahalle Bilgisini Düzenle</h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <Field label="Bölge">
                <select
                  value={editingItem.region}
                  onChange={e => setEditingItem({ ...editingItem, region: e.target.value })}
                  className="input-native"
                >
                  <option value="Batı Bölgesi">Batı Bölgesi</option>
                  <option value="Merkez Bölgesi">Merkez Bölgesi</option>
                  <option value="Kuzey Bölgesi">Kuzey Bölgesi</option>
                  <option value="Doğu Bölgesi">Doğu Bölgesi</option>
                  <option value="Güney Bölgesi">Güney Bölgesi</option>
                  <option value="Kırsal / Dış Bölge">Kırsal / Dış Bölge</option>
                </select>
              </Field>
              <Field label="Mahalle Adı">
                <Input
                  required
                  value={editingItem.name}
                  onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                  İptal
                </Button>
                <Button disabled={updateMutation.isPending} className="bg-emerald-700 hover:bg-emerald-800">
                  {updateMutation.isPending ? "Kaydediliyor..." : "Güncelle"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function parseTonnageReceipts(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    if (typeof parsed === "string" && parsed.trim()) return [parsed.trim()];
  } catch {
    // direct string URL
  }
  return [raw.trim()];
}

// -----------------------------------------------------------------------------
// 2. YÖNETİM RAPORLARI, ANALİZ SIFIRLAMA & TAM CRUD DÜZENLEME
// -----------------------------------------------------------------------------
function ReportsAndManagement({
  shifts,
  wasteList = [],
  containers = [],
  complaints,
  neighborhoodsList = [],
  logs,
  users,
  refresh,
}: {
  shifts: any[];
  wasteList?: any[];
  containers?: any[];
  complaints: any[];
  neighborhoodsList?: any[];
  logs: any[];
  users: any[];
  refresh: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"genel" | "mesailer" | "atiklar" | "konteynerler" | "sikayetler" | "sifirla">("genel");

  // Günlük Denetim ve Analiz Filtreleri (Tarih ve Aralık Seçimi)
  const [auditPeriod, setAuditPeriod] = useState<"today" | "week" | "month" | "all" | "single_date" | "custom_range">("today");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [neighborhoodSearch, setNeighborhoodSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "tonnage_desc" | "tonnage_asc" | "shifts_desc" | "name_asc">("date_desc");

  // Tonaj Fişi Lightbox Modal State
  const [receiptModal, setReceiptModal] = useState<{
    shiftId: number;
    driverName?: string;
    neighborhood?: string;
    shiftHours?: string;
    tonnage?: string;
    receipts: string[];
  } | null>(null);

  const [editingShift, setEditingShift] = useState<any | null>(null);
  const [editingWaste, setEditingWaste] = useState<any | null>(null);
  const [editingContainer, setEditingContainer] = useState<any | null>(null);
  const [editingComplaint, setEditingComplaint] = useState<any | null>(null);

  const [purgeOptions, setPurgeOptions] = useState({
    shifts: false,
    waste: false,
    containers: false,
    complaints: false,
    faults: false,
    auditLogs: false,
  });
  const [confirmPurgeText, setConfirmPurgeText] = useState("");
  const [showPurgeModal, setShowPurgeModal] = useState(false);

  const updateShift = trpc.operations.shifts.update.useMutation({
    onSuccess: () => { toast.success("Mesai güncellendi."); setEditingShift(null); refresh(); },
    onError: e => toast.error(e.message),
  });
  const removeShift = trpc.operations.shifts.remove.useMutation({
    onSuccess: () => { toast.success("Mesai silindi."); refresh(); },
    onError: e => toast.error(e.message),
  });

  const updateWaste = trpc.operations.bulkWaste.update.useMutation({
    onSuccess: () => { toast.success("Damperlik atık güncellendi."); setEditingWaste(null); refresh(); },
    onError: e => toast.error(e.message),
  });
  const removeWaste = trpc.operations.bulkWaste.remove.useMutation({
    onSuccess: () => { toast.success("Damperlik atık silindi."); refresh(); },
    onError: e => toast.error(e.message),
  });

  const updateContainer = trpc.operations.containerFaults.update.useMutation({
    onSuccess: () => { toast.success("Konteyner arızası güncellendi."); setEditingContainer(null); refresh(); },
    onError: e => toast.error(e.message),
  });
  const removeContainer = trpc.operations.containerFaults.remove.useMutation({
    onSuccess: () => { toast.success("Konteyner arızası silindi."); refresh(); },
    onError: e => toast.error(e.message),
  });

  const updateComplaint = trpc.operations.complaints.update.useMutation({
    onSuccess: () => { toast.success("Şikayet güncellendi."); setEditingComplaint(null); refresh(); },
    onError: e => toast.error(e.message),
  });
  const removeComplaint = trpc.operations.complaints.remove.useMutation({
    onSuccess: () => { toast.success("Şikayet silindi."); refresh(); },
    onError: e => toast.error(e.message),
  });

  const resetDataMutation = trpc.operations.reports.resetData.useMutation({
    onSuccess: () => {
      toast.success("Seçilen analiz ve operasyon verileri sıfırlandı.");
      setShowPurgeModal(false);
      setConfirmPurgeText("");
      setPurgeOptions({ shifts: false, waste: false, containers: false, complaints: false, faults: false, auditLogs: false });
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const handleResetSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (confirmPurgeText !== "SIFIRLA") {
      toast.error("Onaylamak için kutuya 'SIFIRLA' yazın.");
      return;
    }
    resetDataMutation.mutate(purgeOptions);
  };

  // --- ANALİZ VE DENETİM HESAPLAMALARI ---
  const isDateInPeriod = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    if (auditPeriod === "all") return true;

    const now = new Date();
    if (auditPeriod === "today") {
      return date.toDateString() === now.toDateString();
    }
    if (auditPeriod === "week") {
      return date.getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000;
    }
    if (auditPeriod === "month") {
      return date.getTime() >= Date.now() - 30 * 24 * 60 * 60 * 1000;
    }
    if (auditPeriod === "single_date") {
      if (!selectedDate) return true;
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}` === selectedDate;
    }
    if (auditPeriod === "custom_range") {
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`);
        if (date < start) return false;
      }
      if (endDate) {
        const end = new Date(`${endDate}T23:59:59`);
        if (date > end) return false;
      }
      return true;
    }
    return true;
  };

  const periodShifts = useMemo(() => {
    return shifts.filter(s => isDateInPeriod(s.startedAt));
  }, [shifts, auditPeriod, selectedDate, startDate, endDate]);

  const periodWaste = useMemo(() => {
    return wasteList.filter(w => isDateInPeriod(w.createdAt));
  }, [wasteList, auditPeriod, selectedDate, startDate, endDate]);

  const periodContainers = useMemo(() => {
    return containers.filter(c => isDateInPeriod(c.reportedAt));
  }, [containers, auditPeriod, selectedDate, startDate, endDate]);

  const periodComplaints = useMemo(() => {
    return complaints.filter(c => isDateInPeriod(c.createdAt));
  }, [complaints, auditPeriod, selectedDate, startDate, endDate]);

  // Genel Toplamlar
  const totalAuditTonnage = useMemo(() => {
    return periodShifts.reduce((sum, s) => sum + Number(String(s.tonnage ?? "0").replace(",", ".")), 0);
  }, [periodShifts]);

  const completedShiftsCount = useMemo(() => periodShifts.filter(s => s.status === "tamamlandı").length, [periodShifts]);
  const activeShiftsCount = useMemo(() => periodShifts.filter(s => s.status === "açık").length, [periodShifts]);
  const avgTonnagePerShift = completedShiftsCount > 0 ? (totalAuditTonnage / completedShiftsCount).toFixed(2) : "0.00";

  const totalWasteWaiting = useMemo(() => periodWaste.filter(w => w.status === "bekliyor").length, [periodWaste]);
  const totalContainersWaiting = useMemo(() => periodContainers.filter(c => c.status === "bekliyor").length, [periodContainers]);
  const totalComplaintsOpen = useMemo(() => periodComplaints.filter(c => c.status === "açık").length, [periodComplaints]);

  // Aktif Dönem Başlığı
  const activePeriodLabel = useMemo(() => {
    if (auditPeriod === "today") return `Bugün · ${new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(new Date())}`;
    if (auditPeriod === "week") return "Son 7 Günlük Denetim";
    if (auditPeriod === "month") return "Son 30 Günlük (Bu Ay) Denetim";
    if (auditPeriod === "single_date") {
      if (!selectedDate) return "Belirli Gün";
      const [y, m, d] = selectedDate.split("-").map(Number);
      const parsed = new Date(y, m - 1, d);
      return `📅 ${new Intl.DateTimeFormat("tr-TR", { dateStyle: "full" }).format(parsed)}`;
    }
    if (auditPeriod === "custom_range") {
      return `🗓️ ${startDate || "Başlangıç"} → ${endDate || "Bitiş"}`;
    }
    return "Tüm Zamanlar";
  }, [auditPeriod, selectedDate, startDate, endDate]);

  // Vardiya Dağılımı
  const shiftHoursAnalysis = useMemo(() => {
    const slots = [
      { id: "08:00 - 16:00", name: "Gündüz Vardiyası", hours: "08:00 - 16:00", badgeColor: "bg-amber-50 text-amber-800 border-amber-200" },
      { id: "16:00 - 00:00", name: "Akşam Vardiyası", hours: "16:00 - 00:00", badgeColor: "bg-sky-50 text-sky-800 border-sky-200" },
      { id: "00:00 - 08:00", name: "Gece Vardiyası", hours: "00:00 - 08:00", badgeColor: "bg-purple-50 text-purple-800 border-purple-200" },
    ];

    return slots.map(slot => {
      const matchShifts = periodShifts.filter(s => (s.shiftHours || "08:00 - 16:00") === slot.id);
      const ton = matchShifts.reduce((sum, s) => sum + Number(String(s.tonnage ?? "0").replace(",", ".")), 0);
      return {
        ...slot,
        count: matchShifts.length,
        tonnage: ton,
        percentage: totalAuditTonnage > 0 ? Math.round((ton / totalAuditTonnage) * 100) : 0,
      };
    });
  }, [periodShifts, totalAuditTonnage]);

  // Mahalle Bazlı Kapsamlı Analiz Matrisi
  const neighborhoodMatrix = useMemo(() => {
    const nMap = new Map<string, { name: string; region: string }>();

    neighborhoodsList.forEach(n => {
      if (n.name) nMap.set(n.name.trim().toLowerCase(), { name: n.name.trim(), region: n.region || "Tepebaşı" });
    });

    periodShifts.forEach(s => {
      if (s.neighborhood) {
        const key = s.neighborhood.trim().toLowerCase();
        if (!nMap.has(key)) {
          nMap.set(key, { name: s.neighborhood.trim(), region: s.region || "Tepebaşı" });
        }
      }
    });

    periodWaste.forEach(w => {
      if (w.neighborhood) {
        const key = w.neighborhood.trim().toLowerCase();
        if (!nMap.has(key)) {
          nMap.set(key, { name: w.neighborhood.trim(), region: w.region || "Tepebaşı" });
        }
      }
    });

    const rows = Array.from(nMap.values()).map(item => {
      const key = item.name.toLowerCase();
      const nShifts = periodShifts.filter(s => (s.neighborhood || "").trim().toLowerCase() === key);
      const nWaste = periodWaste.filter(w => (w.neighborhood || "").trim().toLowerCase() === key);
      const nContainers = periodContainers.filter(c => (c.neighborhood || "").trim().toLowerCase() === key);
      const nComplaints = periodComplaints.filter(c => (c.neighborhood || "").trim().toLowerCase() === key);

      const nTonnage = nShifts.reduce((sum, s) => sum + Number(String(s.tonnage ?? "0").replace(",", ".")), 0);
      const nCompletedShifts = nShifts.filter(s => s.status === "tamamlandı").length;
      const nActiveShifts = nShifts.filter(s => s.status === "açık").length;
      const nAvgTonnage = nCompletedShifts > 0 ? (nTonnage / nCompletedShifts).toFixed(2) : "0.00";
      const tonnageShare = totalAuditTonnage > 0 ? Math.round((nTonnage / totalAuditTonnage) * 100) : 0;

      const wasteTotal = nWaste.length;
      const wasteWaiting = nWaste.filter(w => w.status === "bekliyor").length;

      const containerTotal = nContainers.length;
      const containerWaiting = nContainers.filter(c => c.status === "bekliyor").length;

      const complaintTotal = nComplaints.length;
      const complaintOpen = nComplaints.filter(c => c.status === "açık").length;

      // Son sefer / işlem tarihi hesaplama
      let lastDateText = "—";
      let latestShiftTimestamp = 0;
      if (nShifts.length > 0) {
        const sortedShifts = [...nShifts].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
        latestShiftTimestamp = new Date(sortedShifts[0].startedAt).getTime();
        const latest = new Date(sortedShifts[0].startedAt);
        const latestFormatted = latest.toLocaleDateString("tr-TR");
        if (nShifts.length === 1) {
          lastDateText = latestFormatted;
        } else {
          lastDateText = `${latestFormatted} (${nShifts.length} Sefer)`;
        }
      }

      let auditStatus: "active_shift" | "needs_action" | "clean" | "no_shift" = "no_shift";
      if (nActiveShifts > 0) {
        auditStatus = "active_shift";
      } else if (wasteWaiting > 0 || containerWaiting > 0 || complaintOpen > 0) {
        auditStatus = "needs_action";
      } else if (nShifts.length > 0) {
        auditStatus = "clean";
      } else {
        auditStatus = "no_shift";
      }

      return {
        name: item.name,
        region: item.region,
        totalTonnage: nTonnage,
        completedShifts: nCompletedShifts,
        activeShifts: nActiveShifts,
        totalShifts: nShifts.length,
        avgTonnage: nAvgTonnage,
        tonnageShare,
        wasteTotal,
        wasteWaiting,
        containerTotal,
        containerWaiting,
        complaintTotal,
        complaintOpen,
        auditStatus,
        lastDateText,
        latestShiftTimestamp,
      };
    });

    let filtered = rows;
    if (selectedRegion !== "all") {
      filtered = filtered.filter(r => r.region === selectedRegion);
    }
    if (neighborhoodSearch.trim()) {
      const q = neighborhoodSearch.trim().toLowerCase();
      filtered = filtered.filter(r => r.name.toLowerCase().includes(q) || r.region.toLowerCase().includes(q));
    }

    if (sortBy === "date_desc") {
      filtered.sort((a, b) => (b.latestShiftTimestamp || 0) - (a.latestShiftTimestamp || 0) || b.totalTonnage - a.totalTonnage);
    } else if (sortBy === "date_asc") {
      filtered.sort((a, b) => (a.latestShiftTimestamp || 9999999999999) - (b.latestShiftTimestamp || 9999999999999));
    } else if (sortBy === "tonnage_desc") {
      filtered.sort((a, b) => b.totalTonnage - a.totalTonnage || b.totalShifts - a.totalShifts);
    } else if (sortBy === "tonnage_asc") {
      filtered.sort((a, b) => a.totalTonnage - b.totalTonnage || a.totalShifts - b.totalShifts);
    } else if (sortBy === "shifts_desc") {
      filtered.sort((a, b) => b.totalShifts - a.totalShifts || b.totalTonnage - a.totalTonnage);
    } else if (sortBy === "name_asc") {
      filtered.sort((a, b) => a.name.localeCompare(b.name, "tr"));
    }

    return filtered;
  }, [neighborhoodsList, periodShifts, periodWaste, periodContainers, periodComplaints, totalAuditTonnage, selectedRegion, neighborhoodSearch, sortBy]);

  const topNeighborhood = useMemo(() => {
    if (neighborhoodMatrix.length === 0 || neighborhoodMatrix[0].totalTonnage === 0) return null;
    return neighborhoodMatrix[0];
  }, [neighborhoodMatrix]);

  return (
    <div className="space-y-5">
      {/* Üst Sekmeler */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3">
        {[
          { id: "genel", label: "📊 Genel Özet & Mahalle Analizi", count: neighborhoodMatrix.length },
          { id: "mesailer", label: "🚛 Mesailer & Tonaj Fişleri", count: shifts.length },
          { id: "atiklar", label: "📦 Damperlik Atıklar", count: wasteList.length },
          { id: "konteynerler", label: "🏗️ Konteyner Arızaları", count: containers.length },
          { id: "sikayetler", label: "🚨 Vatandaş Şikayetleri", count: complaints.length },
          { id: "sifirla", label: "⚠️ Veri Sıfırlama", count: 0 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-2xs",
              activeTab === tab.id
                ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            )}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={cn("rounded-full px-1.5 py-0.2 text-[10px]", activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600")}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 1. GENEL ÖZET & MAHALLE BAZLI KAPSAMLI DENETİM ANALİZİ */}
      {activeTab === "genel" && (
        <div className="space-y-6">
          {/* Günlük Denetim Filtre Çubuğu */}
          <Card className="border-0 bg-white shadow-sm p-4 space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Hızlı Dönem Seçiciler */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tarih & Denetim Filtresi</p>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px] font-bold">
                    {activePeriodLabel}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: "today", label: "📅 Bugün" },
                    { id: "week", label: "⏱️ Son 7 Gün" },
                    { id: "month", label: "🗓️ Bu Ay" },
                    { id: "all", label: "📊 Tüm Zamanlar" },
                    { id: "single_date", label: "🎯 Belirli Gün Seç" },
                    { id: "custom_range", label: "↔️ Tarih Aralığı" },
                  ].map(period => (
                    <Button
                      key={period.id}
                      type="button"
                      size="sm"
                      variant={auditPeriod === period.id ? "default" : "outline"}
                      onClick={() => setAuditPeriod(period.id as any)}
                      className={cn(
                        "h-8 text-xs font-semibold rounded-xl transition",
                        auditPeriod === period.id
                          ? "bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      {period.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Bölge, Arama ve Sıralama Filtreleri */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="w-48">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="input-native text-xs h-8 font-semibold text-slate-800"
                  >
                    <option value="date_desc">📅 Tarih (Yeniden Eskiye)</option>
                    <option value="date_asc">📅 Tarih (Eskiden Yeniye)</option>
                    <option value="tonnage_desc">⚖️ Tonaj (Çoktan Aza)</option>
                    <option value="tonnage_asc">⚖️ Tonaj (Azdan Çoka)</option>
                    <option value="shifts_desc">🚛 Sefer (En Çok Sefer)</option>
                    <option value="name_asc">🔤 Mahalle Adı (A-Z)</option>
                  </select>
                </div>

                <div className="w-40">
                  <select
                    value={selectedRegion}
                    onChange={e => setSelectedRegion(e.target.value)}
                    className="input-native text-xs h-8"
                  >
                    <option value="all">Tüm Bölgeler</option>
                    <option value="Batı Bölgesi">Batı Bölgesi</option>
                    <option value="Merkez Bölgesi">Merkez Bölgesi</option>
                    <option value="Kuzey Bölgesi">Kuzey Bölgesi</option>
                    <option value="Doğu Bölgesi">Doğu Bölgesi</option>
                    <option value="Güney Bölgesi">Güney Bölgesi</option>
                    <option value="Kırsal / Dış Bölge">Kırsal / Dış Bölge</option>
                  </select>
                </div>

                <div className="w-44">
                  <Input
                    placeholder="Mahalle ara..."
                    value={neighborhoodSearch}
                    onChange={e => setNeighborhoodSearch(e.target.value)}
                    className="text-xs h-8 bg-slate-50/70"
                  />
                </div>
              </div>
            </div>

            {/* Özel Tarih Seçici Giriş Alanları */}
            {auditPeriod === "single_date" && (
              <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-100 popup-transition">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-emerald-700" />
                  İncelenecek Tarih:
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="input-native h-8 w-44 text-xs font-semibold text-slate-800"
                />
                {selectedDate && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    Seçilen: {new Intl.DateTimeFormat("tr-TR", { dateStyle: "full" }).format(new Date(selectedDate.split("-").map(Number)[0], selectedDate.split("-").map(Number)[1] - 1, selectedDate.split("-").map(Number)[2]))}
                  </span>
                )}
              </div>
            )}

            {auditPeriod === "custom_range" && (
              <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-100 popup-transition">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-emerald-700" />
                  Aralık:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="input-native h-8 w-40 text-xs font-medium text-slate-800"
                    placeholder="Başlangıç"
                  />
                  <span className="text-xs text-slate-400 font-bold">→</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="input-native h-8 w-40 text-xs font-medium text-slate-800"
                    placeholder="Bitiş"
                  />
                </div>
                {(startDate || endDate) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setStartDate(""); setEndDate(""); }}
                    className="h-8 text-xs text-slate-500 hover:text-red-600"
                  >
                    Temizle
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* KPI İstatistik Kartları */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 bg-white shadow-sm p-4.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Toplam Atık Tonajı</p>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Scale className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-emerald-800 mt-2 font-display">
                {totalAuditTonnage.toFixed(2)} <span className="text-base font-bold text-emerald-600">Ton</span>
              </p>
              <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1 font-medium">
                <span>Ortalama: <strong>{avgTonnagePerShift} Ton / Sefer</strong></span>
              </p>
            </Card>

            <Card className="border-0 bg-white shadow-sm p-4.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Çöp Seferi / Mesai</p>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-sky-50 text-sky-700">
                  <Truck className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2 font-display">
                {periodShifts.length} <span className="text-base font-bold text-slate-500">Sefer</span>
              </p>
              <p className="text-xs text-slate-500 mt-1.5 font-medium">
                <span className="text-emerald-700 font-bold">{completedShiftsCount} Tamamlandı</span> · <span className="text-sky-700 font-bold">{activeShiftsCount} Aktif Sahada</span>
              </p>
            </Card>

            <Card className="border-0 bg-white shadow-sm p-4.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">En Çok Atık Çıkan Mahalle</p>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-700">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-slate-900 mt-2 font-display truncate">
                {topNeighborhood ? topNeighborhood.name : "Kayıt Yok"}
              </p>
              <p className="text-xs text-amber-700 mt-1.5 font-bold">
                {topNeighborhood ? `${topNeighborhood.totalTonnage.toFixed(2)} Ton (%${topNeighborhood.tonnageShare} Pay)` : "—"}
              </p>
            </Card>

            <Card className="border-0 bg-white shadow-sm p-4.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Saha Denetim Durumu</p>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-50 text-purple-700">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2 font-display">
                {totalWasteWaiting + totalContainersWaiting + totalComplaintsOpen}{" "}
                <span className="text-base font-bold text-slate-500">Bekleyen</span>
              </p>
              <p className="text-xs text-slate-500 mt-1.5 font-medium">
                📦 {totalWasteWaiting} Atık · 🏗️ {totalContainersWaiting} Arıza · 🚨 {totalComplaintsOpen} Şikayet
              </p>
            </Card>
          </div>

          {/* Vardiya Bazlı Tonaj Dağılımı */}
          <Card className="border-0 bg-white shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-700" />
                <CardTitle className="font-display text-sm font-bold text-slate-900">
                  Vardiya Bazlı Tonaj ve Sefer Analizi
                </CardTitle>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Seçilen Dönem: {auditPeriod === "today" ? "Bugün" : auditPeriod === "week" ? "Son 7 Gün" : auditPeriod === "month" ? "Bu Ay" : "Tüm Zamanlar"}
              </span>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {shiftHoursAnalysis.map(slot => (
                  <div key={slot.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{slot.name}</span>
                      <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", slot.badgeColor)}>
                        {slot.hours}
                      </Badge>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-2xl font-extrabold text-slate-900 font-display">
                        {slot.tonnage.toFixed(2)} <span className="text-xs font-bold text-slate-500">Ton</span>
                      </span>
                      <span className="text-xs font-bold text-slate-600">{slot.count} Sefer</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${slot.percentage}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium text-right">
                      Toplam tonajın %{slot.percentage}&apos;si
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mahalle Bazlı Kapsamlı Tonaj & Günlük Denetim Tablosu */}
          <Card className="border-0 bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-700" />
                  Mahalle Bazlı Kapsamlı Tonaj ve Operasyon Denetim Tablosu
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Her mahallenin çekilen tonaj miktarı, sefer ortalaması, açık arızaları ve denetim durumu
                </p>
              </div>
              <Badge variant="outline" className="text-xs bg-slate-50 font-bold text-slate-700 border-slate-200">
                {neighborhoodMatrix.length} Mahalle
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[1000px]">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th
                        onClick={() => setSortBy(sortBy === "name_asc" ? "date_desc" : "name_asc")}
                        className="px-5 py-3.5 cursor-pointer hover:text-emerald-800 transition select-none"
                        title="Mahalle adına göre sırala"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Mahalle / Bölge</span>
                          {sortBy === "name_asc" && <span className="text-emerald-700 font-bold">▲</span>}
                        </div>
                      </th>
                      <th
                        onClick={() => setSortBy(sortBy === "date_desc" ? "date_asc" : "date_desc")}
                        className="px-5 py-3.5 cursor-pointer hover:text-emerald-800 transition select-none"
                        title="Sefer tarihine göre sırala"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>📅 Son Sefer Tarihi</span>
                          {sortBy === "date_desc" ? (
                            <span className="text-emerald-700 font-bold">▼</span>
                          ) : sortBy === "date_asc" ? (
                            <span className="text-emerald-700 font-bold">▲</span>
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th
                        onClick={() => setSortBy(sortBy === "shifts_desc" ? "date_desc" : "shifts_desc")}
                        className="px-5 py-3.5 cursor-pointer hover:text-emerald-800 transition select-none"
                        title="Sefer sayısına göre sırala"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Çöp Seferi</span>
                          {sortBy === "shifts_desc" && <span className="text-emerald-700 font-bold">▼</span>}
                        </div>
                      </th>
                      <th
                        onClick={() => setSortBy(sortBy === "tonnage_desc" ? "tonnage_asc" : "tonnage_desc")}
                        className="px-5 py-3.5 cursor-pointer hover:text-emerald-800 transition select-none"
                        title="Tonaj miktarına göre sırala"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Toplam Tonaj</span>
                          {sortBy === "tonnage_desc" ? (
                            <span className="text-emerald-700 font-bold">▼</span>
                          ) : sortBy === "tonnage_asc" ? (
                            <span className="text-emerald-700 font-bold">▲</span>
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-3.5">Sefer Ortalaması</th>
                      <th className="px-5 py-3.5 w-36">Tonaj Payı</th>
                      <th className="px-5 py-3.5">Damperlik Atık</th>
                      <th className="px-5 py-3.5">Konteyner</th>
                      <th className="px-5 py-3.5">Şikayet</th>
                      <th className="px-5 py-3.5 text-right">Denetim Durumu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {neighborhoodMatrix.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-xs text-slate-500">
                          Seçilen kriterlere uygun mahalle denetim kaydı bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      neighborhoodMatrix.map(item => (
                        <tr key={item.name} className="border-t border-slate-100 hover:bg-slate-50/70 transition">
                          {/* Mahalle & Bölge */}
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                            <p className="text-[11px] text-slate-500 font-medium">{item.region}</p>
                          </td>

                          {/* Son Sefer Tarihi */}
                          <td className="px-5 py-3.5 text-xs">
                            {item.lastDateText !== "—" ? (
                              <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                                📅 {item.lastDateText}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium">—</span>
                            )}
                          </td>

                          {/* Sefer Sayısı */}
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-slate-800">{item.totalShifts} Sefer</span>
                            {item.activeShifts > 0 && (
                              <span className="block text-[10px] font-bold text-sky-700">({item.activeShifts} Aktif)</span>
                            )}
                          </td>

                          {/* Toplam Tonaj */}
                          <td className="px-5 py-3.5">
                            <span className="font-display font-extrabold text-emerald-800 text-base">
                              {item.totalTonnage.toFixed(2)}
                            </span>
                            <span className="text-xs font-bold text-slate-500 ml-1">Ton</span>
                          </td>

                          {/* Ortalama Sefer Başı Tonaj */}
                          <td className="px-5 py-3.5 text-slate-700 font-medium text-xs">
                            {item.completedShifts > 0 ? `${item.avgTonnage} Ton/Sefer` : "—"}
                          </td>

                          {/* Tonaj Payı Progress Bar */}
                          <td className="px-5 py-3.5">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                                <span>%{item.tonnageShare}</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(item.tonnageShare, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Damperlik Atık Durumu */}
                          <td className="px-5 py-3.5 text-xs">
                            {item.wasteTotal > 0 ? (
                              <div>
                                <span className="font-semibold text-slate-800">{item.wasteTotal} Kayıt</span>
                                {item.wasteWaiting > 0 ? (
                                  <span className="block text-[10px] font-bold text-amber-700">⚠️ {item.wasteWaiting} Bekliyor</span>
                                ) : (
                                  <span className="block text-[10px] font-semibold text-emerald-700">✓ Toplandı</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Konteyner Arızası */}
                          <td className="px-5 py-3.5 text-xs">
                            {item.containerTotal > 0 ? (
                              <div>
                                <span className="font-semibold text-slate-800">{item.containerTotal} Arıza</span>
                                {item.containerWaiting > 0 ? (
                                  <span className="block text-[10px] font-bold text-amber-700">⚠️ {item.containerWaiting} Onarım Bekliyor</span>
                                ) : (
                                  <span className="block text-[10px] font-semibold text-emerald-700">✓ Onarıldı</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Vatandaş Şikayeti */}
                          <td className="px-5 py-3.5 text-xs">
                            {item.complaintTotal > 0 ? (
                              <div>
                                <span className="font-semibold text-slate-800">{item.complaintTotal} Şikayet</span>
                                {item.complaintOpen > 0 ? (
                                  <span className="block text-[10px] font-bold text-red-700">🚨 {item.complaintOpen} Açık</span>
                                ) : (
                                  <span className="block text-[10px] font-semibold text-emerald-700">✓ Çözüldü</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Günlük Denetim Durumu */}
                          <td className="px-5 py-3.5 text-right">
                            {item.auditStatus === "active_shift" && (
                              <Badge className="bg-sky-50 text-sky-800 border border-sky-200 text-[11px] font-bold">
                                🔵 Mesai Sürüyor
                              </Badge>
                            )}
                            {item.auditStatus === "needs_action" && (
                              <Badge className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                                🟡 Müdahale Bekliyor
                              </Badge>
                            )}
                            {item.auditStatus === "clean" && (
                              <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                                🟢 Tamamlandı / Temiz
                              </Badge>
                            )}
                            {item.auditStatus === "no_shift" && (
                              <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[11px]">
                                ⚪ Sefer Yapılmadı
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. MESAİ YÖNETİMİ & TONAJ FİŞİ İNCELEME */}
      {activeTab === "mesailer" && (
        <Card className="border-0 bg-white shadow-sm overflow-hidden">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-base font-bold text-slate-900">Kayıtlı Mesailer ve Tonaj Fişleri</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Şoför mesai kayıtları, tamamlanan tonajlar ve yüklenen tonaj fişi fotoğrafları</p>
            </div>
            <Badge variant="outline" className="text-xs font-bold text-slate-700 bg-slate-50">{shifts.length} Mesai</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[800px]">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="px-5 py-3">ID & Tarih</th>
                    <th className="px-5 py-3">Şoför</th>
                    <th className="px-5 py-3">Mahalle & Vardiya</th>
                    <th className="px-5 py-3">Araç</th>
                    <th className="px-5 py-3">Km / Tonaj & Fiş</th>
                    <th className="px-5 py-3">Durum</th>
                    <th className="px-5 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map(shift => {
                    const receipts = parseTonnageReceipts(shift.tonnageReceiptUrl);
                    return (
                      <tr key={shift.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition">
                        <td className="px-5 py-3">
                          <span className="font-bold text-slate-900">#{shift.id}</span>
                          <span className="block text-xs text-slate-400">{new Date(shift.startedAt).toLocaleDateString("tr-TR")}</span>
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-800">{shift.driverName || `Şoför #${shift.driverId}`}</td>
                        <td className="px-5 py-3 text-slate-700">
                          <span className="font-semibold text-slate-900">{shift.neighborhood}</span>
                          <span className="block text-xs text-purple-700 font-medium">{shift.shiftHours || "08:00 - 16:00"}</span>
                        </td>
                        <td className="px-5 py-3 font-medium">{shift.vehiclePlate || `#${shift.vehicleId}`}</td>
                        <td className="px-5 py-3 text-slate-600 text-xs">
                          <div>
                            {shift.startKm} → {shift.endKm ?? "—"} km
                            {shift.tonnage && (
                              <span className="block font-bold text-emerald-700">
                                ⚖️ {shift.tonnage} Ton
                              </span>
                            )}
                            {receipts.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setReceiptModal({
                                    shiftId: shift.id,
                                    driverName: shift.driverName,
                                    neighborhood: shift.neighborhood,
                                    shiftHours: shift.shiftHours,
                                    tonnage: shift.tonnage,
                                    receipts,
                                  })
                                }
                                className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 transition shadow-2xs"
                              >
                                <Camera className="h-3.5 w-3.5 text-emerald-700" />
                                <span>Tonaj Fişi ({receipts.length})</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant="outline" className={shift.status === "açık" ? "bg-sky-50 text-sky-700 text-[10px]" : "bg-emerald-50 text-emerald-700 text-[10px]"}>
                            {shift.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="ghost" onClick={() => setEditingShift(shift)} className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-700">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Mesai #${shift.id} kaydını silmek istiyor musunuz?`)) {
                                  removeShift.mutate({ id: shift.id });
                                }
                              }}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. DAMPERLİK ATIKLAR */}
      {activeTab === "atiklar" && (
        <Card className="border-0 bg-white shadow-sm overflow-hidden">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="font-display text-base">Damperlik Atık Kayıtları</CardTitle>
            <Badge variant="outline" className="text-xs font-bold">{wasteList.length} Kayıt</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[750px]">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Tür & Mahalle</th>
                    <th className="px-5 py-3">Açıklama</th>
                    <th className="px-5 py-3">Bildiren Şoför</th>
                    <th className="px-5 py-3">Kepçe Durumu</th>
                    <th className="px-5 py-3">Durum</th>
                    <th className="px-5 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {wasteList.map(waste => (
                    <tr key={waste.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-semibold text-slate-900">
                        {waste.wasteType} · {waste.neighborhood}
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs max-w-xs truncate">{waste.description}</td>
                      <td className="px-5 py-3 text-xs">
                        {waste.reporterName ? (
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/70">
                            👤 {waste.reporterName}
                          </span>
                        ) : (
                          <span className="text-slate-400">Belirtilmedi</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {waste.requiresExcavator ? (
                          <Badge className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                            🚜 Kepçe Gerekli
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-200 text-slate-500 text-[10px]">
                            Gerekli Değil
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={waste.status === "bekliyor" ? "bg-amber-50 text-amber-700 text-[10px] font-bold" : "bg-emerald-50 text-emerald-700 text-[10px] font-bold"}>
                          {waste.status === "bekliyor" ? "Bekliyor" : "Toplandı"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="ghost" onClick={() => setEditingWaste(waste)} className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-700">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Damperlik atık #${waste.id} kaydını silmek istiyor musunuz?`)) {
                                removeWaste.mutate({ id: waste.id });
                              }
                            }}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. KONTEYNER ARIZALARI */}
      {activeTab === "konteynerler" && (
        <Card className="border-0 bg-white shadow-sm overflow-hidden">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="font-display text-base">Konteyner Arıza Kayıtları</CardTitle>
            <Badge variant="outline" className="text-xs">{containers.length} Kayıt</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[650px]">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Arıza & Mahalle</th>
                    <th className="px-5 py-3">Açıklama</th>
                    <th className="px-5 py-3">Durum</th>
                    <th className="px-5 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {containers.map(cont => (
                    <tr key={cont.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-semibold text-slate-900">{cont.faultType} · {cont.neighborhood}</td>
                      <td className="px-5 py-3 text-slate-600 text-xs max-w-md truncate">{cont.description}</td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={cont.status === "bekliyor" ? "bg-amber-50 text-amber-700 text-[10px]" : "bg-emerald-50 text-emerald-700 text-[10px]"}>
                          {cont.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="ghost" onClick={() => setEditingContainer(cont)} className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-700">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Konteyner arızası #${cont.id} kaydını silmek istiyor musunuz?`)) {
                                removeContainer.mutate({ id: cont.id });
                              }
                            }}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. VATANDAŞ ŞİKAYETLERİ */}
      {activeTab === "sikayetler" && (
        <Card className="border-0 bg-white shadow-sm overflow-hidden">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="font-display text-base">Vatandaş Şikayetleri</CardTitle>
            <Badge variant="outline" className="text-xs">{complaints.length} Kayıt</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[650px]">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Mahalle</th>
                    <th className="px-5 py-3">Açıklama</th>
                    <th className="px-5 py-3">Durum</th>
                    <th className="px-5 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map(comp => (
                    <tr key={comp.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-semibold text-slate-900">{comp.neighborhood}</td>
                      <td className="px-5 py-3 text-slate-600 text-xs max-w-md truncate">{comp.description}</td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={comp.status === "açık" ? "bg-red-50 text-red-700 text-[10px]" : "bg-emerald-50 text-emerald-700 text-[10px]"}>
                          {comp.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="ghost" onClick={() => setEditingComplaint(comp)} className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-700">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Şikayet #${comp.id} kaydını silmek istiyor musunuz?`)) {
                                removeComplaint.mutate({ id: comp.id });
                              }
                            }}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. ANALİZ VERİLERİNİ SIFIRLAMA */}
      {activeTab === "sifirla" && (
        <Card className="border border-red-200 bg-red-50/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-display flex items-center gap-2 text-red-900 text-base">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              Operasyon Verilerini Sıfırlama
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { key: "shifts", label: "Tüm Mesai Kayıtları", count: shifts.length },
                { key: "waste", label: "Damperlik Atık Kayıtları", count: wasteList.length },
                { key: "containers", label: "Konteyner Arıza Kayıtları", count: containers.length },
                { key: "complaints", label: "Vatandaş Şikayetleri", count: complaints.length },
                { key: "faults", label: "Araç Arıza Kayıtları", count: 0 },
                { key: "auditLogs", label: "Denetim Logları", count: logs.length },
              ].map(opt => (
                <label
                  key={opt.key}
                  className="flex items-center gap-3 p-3 rounded-xl border border-red-200 bg-white hover:bg-red-50/50 cursor-pointer shadow-2xs"
                >
                  <input
                    type="checkbox"
                    checked={(purgeOptions as any)[opt.key]}
                    onChange={e => setPurgeOptions({ ...purgeOptions, [opt.key]: e.target.checked })}
                    className="h-4 w-4 rounded text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{opt.label}</p>
                    <p className="text-[11px] text-slate-500">{opt.count} kayıt</p>
                  </div>
                </label>
              ))}
            </div>

            <div>
              <Button
                type="button"
                onClick={() => {
                  const anySelected = Object.values(purgeOptions).some(Boolean);
                  if (!anySelected) return toast.error("Lütfen en az bir kategori seçin.");
                  setShowPurgeModal(true);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Seçilenleri Sıfırla...
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SIFIRLAMA ONAY MODALI */}
      {showPurgeModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 popup-transition border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-red-950 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Veri Sıfırlama Onayı
              </h3>
              <button onClick={() => setShowPurgeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seçtiğiniz veriler kalıcı olarak silinecektir. Onaylamak için kutuya <strong>SIFIRLA</strong> yazın:
            </p>
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <Input
                placeholder="SIFIRLA"
                value={confirmPurgeText}
                onChange={e => setConfirmPurgeText(e.target.value)}
                className="font-mono text-center font-bold tracking-widest"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowPurgeModal(false)}>
                  İptal
                </Button>
                <Button
                  disabled={confirmPurgeText !== "SIFIRLA" || resetDataMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  {resetDataMutation.isPending ? "Sıfırlanıyor..." : "Kalıcı Olarak Sıfırla"}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MESAİ DÜZENLEME MODALI */}
      {editingShift && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 popup-transition border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Mesaiyi Düzenle #{editingShift.id}</h3>
              <button onClick={() => setEditingShift(null)}><X className="h-5 w-5" /></button>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                updateShift.mutate({
                  id: editingShift.id,
                  neighborhood: editingShift.neighborhood,
                  shiftHours: editingShift.shiftHours,
                  startKm: Number(editingShift.startKm),
                  endKm: editingShift.endKm ? Number(editingShift.endKm) : null,
                  tonnage: editingShift.tonnage || null,
                  status: editingShift.status,
                });
              }}
              className="space-y-3"
            >
              <Field label="Mahalle">
                <Input value={editingShift.neighborhood} onChange={e => setEditingShift({ ...editingShift, neighborhood: e.target.value })} />
              </Field>
              <Field label="Vardiya">
                <select value={editingShift.shiftHours || "08:00 - 16:00"} onChange={e => setEditingShift({ ...editingShift, shiftHours: e.target.value })} className="input-native">
                  <option value="08:00 - 16:00">08:00 - 16:00</option>
                  <option value="16:00 - 00:00">16:00 - 00:00</option>
                  <option value="00:00 - 08:00">00:00 - 08:00</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Başlangıç Km"><Input type="number" value={editingShift.startKm} onChange={e => setEditingShift({ ...editingShift, startKm: e.target.value })} /></Field>
                <Field label="Bitiş Km"><Input type="number" value={editingShift.endKm || ""} onChange={e => setEditingShift({ ...editingShift, endKm: e.target.value })} /></Field>
              </div>
              <Field label="Tonaj"><Input value={editingShift.tonnage || ""} onChange={e => setEditingShift({ ...editingShift, tonnage: e.target.value })} placeholder="Örn. 3.50" /></Field>
              {(() => {
                const receipts = parseTonnageReceipts(editingShift.tonnageReceiptUrl);
                if (receipts.length === 0) return null;
                return (
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Scale className="h-3.5 w-3.5 text-emerald-700" />
                        Tonaj Fişi ({receipts.length})
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setReceiptModal({
                            shiftId: editingShift.id,
                            driverName: editingShift.driverName,
                            neighborhood: editingShift.neighborhood,
                            shiftHours: editingShift.shiftHours,
                            tonnage: editingShift.tonnage,
                            receipts,
                          })
                        }
                        className="text-[11px] font-bold text-emerald-700 hover:underline"
                      >
                        Büyük İncele
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {receipts.map((src, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setReceiptModal({
                              shiftId: editingShift.id,
                              driverName: editingShift.driverName,
                              neighborhood: editingShift.neighborhood,
                              shiftHours: editingShift.shiftHours,
                              tonnage: editingShift.tonnage,
                              receipts,
                            })
                          }
                          className="h-16 w-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 hover:opacity-85 transition"
                        >
                          <img src={src} alt="Tonaj Fişi" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <Field label="Durum">
                <select value={editingShift.status} onChange={e => setEditingShift({ ...editingShift, status: e.target.value })} className="input-native">
                  <option value="açık">açık</option>
                  <option value="tamamlandı">tamamlandı</option>
                </select>
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingShift(null)}>İptal</Button>
                <Button disabled={updateShift.isPending} className="bg-emerald-700 hover:bg-emerald-800">Kaydet</Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ATIK DÜZENLEME MODALI */}
      {editingWaste && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 popup-transition border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Damperlik Atık Düzenle #{editingWaste.id}</h3>
              <button onClick={() => setEditingWaste(null)}><X className="h-5 w-5" /></button>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                updateWaste.mutate({
                  id: editingWaste.id,
                  wasteType: editingWaste.wasteType,
                  description: editingWaste.description,
                  neighborhood: editingWaste.neighborhood,
                  status: editingWaste.status,
                  requiresExcavator: Boolean(editingWaste.requiresExcavator),
                });
              }}
              className="space-y-3"
            >
              <Field label="Atık Türü"><Input value={editingWaste.wasteType} onChange={e => setEditingWaste({ ...editingWaste, wasteType: e.target.value })} /></Field>
              <Field label="Mahalle"><Input value={editingWaste.neighborhood} onChange={e => setEditingWaste({ ...editingWaste, neighborhood: e.target.value })} /></Field>
              <Field label="Açıklama"><Textarea value={editingWaste.description} onChange={e => setEditingWaste({ ...editingWaste, description: e.target.value })} /></Field>
              <Field label="Kepçe İhtiyacı">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingWaste({ ...editingWaste, requiresExcavator: false })}
                    className={cn(
                      "flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold transition",
                      !editingWaste.requiresExcavator ? "border-emerald-700 bg-emerald-50 text-emerald-800 font-bold" : "border-slate-200 bg-white text-slate-600"
                    )}
                  >
                    Gerekli Değil
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingWaste({ ...editingWaste, requiresExcavator: true })}
                    className={cn(
                      "flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold transition",
                      editingWaste.requiresExcavator ? "border-amber-500 bg-amber-500 text-white font-bold" : "border-slate-200 bg-white text-slate-600"
                    )}
                  >
                    🚜 Kepçe Gerekli
                  </button>
                </div>
              </Field>
              <Field label="Durum">
                <select value={editingWaste.status} onChange={e => setEditingWaste({ ...editingWaste, status: e.target.value })} className="input-native">
                  <option value="bekliyor">bekliyor</option>
                  <option value="toplandı">toplandı</option>
                </select>
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingWaste(null)}>İptal</Button>
                <Button disabled={updateWaste.isPending} className="bg-emerald-700 hover:bg-emerald-800">Kaydet</Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* KONTEYNER DÜZENLEME MODALI */}
      {editingContainer && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 popup-transition border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Konteyner Arızası Düzenle #{editingContainer.id}</h3>
              <button onClick={() => setEditingContainer(null)}><X className="h-5 w-5" /></button>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                updateContainer.mutate({
                  id: editingContainer.id,
                  faultType: editingContainer.faultType,
                  description: editingContainer.description,
                  repairNote: editingContainer.repairNote || undefined,
                  status: editingContainer.status,
                });
              }}
              className="space-y-3"
            >
              <Field label="Arıza Türü">
                <select value={editingContainer.faultType} onChange={e => setEditingContainer({ ...editingContainer, faultType: e.target.value })} className="input-native">
                  <option value="kol">kol</option>
                  <option value="ayak">ayak</option>
                  <option value="gövde">gövde</option>
                  <option value="kapak">kapak</option>
                  <option value="diğer">diğer</option>
                </select>
              </Field>
              <Field label="Mahalle"><Input value={editingContainer.neighborhood} onChange={e => setEditingContainer({ ...editingContainer, neighborhood: e.target.value })} /></Field>
              <Field label="Açıklama"><Textarea value={editingContainer.description} onChange={e => setEditingContainer({ ...editingContainer, description: e.target.value })} /></Field>
              <Field label="Onarım Notu"><Input value={editingContainer.repairNote || ""} onChange={e => setEditingContainer({ ...editingContainer, repairNote: e.target.value })} placeholder="Onarım detayları..." /></Field>
              <Field label="Durum">
                <select value={editingContainer.status} onChange={e => setEditingContainer({ ...editingContainer, status: e.target.value })} className="input-native">
                  <option value="bekliyor">bekliyor</option>
                  <option value="onarıldı">onarıldı</option>
                </select>
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingContainer(null)}>İptal</Button>
                <Button disabled={updateContainer.isPending} className="bg-emerald-700 hover:bg-emerald-800">Kaydet</Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ŞİKAYET DÜZENLEME MODALI */}
      {editingComplaint && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 popup-transition border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Şikayeti Düzenle #{editingComplaint.id}</h3>
              <button onClick={() => setEditingComplaint(null)}><X className="h-5 w-5" /></button>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                updateComplaint.mutate({
                  id: editingComplaint.id,
                  neighborhood: editingComplaint.neighborhood,
                  description: editingComplaint.description,
                  status: editingComplaint.status,
                });
              }}
              className="space-y-3"
            >
              <Field label="Mahalle"><Input value={editingComplaint.neighborhood} onChange={e => setEditingComplaint({ ...editingComplaint, neighborhood: e.target.value })} /></Field>
              <Field label="Açıklama"><Textarea value={editingComplaint.description} onChange={e => setEditingComplaint({ ...editingComplaint, description: e.target.value })} /></Field>
              <Field label="Durum">
                <select value={editingComplaint.status} onChange={e => setEditingComplaint({ ...editingComplaint, status: e.target.value })} className="input-native">
                  <option value="açık">açık</option>
                  <option value="onaylandı">onaylandı</option>
                </select>
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingComplaint(null)}>İptal</Button>
                <Button disabled={updateComplaint.isPending} className="bg-emerald-700 hover:bg-emerald-800">Kaydet</Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* TONAJ FİŞİ LIGHTBOX MODAL */}
      {receiptModal && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
          onClick={() => setReceiptModal(null)}
        >
          <div
            className={cn(
              "relative max-h-[90vh] w-full overflow-hidden rounded-2xl bg-white shadow-2xl popup-transition border border-slate-200 flex flex-col",
              receiptModal.receipts.length > 1 ? "max-w-2xl" : "max-w-md"
            )}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50/50 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-1.5">
                    <Scale className="h-4 w-4 text-emerald-700" />
                    Tonaj Fişi İnceleme
                  </h3>
                  <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold">
                    Mesai #{receiptModal.shiftId}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  👤 {receiptModal.driverName || "Şoför"} · 📍 {receiptModal.neighborhood || "Bölge"} · ⏱️ {receiptModal.shiftHours || "08:00 - 16:00"}
                  {receiptModal.tonnage && ` · ⚖️ ${receiptModal.tonnage} Ton`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReceiptModal(null)}
                className="rounded-full bg-white border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 transition shadow-2xs"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body / Images */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-130px)]">
              <div className={cn(
                "grid gap-3",
                receiptModal.receipts.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
              )}>
                {receiptModal.receipts.map((imgSrc, idx) => (
                  <div key={idx} className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 p-2 text-center">
                    <div className="h-[46vh] w-full rounded-lg bg-white flex items-center justify-center overflow-hidden border border-slate-100 shadow-2xs">
                      <img
                        src={imgSrc}
                        alt={`Tonaj Fişi ${idx + 1}`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold text-slate-700">
                        📄 Fiş #{idx + 1}
                      </span>
                      <a
                        href={imgSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Tam Boyut Aç
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-3.5 border-t border-slate-100 bg-slate-50/50 shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Toplam {receiptModal.receipts.length} adet tonaj fişi kayıtlı.
              </span>
              <Button variant="outline" size="sm" onClick={() => setReceiptModal(null)}>
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

// -----------------------------------------------------------------------------
// 3. PERSONEL YÖNETİMİ
// -----------------------------------------------------------------------------
function Personnel({ users, refresh }: { users: any[]; refresh: () => void }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    role: "şoför" as Role,
  });

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "şoför" as Role,
  });

  const create = trpc.operations.users.create.useMutation({
    onSuccess: () => {
      toast.success("Personel hesabı oluşturuldu.");
      setForm({ username: "", password: "", name: "", role: "şoför" });
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const update = trpc.operations.users.update.useMutation({
    onSuccess: () => {
      toast.success("Personel bilgileri güncellendi.");
      setEditingUser(null);
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const remove = trpc.operations.users.remove.useMutation({
    onSuccess: () => {
      toast.success("Personel hesabı silindi.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const submitCreate = (e: FormEvent) => {
    e.preventDefault();
    create.mutate(form);
  };

  const submitUpdate = (e: FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    update.mutate({
      openId: editingUser.openId,
      name: editForm.name || undefined,
      username: editForm.username || undefined,
      password: editForm.password || undefined,
      role: editForm.role,
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="border-0 bg-white shadow-sm h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="font-display flex items-center gap-2 text-base">
            <Plus className="h-5 w-5 text-emerald-700" />
            Yeni Personel Tanımla
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitCreate} className="space-y-4">
            <Field label="Ad Soyad">
              <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Kullanıcı Adı">
              <Input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            </Field>
            <Field label="Şifre">
              <Input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </Field>
            <Field label="Rol">
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })} className="input-native">
                <option value="şoför">şoför</option>
                <option value="kademe personeli">kademe personeli</option>
                <option value="kaynak personeli">kaynak personeli</option>
                <option value="yönetim">yönetim</option>
              </select>
            </Field>
            <Button disabled={create.isPending} className="w-full bg-emerald-700 hover:bg-emerald-800">
              {create.isPending ? "Ekleniyor..." : "Personeli Kaydet"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm lg:col-span-2">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="font-display text-base">Personel Listesi</CardTitle>
          <Badge variant="outline" className="text-xs">{users.length} Personel</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Ad Soyad</th>
                  <th className="px-5 py-3">Kullanıcı Adı</th>
                  <th className="px-5 py-3">Rol</th>
                  <th className="px-5 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{u.name || "İsimsiz"}</td>
                    <td className="px-5 py-3.5 text-slate-600">@{u.username || "yerel"}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant="outline" className="text-xs bg-slate-50">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingUser(u);
                            setEditForm({ name: u.name || "", username: u.username || "", password: "", role: u.role || "şoför" });
                          }}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`@${u.username} kullanıcısını silmek istiyor musunuz?`)) {
                              remove.mutate({ openId: u.openId });
                            }
                          }}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Personel Düzenleme Modalı */}
      {editingUser && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 popup-transition border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Personel Düzenle: @{editingUser.username}</h3>
              <button onClick={() => setEditingUser(null)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submitUpdate} className="space-y-3">
              <Field label="Ad Soyad">
                <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </Field>
              <Field label="Kullanıcı Adı">
                <Input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} />
              </Field>
              <Field label="Yeni Şifre (Boş bırakılırsa değişmez)">
                <Input type="password" placeholder="••••••••" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} />
              </Field>
              <Field label="Rol">
                <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value as Role })} className="input-native">
                  <option value="şoför">şoför</option>
                  <option value="kademe personeli">kademe personeli</option>
                  <option value="kaynak personeli">kaynak personeli</option>
                  <option value="yönetim">yönetim</option>
                </select>
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>İptal</Button>
                <Button disabled={update.isPending} className="bg-emerald-700 hover:bg-emerald-800">Güncelle</Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
