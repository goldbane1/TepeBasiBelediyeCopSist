import { AccessNotice, Field, type AppView } from "@/components/OperationsWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ClipboardCheck, FileBarChart, Plus, Trash2, User, UserCheck, Users, Wrench } from "lucide-react";
import { useState, type FormEvent } from "react";
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

  const activeShifts = shifts.filter(shift => shift.status === "açık");

  const [endKmValues, setEndKmValues] = useState<Record<number, string>>({});

  const finishShift = trpc.operations.shifts.finish.useMutation({
    onSuccess: () => {
      toast.success("Mesai yönetici tarafından başarıyla sonlandırıldı.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const handleAdminFinish = (shift: any) => {
    const endKm = Number(endKmValues[shift.id] || shift.startKm);
    finishShift.mutate({
      shiftId: shift.id,
      endKm,
      endFullness: "boş",
      faultReported: false,
    });
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <ReportCard label="Toplam mesai kaydı" value={shifts.length} />
        <ReportCard label="Tonaj bildirimi" value={`${totalTonnage.toLocaleString("tr-TR")} ton`} />
        <ReportCard label="İşlem geçmişi" value={logs.length} />
      </section>

      {/* Yönetici Mesai Kontrol Paneli */}
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-emerald-700" />
              Yönetici Mesai Kontrol Paneli
            </CardTitle>
            <p className="text-sm text-slate-500">Açık mesaileri anlık izleyin, şoförler adına mesaiyi sonlandırın veya başlatın.</p>
          </div>
          <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-50">{activeShifts.length} Açık Mesai</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeShifts.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">Şu anda sahada devam eden açık mesai bulunmuyor.</p>
          ) : (
            activeShifts.map(shift => (
              <div key={shift.id} className="rounded-xl border border-sky-100 bg-sky-50/30 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{shift.driverName || `Şoför #${shift.driverId}`}</span>
                    <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                      @{shift.driverUsername || "yerel_hesap"} · {shift.driverRole || "şoför"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    Bölge: <strong>{shift.region} / {shift.neighborhood}</strong> · Araç: <strong>{shift.vehiclePlate || `#${shift.vehicleId}`} ({shift.vehicleType})</strong>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Başlangıç Km: {shift.startKm} · Başlangıç Zamanı: {new Date(shift.startedAt).toLocaleString("tr-TR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder={`Bitiş km (${shift.startKm})`}
                    value={endKmValues[shift.id] || ""}
                    onChange={e => setEndKmValues({ ...endKmValues, [shift.id]: e.target.value })}
                    className="bg-white text-xs h-9 w-36"
                  />
                  <Button
                    size="sm"
                    disabled={finishShift.isPending}
                    onClick={() => handleAdminFinish(shift)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Mesaiyi Sonlandır
                  </Button>
                </div>
              </div>
            ))
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
                            <a href={shift.tonnageReceiptUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-emerald-700 underline">
                              Fişi aç
                            </a>
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

        {/* Denetim Kaydı (Audit Logs) */}
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-display">Denetim Kaydı (Tüm Loglar)</CardTitle>
            <p className="text-sm text-slate-500">İşlemi yapan personel, kullanıcı adı, rolü ve detayları.</p>
          </CardHeader>
          <CardContent className="max-h-[520px] space-y-3.5 overflow-auto">
            {logs.length === 0 ? (
              <NoData text="Henüz işlem geçmişi oluşmadı." />
            ) : (
              logs.map(log => (
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
  const [form, setForm] = useState({ username: "", password: "", name: "", role: "şoför" as Role });
  const create = trpc.operations.users.create.useMutation({
    onSuccess: () => {
      toast.success("Personel hesabı kaydedildi.");
      setShowForm(false);
      setForm({ username: "", password: "", name: "", role: "şoför" });
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
  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(form);
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">Personel hesapları</h2>
          <p className="mt-1 text-sm text-slate-500">Kullanıcı adı, şifre ve rol atama ile silme yetkisi yalnızca yönetim rolündedir.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-700 hover:bg-emerald-800">
          <Plus className="mr-2 h-4 w-4" />
          Personel hesabı ekle
        </Button>
      </div>
      {showForm && (
        <Card className="border-0 bg-white shadow-sm">
          <CardContent className="p-5">
            <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={submit}>
              <Field label="Ad soyad">
                <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Kullanıcı adı">
                <Input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase() })} placeholder="ornek.sofor" />
              </Field>
              <Field label="Geçici şifre">
                <Input required type="password" minLength={10} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="En az 10 karakter" />
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
                  Kaydet
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
                    <th className="px-5 py-3">İşlem</th>
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
                      <td className="px-5 py-4">
                        <Button variant="ghost" size="sm" disabled={remove.isPending} onClick={() => remove.mutate({ openId: user.openId })} className="text-red-600 hover:bg-red-50 hover:text-red-700">
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
