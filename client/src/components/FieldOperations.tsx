import OperationsMap, { type MapOperation } from "@/components/OperationsMap";
import { AccessNotice, Field, type AppView } from "@/components/OperationsWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Camera, CheckCircle2, LocateFixed, MapPin, MessageSquareWarning, Recycle, Search, Wrench } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import type { Role } from "@/pages/Home";

export default function FieldOperations({
  role,
  view,
  containers,
  complaints,
  refresh,
}: {
  role: Role;
  view: AppView;
  containers: any[];
  complaints: any[];
  refresh: () => void;
}) {
  if (view === "konteyner") return <ContainerPanel role={role} records={containers} refresh={refresh} />;
  return <ComplaintPanel role={role} records={complaints} refresh={refresh} />;
}

function ContainerPanel({ role, records, refresh }: { role: Role; records: any[]; refresh: () => void }) {
  const canRepair = role === "kaynak personeli" || role === "yönetim" || role === "kademe personeli" || role === "şoför";
  const [repairNotes, setRepairNotes] = useState<Record<number, string>>({});

  const repair = trpc.operations.containerFaults.repair.useMutation({
    onSuccess: () => {
      toast.success("Konteyner onarımı tamamlandı ve kayıt güncellendi.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const handleRepair = (id: number) => {
    const note = repairNotes[id]?.trim() || "Kaynak ve parça onarımı tamamlandı.";
    repair.mutate({ id, note });
  };

  const openRecords = useMemo(() => records.filter(r => r.status === "bekliyor"), [records]);
  const completedRecords = useMemo(() => records.filter(r => r.status === "onarım_tamamlandı"), [records]);

  const mapOperations = useMemo<MapOperation[]>(
    () =>
      openRecords.map(record => ({
        id: record.id,
        category: "Konteyner arızası" as const,
        title: `${record.faultType} arızası · ${record.neighborhood}`,
        description: record.description,
        latitude: record.latitude,
        longitude: record.longitude,
        status: record.status,
      })),
    [openRecords]
  );

  return (
    <div className="space-y-6">
      {/* Dedicated Container Faults Map Header */}
      <Card className="border-0 bg-white shadow-sm p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Konteyner Arıza Çözümü & Haritası</h2>
            <p className="text-xs text-slate-500">Bildirilen konteyner arızalarının harita konumları ve onarım işlemleri bu ekrandan yönetilir.</p>
          </div>
          <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50">
            {openRecords.length} Onarım Bekleyen Arıza
          </Badge>
        </div>
        <OperationsMap operations={mapOperations} initialCategoryFilter="Konteyner arızası" showCategoryTabs={false} />
      </Card>

      {/* Onarım Bekleyen Kayıtlar Listesi */}
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <Wrench className="h-5 w-5 text-amber-600" />
              Konteyner Onarım Kayıtları
            </CardTitle>
            <p className="text-sm text-slate-500">Arızalı konteynerleri onarıldı olarak kaydedin ve haritadan kaldırın.</p>
          </div>
          <Badge variant="outline" className="text-slate-600">
            Toplam {records.length} Kayıt
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {records.length === 0 ? (
            <NoRecords icon={Recycle} text="Henüz konteyner arıza kaydı yok." />
          ) : (
            records.map(record => {
              const isPending = record.status === "bekliyor";
              return (
                <div
                  key={record.id}
                  className={`rounded-2xl border p-4 transition ${
                    isPending ? "border-amber-200/80 bg-amber-50/20" : "border-emerald-100 bg-emerald-50/10"
                  }`}
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">
                          {record.faultType.toUpperCase()} Arızası · {record.neighborhood}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            isPending
                              ? "border-amber-200 bg-amber-50 text-amber-700 font-semibold"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold"
                          }
                        >
                          {isPending ? "Onarım Bekliyor" : "Onarım Tamamlandı"}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{record.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {record.latitude}, {record.longitude}
                        </span>
                        <span>·</span>
                        <span>Bölge: {record.region}</span>
                        {record.repairNote && (
                          <>
                            <span>·</span>
                            <span className="font-medium text-emerald-700">Not: {record.repairNote}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {canRepair && isPending && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                        <Input
                          placeholder="Onarım notu (opsiyonel)"
                          value={repairNotes[record.id] || ""}
                          onChange={e => setRepairNotes({ ...repairNotes, [record.id]: e.target.value })}
                          className="bg-white text-xs h-9 w-full sm:w-56"
                        />
                        <Button
                          size="sm"
                          disabled={repair.isPending}
                          onClick={() => handleRepair(record.id)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-xs shrink-0"
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          Onarımı Kaydet & Kapat
                        </Button>
                      </div>
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

function ComplaintPanel({ role, records, refresh }: { role: Role; records: any[]; refresh: () => void }) {
  const canReport = role === "şoför" || role === "yönetim";
  const canAcknowledge = role === "şoför" || role === "yönetim";

  const [form, setForm] = useState({
    region: "Tepebaşı",
    neighborhood: "",
    description: "",
    latitude: "39.7767",
    longitude: "30.5206",
    dueAt: "",
    photo: undefined as string | undefined,
  });

  const [searchAddressText, setSearchAddressText] = useState("");
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [locationState, setLocationState] = useState<"idle" | "loading" | "ready">("idle");
  const [resolvedAddress, setResolvedAddress] = useState("");

  const create = trpc.operations.complaints.create.useMutation({
    onSuccess: () => {
      toast.success("Vatandaş şikayeti kaydedildi.");
      refresh();
      setForm({
        region: "Tepebaşı",
        neighborhood: "",
        description: "",
        latitude: "39.7767",
        longitude: "30.5206",
        dueAt: "",
        photo: undefined,
      });
      setResolvedAddress("");
      setSearchAddressText("");
    },
    onError: e => toast.error(e.message),
  });

  const acknowledge = trpc.operations.complaints.acknowledge.useMutation({
    onSuccess: () => {
      toast.success("Vatandaş şikayeti giderildi olarak işaretlendi.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const readPhoto = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Yalnızca görsel yükleyebilirsiniz.");
    const reader = new FileReader();
    reader.onload = () => setForm(current => ({ ...current, photo: String(reader.result) }));
    reader.readAsDataURL(file);
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
        setResolvedAddress(data.display_name || `${latitude}, ${longitude}`);
        toast.success("Konumdan bölge ve mahalle alanları dolduruldu.");
      } else {
        toast.message("Adres bulunamadı; bölge ve mahalle alanlarını manuel doldurabilirsiniz.");
      }
    } catch {
      toast.message("Adres servisi yanıt vermedi; bölge ve mahalle alanlarını manuel doldurabilirsiniz.");
    }
  };

  const searchLocationByAddress = async () => {
    const textToSearch = (searchAddressText || form.neighborhood || form.region).trim();
    if (!textToSearch) {
      return toast.error("Lütfen konum aramak için bir mahalle, cadde veya sokak adı yazın.");
    }

    setIsSearchingAddress(true);

    // Temizleme: mah., mahallesi, cad., caddesi, sok. gibi gürültü kelimeleri kaldırarak aramayı güçlendir
    const cleanSearchText = textToSearch
      .replace(/mah(\.|allesi)?/gi, "")
      .replace(/cad(\.|desi)?/gi, "")
      .replace(/sok(\.|ağı)?/gi, "")
      .trim();

    // Arama başarısını maksimuma çıkarmak için sırayla denenecek arama sorguları
    const queryCandidates = [
      `${cleanSearchText}, Tepebaşı, Eskişehir, Türkiye`,
      `${cleanSearchText}, Eskişehir, Türkiye`,
      `${cleanSearchText}, Tepebaşı`,
      cleanSearchText,
      `Tepebaşı, Eskişehir`,
    ];

    try {
      let foundResult: any = null;

      for (const queryStr of queryCandidates) {
        if (!queryStr.trim()) continue;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=tr&limit=3&q=${encodeURIComponent(queryStr)}`,
            { headers: { "User-Agent": "TepebasiTemizlikApp/1.0" } }
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              foundResult = data[0];
              break;
            }
          }
        } catch {
          // Bir sonraki alternatife geç
        }
      }

      if (foundResult) {
        const lat = Number(foundResult.lat).toFixed(6);
        const lon = Number(foundResult.lon).toFixed(6);
        const addr = foundResult.address || {};
        const region = addr.city || addr.town || addr.district || addr.county || addr.state_district || addr.province || "Tepebaşı";
        const neighborhood = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.village || addr.road || form.neighborhood || cleanSearchText;

        setForm(current => ({
          ...current,
          latitude: lat,
          longitude: lon,
          region: region || current.region,
          neighborhood: neighborhood || current.neighborhood,
        }));
        setResolvedAddress(foundResult.display_name || `${lat}, ${lon}`);
        toast.success(`Konum bulundu! (${neighborhood})`);
      } else {
        // Hata vermek yerine esnek varsayılan koordinat ataması
        setForm(current => ({
          ...current,
          latitude: "39.7767",
          longitude: "30.5206",
          region: "Tepebaşı",
          neighborhood: current.neighborhood || cleanSearchText,
        }));
        setResolvedAddress("Tepebaşı Bölge Koordinatı (Varsayılan)");
        toast.info("Yazılan adres doğrudan haritada eşleşmedi. Tepebaşı bölge koordinatları tanımlandı.");
      }
    } catch {
      setForm(current => ({
        ...current,
        latitude: "39.7767",
        longitude: "30.5206",
        region: "Tepebaşı",
      }));
      toast.info("Arama servisi yanıt vermedi, varsayılan Tepebaşı koordinatları tanımlandı.");
    } finally {
      setIsSearchingAddress(false);
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
        const message = error.code === error.PERMISSION_DENIED ? "Konum izni verilmedi. Enlem ve boylamı manuel girebilirsiniz." : "Konum alınamadı. Lütfen tekrar deneyin veya manuel giriş yapın.";
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 }
    );
  };

  const mapOperations = useMemo<MapOperation[]>(
    () =>
      records
        .filter(record => record.status === "açık")
        .map(record => ({
          id: record.id,
          category: "Vatandaş şikayeti" as const,
          title: `Şikayet · ${record.neighborhood}`,
          description: record.description,
          latitude: record.latitude,
          longitude: record.longitude,
          dueAt: record.dueAt,
          status: record.status,
        })),
    [records]
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.neighborhood.trim()) return toast.error("Lütfen mahalle adı girin.");
    if (!form.description.trim()) return toast.error("Lütfen şikayet açıklaması girin.");
    if (!form.dueAt) return toast.error("Lütfen son işlem zamanı girin.");
    create.mutate({
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      dueAt: new Date(form.dueAt),
    });
  };

  return (
    <div className="space-y-6">
      {/* Dedicated Complaints Map Header */}
      <Card className="border-0 bg-white shadow-sm p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Vatandaş Şikayetleri Haritası</h2>
            <p className="text-xs text-slate-500">Saha şikayetlerinin konumu, müdahale süresi ve detayları canlı haritada gösterilir.</p>
          </div>
          <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-50">
            {records.filter(r => r.status === "açık").length} Açık Şikayet Kaydı
          </Badge>
        </div>
        <OperationsMap operations={mapOperations} initialCategoryFilter="Vatandaş şikayeti" showCategoryTabs={false} />
      </Card>

      <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
        {canReport ? (
          <Card className="border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="font-display">Vatandaş Şikayeti Kaydı</CardTitle>
              <p className="text-sm text-slate-500">Şikayeti adres arayarak veya konum alarak haritaya kaydedin.</p>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
                <Field label="Bölge">
                  <Input required value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} />
                </Field>
                <Field label="Mahalle">
                  <Input
                    required
                    value={form.neighborhood}
                    onChange={e => setForm({ ...form, neighborhood: e.target.value })}
                    placeholder="Örn. Eskibağlar"
                  />
                </Field>
                <Field label="Son işlem zamanı">
                  <Input
                    required
                    type="datetime-local"
                    value={form.dueAt}
                    onChange={e => setForm({ ...form, dueAt: e.target.value })}
                  />
                </Field>
                <Field label="Fotoğraf (opsiyonel)">
                  <Input type="file" accept="image/*" onChange={e => void readPhoto(e.target.files?.[0] ?? null)} />
                </Field>

                {/* Adres/Konum Arama & GPS Konum Alma Alanı */}
                <div className="sm:col-span-2 rounded-xl border border-emerald-100 bg-emerald-50/80 p-3.5 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-emerald-900 block mb-1">Adres/Sokak Yazıp Konum Bul</label>
                    <div className="flex gap-2">
                      <Input
                        value={searchAddressText}
                        onChange={e => setSearchAddressText(e.target.value)}
                        placeholder="Örn. Eskibağlar Mah. Üniversite Cad."
                        className="bg-white text-xs h-9"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={isSearchingAddress}
                        onClick={searchLocationByAddress}
                        className="bg-emerald-700 hover:bg-emerald-800 shrink-0 text-xs"
                      >
                        <Search className="mr-1.5 h-3.5 w-3.5" />
                        {isSearchingAddress ? "Aranıyor..." : "Adresten Konum Bul"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center pt-2 border-t border-emerald-200/60">
                    <p className="text-xs font-medium text-emerald-800">Veya cihazınızın GPS konumunu çekebilirsiniz:</p>
                    <Button type="button" size="sm" variant="outline" disabled={locationState === "loading"} onClick={useCurrentLocation} className="border-emerald-300 text-emerald-800 bg-white hover:bg-emerald-100 text-xs">
                      <LocateFixed className="mr-1.5 h-3.5 w-3.5" />
                      {locationState === "loading" ? "GPS Alınıyor" : "Anlık GPS Konumu Kullan"}
                    </Button>
                  </div>

                  {resolvedAddress && (
                    <p className="mt-2 text-xs leading-5 font-semibold text-emerald-800 bg-white/80 p-2 rounded-lg border border-emerald-200">
                      📍 Algılanan Konum: {resolvedAddress}
                    </p>
                  )}
                </div>

                <Field label="Enlem">
                  <Input required type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} />
                </Field>
                <Field label="Boylam">
                  <Input required type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Şikayet açıklaması">
                    <Textarea
                      required
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Şikayeti ayrıntılı açıklayın"
                    />
                  </Field>
                </div>
                {form.photo && (
                  <p className="sm:col-span-2 flex items-center gap-2 text-xs font-medium text-emerald-700">
                    <Camera className="h-4 w-4" />
                    Fotoğraf ekleme için hazır.
                  </p>
                )}
                <div className="sm:col-span-2">
                  <Button disabled={create.isPending} className="w-full bg-emerald-700 hover:bg-emerald-800">
                    <MessageSquareWarning className="mr-2 h-4 w-4" />
                    {create.isPending ? "Kaydediliyor..." : "Şikayeti kaydet"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <AccessNotice title="Vatandaş şikayetleri takibi izlenebilir." />
        )}

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-display">Şikayet Kayıtları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {records.length === 0 ? (
              <NoRecords icon={MessageSquareWarning} text="Henüz vatandaş şikayeti kaydı yok." />
            ) : (
              records.map(record => {
                const overdue = record.status === "açık" && new Date(record.dueAt).getTime() < Date.now();
                return (
                  <div key={record.id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex flex-wrap justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800">{record.neighborhood} şikayeti</p>
                          <Badge
                            variant="outline"
                            className={
                              overdue
                                ? "border-red-100 bg-red-50 text-red-700"
                                : record.status === "onaylandı"
                                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                  : "border-amber-100 bg-amber-50 text-amber-700"
                            }
                          >
                            {overdue ? "günü geçmiş" : record.status === "onaylandı" ? "Giderildi" : record.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{record.description}</p>
                        {record.photoUrl && (
                          <a
                            className="mt-2 inline-flex text-xs font-semibold text-emerald-700 underline"
                            href={record.photoUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Yüklenen fotoğrafı görüntüle
                          </a>
                        )}
                        <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                          <MapPin className="h-3.5 w-3.5" />
                          {record.latitude}, {record.longitude}
                        </p>
                      </div>
                      {canAcknowledge && record.status === "açık" && (
                        <Button
                          size="sm"
                          disabled={acknowledge.isPending}
                          onClick={() => acknowledge.mutate({ id: record.id })}
                          className="bg-emerald-700 hover:bg-emerald-800"
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Şikayeti Gider ve Kapat
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
    </div>
  );
}

function NoRecords({ icon: Icon, text }: { icon: typeof Recycle; text: string }) {
  return (
    <div className="grid min-h-44 place-items-center p-6 text-center">
      <Icon className="h-7 w-7 text-emerald-600" />
      <p className="mt-3 font-semibold text-slate-800">{text}</p>
      <p className="mt-1 text-sm text-slate-500">Yeni saha bildirimleri burada görüntülenir.</p>
    </div>
  );
}
