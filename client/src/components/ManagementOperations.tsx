import { AccessNotice, Field, type AppView } from "@/components/OperationsWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  FileBarChart,
  Filter,
  KeyRound,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  UserCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { Role } from "@/pages/Home";

export default function ManagementOperations({
  role,
  view,
  shifts,
  complaints,
  logs,
  users,
  refresh,
}: {
  role: Role;
  view: AppView;
  shifts: any[];
  complaints: any[];
  logs: any[];
  users: any[];
  refresh: () => void;
}) {
  if (role !== "yönetim") return <AccessNotice title="Bu ekran yalnızca yönetim rolü için kullanılabilir." />;
  if (view === "raporlar") return <Reports shifts={shifts} complaints={complaints} logs={logs} users={users} refresh={refresh} />;
  return <Personnel users={users} refresh={refresh} />;
}

function Reports({ shifts, complaints, logs, users, refresh }: { shifts: any[]; complaints: any[]; logs: any[]; users: any[]; refresh: () => void }) {
  const totalTonnage = shifts.reduce((sum, shift) => sum + Number(String(shift.tonnage ?? "0").replace(",", ".")), 0);
  const openComplaints = complaints.filter(complaint => complaint.status === "açık").length;
  const overdueComplaints = complaints.filter(
    complaint => complaint.status === "açık" && new Date(complaint.dueAt).getTime() < Date.now()
  ).length;

  // 1. LOG DİREKT TARİH FİLTRELEME (xx.xx.xxxx TARİH SEÇİCİ)
  const [logStartDate, setLogStartDate] = useState("");
  const [logEndDate, setLogEndDate] = useState("");

  const filteredLogs = useMemo(() => {
    if (!logStartDate && !logEndDate) return logs;

    let startMs = 0;
    let endMs = Infinity;

    if (logStartDate) {
      const [y, m, d] = logStartDate.split("-").map(Number);
      startMs = new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
    }

    if (logEndDate) {
      const [y, m, d] = logEndDate.split("-").map(Number);
      endMs = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
    }

    return logs.filter(log => {
      const logTime = new Date(log.createdAt).getTime();
      return logTime >= startMs && logTime <= endMs;
    });
  }, [logs, logStartDate, logEndDate]);

  // 2. MAHALLE BAZLI TONAJ ANALİZİ & FİLTRELEME
  const [tonnagePeriod, setTonnagePeriod] = useState<"all" | "today" | "week" | "month">("all");
  const [tonnageSearchNeighborhood, setTonnageSearchNeighborhood] = useState("");

  const neighborhoodTonnageAnalysis = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    // Period filtering on shifts
    const periodFilteredShifts = shifts.filter(shift => {
      if (!shift.startedAt) return false;
      const shiftTime = new Date(shift.startedAt).getTime();
      if (tonnagePeriod === "today") return shiftTime >= startOfToday;
      if (tonnagePeriod === "week") return shiftTime >= sevenDaysAgo;
      if (tonnagePeriod === "month") return shiftTime >= thirtyDaysAgo;
      return true;
    });

    // Grouping by neighborhood
    const statsMap: Record<string, { neighborhood: string; region: string; totalTonnage: number; shiftCount: number }> = {};

    for (const shift of periodFilteredShifts) {
      const neigh = (shift.neighborhood || "Belirtilmemiş").trim();
      const ton = Number(String(shift.tonnage ?? "0").replace(",", "."));

      if (!statsMap[neigh]) {
        statsMap[neigh] = {
          neighborhood: neigh,
          region: shift.region || "Tepebaşı",
          totalTonnage: 0,
          shiftCount: 0,
        };
      }

      statsMap[neigh].totalTonnage += ton;
      statsMap[neigh].shiftCount += 1;
    }

    let list = Object.values(statsMap);

    // Search query filtering
    if (tonnageSearchNeighborhood.trim()) {
      const query = tonnageSearchNeighborhood.toLocaleLowerCase("tr").trim();
      list = list.filter(item => item.neighborhood.toLocaleLowerCase("tr").includes(query) || item.region.toLocaleLowerCase("tr").includes(query));
    }

    // Sort by total tonnage descending
    return list.sort((a, b) => b.totalTonnage - a.totalTonnage);
  }, [shifts, tonnagePeriod, tonnageSearchNeighborhood]);

  const maxNeighborhoodTonnage = useMemo(() => {
    return Math.max(...neighborhoodTonnageAnalysis.map(item => item.totalTonnage), 1);
  }, [neighborhoodTonnageAnalysis]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <ReportCard label="Toplam mesai kaydı" value={shifts.length} />
        <ReportCard label="Tonaj bildirimi" value={`${totalTonnage.toLocaleString("tr-TR")} ton`} />
        <ReportCard label="İşlem geçmişi" value={logs.length} />
      </section>

      {/* MAHALLE BAZLI TONAJ ANALİZİ KARTI */}
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-700" />
              Mahalle Bazlı Tonaj Analizi
            </CardTitle>
            <p className="text-sm text-slate-500">Günlük, haftalık, aylık zaman dilimlerine göre mahallelerin atık toplama ve tonaj analizi.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setTonnagePeriod("today")}
                className={`rounded-lg px-2.5 py-1 transition ${tonnagePeriod === "today" ? "bg-emerald-700 text-white shadow-xs" : "hover:text-slate-900"}`}
              >
                Günlük (Bugün)
              </button>
              <button
                onClick={() => setTonnagePeriod("week")}
                className={`rounded-lg px-2.5 py-1 transition ${tonnagePeriod === "week" ? "bg-emerald-700 text-white shadow-xs" : "hover:text-slate-900"}`}
              >
                Haftalık (7 Gün)
              </button>
              <button
                onClick={() => setTonnagePeriod("month")}
                className={`rounded-lg px-2.5 py-1 transition ${tonnagePeriod === "month" ? "bg-emerald-700 text-white shadow-xs" : "hover:text-slate-900"}`}
              >
                Aylık (30 Gün)
              </button>
              <button
                onClick={() => setTonnagePeriod("all")}
                className={`rounded-lg px-2.5 py-1 transition ${tonnagePeriod === "all" ? "bg-emerald-700 text-white shadow-xs" : "hover:text-slate-900"}`}
              >
                Tüm Zamanlar
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 max-w-sm">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <Input
              placeholder="Mahalle adı ile ara (Örn. Hoşnudiye)"
              value={tonnageSearchNeighborhood}
              onChange={e => setTonnageSearchNeighborhood(e.target.value)}
              className="text-xs bg-slate-50 h-9"
            />
            {tonnageSearchNeighborhood && (
              <button onClick={() => setTonnageSearchNeighborhood("")} className="text-slate-400 hover:text-slate-600 text-xs">
                Temizle
              </button>
            )}
          </div>

          {neighborhoodTonnageAnalysis.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              Seçili zaman aralığında tonaj kaydı bulunan mahalle verisi yok.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {neighborhoodTonnageAnalysis.map(item => {
                const percentage = Math.round((item.totalTonnage / maxNeighborhoodTonnage) * 100);
                const avgPerShift = item.shiftCount > 0 ? (item.totalTonnage / item.shiftCount).toFixed(2) : "0";

                return (
                  <div key={item.neighborhood} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                        {item.neighborhood}
                      </span>
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold">
                        {item.totalTonnage.toLocaleString("tr-TR")} ton
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Sefer Sayısı: <strong>{item.shiftCount} mesai</strong></span>
                        <span>Sefer Başı Ortalama: <strong>{avgPerShift} ton</strong></span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full bg-emerald-600 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        {/* Mesai ve Tonaj Raporu Tablosu */}
        <Card className="overflow-hidden border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-display">Mesai ve Tonaj Raporu</CardTitle>
            <p className="text-sm text-slate-500">Mesaiyi gerçekleştiren personel, rolü ve tonaj fişi bilgileri.</p>
          </CardHeader>
          <CardContent className="p-0">
            {shifts.length === 0 ? (
              <NoData text="Henüz tamamlanmış mesai kaydı yok." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Personel & Rol</th>
                      <th className="px-5 py-3">Bölge / Mahalle</th>
                      <th className="px-5 py-3">Araç</th>
                      <th className="px-5 py-3">Km</th>
                      <th className="px-5 py-3">Tonaj</th>
                      <th className="px-5 py-3">Fiş</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map(shift => (
                      <tr key={shift.id} className="border-t border-slate-100">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">{shift.driverName || `Şoför #${shift.driverId}`}</p>
                          <p className="mt-0.5 text-xs text-slate-400 flex items-center gap-1">
                            @{shift.driverUsername || "bilgi_yok"} ·{" "}
                            <Badge variant="outline" className="border-emerald-100 bg-emerald-50 text-emerald-700 text-[10px] py-0">
                              {shift.driverRole || "şoför"}
                            </Badge>
                          </p>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-700">
                          {shift.region} / {shift.neighborhood}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {shift.vehiclePlate ? `${shift.vehiclePlate} (${shift.vehicleBrand})` : `#${shift.vehicleId}`}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {shift.startKm} → {shift.endKm ?? "—"}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-800">{shift.tonnage ?? "—"}</td>
                        <td className="px-5 py-4">
                          {shift.tonnageReceiptUrl ? (
                            (() => {
                              let urls: string[] = [];
                              try {
                                if (String(shift.tonnageReceiptUrl).startsWith("[")) {
                                  urls = JSON.parse(shift.tonnageReceiptUrl);
                                } else {
                                  urls = [shift.tonnageReceiptUrl];
                                }
                              } catch {
                                urls = [shift.tonnageReceiptUrl];
                              }

                              return (
                                <div className="flex flex-wrap gap-1.5">
                                  {urls.map((url, i) => (
                                    <a
                                      key={i}
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs font-semibold text-emerald-700 underline hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100"
                                    >
                                      Fiş {urls.length > 1 ? `#${i + 1}` : "aç"}
                                    </a>
                                  ))}
                                </div>
                              );
                            })()
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Denetim Kaydı (Audit Logs & xx.xx.xxxx Tarih Seçici Filtresi) */}
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display">Denetim Kaydı (Tüm Loglar)</CardTitle>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 font-bold text-xs">
                {filteredLogs.length} Kayıt
              </Badge>
            </div>
            <p className="text-sm text-slate-500">İşlemi yapan personel ve işlem detayları.</p>

            {/* Tarih Aralığı Filtreleme Araç Çubuğu (xx.xx.xxxx Tarih Seçici) */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-emerald-700" />
                  Tarih Bazlı Log Filtreleme (gün.ay.yıl)
                </span>
                {(logStartDate || logEndDate) && (
                  <button
                    onClick={() => {
                      setLogStartDate("");
                      setLogEndDate("");
                    }}
                    className="text-red-600 hover:underline text-[11px] font-bold"
                  >
                    Filtreyi Temizle
                  </button>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Başlangıç Tarihi</label>
                  <Input
                    type="date"
                    value={logStartDate}
                    onChange={e => setLogStartDate(e.target.value)}
                    className="h-8 text-xs bg-white cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Bitiş Tarihi</label>
                  <Input
                    type="date"
                    value={logEndDate}
                    onChange={e => setLogEndDate(e.target.value)}
                    className="h-8 text-xs bg-white cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="max-h-[480px] space-y-3.5 overflow-auto">
            {filteredLogs.length === 0 ? (
              <NoData text="Seçilen tarih aralığında log kaydı bulunmuyor." />
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="border-l-2 border-emerald-500 pl-3 py-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-800">{log.action.replaceAll("_", " ")}</p>
                    <Badge variant="outline" className="border-emerald-100 bg-emerald-50 text-emerald-800 text-[10px]">
                      {log.actorRole || "personel"}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-emerald-800 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {log.actorName || `Kullanıcı #${log.actorId}`} <span className="text-slate-400 font-normal">(@{log.actorUsername || "sistem"})</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {log.entityType} {log.details ? `· ${log.details}` : ""}
                  </p>
                  <p className="text-[11px] text-slate-400">{new Date(log.createdAt).toLocaleString("tr-TR")}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vatandaş Şikayetleri Raporu */}
      <Card className="overflow-hidden border-0 bg-white shadow-sm">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="font-display">Şikayet Raporu</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Bölge, mahalle, süre ve sonuç durumuna göre vatandaş şikayetleri.</p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">Açık: {openComplaints}</Badge>
            <Badge className="bg-red-50 text-red-700 hover:bg-red-50">Geciken: {overdueComplaints}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {complaints.length === 0 ? (
            <NoData text="Henüz raporlanacak vatandaş şikayeti yok." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Bölge / mahalle</th>
                    <th className="px-5 py-3">Şikayet Açıklaması</th>
                    <th className="px-5 py-3">Son işlem</th>
                    <th className="px-5 py-3">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map(complaint => {
                    const overdue = complaint.status === "açık" && new Date(complaint.dueAt).getTime() < Date.now();
                    return (
                      <tr key={complaint.id} className="border-t border-slate-100">
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {complaint.region} / {complaint.neighborhood}
                        </td>
                        <td className="px-5 py-4 text-slate-600">{complaint.description}</td>
                        <td className="px-5 py-4 text-slate-600">{new Date(complaint.dueAt).toLocaleString("tr-TR")}</td>
                        <td className="px-5 py-4">
                          <Badge
                            variant="outline"
                            className={
                              overdue
                                ? "border-red-100 bg-red-50 text-red-700"
                                : complaint.status === "onaylandı"
                                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                  : "border-amber-100 bg-amber-50 text-amber-700"
                            }
                          >
                            {overdue ? "günü geçmiş" : complaint.status === "onaylandı" ? "Giderildi" : complaint.status}
                          </Badge>
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

function Personnel({ users, refresh }: { users: any[]; refresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const [form, setForm] = useState({ username: "", password: "", name: "", role: "şoför" as Role });
  const [editForm, setEditForm] = useState({ openId: "", username: "", password: "", name: "", role: "şoför" as Role });

  const create = trpc.operations.users.create.useMutation({
    onSuccess: () => {
      toast.success("Personel hesabı kaydedildi.");
      setShowForm(false);
      setForm({ username: "", password: "", name: "", role: "şoför" });
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const update = trpc.operations.users.update.useMutation({
    onSuccess: () => {
      toast.success("Personel bilgileri ve şifresi güncellendi.");
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

  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(form);
  };

  const startEdit = (user: any) => {
    setEditingUser(user);
    setEditForm({
      openId: user.openId,
      name: user.name || "",
      username: user.username || "",
      password: "",
      role: user.role || "şoför",
    });
  };

  const submitEdit = (event: FormEvent) => {
    event.preventDefault();
    update.mutate({
      openId: editForm.openId,
      name: editForm.name,
      username: editForm.username,
      password: editForm.password || undefined,
      role: editForm.role,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">Personel hesapları ve Yetkileri</h2>
          <p className="mt-1 text-sm text-slate-500">Personel hesaplarını ekleyin, kullanıcı adı, şifre ve rollerini düzenleyin.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-700 hover:bg-emerald-800">
          <Plus className="mr-2 h-4 w-4" />
          Personel hesabı ekle
        </Button>
      </div>

      {showForm && (
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">Yeni Personel Hesabı Ekle</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={submitCreate}>
              <Field label="Ad soyad">
                <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Kullanıcı adı">
                <Input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase() })} placeholder="ornek.sofor" />
              </Field>
              <Field label="Geçici şifre">
                <Input required type="password" minLength={3} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="En az 3 karakter" />
              </Field>
              <Field label="Rol">
                <select className="input-native" value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}>
                  <option value="şoför">şoför</option>
                  <option value="kademe personeli">kademe personeli</option>
                  <option value="kaynak personeli">kaynak personeli</option>
                  <option value="yönetim">yönetim</option>
                </select>
              </Field>
              <div className="flex items-end">
                <Button disabled={create.isPending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                  {create.isPending ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* PERSONEL BİLGİLERİ DÜZENLEME & ŞİFRE SIFIRLAMA FORMU */}
      {editingUser && (
        <Card className="border-2 border-emerald-500 bg-emerald-50/20 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-display text-lg text-emerald-950 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-emerald-700" />
              Personel Bilgilerini & Şifresini Güncelle ({editingUser.name})
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setEditingUser(null)} className="h-8 w-8 p-0 text-slate-500">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-5">
            <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={submitEdit}>
              <Field label="Ad Soyad">
                <Input required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </Field>
              <Field label="Kullanıcı Adı">
                <Input required value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value.toLowerCase() })} />
              </Field>
              <Field label="Yeni Şifre (Sıfırlama)">
                <Input
                  type="password"
                  value={editForm.password}
                  onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Değişmeyecekse boş bırakın"
                />
              </Field>
              <Field label="Rol">
                <select className="input-native" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value as Role })}>
                  <option value="şoför">şoför</option>
                  <option value="kademe personeli">kademe personeli</option>
                  <option value="kaynak personeli">kaynak personeli</option>
                  <option value="yönetim">yönetim</option>
                </select>
              </Field>
              <div className="flex items-end gap-2">
                <Button disabled={update.isPending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                  {update.isPending ? "Güncelleniyor..." : "Güncelle"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden border-0 bg-white shadow-sm">
        <CardContent className="p-0">
          {users.length === 0 ? (
            <NoData text="Henüz ayrı bir personel hesabı kaydı yok." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Personel</th>
                    <th className="px-5 py-3">Kullanıcı adı</th>
                    <th className="px-5 py-3">Rol</th>
                    <th className="px-5 py-3">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.openId} className="border-t border-slate-100">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{user.name || "İsimsiz kullanıcı"}</p>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">{user.username || "yerel giriş tanımlanmadı"}</td>
                      <td className="px-5 py-4">
                        <Badge variant="outline" className="border-emerald-100 bg-emerald-50 text-emerald-700">
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(user)}
                          className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs"
                        >
                          <Pencil className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                          Düzenle / Şifre Yenile
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={remove.isPending}
                          onClick={() => {
                            if (window.confirm(`${user.name || user.username} kullanıcısını silmek istiyor musunuz?`)) {
                              remove.mutate({ openId: user.openId });
                            }
                          }}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 text-xs"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Sil
                        </Button>
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

function ReportCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-2 font-display text-3xl font-bold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}

function NoData({ text }: { text: string }) {
  return (
    <div className="grid min-h-44 place-items-center p-6 text-center">
      <Users className="h-7 w-7 text-emerald-600" />
      <p className="mt-3 font-semibold text-slate-800">{text}</p>
      <p className="mt-1 text-sm text-slate-500">Yeni kayıtlar oluştuğunda burada görüntülenir.</p>
    </div>
  );
}
