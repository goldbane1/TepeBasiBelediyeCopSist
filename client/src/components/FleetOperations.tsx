import { AccessNotice, Field, type AppView } from "@/components/OperationsWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle2, Plus, Trash2, Truck, Wrench } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { Role } from "@/pages/Home";

export default function FleetOperations({
  role,
  view,
  vehicles,
  faults,
  refresh,
}: {
  role: Role;
  view: AppView;
  vehicles: any[];
  faults: any[];
  refresh: () => void;
}) {
  if (view === "araçlar") return <VehiclesPanel role={role} vehicles={vehicles} refresh={refresh} />;
  return <FaultsPanel role={role} vehicles={vehicles} faults={faults} refresh={refresh} />;
}

function VehiclesPanel({ role, vehicles, refresh }: { role: Role; vehicles: any[]; refresh: () => void }) {
  const canManage = role === "yönetim" || role === "kademe personeli";
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "çöp kamyonu" as "çöp kamyonu" | "damperli kamyon",
    capacityTon: "",
    brand: "",
    plate: "",
    status: "aktif" as "aktif" | "arızalı" | "bakımda",
  });

  const create = trpc.operations.vehicles.create.useMutation({
    onSuccess: () => {
      toast.success("Araç envantere eklendi.");
      setShowForm(false);
      setForm({ type: "çöp kamyonu", capacityTon: "", brand: "", plate: "", status: "aktif" });
      refresh();
    },
    onError: error => toast.error(error.message),
  });

  const updateStatus = trpc.operations.vehicles.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Araç durumu güncellendi.");
      refresh();
    },
    onError: error => toast.error(error.message),
  });

  const remove = trpc.operations.vehicles.remove.useMutation({
    onSuccess: () => {
      toast.success("Araç envanterden çıkarıldı.");
      refresh();
    },
    onError: error => toast.error(error.message),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.plate.trim()) return toast.error("Lütfen araç plakası girin.");
    if (!form.brand.trim()) return toast.error("Lütfen marka bilgisi girin.");
    if (!form.capacityTon.trim()) return toast.error("Lütfen kapasite bilgisi girin.");
    create.mutate({
      type: form.type,
      capacityTon: form.capacityTon.trim(),
      brand: form.brand.trim(),
      plate: form.plate.trim().toUpperCase(),
      status: form.status,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900">Araç envanteri</h2>
          <p className="mt-1 text-sm text-slate-500">
            Şantiyedeki araçların kapasite, marka, plaka ve arıza durumlarını izleyin ve yönetin.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-700 hover:bg-emerald-800">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Araç Ekle
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-lg">Yeni Araç Kaydı</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={submit}>
              <Field label="Araç tipi">
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as typeof form.type })}
                  className="input-native"
                >
                  <option value="çöp kamyonu">çöp kamyonu</option>
                  <option value="damperli kamyon">damperli kamyon</option>
                </select>
              </Field>
              <Field label="Plaka">
                <Input
                  required
                  value={form.plate}
                  onChange={e => setForm({ ...form, plate: e.target.value.toUpperCase() })}
                  placeholder="26 TP 101"
                />
              </Field>
              <Field label="Marka / Model">
                <Input
                  required
                  value={form.brand}
                  onChange={e => setForm({ ...form, brand: e.target.value })}
                  placeholder="Örn. Mercedes-Benz Atego"
                />
              </Field>
              <Field label="Kapasite (ton)">
                <Input
                  required
                  value={form.capacityTon}
                  onChange={e => setForm({ ...form, capacityTon: e.target.value })}
                  placeholder="Örn. 13"
                />
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

      <Card className="overflow-hidden border-0 bg-white shadow-sm">
        <CardContent className="p-0">
          {vehicles.length === 0 ? (
            <EmptyFleet />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[740px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Plaka</th>
                    <th className="px-5 py-3">Araç tipi</th>
                    <th className="px-5 py-3">Marka / Model</th>
                    <th className="px-5 py-3">Kapasite</th>
                    <th className="px-5 py-3">Durum</th>
                    {canManage && <th className="px-5 py-3">İşlem</th>}
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(vehicle => (
                    <tr key={vehicle.id} className="border-t border-slate-100">
                      <td className="px-5 py-4 font-bold text-slate-800">{vehicle.plate}</td>
                      <td className="px-5 py-4 text-slate-600">{vehicle.type}</td>
                      <td className="px-5 py-4 text-slate-600">{vehicle.brand}</td>
                      <td className="px-5 py-4 text-slate-600">{vehicle.capacityTon} ton</td>
                      <td className="px-5 py-4">
                        {canManage ? (
                          <select
                            value={vehicle.status}
                            onChange={e =>
                              updateStatus.mutate({
                                id: vehicle.id,
                                status: e.target.value as "aktif" | "arızalı" | "bakımda",
                              })
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
                          >
                            <option value="aktif">aktif</option>
                            <option value="arızalı">arızalı</option>
                            <option value="bakımda">bakımda</option>
                          </select>
                        ) : (
                          <StatusBadge value={vehicle.status} />
                        )}
                      </td>
                      {canManage && (
                        <td className="px-5 py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={remove.isPending}
                            onClick={() => {
                              if (window.confirm(`${vehicle.plate} plakalı aracı envanterden çıkarmak istiyor musunuz?`)) {
                                remove.mutate({ id: vehicle.id });
                              }
                            }}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Sil
                          </Button>
                        </td>
                      )}
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

function FaultsPanel({
  role,
  vehicles,
  faults,
  refresh,
}: {
  role: Role;
  vehicles: any[];
  faults: any[];
  refresh: () => void;
}) {
  const canReview = role === "kademe personeli" || role === "yönetim";
  const [form, setForm] = useState({
    vehicleId: "",
    description: "",
    severity: "orta" as "düşük" | "orta" | "yüksek",
  });

  const create = trpc.operations.vehicleFaults.create.useMutation({
    onSuccess: () => {
      toast.success("Araç arızası bildarimi kaydedildi.");
      setForm({ vehicleId: "", description: "", severity: "orta" });
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const review = trpc.operations.vehicleFaults.review.useMutation({
    onSuccess: () => {
      toast.success("Arıza kaydı güncellendi.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.vehicleId) return toast.error("Lütfen araç seçin.");
    create.mutate({
      vehicleId: Number(form.vehicleId),
      description: form.description,
      severity: form.severity,
    });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-display">Araç arızası bildir</CardTitle>
          <p className="text-sm text-slate-500">Bildirilen araç, kademe onayı alınana kadar mesaiye çıkamaz.</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submit}>
            <Field label="Araç plakası">
              <select
                required
                className="input-native"
                value={form.vehicleId}
                onChange={e => setForm({ ...form, vehicleId: e.target.value })}
              >
                <option value="">Araç seçin</option>
                {vehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate} · {vehicle.brand} ({vehicle.type})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Arıza önceliği">
              <select
                className="input-native"
                value={form.severity}
                onChange={e => setForm({ ...form, severity: e.target.value as typeof form.severity })}
              >
                <option value="düşük">düşük</option>
                <option value="orta">orta</option>
                <option value="yüksek">yüksek</option>
              </select>
            </Field>
            <Field label="Arıza açıklaması">
              <Input
                required
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Arızayı açık biçimde yazın"
              />
            </Field>
            <Button disabled={create.isPending} className="bg-emerald-700 hover:bg-emerald-800">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Arıza bildirimi oluştur
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="font-display">Araç arıza kayıtları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {faults.length === 0 ? (
            <EmptyFault />
          ) : (
            faults.map(fault => (
              <div key={fault.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">
                      Araç #{fault.vehicleId} · {fault.severity} öncelik
                    </p>
                    <p className="mt-1 text-sm leading-5 text-slate-500">{fault.description}</p>
                  </div>
                  <StatusBadge value={fault.status} />
                </div>
                {canReview && fault.status === "kademe_onayı_bekliyor" && (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      disabled={review.isPending}
                      onClick={() => review.mutate({ id: fault.id, approved: true, note: "Kademe onayı verildi." })}
                      className="bg-emerald-700 hover:bg-emerald-800"
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Onayla
                    </Button>
                    <Button
                      size="sm"
                      disabled={review.isPending}
                      onClick={() => review.mutate({ id: fault.id, approved: false, note: "Araç bakımda." })}
                      variant="outline"
                    >
                      Bakımda tut
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const danger = ["arızalı", "kademe_onayı_bekliyor", "yüksek"].includes(value);
  const success = ["aktif", "onaylandı", "toplandı"].includes(value);
  return (
    <Badge
      variant="outline"
      className={
        danger
          ? "border-red-100 bg-red-50 text-red-700"
          : success
            ? "border-emerald-100 bg-emerald-50 text-emerald-700"
            : "border-amber-100 bg-amber-50 text-amber-700"
      }
    >
      {value.replaceAll("_", " ")}
    </Badge>
  );
}

function EmptyFleet() {
  return (
    <div className="grid min-h-44 place-items-center p-6 text-center">
      <Truck className="h-7 w-7 text-emerald-600" />
      <p className="mt-3 font-semibold text-slate-800">Henüz araç kaydı yok</p>
      <p className="mt-1 text-sm text-slate-500">Yönetim veya kademe ekibi araç envanterini ekleyebilir.</p>
    </div>
  );
}

function EmptyFault() {
  return (
    <div className="grid min-h-44 place-items-center p-6 text-center">
      <Wrench className="h-7 w-7 text-emerald-600" />
      <p className="mt-3 font-semibold text-slate-800">Arıza kaydı bulunmuyor</p>
      <p className="mt-1 text-sm text-slate-500">Yeni bildirimler burada kademe onayıyla görünür.</p>
    </div>
  );
}
