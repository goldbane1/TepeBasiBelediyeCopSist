import { AccessNotice, Field, type AppView } from "@/components/OperationsWorkspace";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowUpDown,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Eye,
  FileBarChart,
  FileText,
  Filter,
  History,
  Image as ImageIcon,
  Info,
  Sun,
  Sunset,
  Moon,
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


function AdminInfoTooltip({
  title,
  description,
  side = "top",
}: {
  title?: string;
  description: string;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-400 hover:text-emerald-700 transition cursor-help shrink-0 shadow-2xs border border-slate-200/80 ml-1.5 focus:outline-none"
          aria-label="Bilgi Kartı"
          onClick={e => e.stopPropagation()}
        >
          <Info className="h-2.5 w-2.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className="max-w-xs bg-slate-900/95 backdrop-blur-md text-white p-2.5 rounded-xl shadow-2xl border border-slate-700/80 text-xs z-50 animate-in fade-in zoom-in-95 duration-150"
      >
        {title && (
          <div className="font-extrabold text-emerald-300 text-[11px] mb-1 flex items-center gap-1.5">
            <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black">
              i
            </span>
            <span>{title}</span>
          </div>
        )}
        <div className="text-[11px] text-slate-200 leading-relaxed font-medium">
          {description}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

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
        <CardContent className="p-0 min-h-[420px] flex flex-col justify-between">
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

function exportNeighborhoodsCsv(rows: any[], periodLabel: string) {
  if (!rows || !rows.length) return;
  const separator = ";";
  const columns = [
    { key: "name", label: "Mahalle" },
    { key: "region", label: "Bölge" },
    { key: "lastDateText", label: "Son Sefer Tarihi" },
    { key: "totalShifts", label: "Toplam Sefer" },
    { key: "totalTonnage", label: "Toplam Tonaj (Ton)" },
    { key: "avgTonnage", label: "Sefer Ortalaması (Ton)" },
    { key: "tonnageShare", label: "İlçe Tonaj Payı (%)" },
    { key: "wasteWaiting", label: "Bekleyen Damperlik Atık" },
    { key: "containerWaiting", label: "Bekleyen Konteyner Arızası" },
    { key: "complaintOpen", label: "Açık Vatandaş Şikayeti" },
    { key: "auditStatus", label: "Saha Durumu" },
  ];

  const header = columns.map(c => `"${c.label}"`).join(separator);
  const dataRows = rows.map(r => {
    return columns.map(c => {
      let val = r[c.key] ?? "";
      if (c.key === "totalTonnage" && typeof val === "number") val = val.toFixed(2);
      if (typeof val === "string") val = val.replace(/"/g, '""');
      return `"${val}"`;
    }).join(separator);
  });

  const csvContent = "\uFEFF" + [header, ...dataRows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("download", `Tepebasi_Mahalle_Denetim_Raporu_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


function exportNeighborhoodsPdf(rows: any[], periodLabel: string, totalTonnage: number, totalShifts: number) {
  if (!rows || !rows.length) return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Tarayıcınız açılır pencereyi engelledi. Lütfen adres çubuğundan izin verin.");
    return;
  }

  const nowFormatted = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short" }).format(new Date());

  const tableRowsHtml = rows.map((r, i) => `
    <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'}; font-size: 11px;">
      <td style="padding: 7px 10px; font-weight: bold; color: #0f172a;">${r.name}</td>
      <td style="padding: 7px 10px; color: #475569;">${r.region}</td>
      <td style="padding: 7px 10px; color: #475569;">${r.lastDateText}</td>
      <td style="padding: 7px 10px; font-weight: bold; text-align: center;">${r.totalShifts}</td>
      <td style="padding: 7px 10px; font-weight: bold; color: #065f46; text-align: right;">${Number(r.totalTonnage).toFixed(2)} Ton</td>
      <td style="padding: 7px 10px; text-align: right;">${r.avgTonnage} Ton</td>
      <td style="padding: 7px 10px; text-align: center;">%${r.tonnageShare}</td>
      <td style="padding: 7px 10px; text-align: center; color: ${r.wasteWaiting > 0 ? '#b91c1c' : '#64748b'}; font-weight: ${r.wasteWaiting > 0 ? 'bold' : 'normal'};">${r.wasteWaiting}</td>
      <td style="padding: 7px 10px; text-align: center; color: ${r.containerWaiting > 0 ? '#b45309' : '#64748b'}; font-weight: ${r.containerWaiting > 0 ? 'bold' : 'normal'};">${r.containerWaiting}</td>
      <td style="padding: 7px 10px; text-align: center; color: ${r.complaintOpen > 0 ? '#b91c1c' : '#64748b'}; font-weight: ${r.complaintOpen > 0 ? 'bold' : 'normal'};">${r.complaintOpen}</td>
      <td style="padding: 7px 10px; text-align: right; font-weight: bold; color: ${r.auditStatus === 'clean' ? '#047857' : r.auditStatus === 'needs_action' ? '#b91c1c' : '#475569'};">
        ${r.auditStatus === 'clean' ? 'Saha Temiz' : r.auditStatus === 'needs_action' ? 'Müdahale Bekliyor' : r.auditStatus === 'active_shift' ? 'Mesai Sürüyor' : 'Sefer Yok'}
      </td>
    </tr>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8" />
      <title>Tepebaşı Belediyesi Temizlik İşleri Operasyon Denetim Raporu</title>
      <style>
        @page { size: A4 landscape; margin: 10mm 10mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #065f46; padding-bottom: 12px; margin-bottom: 14px; }
        .title-group h1 { margin: 0; font-size: 17px; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; }
        .title-group h2 { margin: 4px 0 0; font-size: 13px; color: #334155; font-weight: 600; }
        .meta { text-align: right; font-size: 11px; color: #64748b; line-height: 1.4; }
        .summary-bar { display: flex; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 12px; }
        .summary-item { flex: 1; color: #475569; }
        .summary-item strong { display: block; font-size: 14px; color: #065f46; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #065f46; color: #ffffff; padding: 8px 10px; font-size: 11px; text-transform: uppercase; text-align: left; }
        .footer-signatures { display: flex; justify-content: space-between; margin-top: 28px; page-break-inside: avoid; }
        .sig-box { width: 28%; text-align: center; border-top: 1px dashed #94a3b8; padding-top: 8px; font-size: 11px; color: #334155; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title-group">
          <h1>T.C. TEPEBAŞI BELEDİYE BAŞKANLIĞI</h1>
          <h2>Temizlik İşleri Müdürlüğü · Saha Operasyon & Denetim Raporu</h2>
        </div>
        <div class="meta">
          <div><strong>Rapor Tanzim Tarihi:</strong> ${nowFormatted}</div>
          <div><strong>İncelenen Dönem:</strong> ${periodLabel}</div>
          <div><strong>Kayıt Adedi:</strong> ${rows.length} Mahalle</div>
        </div>
      </div>

      <div class="summary-bar">
        <div class="summary-item">Toplam Atık Tonajı: <strong>${totalTonnage.toFixed(2)} Ton</strong></div>
        <div class="summary-item">Tamamlanan Araç Seferi: <strong>${totalShifts} Sefer</strong></div>
        <div class="summary-item">İncelenen Mahalle Sayısı: <strong>${rows.length} Mahalle</strong></div>
        <div class="summary-item">Evrak Niteliği: <strong>Resmi İdari Rapor</strong></div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Mahalle</th>
            <th>Bölge</th>
            <th>Son Sefer</th>
            <th style="text-align: center;">Sefer</th>
            <th style="text-align: right;">Net Tonaj</th>
            <th style="text-align: right;">Ortalama</th>
            <th style="text-align: center;">İlçe Payı</th>
            <th style="text-align: center;">Moloz</th>
            <th style="text-align: center;">Konteyner</th>
            <th style="text-align: center;">Şikayet</th>
            <th style="text-align: right;">Saha Durumu</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div class="footer-signatures">
        <div class="sig-box">
          <strong>Hazırlayan</strong><br/><br/><br/>Saha Denetim Sorumlusu
        </div>
        <div class="sig-box">
          <strong>Kontrol Eden</strong><br/><br/><br/>Operasyon ve Lojistik Şefi
        </div>
        <div class="sig-box">
          <strong>Tasdik Eden</strong><br/><br/><br/>Temizlik İşleri Müdürü
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}


// ==========================================
// RESMİ BELEDİYE KURUMSAL PDF RAPOR MOTORU
// ==========================================
function generateMunicipalPdfDoc(title: string, subtitle: string, headers: string[], rowsHtml: string, metaSummary: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Tarayıcınız açılır pencereyi engelledi. Lütfen adres çubuğundan izin verin.");
    return;
  }
  const nowFormatted = new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short" }).format(new Date());

  const thHtml = headers.map(h => `<th style="background:#065f46;color:#ffffff;padding:8px 10px;font-size:11px;text-transform:uppercase;text-align:left;">${h}</th>`).join("");

  const docHtml = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <style>
        @page { size: A4 landscape; margin: 10mm 10mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 0; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #065f46; padding-bottom: 12px; margin-bottom: 14px; }
        .title-group h1 { margin: 0; font-size: 17px; color: #065f46; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; }
        .title-group h2 { margin: 4px 0 0; font-size: 13px; color: #334155; font-weight: 600; }
        .meta { text-align: right; font-size: 11px; color: #64748b; line-height: 1.4; }
        .summary-bar { display: flex; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .footer-signatures { display: flex; justify-content: space-between; margin-top: 28px; page-break-inside: avoid; }
        .sig-box { width: 28%; text-align: center; border-top: 1px dashed #94a3b8; padding-top: 8px; font-size: 11px; color: #334155; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title-group">
          <h1>T.C. TEPEBAŞI BELEDİYE BAŞKANLIĞI</h1>
          <h2>Temizlik İşleri Müdürlüğü · ${subtitle}</h2>
        </div>
        <div class="meta">
          <div><strong>Rapor Tanzim Tarihi:</strong> ${nowFormatted}</div>
          <div><strong>Evrak Niteliği:</strong> Resmi İdari Denetim Nüshası</div>
        </div>
      </div>
      ${metaSummary}
      <table>
        <thead><tr>${thHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="footer-signatures">
        <div class="sig-box"><strong>Hazırlayan</strong><br/><br/><br/>Saha Denetim Sorumlusu</div>
        <div class="sig-box"><strong>Kontrol Eden</strong><br/><br/><br/>Operasyon ve Lojistik Şefi</div>
        <div class="sig-box"><strong>Tasdik Eden</strong><br/><br/><br/>Temizlik İşleri Müdürü</div>
      </div>
      <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 350); };</script>
    </body>
    </html>
  `;
  printWindow.document.open();
  printWindow.document.write(docHtml);
  printWindow.document.close();
}

// 1. Mesai ve Kantar Raporu PDF & CSV
function exportShiftsPdf(shiftsList: any[], periodLabel: string) {
  if (!shiftsList || !shiftsList.length) return;
  const headers = ["ID", "Tarih", "Şoför", "Mahalle", "Vardiya", "Araç Plaka", "Km (Baş-Bit)", "Net Tonaj", "Durum"];
  let totalTon = 0;
  const rows = shiftsList.map((s, i) => {
    const tonVal = Number(String(s.tonnage ?? "0").replace(",", "."));
    totalTon += isNaN(tonVal) ? 0 : tonVal;
    return `
      <tr style="border-bottom:1px solid #e2e8f0;background:${i % 2 === 0 ? '#fff' : '#f8fafc'};font-size:11px;">
        <td style="padding:7px 10px;font-weight:bold;">#${s.id}</td>
        <td style="padding:7px 10px;">${new Date(s.startedAt).toLocaleDateString("tr-TR")}</td>
        <td style="padding:7px 10px;font-weight:600;">${s.driverName || "Şoför #" + s.driverId}</td>
        <td style="padding:7px 10px;">${s.neighborhood}</td>
        <td style="padding:7px 10px;">${s.shiftHours || "08:00 - 16:00"}</td>
        <td style="padding:7px 10px;font-weight:bold;">${s.vehiclePlate || "#" + s.vehicleId}</td>
        <td style="padding:7px 10px;">${s.startKm ?? "—"} → ${s.endKm ?? "—"} km</td>
        <td style="padding:7px 10px;font-weight:bold;color:#065f46;text-align:right;">${s.tonnage ? Number(s.tonnage).toFixed(2) + " Ton" : "—"}</td>
        <td style="padding:7px 10px;text-align:right;">${s.status === "tamamlandı" ? "✓ Tamamlandı" : "● Sahada"}</td>
      </tr>
    `;
  }).join("");

  const summary = `
    <div class="summary-bar">
      <div style="flex:1;">İncelenen Dönem: <strong>${periodLabel}</strong></div>
      <div style="flex:1;">Toplam Sefer: <strong>${shiftsList.length} Sefer</strong></div>
      <div style="flex:1;">Toplam Tartılan Atık: <strong>${totalTon.toFixed(2)} Ton</strong></div>
    </div>
  `;
  generateMunicipalPdfDoc("Mesai ve Kantar Tartım Raporu", "Mesai ve Resmi Kantar Tartım Denetim Raporu", headers, rows, summary);
}

function exportShiftsCsv(shiftsList: any[]) {
  if (!shiftsList || !shiftsList.length) return;
  const cols = ["ID", "Tarih", "Şoför", "Mahalle", "Vardiya", "Araç", "Başlangıç Km", "Bitiş Km", "Net Tonaj (Ton)", "Durum"];
  const header = cols.map(c => `"${c}"`).join(";");
  const data = shiftsList.map(s => [
    s.id,
    new Date(s.startedAt).toLocaleDateString("tr-TR"),
    s.driverName || "Şoför #" + s.driverId,
    s.neighborhood,
    s.shiftHours || "08:00 - 16:00",
    s.vehiclePlate || "#" + s.vehicleId,
    s.startKm ?? "",
    s.endKm ?? "",
    s.tonnage ?? "",
    s.status
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";"));
  const csv = "\uFEFF" + [header, ...data].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Tepebasi_Mesailer_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}

// 2. Damperlik Atık Raporu PDF & CSV
function exportWastePdf(wasteList: any[], periodLabel: string) {
  if (!wasteList || !wasteList.length) return;
  const headers = ["ID", "Tarih", "Mahalle", "Adres / Konum", "Açıklama", "Bildiren", "Toplanma Tarihi", "Durum"];
  const rows = wasteList.map((w, i) => `
    <tr style="border-bottom:1px solid #e2e8f0;background:${i % 2 === 0 ? '#fff' : '#f8fafc'};font-size:11px;">
      <td style="padding:7px 10px;font-weight:bold;">#${w.id}</td>
      <td style="padding:7px 10px;">${new Date(w.createdAt).toLocaleDateString("tr-TR")}</td>
      <td style="padding:7px 10px;font-weight:600;">${w.neighborhood}</td>
      <td style="padding:7px 10px;">${w.addressText || "—"}</td>
      <td style="padding:7px 10px;">${w.description || "Damperlik Atık"}</td>
      <td style="padding:7px 10px;">${w.createdByName || "Saha Ekibi"}</td>
      <td style="padding:7px 10px;">${w.collectedAt ? new Date(w.collectedAt).toLocaleDateString("tr-TR") : "—"}</td>
      <td style="padding:7px 10px;font-weight:bold;color:${w.status === "toplandı" ? "#047857" : "#b91c1c"};text-align:right;">
        ${w.status === "toplandı" ? "✓ Toplandı" : "Müdahale Bekliyor"}
      </td>
    </tr>
  `).join("");
  const summary = `
    <div class="summary-bar">
      <div style="flex:1;">İncelenen Dönem: <strong>${periodLabel}</strong></div>
      <div style="flex:1;">Toplam Atık Bildirimi: <strong>${wasteList.length} Adet</strong></div>
      <div style="flex:1;">Bekleyen Müdahale: <strong>${wasteList.filter(w => w.status === "bekliyor").length} Adet</strong></div>
    </div>
  `;
  generateMunicipalPdfDoc("Damperlik Atık ve Moloz Raporu", "Damperlik Atık ve Moloz Takip Denetim Raporu", headers, rows, summary);
}

function exportWasteCsv(wasteList: any[]) {
  if (!wasteList || !wasteList.length) return;
  const cols = ["ID", "Tarih", "Mahalle", "Adres", "Açıklama", "Bildiren", "Toplanma Tarihi", "Durum"];
  const header = cols.map(c => `"${c}"`).join(";");
  const data = wasteList.map(w => [
    w.id,
    new Date(w.createdAt).toLocaleDateString("tr-TR"),
    w.neighborhood,
    w.addressText || "",
    w.description || "",
    w.createdByName || "",
    w.collectedAt ? new Date(w.collectedAt).toLocaleDateString("tr-TR") : "",
    w.status
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";"));
  const csv = "\uFEFF" + [header, ...data].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Tepebasi_Damperlik_Atiklar_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}

// 3. Konteyner Arıza Raporu PDF & CSV
function exportContainersPdf(containersList: any[], periodLabel: string) {
  if (!containersList || !containersList.length) return;
  const headers = ["ID", "Tarih", "Mahalle", "Adres / Konum", "Arıza Türü", "Bildiren", "Onarım Tarihi", "Durum"];
  const rows = containersList.map((c, i) => `
    <tr style="border-bottom:1px solid #e2e8f0;background:${i % 2 === 0 ? '#fff' : '#f8fafc'};font-size:11px;">
      <td style="padding:7px 10px;font-weight:bold;">#${c.id}</td>
      <td style="padding:7px 10px;">${new Date(c.reportedAt).toLocaleDateString("tr-TR")}</td>
      <td style="padding:7px 10px;font-weight:600;">${c.neighborhood}</td>
      <td style="padding:7px 10px;">${c.addressText || "—"}</td>
      <td style="padding:7px 10px;font-weight:600;">${c.faultType || "Arıza"}</td>
      <td style="padding:7px 10px;">${c.reportedByName || "Saha Ekibi"}</td>
      <td style="padding:7px 10px;">${c.repairedAt ? new Date(c.repairedAt).toLocaleDateString("tr-TR") : "—"}</td>
      <td style="padding:7px 10px;font-weight:bold;color:${c.status === "onarıldı" ? "#047857" : "#b45309"};text-align:right;">
        ${c.status === "onarıldı" ? "✓ Onarıldı" : "Kaynak Bekliyor"}
      </td>
    </tr>
  `).join("");
  const summary = `
    <div class="summary-bar">
      <div style="flex:1;">İncelenen Dönem: <strong>${periodLabel}</strong></div>
      <div style="flex:1;">Toplam Arıza: <strong>${containersList.length} Adet</strong></div>
      <div style="flex:1;">Onarım Bekleyen: <strong>${containersList.filter(c => c.status === "bekliyor").length} Adet</strong></div>
    </div>
  `;
  generateMunicipalPdfDoc("Konteyner Onarım Raporu", "Konteyner Arıza ve Atölye Onarım Denetim Raporu", headers, rows, summary);
}

function exportContainersCsv(containersList: any[]) {
  if (!containersList || !containersList.length) return;
  const cols = ["ID", "Tarih", "Mahalle", "Adres", "Arıza Tipi", "Bildiren", "Onarım Tarihi", "Durum"];
  const header = cols.map(c => `"${c}"`).join(";");
  const data = containersList.map(c => [
    c.id,
    new Date(c.reportedAt).toLocaleDateString("tr-TR"),
    c.neighborhood,
    c.addressText || "",
    c.faultType || "",
    c.reportedByName || "",
    c.repairedAt ? new Date(c.repairedAt).toLocaleDateString("tr-TR") : "",
    c.status
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";"));
  const csv = "\uFEFF" + [header, ...data].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Tepebasi_Konteynerler_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}

// 4. Şikayetler Raporu PDF & CSV
function exportComplaintsPdf(complaintsList: any[], periodLabel: string) {
  if (!complaintsList || !complaintsList.length) return;
  const headers = ["ID", "Tarih", "Mahalle", "Adres", "Vatandaş Adı", "Şikayet Konusu", "Çözüm Tarihi", "Durum"];
  const rows = complaintsList.map((cp, i) => `
    <tr style="border-bottom:1px solid #e2e8f0;background:${i % 2 === 0 ? '#fff' : '#f8fafc'};font-size:11px;">
      <td style="padding:7px 10px;font-weight:bold;">#${cp.id}</td>
      <td style="padding:7px 10px;">${new Date(cp.createdAt).toLocaleDateString("tr-TR")}</td>
      <td style="padding:7px 10px;font-weight:600;">${cp.neighborhood}</td>
      <td style="padding:7px 10px;">${cp.addressText || "—"}</td>
      <td style="padding:7px 10px;">${cp.citizenName || "Vatandaş"}</td>
      <td style="padding:7px 10px;">${cp.description || "Temizlik Talebi"}</td>
      <td style="padding:7px 10px;">${cp.resolvedAt ? new Date(cp.resolvedAt).toLocaleDateString("tr-TR") : "—"}</td>
      <td style="padding:7px 10px;font-weight:bold;color:${cp.status === "çözüldü" ? "#047857" : "#b91c1c"};text-align:right;">
        ${cp.status === "çözüldü" ? "✓ Çözüldü" : "Açık Şikayet"}
      </td>
    </tr>
  `).join("");
  const summary = `
    <div class="summary-bar">
      <div style="flex:1;">İncelenen Dönem: <strong>${periodLabel}</strong></div>
      <div style="flex:1;">Toplam Başvuru: <strong>${complaintsList.length} Adet</strong></div>
      <div style="flex:1;">Açık Bekleyen: <strong>${complaintsList.filter(c => c.status === "açık").length} Adet</strong></div>
    </div>
  `;
  generateMunicipalPdfDoc("Vatandaş Şikayet Raporu", "Vatandaş Temizlik Talepleri ve Çözüm Takip Raporu", headers, rows, summary);
}

function exportComplaintsCsv(complaintsList: any[]) {
  if (!complaintsList || !complaintsList.length) return;
  const cols = ["ID", "Tarih", "Mahalle", "Adres", "Vatandaş", "Şikayet Detayı", "Çözüm Tarihi", "Durum"];
  const header = cols.map(c => `"${c}"`).join(";");
  const data = complaintsList.map(cp => [
    cp.id,
    new Date(cp.createdAt).toLocaleDateString("tr-TR"),
    cp.neighborhood,
    cp.addressText || "",
    cp.citizenName || "",
    cp.description || "",
    cp.resolvedAt ? new Date(cp.resolvedAt).toLocaleDateString("tr-TR") : "",
    cp.status
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";"));
  const csv = "\uFEFF" + [header, ...data].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Tepebasi_Sikayetler_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}

// 5. Sistem Logları Raporu PDF & CSV
function exportLogsPdf(logsList: any[]) {
  if (!logsList || !logsList.length) return;
  const headers = ["ID", "Zaman Damgası", "Kullanıcı", "Rol", "İşlem Türü", "Açıklama / Detay", "IP Adresi"];
  const rows = logsList.map((l, i) => `
    <tr style="border-bottom:1px solid #e2e8f0;background:${i % 2 === 0 ? '#fff' : '#f8fafc'};font-size:11px;">
      <td style="padding:7px 10px;font-weight:bold;">#${l.id}</td>
      <td style="padding:7px 10px;">${new Date(l.createdAt).toLocaleString("tr-TR")}</td>
      <td style="padding:7px 10px;font-weight:600;">${l.userName || "Kullanıcı #" + l.userId}</td>
      <td style="padding:7px 10px;">${l.userRole || "Kullanıcı"}</td>
      <td style="padding:7px 10px;font-weight:bold;">${l.action}</td>
      <td style="padding:7px 10px;">${l.details || "—"}</td>
      <td style="padding:7px 10px;color:#64748b;">${l.ipAddress || "—"}</td>
    </tr>
  `).join("");
  const summary = `
    <div class="summary-bar">
      <div style="flex:1;">Toplam Denetim Kaydı: <strong>${logsList.length} Log</strong></div>
      <div style="flex:1;">Güvenlik Standardı: <strong>Değiştirilemez Zaman Damgalı</strong></div>
    </div>
  `;
  generateMunicipalPdfDoc("Sistem Denetim Logları", "Sistem Güvenlik ve Denetim Logları Raporu", headers, rows, summary);
}

function exportLogsCsv(logsList: any[]) {
  if (!logsList || !logsList.length) return;
  const cols = ["ID", "Zaman", "Kullanıcı", "Rol", "İşlem", "Detay", "IP"];
  const header = cols.map(c => `"${c}"`).join(";");
  const data = logsList.map(l => [
    l.id,
    new Date(l.createdAt).toLocaleString("tr-TR"),
    l.userName || "Kullanıcı #" + l.userId,
    l.userRole || "",
    l.action,
    l.details || "",
    l.ipAddress || ""
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(";"));
  const csv = "\uFEFF" + [header, ...data].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Tepebasi_Sistem_Loglari_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}

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
  const [activeTab, setActiveTab] = useState<"genel" | "mesailer" | "atiklar" | "konteynerler" | "sikayetler" | "loglar" | "sifirla">("genel");

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
  const [selectedScalePhoto, setSelectedScalePhoto] = useState<string | null>(null);
  const [selectedNeighborhoodDetail, setSelectedNeighborhoodDetail] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState<"shifts" | "waste" | "containers" | "complaints">("shifts");
  const [quickPreset, setQuickPreset] = useState<"all" | "needs_attention" | "no_shifts" | "top_tonnage" | "clean">("all");

  // Denetim Logları Filtreleme State'leri
  const [logPeriod, setLogPeriod] = useState<"today" | "week" | "month" | "all" | "single_date" | "custom_range">("today");
  const [logSelectedDate, setLogSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [logStartDate, setLogStartDate] = useState<string>("");
  const [logEndDate, setLogEndDate] = useState<string>("");
  const [logActorFilter, setLogActorFilter] = useState<string>("all");
  const [logActionCategory, setLogActionCategory] = useState<string>("all");
  const [logSearchQuery, setLogSearchQuery] = useState<string>("");
  const [logPage, setLogPage] = useState<number>(1);
  const logPageSize = 25;

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
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title?: string;
    entityType?: "shift" | "waste" | "container" | "complaint";
    entityId?: number;
    photoField?: "photoUrl" | "repairPhotoUrl" | "resolutionPhotoUrl";
  } | null>(null);

  const [purgeOptions, setPurgeOptions] = useState({
    shifts: false,
    waste: false,
    containers: false,
    complaints: false,
    faults: false,
    auditLogs: false,
    photos: false,
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

  const approveComplaint = trpc.operations.complaints.approve.useMutation({
    onSuccess: () => {
      toast.success("Vatandaş şikayeti onaylandı ve kapatıldı.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const rejectComplaint = trpc.operations.complaints.reject.useMutation({
    onSuccess: () => {
      toast.success("Vatandaş şikayeti reddedildi, tekrar açık duruma getirildi.");
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const deletePhotoMutation = trpc.operations.photos.deleteSingle.useMutation({
    onSuccess: (_, vars) => {
      toast.success("Görsel başarıyla silindi.");
      if (vars.entityType === "shift" && receiptModal) {
        setReceiptModal(prev => {
          if (!prev) return null;
          const updated = prev.receipts.filter(r => r !== vars.photoUrl);
          if (updated.length === 0) return null;
          return { ...prev, receipts: updated };
        });
      }
      setPreviewImage(null);
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const purgePhotosMutation = trpc.operations.photos.purge.useMutation({
    onSuccess: data => {
      toast.success(`${data.deletedCount} adet görsel sistemden ve diskten başarıyla temizlendi.`);
      refresh();
    },
    onError: e => toast.error(e.message),
  });

  const activeWasteList = useMemo(() => wasteList.filter(w => w.status === "bekliyor"), [wasteList]);
  const activeContainers = useMemo(() => containers.filter(c => c.status === "bekliyor"), [containers]);
  const activeComplaints = useMemo(() => complaints.filter(c => c.status === "açık" || c.status === "onay_bekliyor"), [complaints]);

  const resetDataMutation = trpc.operations.reports.resetData.useMutation({
    onSuccess: (data) => {
      toast.success("Seçilen analiz ve operasyon verileri sıfırlandı.");
      setShowPurgeModal(false);
      setConfirmPurgeText("");
      setPurgeOptions({ shifts: false, waste: false, containers: false, complaints: false, faults: false, auditLogs: false, photos: false });
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
    const { photos, ...rest } = purgeOptions;
    resetDataMutation.mutate({
      ...rest,
      photosScope: photos ? "all" : undefined,
    });
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
  
  // BUGÜN İÇİN SABİT SAHA YOĞUNLUĞU İSTATİSTİKLERİ (Seçilen filtreden bağımsız canlı nabız)
  const todayDateStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const isCreatedToday = (d: any) => {
    if (!d) return false;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return false;
    const s = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    return s === todayDateStr;
  };

  const todayShifts = useMemo(() => shifts.filter(s => isCreatedToday(s.startedAt)), [shifts, todayDateStr]);
  const todayAuditTonnage = useMemo(() => {
    return todayShifts.reduce((sum, s) => sum + Number(String(s.tonnage ?? "0").replace(",", ".")), 0);
  }, [todayShifts]);
  const todayActiveShiftsCount = useMemo(() => todayShifts.filter(s => s.status === "açık").length, [todayShifts]);
  const todayWasteWaiting = useMemo(() => wasteList.filter(w => isCreatedToday(w.createdAt) && w.status === "bekliyor").length, [wasteList, todayDateStr]);
  const todayContainersWaiting = useMemo(() => containers.filter(c => isCreatedToday(c.reportedAt) && c.status === "bekliyor").length, [containers, todayDateStr]);
  const todayComplaintsOpen = useMemo(() => complaints.filter(c => isCreatedToday(c.createdAt) && c.status === "açık").length, [complaints, todayDateStr]);
  const todayTotalWaiting = todayWasteWaiting + todayContainersWaiting + todayComplaintsOpen;

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

  const needsAttentionCount = useMemo(() => neighborhoodMatrix.filter(m => m.wasteWaiting > 0 || m.containerWaiting > 0 || m.complaintOpen > 0).length, [neighborhoodMatrix]);
  const noShiftsCount = useMemo(() => neighborhoodMatrix.filter(m => m.totalShifts === 0).length, [neighborhoodMatrix]);
  const cleanCount = useMemo(() => neighborhoodMatrix.filter(m => m.auditStatus === "clean").length, [neighborhoodMatrix]);

  const displayedNeighborhoodMatrix = useMemo(() => {
    let list = [...neighborhoodMatrix];
    if (quickPreset === "needs_attention") {
      list = list.filter(m => m.wasteWaiting > 0 || m.containerWaiting > 0 || m.complaintOpen > 0);
    } else if (quickPreset === "no_shifts") {
      list = list.filter(m => m.totalShifts === 0);
    } else if (quickPreset === "top_tonnage") {
      list = [...list].sort((a, b) => b.totalTonnage - a.totalTonnage).slice(0, 10);
    } else if (quickPreset === "clean") {
      list = list.filter(m => m.auditStatus === "clean");
    }
    return list;
  }, [neighborhoodMatrix, quickPreset]);

  // --- DENETİM LOGLARI HESAPLAMALARI VE FİLTRELEME ---
  const isLogDateInPeriod = (dateVal: string | Date | null | undefined) => {
    if (!dateVal) return false;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return false;

    if (logPeriod === "today") {
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }
    if (logPeriod === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      return d >= weekAgo;
    }
    if (logPeriod === "month") {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      monthAgo.setHours(0, 0, 0, 0);
      return d >= monthAgo;
    }
    if (logPeriod === "single_date" && logSelectedDate) {
      const [year, month, day] = logSelectedDate.split("-").map(Number);
      return (
        d.getFullYear() === year &&
        d.getMonth() + 1 === month &&
        d.getDate() === day
      );
    }
    if (logPeriod === "custom_range") {
      const start = logStartDate ? new Date(`${logStartDate}T00:00:00`) : null;
      const end = logEndDate ? new Date(`${logEndDate}T23:59:59`) : null;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    }
    return true; // "all"
  };

  const filteredLogs = useMemo(() => {
    return (logs || []).filter(log => {
      // 1. Tarih Filtresi
      if (!isLogDateInPeriod(log.createdAt)) return false;

      // 2. Kullanıcı Filtresi
      if (logActorFilter !== "all") {
        if (String(log.actorId) !== String(logActorFilter) && log.actorUsername !== logActorFilter) {
          return false;
        }
      }

      // 3. Eylem Kategorisi
      if (logActionCategory !== "all") {
        const action = String(log.action || "").toUpperCase();
        const entity = String(log.entityType || "").toLowerCase();
        if (logActionCategory === "mesai" && !action.includes("MESAİ") && entity !== "mesai") return false;
        if (logActionCategory === "atik" && !action.includes("ATIK") && !action.includes("DAMPER") && entity !== "damperlik_atık") return false;
        if (logActionCategory === "konteyner" && !action.includes("KONTEYNER") && entity !== "konteyner_arızası") return false;
        if (logActionCategory === "sikayet" && !action.includes("ŞİKAYET") && entity !== "vatandaş_şikayeti") return false;
        if (logActionCategory === "arac" && !action.includes("ARAÇ") && entity !== "araç" && entity !== "araç_arızası") return false;
        if (logActionCategory === "yonetim" && !action.includes("SIFIRLA") && !action.includes("MAHALLE") && !action.includes("PERSONEL") && entity !== "kullanıcı" && entity !== "mahalle") return false;
      }

      // 4. Metin Arama
      if (logSearchQuery.trim()) {
        const q = logSearchQuery.toLowerCase().trim();
        const matchText = [
          log.actorName,
          log.actorUsername,
          log.actorRole,
          log.action,
          log.entityType,
          String(log.entityId || ""),
          log.details,
        ].filter(Boolean).join(" ").toLowerCase();

        if (!matchText.includes(q)) return false;
      }

      return true;
    });
  }, [logs, logPeriod, logSelectedDate, logStartDate, logEndDate, logActorFilter, logActionCategory, logSearchQuery]);

  // Log İstatistikleri
  const logStats = useMemo(() => {
    const todayNow = new Date().toDateString();
    const todayLogsCount = (logs || []).filter(l => l.createdAt && new Date(l.createdAt).toDateString() === todayNow).length;

    // En aktif kullanıcı
    const actorCounts: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};

    filteredLogs.forEach(l => {
      const actorKey = l.actorName || l.actorUsername || (l.actorId ? `Kullanıcı #${l.actorId}` : "Sistem");
      actorCounts[actorKey] = (actorCounts[actorKey] || 0) + 1;

      const act = l.action || "İşlem";
      actionCounts[act] = (actionCounts[act] || 0) + 1;
    });

    let topActor = "—";
    let topActorCount = 0;
    Object.entries(actorCounts).forEach(([actor, count]) => {
      if (count > topActorCount) {
        topActor = actor;
        topActorCount = count;
      }
    });

    let topAction = "—";
    let topActionCount = 0;
    Object.entries(actionCounts).forEach(([act, count]) => {
      if (count > topActionCount) {
        topAction = act.replace(/_/g, " ");
        topActionCount = count;
      }
    });

    return {
      totalFiltered: filteredLogs.length,
      todayCount: todayLogsCount,
      topActor: topActorCount > 0 ? `${topActor} (${topActorCount})` : "—",
      topAction: topActionCount > 0 ? `${topAction} (${topActionCount})` : "—",
    };
  }, [filteredLogs, logs]);

  const logTotalPages = Math.max(1, Math.ceil(filteredLogs.length / logPageSize));
  const paginatedLogs = useMemo(() => {
    const start = (logPage - 1) * logPageSize;
    return filteredLogs.slice(start, start + logPageSize);
  }, [filteredLogs, logPage]);

  const getActionBadgeInfo = (action: string) => {
    const upper = (action || "").toUpperCase();
    if (upper.includes("SİLİNDİ") || upper.includes("SIFIRLANDI") || upper.includes("REDDETTİ")) {
      return {
        label: action.replace(/_/g, " "),
        badgeClass: "bg-red-50 text-red-700 border-red-200",
        iconText: "🗑️",
      };
    }
    if (upper.includes("GÜNCELLENDİ") || upper.includes("BAKIMA") || upper.includes("DURUMU")) {
      return {
        label: action.replace(/_/g, " "),
        badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
        iconText: "✏️",
      };
    }
    if (upper.includes("BAŞLATILDI") || upper.includes("BİLDİRİLDİ")) {
      return {
        label: action.replace(/_/g, " "),
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
        iconText: "📢",
      };
    }
    if (upper.includes("SONLANDIRILDI") || upper.includes("TOPLANDI") || upper.includes("ONARILDI") || upper.includes("ONAYLANDI") || upper.includes("OLUŞTURULDU") || upper.includes("EKLENDİ")) {
      return {
        label: action.replace(/_/g, " "),
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconText: "✅",
      };
    }
    return {
      label: action.replace(/_/g, " "),
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
      iconText: "📋",
    };
  };

  return (
    <div className="space-y-5">
      {/* Üst Sekmeler (Modern Yönetici Kontrol Paneli) */}
      <div className="rounded-2xl bg-white p-2 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          {/* Ana Rapor Sekmeleri (Yatayda pürüzsüz kaydırılabilir grup) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
            {[
              {
                id: "genel",
                label: "Genel Bakış",
                icon: FileBarChart,
                count: neighborhoodMatrix.length,
                info: "Tepebaşı genelindeki anlık atık tonajı, çöp seferleri, vardiya analizleri ve mahalle denetim matrisi.",
              },
              {
                id: "mesailer",
                label: "Mesai & Tonaj",
                icon: Truck,
                count: shifts.length,
                info: "Şoförlerin günlük vardiyaları, başlama/bitiş saatleri ve kantardan yüklenen resmi kantar fişi fotoğrafları.",
              },
              {
                id: "atiklar",
                label: "Damperlik Atık",
                icon: Recycle,
                count: activeWasteList.length,
                info: "Saha ekiplerinin bildirdiği moloz, hafriyat ve kaba atıklar ile 175m GPS doğrulamalı toplama durumu.",
              },
              {
                id: "konteynerler",
                label: "Konteynerler",
                icon: Wrench,
                count: activeContainers.length,
                info: "Kaldırma kolu, ayak veya gövdesi arızalı çöp konteynerleri ve kaynak ekibinin onarım süreci.",
              },
              {
                id: "sikayetler",
                label: "Şikayetler",
                icon: AlertTriangle,
                count: activeComplaints.length,
                info: "Vatandaşlardan gelen çöp/temizlik şikayetleri ve şoförlerin yüklediği çözüm fotoğraflarının yönetici onay paneli.",
              },
              {
                id: "loglar",
                label: "Sistem Logları",
                icon: History,
                count: filteredLogs.length,
                info: "Sistemde kimin ne zaman hangi işlemi yaptığını gösteren değiştirilemez güvenlik ve denetim kayıtları.",
              },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <div key={tab.id} className="relative flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border",
                      isActive
                        ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200/60 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-emerald-100" : "text-slate-500")} />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[10px] font-extrabold shrink-0",
                          isActive ? "bg-white/20 text-white" : "bg-white text-slate-700 border border-slate-200"
                        )}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                  <AdminInfoTooltip title={tab.label} description={tab.info} side="bottom" />
                </div>
              );
            })}
          </div>

          {/* Ayrılmış Veri Sıfırlama Butonu */}
          <div className="shrink-0 flex items-center gap-1 pl-2 sm:border-l sm:border-slate-200 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setActiveTab("sifirla")}
              className={cn(
                "px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border",
                activeTab === "sifirla"
                  ? "bg-red-600 text-white border-red-700 shadow-xs"
                  : "bg-red-50 text-red-700 border-red-200/80 hover:bg-red-100"
              )}
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              <span>Sıfırlama</span>
            </button>
            <AdminInfoTooltip
              title="Veri Sıfırlama"
              description="Test verilerini silerek fabrika ayarlarına döndürür veya demo kayıtlarını temizler."
              side="bottom"
            />
          </div>
        </div>
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
                    { id: "today", label: "Bugün" },
                    { id: "week", label: "Son 7 Gün" },
                    { id: "month", label: "Bu Ay" },
                    { id: "all", label: "Tüm Zamanlar" },
                    { id: "single_date", label: "Belirli Gün" },
                    { id: "custom_range", label: "Tarih Aralığı" },
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
                    <option value="date_desc">Tarih (Yeniden Eskiye)</option>
                    <option value="date_asc">Tarih (Eskiden Yeniye)</option>
                    <option value="tonnage_desc">Tonaj (Çoktan Aza)</option>
                    <option value="tonnage_asc">Tonaj (Azdan Çoka)</option>
                    <option value="shifts_desc">Sefer (En Çok Sefer)</option>
                    <option value="name_asc">Mahalle Adı (A-Z)</option>
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

                {/* Hızlı Dışa Aktarma Butonları (Üst Araç Çubuğu) */}
                <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-slate-200">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); exportNeighborhoodsCsv(displayedNeighborhoodMatrix, activePeriodLabel); }}
                    className="h-8 px-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs active:scale-98 cursor-pointer"
                    title="Tüm dönem verilerini Excel tablosu olarak indir"
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); exportNeighborhoodsPdf(displayedNeighborhoodMatrix, activePeriodLabel, totalAuditTonnage, periodShifts.length); }}
                    className="h-8 px-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs active:scale-98 cursor-pointer"
                    title="Resmi belediye formatında PDF raporu yazdır veya kaydet"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>PDF</span>
                  </button>
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

                    {/* Kurumsal Operasyon Nabzı (Executive Mission Banner) */}
          {/* Kurumsal Saha Yoğunluğu (Yalnızca Bugünün Canlı Verileri) */}
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-4 text-white shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                  <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping", todayTotalWaiting > 0 ? "bg-amber-400" : "bg-emerald-400")} />
                  <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", todayTotalWaiting > 0 ? "bg-amber-500" : "bg-emerald-500")} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-extrabold text-sm tracking-tight text-white">
                      Saha Yoğunluğu
                    </h3>
                    <Badge className={cn("text-[10px] font-extrabold px-2 py-0.2 border", todayTotalWaiting > 0 ? "bg-amber-500/20 text-amber-200 border-amber-400/30" : "bg-emerald-500/20 text-emerald-200 border-emerald-400/30")}>
                      {todayTotalWaiting > 0 ? "Bugün Müdahale Bekleyen İşler Var" : "Bugünkü Saha Durumu Normal"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300/80 mt-0.5 font-medium">
                    Bugünün Canlı Operasyon Durumu: Bugün gerçekleşen {todayShifts.length} seferde kantarda tartılan toplam <strong className="text-emerald-300 font-semibold">{todayAuditTonnage.toFixed(2)} Ton</strong> katı atık toplandı.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-xs font-semibold text-slate-300 border-t md:border-t-0 border-white/10 pt-2 md:pt-0">
                <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                  Bugün Sahada: <strong className="text-sky-300">{todayActiveShiftsCount} Araç</strong>
                </span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/10">
                  Bugün Bekleyen: <strong className={cn(todayTotalWaiting > 0 ? "text-amber-300" : "text-emerald-300")}>{todayTotalWaiting} İş</strong>
                </span>
              </div>
            </div>
          </div>

          {/* KPI İstatistik Kartları (Yönetici Paneli) */}
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Toplam Atık Tonajı */}
            <Card className="border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 shadow-xs p-4.5 relative overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Toplam Atık Tonajı</p>
                  <AdminInfoTooltip
                    title="Toplam Tonaj"
                    description="Seçilen tarih aralığında çöp ve damperli kamyonların kantarda tartılarak sisteme işlenen toplam net tonajıdır."
                  />
                </div>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100/80 text-emerald-800 shadow-2xs">
                  <Scale className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-emerald-950 mt-2 font-display tracking-tight">
                {totalAuditTonnage.toFixed(2)} <span className="text-base font-bold text-emerald-700">Ton</span>
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-600 bg-white/80 px-2 py-1 rounded-lg border border-emerald-200/50">
                <span className="text-[11px] font-medium text-slate-500">Sefer Ortalaması:</span>
                <span className="font-extrabold text-emerald-900">{avgTonnagePerShift} Ton / Sefer</span>
              </div>
            </Card>

            {/* 2. Çöp Seferi / Mesai */}
            <Card className="border border-sky-100 bg-gradient-to-br from-white to-sky-50/40 shadow-xs p-4.5 relative overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Çöp Seferi / Mesai</p>
                  <AdminInfoTooltip
                    title="Sefer Sayısı"
                    description="Seçilen dönemde sahaya çıkan araçların tamamlanan ve şu an aktif süren vardiya mesai sayısıdır."
                  />
                </div>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-sky-100/80 text-sky-800 shadow-2xs">
                  <Truck className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2 font-display tracking-tight">
                {periodShifts.length} <span className="text-base font-bold text-slate-500">Sefer</span>
              </p>
              <div className="mt-2 flex items-center justify-between text-xs bg-white/80 px-2 py-1 rounded-lg border border-sky-200/50">
                <span className="text-emerald-700 font-extrabold text-[11px]">✓ {completedShiftsCount} Tamamlandı</span>
                <span className="text-sky-700 font-extrabold text-[11px]">● {activeShiftsCount} Aktif</span>
              </div>
            </Card>

            {/* 3. En Çok Atık Çıkan Mahalle */}
            <Card className="border border-amber-100 bg-gradient-to-br from-white to-amber-50/40 shadow-xs p-4.5 relative overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">En Çok Atık Çıkan</p>
                  <AdminInfoTooltip
                    title="En Çok Atık Çıkan Mahalle"
                    description="Seçilen dönemde en yüksek tonajın toplandığı mahalle ve toplam ilçe atığı içindeki yüzdelik payı."
                  />
                </div>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-100/80 text-amber-800 shadow-2xs">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-slate-900 mt-2 font-display truncate">
                {topNeighborhood ? topNeighborhood.name : "Kayıt Yok"}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs bg-white/80 px-2 py-1 rounded-lg border border-amber-200/50">
                <span className="text-[11px] text-slate-500 font-medium">Toplam Payı:</span>
                <span className="font-extrabold text-amber-800">
                  {topNeighborhood ? `${topNeighborhood.totalTonnage.toFixed(2)} T (% ${topNeighborhood.tonnageShare})` : "—"}
                </span>
              </div>
            </Card>

            {/* 4. Saha Denetim Durumu */}
            <Card className="border border-purple-100 bg-gradient-to-br from-white to-purple-50/40 shadow-xs p-4.5 relative overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Saha Denetim Durumu</p>
                  <AdminInfoTooltip
                    title="Bekleyen Saha İşleri"
                    description="Şu an sahada müdahale veya kaynak bekleyen açık atık, konteyner arızası ve vatandaş şikayetleri toplamı."
                  />
                </div>
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-purple-100/80 text-purple-800 shadow-2xs">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2 font-display tracking-tight">
                {totalWasteWaiting + totalContainersWaiting + totalComplaintsOpen}{" "}
                <span className="text-base font-bold text-slate-500">Bekleyen</span>
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] bg-white/80 px-2 py-1 rounded-lg border border-purple-200/50 font-bold">
                <span className="text-emerald-700">📦 {totalWasteWaiting}</span>
                <span className="text-amber-700">🏗️ {totalContainersWaiting}</span>
                <span className="text-red-700">🚨 {totalComplaintsOpen}</span>
              </div>
            </Card>
          </div>

          {/* Vardiya Bazlı Tonaj Dağılımı */}
          <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-700" />
                <CardTitle className="font-display text-sm font-bold text-slate-900 flex items-center">
                  <span>Vardiya Bazlı Tonaj ve Sefer Analizi</span>
                  <AdminInfoTooltip
                    title="Vardiya Karşılaştırması"
                    description="Gündüz (08:00 - 16:00), Akşam (16:00 - 00:00) ve Gece (00:00 - 08:00) vardiyalarında toplanan çöp tonajlarının sefer sayısı ve yüzdelik dağılım karşılaştırması."
                  />
                </CardTitle>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-2xs">
                Seçilen Dönem: {auditPeriod === "today" ? "Bugün" : auditPeriod === "week" ? "Son 7 Gün" : auditPeriod === "month" ? "Bu Ay" : "Tüm Zamanlar"}
              </span>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {shiftHoursAnalysis.map((slot, idx) => (
                  <div key={slot.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-2.5 transition hover:border-emerald-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {idx === 0 ? (
                          <Sun className="h-4 w-4 text-amber-600" />
                        ) : idx === 1 ? (
                          <Sunset className="h-4 w-4 text-orange-600" />
                        ) : (
                          <Moon className="h-4 w-4 text-indigo-600" />
                        )}
                        <span className="text-xs font-extrabold text-slate-800">{slot.name}</span>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", slot.badgeColor)}>
                        {slot.hours}
                      </Badge>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-2xl font-extrabold text-slate-900 font-display">
                        {slot.tonnage.toFixed(2)} <span className="text-xs font-bold text-slate-500">Ton</span>
                      </span>
                      <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200/70">
                        {slot.count} Sefer
                      </span>
                    </div>
                    <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${slot.percentage}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium text-right">
                      Toplam tonajın <strong>%{slot.percentage}</strong>&apos;si
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mahalle Bazlı Kapsamlı Tonaj & Günlük Denetim Tablosu */}
          <Card className="border-0 bg-white shadow-sm overflow-hidden min-h-[520px] transition-all duration-200">
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
            {/* Akıllı Hızlı Görünüm Filtreleri (Linear / Stripe Preset Bar) */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1 shrink-0">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <span>Hızlı Görünüm:</span>
                </span>
                {[
                  { id: "all", label: "Tüm Mahalleler", count: neighborhoodMatrix.length, badgeClass: "bg-slate-100 text-slate-700" },
                  { id: "needs_attention", label: "Müdahale Bekleyenler", count: needsAttentionCount, badgeClass: "bg-red-100 text-red-700 font-bold" },
                  { id: "no_shifts", label: "Sefer Yapılmayanlar", count: noShiftsCount, badgeClass: "bg-amber-100 text-amber-800 font-bold" },
                  { id: "top_tonnage", label: "En Yüksek Tonaj (İlk 10)", count: Math.min(10, neighborhoodMatrix.length), badgeClass: "bg-emerald-100 text-emerald-800 font-bold" },
                  { id: "clean", label: "Temiz Mahalleler", count: cleanCount, badgeClass: "bg-emerald-50 text-emerald-700" },
                ].map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={(e) => { e.preventDefault(); setQuickPreset(preset.id as any); }}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border",
                      quickPreset === preset.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <span>{preset.label}</span>
                    <span className={cn("rounded-full px-1.5 py-0.2 text-[10px]", quickPreset === preset.id ? "bg-white/20 text-white font-black" : preset.badgeClass)}>
                      {preset.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-500 font-medium shrink-0">
                Gösterilen: <strong className="text-slate-800">{displayedNeighborhoodMatrix.length}</strong> / {neighborhoodMatrix.length} Mahalle
              </div>
            </div>
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
                          <span>Mahalle / Bölge</span><AdminInfoTooltip title="Mahalle & Bölge" description="Mahalle adı ve belediyenin belirlediği temizlik bölgesi (Doğu, Batı, Merkez, vb.)." />
                          {sortBy === "name_asc" && <span className="text-emerald-700 font-bold">▲</span>}
                        </div>
                      </th>
                      <th
                        onClick={() => setSortBy(sortBy === "date_desc" ? "date_asc" : "date_desc")}
                        className="px-5 py-3.5 cursor-pointer hover:text-emerald-800 transition select-none"
                        title="Sefer tarihine göre sırala"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Son Sefer Tarihi</span><AdminInfoTooltip title="Son Sefer" description="Mahalleye en son giren çöp kamyonunun vardiya ve tartım tarihi." />
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
                          <span>Çöp Seferi</span><AdminInfoTooltip title="Sefer Sayısı" description="Seçilen dönemde bu mahalleye yapılan toplam araç boşaltım seferi sayısı." />
                          {sortBy === "shifts_desc" && <span className="text-emerald-700 font-bold">▼</span>}
                        </div>
                      </th>
                      <th
                        onClick={() => setSortBy(sortBy === "tonnage_desc" ? "tonnage_asc" : "tonnage_desc")}
                        className="px-5 py-3.5 cursor-pointer hover:text-emerald-800 transition select-none"
                        title="Tonaj miktarına göre sırala"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Toplam Tonaj</span><AdminInfoTooltip title="Mahalle Tonajı" description="Mahalleden toplanan ve kantar fişiyle belgelenen net katı atık tonajı." />
                          {sortBy === "tonnage_desc" ? (
                            <span className="text-emerald-700 font-bold">▼</span>
                          ) : sortBy === "tonnage_asc" ? (
                            <span className="text-emerald-700 font-bold">▲</span>
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th className="px-5 py-3.5"><div className="flex items-center"><span>Sefer Ortalaması</span><AdminInfoTooltip title="Ortalama Tonaj" description="Sefer başına düşen ortalama çöp ağırlığı (Tonaj / Sefer)." /></div></th>
                      <th className="px-5 py-3.5 w-36"><div className="flex items-center"><span>Tonaj Payı</span><AdminInfoTooltip title="İlçe Payı" description="İlçeden toplanan toplam atık içindeki mahallenin yüzdelik oranı." /></div></th>
                      <th className="px-5 py-3.5"><div className="flex items-center"><span>Damperlik Atık</span><AdminInfoTooltip title="Damperlik Atık" description="Mahallede tespit edilen ve toplanmayı bekleyen kaba hafriyat/moloz birikintileri." /></div></th>
                      <th className="px-5 py-3.5"><div className="flex items-center"><span>Konteyner</span><AdminInfoTooltip title="Arızalı Konteyner" description="Kaynak ekibinden tamir veya yedek parça bekleyen arızalı çöp konteynerleri." /></div></th>
                      <th className="px-5 py-3.5"><div className="flex items-center"><span>Şikayet</span><AdminInfoTooltip title="Vatandaş Şikayeti" description="Vatandaşlardan gelen ve henüz çözülmemiş açık temizlik şikayetleri." /></div></th>
                      <th className="px-5 py-3.5 text-right"><div className="flex items-center justify-end"><span>Denetim Durumu</span><AdminInfoTooltip title="Denetim Durumu" description="Mahallenin genel saha sağlığı rozeti: Açık sorun yoksa Temiz, atık/arıza varsa Müdahale Bekliyor." /></div></th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedNeighborhoodMatrix.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-xs text-slate-500">
                          Seçilen kriterlere uygun mahalle denetim kaydı bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      displayedNeighborhoodMatrix.map(item => (
                        <tr key={item.name} onClick={() => { setSelectedNeighborhoodDetail(item); setDrawerTab("shifts"); }} className="border-t border-slate-100 hover:bg-emerald-50/60 transition cursor-pointer group" title="Bu mahallenin tüm kantar fişlerini, seferlerini ve arızalarını incelemek için tıklayın">
                          {/* Mahalle & Bölge */}
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-slate-900 text-sm group-hover:text-emerald-800 transition flex items-center gap-1.5">
                                <span>{item.name}</span>
                                <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-600 transition group-hover:translate-x-0.5" />
                              </p>
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

      {/* 4. MAHALLENİN DERİN DETAY ÇEKMECESİ (SLIDE-OVER SHEET) */}
      <Sheet open={Boolean(selectedNeighborhoodDetail)} onOpenChange={open => !open && setSelectedNeighborhoodDetail(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-slate-50 border-l border-slate-200">
          {selectedNeighborhoodDetail && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Çekmece Başlığı (Executive Dark Hero) */}
              <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 p-5 text-white shrink-0 relative">
                <div className="flex items-center gap-2">
                  <Badge className="bg-white/10 text-emerald-300 border-white/10 text-[10px] font-bold">
                    {selectedNeighborhoodDetail.region}
                  </Badge>
                  {selectedNeighborhoodDetail.auditStatus === "active_shift" ? (
                    <Badge className="bg-sky-500/20 text-sky-200 border-sky-400/30 text-[10px] font-bold">
                      ● Aktif Mesai Sürüyor
                    </Badge>
                  ) : selectedNeighborhoodDetail.auditStatus === "needs_action" ? (
                    <Badge className="bg-red-500/20 text-red-200 border-red-400/30 text-[10px] font-bold">
                      ⚠️ Müdahale Bekliyor
                    </Badge>
                  ) : selectedNeighborhoodDetail.auditStatus === "clean" ? (
                    <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 text-[10px] font-bold">
                      ✓ Saha Temiz
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-500/20 text-slate-300 border-slate-400/30 text-[10px] font-bold">
                      Sefer Yok
                    </Badge>
                  )}
                </div>

                <h2 className="text-2xl font-black font-display tracking-tight text-white mt-1.5">
                  {selectedNeighborhoodDetail.name} Mahalle Raporu
                </h2>
                <p className="text-xs text-emerald-200/80 mt-0.5">
                  Seçilen dönemdeki kantar fişleri, araç vardiyaları, moloz atıkları ve konteyner onarım dökümü.
                </p>

                {/* 4 Özet Mikro Metrik Kartı */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/10 text-center">
                  <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                    <p className="text-[10px] uppercase font-bold text-emerald-300">Toplam Atık</p>
                    <p className="text-base font-extrabold text-white mt-0.5 font-display">
                      {selectedNeighborhoodDetail.totalTonnage.toFixed(2)} <span className="text-[10px]">T</span>
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                    <p className="text-[10px] uppercase font-bold text-emerald-300">Sefer</p>
                    <p className="text-base font-extrabold text-white mt-0.5 font-display">
                      {selectedNeighborhoodDetail.totalShifts}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                    <p className="text-[10px] uppercase font-bold text-emerald-300">Ortalama</p>
                    <p className="text-base font-extrabold text-white mt-0.5 font-display">
                      {selectedNeighborhoodDetail.avgTonnage} <span className="text-[10px]">T</span>
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                    <p className="text-[10px] uppercase font-bold text-emerald-300">İlçe Payı</p>
                    <p className="text-base font-extrabold text-white mt-0.5 font-display">
                      %{selectedNeighborhoodDetail.tonnageShare}
                    </p>
                  </div>
                </div>
              </div>

              {/* Çekmece Alt Sekmeleri */}
              <div className="flex items-center gap-1 p-2 bg-white border-b border-slate-200 shrink-0 overflow-x-auto">
                {[
                  { id: "shifts", label: "Sefer & Kantar", count: (selectedNeighborhoodDetail.shifts || []).length, icon: Truck },
                  { id: "waste", label: "Damperlik Atık", count: (selectedNeighborhoodDetail.waste || []).length, icon: Recycle },
                  { id: "containers", label: "Konteyner", count: (selectedNeighborhoodDetail.containers || []).length, icon: Wrench },
                  { id: "complaints", label: "Şikayetler", count: (selectedNeighborhoodDetail.complaints || []).length, icon: AlertTriangle },
                ].map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDrawerTab(t.id as any)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border",
                        drawerTab === t.id
                          ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200/60 hover:bg-slate-100"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{t.label}</span>
                      <span className={cn("rounded-full px-1.5 py-0.2 text-[10px]", drawerTab === t.id ? "bg-white/20 text-white" : "bg-white text-slate-700 border")}>
                        {t.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Çekmece İçerik Alanı (Kaydırılabilir) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* 1. SEFERLER & KANTAR FİŞLERİ */}
                {drawerTab === "shifts" && (
                  <div className="space-y-3">
                    {(selectedNeighborhoodDetail.shifts || []).length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-400">
                        İncelenen dönem aralığında bu mahalle sınırları içerisinde kayıtlı araç seferi bulunmamaktadır.
                      </div>
                    ) : (
                      (selectedNeighborhoodDetail.shifts || []).map((s: any) => (
                        <div key={s.id} className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                {s.vehiclePlate || "Plakasız"}
                              </span>
                              <span className="text-xs font-semibold text-slate-700">{s.driverName || "Şoför"}</span>
                            </div>
                            <Badge className={cn("text-[10px] font-bold", s.status === "tamamlandı" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-sky-50 text-sky-700 border-sky-200")}>
                              {s.status === "tamamlandı" ? "✓ Tamamlandı" : "● Aktif Sahada"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">Başlama / Bitiş</span>
                              <span className="font-bold text-slate-800">
                                {new Date(s.startedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                                {s.endedAt ? " - " + new Date(s.endedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : " (Sürüyor)"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">Kantar Net Ağırlık</span>
                              <span className="font-extrabold text-emerald-800 text-sm font-display">
                                {s.tonnage ? Number(s.tonnage).toFixed(2) + " Ton" : "Tartım Yok"}
                              </span>
                            </div>
                          </div>

                          {/* Kantar Fişi Görseli */}
                          {s.scalePhotoUrl ? (
                            <div className="pt-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                                <Camera className="h-3 w-3 text-emerald-600" />
                                <span>Kantar Fişi Fotoğrafı</span>
                              </p>
                              <div
                                onClick={() => setPreviewImage({ url: s.scalePhotoUrl, title: "Kantar Fişi - " + (s.vehiclePlate || "Tartım") })}
                                className="relative rounded-xl overflow-hidden border border-slate-200 h-28 w-full bg-slate-100 cursor-pointer group shadow-2xs"
                              >
                                <img
                                  src={s.scalePhotoUrl}
                                  alt="Kantar Fişi"
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                  <Eye className="h-4 w-4" /> Büyüt
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">Kantar fişi fotoğrafı yüklenmemiş.</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 2. DAMPERLİK ATIKLAR */}
                {drawerTab === "waste" && (
                  <div className="space-y-3">
                    {(selectedNeighborhoodDetail.waste || []).length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-400">
                        İncelenen dönem aralığında bu mahalle için sisteme intikal etmiş açık moloz/hafriyat bildirimi bulunmamaktadır.
                      </div>
                    ) : (
                      (selectedNeighborhoodDetail.waste || []).map((w: any) => (
                        <div key={w.id} className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{w.description || "Damperlik Atık"}</span>
                            <Badge className={cn("text-[10px] font-bold", w.status === "toplandı" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200")}>
                              {w.status === "toplandı" ? "✓ Toplandı" : "Müdahale Bekliyor"}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600">{w.addressText || "Adres detayı yok"}</p>
                          {w.photoUrl && (
                            <div
                              onClick={() => setPreviewImage({ url: w.photoUrl, title: "Damperlik Atık Görseli" })}
                              className="relative rounded-xl overflow-hidden border border-slate-200 h-24 w-full bg-slate-100 cursor-pointer group shadow-2xs"
                            >
                              <img src={w.photoUrl} alt="Atık Görseli" className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                <Eye className="h-4 w-4" /> Fotoğrafı Gör
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 3. KONTEYNER ARIZALARI */}
                {drawerTab === "containers" && (
                  <div className="space-y-3">
                    {(selectedNeighborhoodDetail.containers || []).length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-400">
                        İncelenen dönem aralığında bu mahallede kaynak veya revizyon gerektiren arızalı çöp konteyneri kaydı bulunmamaktadır.
                      </div>
                    ) : (
                      (selectedNeighborhoodDetail.containers || []).map((c: any) => (
                        <div key={c.id} className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{c.faultType || "Konteyner Arızası"}</span>
                            <Badge className={cn("text-[10px] font-bold", c.status === "onarıldı" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200")}>
                              {c.status === "onarıldı" ? "✓ Onarıldı" : "Kaynak Bekliyor"}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600">{c.addressText || "Adres detayı yok"}</p>
                          {c.photoUrl && (
                            <div
                              onClick={() => setPreviewImage({ url: c.photoUrl, title: "Arızalı Konteyner Görseli" })}
                              className="relative rounded-xl overflow-hidden border border-slate-200 h-24 w-full bg-slate-100 cursor-pointer group shadow-2xs"
                            >
                              <img src={c.photoUrl} alt="Arıza Görseli" className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                <Eye className="h-4 w-4" /> Fotoğrafı Gör
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* 4. ŞİKAYETLER */}
                {drawerTab === "complaints" && (
                  <div className="space-y-3">
                    {(selectedNeighborhoodDetail.complaints || []).length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-400">
                        İncelenen dönem aralığında bu mahalle için sisteme intikal etmiş açık vatandaş temizlik talebi bulunmamaktadır.
                      </div>
                    ) : (
                      (selectedNeighborhoodDetail.complaints || []).map((cp: any) => (
                        <div key={cp.id} className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{cp.citizenName || "Vatandaş Başvurusu"}</span>
                            <Badge className={cn("text-[10px] font-bold", cp.status === "çözüldü" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200")}>
                              {cp.status === "çözüldü" ? "✓ Çözüldü" : "Açık Şikayet"}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-700 font-medium">{cp.description}</p>
                          <p className="text-[11px] text-slate-500">{cp.addressText}</p>
                          {cp.proofPhotoUrl && (
                            <div
                              onClick={() => setPreviewImage({ url: cp.proofPhotoUrl, title: "Vatandaş Şikayeti Çözüm Fotoğrafı" })}
                              className="relative rounded-xl overflow-hidden border border-slate-200 h-24 w-full bg-slate-100 cursor-pointer group shadow-2xs"
                            >
                              <img src={cp.proofPhotoUrl} alt="Çözüm Kanıtı" className="w-full h-full object-cover group-hover:scale-105 transition" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                <Eye className="h-4 w-4" /> Çözüm Fotoğrafı
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )}

      {activeTab === "mesailer" && (
        <Card className="border-0 bg-white shadow-sm overflow-hidden min-h-[500px]">
          <CardHeader className="pb-3 flex flex-row items-center justify-between flex-wrap gap-2 border-b border-slate-100 bg-slate-50/50">
            <div>
              <CardTitle className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="h-4 w-4 text-emerald-700" />
                Kayıtlı Mesailer ve Tonaj Fişleri
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Seçili döneme ait ({activePeriodLabel}) şoför mesai kayıtları, tamamlanan tonajlar ve kantar tartım fişleri</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-bold text-slate-700 bg-white border-slate-200">
                Seçilen Dönem: {periodShifts.length} Mesai
              </Badge>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); exportShiftsCsv(periodShifts); }}
                className="h-8 px-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs cursor-pointer active:scale-98"
                title="Seçilen dönem mesai listesini Excel olarak indir"
              >
                <Download className="h-3.5 w-3.5 text-emerald-700" />
                <span>Excel</span>
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); exportShiftsPdf(periodShifts, activePeriodLabel); }}
                className="h-8 px-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer active:scale-98"
                title="Seçilen döneme ait resmi belediye formatında Mesai ve Tonaj PDF raporu al"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>PDF Rapor Al</span>
              </button>
            </div>
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
                  {periodShifts.map(shift => {
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
        <Card className="border-0 bg-white shadow-sm overflow-hidden min-h-[500px]">
          <CardHeader className="pb-3 flex flex-row items-center justify-between flex-wrap gap-2 border-b border-slate-100 bg-slate-50/50">
            <div>
              <CardTitle className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <Recycle className="h-4 w-4 text-emerald-700" />
                Damperlik Atık ve Moloz Kayıtları
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Seçili döneme ait ({activePeriodLabel}) moloz, hafriyat ve kaba atık bildirimleri (175m GPS doğrulamalı)</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-bold text-slate-700 bg-white border-slate-200">
                Seçilen Dönem: {periodWaste.length} Atık
              </Badge>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); exportWasteCsv(periodWaste); }}
                className="h-8 px-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs cursor-pointer active:scale-98"
                title="Seçilen dönem atık listesini Excel olarak indir"
              >
                <Download className="h-3.5 w-3.5 text-emerald-700" />
                <span>Excel</span>
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); exportWastePdf(periodWaste, activePeriodLabel); }}
                className="h-8 px-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer active:scale-98"
                title="Seçilen döneme ait resmi Damperlik Atık PDF raporu al"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>PDF Rapor Al</span>
              </button>
            </div>
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
                  {activeWasteList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-500 font-medium">
                        Henüz bildirilmiş bekleyen damperlik atık kaydı bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    activeWasteList.map(waste => (
                      <tr key={waste.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="px-5 py-3 font-semibold text-slate-900">
                          {waste.wasteType} · {waste.neighborhood}
                        </td>
                        <td className="px-5 py-3 text-slate-600 text-xs max-w-xs">
                          <div className="truncate">{waste.description}</div>
                          {waste.photoUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewImage({
                                url: waste.photoUrl,
                                title: `Damperlik Atık #${waste.id} Fotoğrafı`,
                                entityType: "waste",
                                entityId: waste.id,
                                photoField: "photoUrl",
                              })}
                              className="mt-1 inline-flex items-center gap-1 bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200"
                            >
                              <ImageIcon className="h-3 w-3 text-slate-600" /> Fotoğrafı İncele
                            </button>
                          )}
                        </td>
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
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px] font-bold">
                            Toplanma Bekliyor
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. KONTEYNER ARIZALARI */}
      {activeTab === "konteynerler" && (
        <Card className="border-0 bg-white shadow-sm overflow-hidden min-h-[500px]">
          <CardHeader className="pb-3 flex flex-row items-center justify-between flex-wrap gap-2 border-b border-slate-100 bg-slate-50/50">
            <div>
              <CardTitle className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-emerald-700" />
                Konteyner Arıza ve Onarım Kayıtları
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Seçili döneme ait ({activePeriodLabel}) kaldırma kolu veya gövdesi arızalı çöp konteynerleri takip listesi</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-bold text-slate-700 bg-white border-slate-200">
                Seçilen Dönem: {periodContainers.length} Arıza
              </Badge>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); exportContainersCsv(periodContainers); }}
                className="h-8 px-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs cursor-pointer active:scale-98"
                title="Seçilen dönem konteyner arıza listesini Excel olarak indir"
              >
                <Download className="h-3.5 w-3.5 text-emerald-700" />
                <span>Excel</span>
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); exportContainersPdf(periodContainers, activePeriodLabel); }}
                className="h-8 px-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer active:scale-98"
                title="Seçilen döneme ait resmi Konteyner Arıza ve Onarım PDF raporu al"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>PDF Rapor Al</span>
              </button>
            </div>
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
                  {activeContainers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-xs text-slate-500 font-medium">
                        Henüz bildirilmiş bekleyen konteyner arıza kaydı bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    activeContainers.map(cont => (
                      <tr key={cont.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="px-5 py-3 font-semibold text-slate-900">{cont.faultType} · {cont.neighborhood}</td>
                        <td className="px-5 py-3 text-slate-600 text-xs max-w-md">
                          <div className="truncate">{cont.description}</div>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {cont.photoUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewImage({
                                  url: cont.photoUrl,
                                  title: `Konteyner #${cont.id} Arıza Fotoğrafı`,
                                  entityType: "container",
                                  entityId: cont.id,
                                  photoField: "photoUrl",
                                })}
                                className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200"
                              >
                                <ImageIcon className="h-3 w-3 text-slate-600" /> Arıza Foto
                              </button>
                            )}
                            {cont.repairPhotoUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewImage({
                                  url: cont.repairPhotoUrl,
                                  title: `Konteyner #${cont.id} Onarım Fotoğrafı`,
                                  entityType: "container",
                                  entityId: cont.id,
                                  photoField: "repairPhotoUrl",
                                })}
                                className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-300 shadow-2xs"
                              >
                                <Camera className="h-3 w-3 text-emerald-700" /> Onarım Foto
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px] font-bold">
                            Onarım Bekliyor
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. VATANDAŞ ŞİKAYETLERİ */}
      {activeTab === "sikayetler" && (
        <Card className="border-0 bg-white shadow-sm overflow-hidden min-h-[500px]">
          <CardHeader className="pb-3 flex flex-row items-center justify-between flex-wrap gap-2 border-b border-slate-100 bg-slate-50/50">
            <div>
              <CardTitle className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-emerald-700" />
                Vatandaş Şikayetleri ve Çözüm Denetimi
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Seçili döneme ait ({activePeriodLabel}) temizlik başvuruları, saha çözüm fotoğrafları ve yönetici onay paneli</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-bold text-slate-700 bg-white border-slate-200">
                Seçilen Dönem: {periodComplaints.length} Şikayet
              </Badge>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); exportComplaintsCsv(periodComplaints); }}
                className="h-8 px-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs cursor-pointer active:scale-98"
                title="Seçilen dönem vatandaş şikayet listesini Excel olarak indir"
              >
                <Download className="h-3.5 w-3.5 text-emerald-700" />
                <span>Excel</span>
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); exportComplaintsPdf(periodComplaints, activePeriodLabel); }}
                className="h-8 px-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer active:scale-98"
                title="Seçilen döneme ait resmi Vatandaş Şikayet ve Çözüm PDF raporu al"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>PDF Rapor Al</span>
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[750px]">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Mahalle & Bölge</th>
                    <th className="px-5 py-3">Açıklama</th>
                    <th className="px-5 py-3">Bildiren</th>
                    <th className="px-5 py-3">Çözüm & Fotoğraf</th>
                    <th className="px-5 py-3">Durum</th>
                    <th className="px-5 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {activeComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-500 font-medium">
                        Henüz bildirilmiş aktif vatandaş şikayeti bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    activeComplaints.map(comp => (
                    <tr key={comp.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-5 py-3">
                        <span className="font-semibold text-slate-900">{comp.neighborhood}</span>
                        <span className="block text-xs text-slate-500">📍 {comp.region}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs max-w-xs truncate">{comp.description}</td>
                      <td className="px-5 py-3 text-xs">
                        {comp.reporterName ? (
                          <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/70">
                            👤 {comp.reporterName}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {comp.photoUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewImage({
                                url: comp.photoUrl,
                                title: `Şikayet #${comp.id} Fotoğrafı`,
                                entityType: "complaint",
                                entityId: comp.id,
                                photoField: "photoUrl",
                              })}
                              className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200"
                            >
                              <ImageIcon className="h-3 w-3 text-slate-600" /> Şikayet Foto
                            </button>
                          )}
                          {comp.resolutionPhotoUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewImage({
                                url: comp.resolutionPhotoUrl,
                                title: `Şikayet #${comp.id} Çözüm Fotoğrafı`,
                                entityType: "complaint",
                                entityId: comp.id,
                                photoField: "resolutionPhotoUrl",
                              })}
                              className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-300 shadow-2xs"
                            >
                              <Camera className="h-3 w-3 text-emerald-700" /> 📸 Çözüm Foto
                            </button>
                          )}
                          {comp.resolverName && (
                            <span className="block w-full text-[10px] text-emerald-800 font-semibold mt-0.5">
                              🧹 Çözen: {comp.resolverName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          variant="outline"
                          className={
                            comp.status === "onay_bekliyor"
                              ? "bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold animate-pulse"
                              : comp.status === "açık"
                              ? "bg-red-50 text-red-700 text-[10px] font-bold"
                              : "bg-emerald-50 text-emerald-700 text-[10px] font-bold"
                          }
                        >
                          {comp.status === "onay_bekliyor"
                            ? "⏳ Onay Bekliyor"
                            : comp.status === "açık"
                            ? "Açık"
                            : "✅ Onaylandı"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">

                        <div className="flex items-center justify-end gap-1.5">
                          {comp.status === "onay_bekliyor" && (
                            <>
                              <Button
                                size="sm"
                                disabled={approveComplaint.isPending}
                                onClick={() => approveComplaint.mutate({ id: comp.id })}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-7 px-2.5 font-bold shadow-xs"
                                title="Onayla ve Kapat"
                              >
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                Onayla
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={rejectComplaint.isPending}
                                onClick={() => rejectComplaint.mutate({ id: comp.id })}
                                className="border-red-200 text-red-700 hover:bg-red-50 text-xs h-7 px-2"
                                title="Reddet ve Tekrar Aç"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. SİSTEM DENETİM LOGLARI */}
      {activeTab === "loglar" && (
        <div className="space-y-5">
          {/* Başlık ve Hızlı Eylemler Kartı */}
          <Card className="border-0 bg-white shadow-sm">
            <CardHeader className="pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-700" />
                  Sistem Denetim İzi & Hareket Logları
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sistemde şoför, kaynak, kademe ve yöneticiler tarafından gerçekleştirilen tüm operasyonel eylemlerin güvenli denetim kaydı
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-bold text-slate-700 border-slate-200">
                  {filteredLogs.length} / {logs.length} Log Kaydı
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={refresh}
                  className="h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
                  title="Logları Yenile"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5 text-emerald-700" />
                  Yenile
                </Button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); exportLogsCsv(filteredLogs); }}
                  className="h-8 px-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs cursor-pointer active:scale-98"
                  title="Sistem loglarını Excel olarak indir"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Excel</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); exportLogsPdf(filteredLogs); }}
                  className="h-8 px-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer active:scale-98"
                  title="Resmi belediye formatında Sistem Logları PDF raporu al"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>PDF Rapor Al</span>
                </button>
              </div>
            </CardHeader>
          </Card>

          {/* KPI İstatistik Kartları */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-150 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Filtrelenen İşlemler</p>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Activity className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">{filteredLogs.length}</p>
              <p className="mt-1 text-[11px] text-slate-500">Seçilen filtrelere uygun hareket</p>
            </div>

            <div className="rounded-2xl border border-slate-150 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Bugünkü Hareketler</p>
                <span className="p-2 rounded-xl bg-sky-50 text-sky-700">
                  <Calendar className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-sky-950">{logStats.todayCount}</p>
              <p className="mt-1 text-[11px] text-slate-500">Bugün gerçekleşen işlem</p>
            </div>

            <div className="rounded-2xl border border-slate-150 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">En Aktif Personel</p>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <User className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-sm font-bold text-slate-900 truncate" title={logStats.topActor}>{logStats.topActor}</p>
              <p className="mt-1 text-[11px] text-slate-500">Seçilen aralıkta en çok işlem yapan</p>
            </div>

            <div className="rounded-2xl border border-slate-150 bg-white p-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">En Çok Yapılan İşlem</p>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-xs font-bold text-slate-900 truncate uppercase" title={logStats.topAction}>{logStats.topAction}</p>
              <p className="mt-1 text-[11px] text-slate-500">En yoğun işlem türü</p>
            </div>
          </div>

          {/* Kapsamlı Filtre Kontrol Paneli */}
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-4 space-y-4">
              {/* 1. Zaman Aralığı Butonları */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-emerald-700" />
                    Zaman Aralığı Seçimi
                  </p>
                  {logPeriod === "single_date" && (
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      📅 {new Date(logSelectedDate).toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: "today", label: "📅 Bugünün Logları" },
                    { id: "week", label: "⏱️ Son 7 Gün" },
                    { id: "month", label: "🗓️ Bu Ay" },
                    { id: "all", label: "📊 Tüm Zamanlar" },
                    { id: "single_date", label: "🎯 Belirli Gün Seç" },
                    { id: "custom_range", label: "↔️ Tarih Aralığı" },
                  ].map(btn => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => {
                        setLogPeriod(btn.id as any);
                        setLogPage(1);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition border",
                        logPeriod === btn.id
                          ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Tek Gün Takvim Seçimi */}
                {logPeriod === "single_date" && (
                  <div className="mt-3 flex items-center gap-3 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                    <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 shrink-0">
                      <Calendar className="h-4 w-4 text-emerald-700" />
                      Görüntülenecek Tarih:
                    </label>
                    <Input
                      type="date"
                      value={logSelectedDate}
                      onChange={e => {
                        setLogSelectedDate(e.target.value);
                        setLogPage(1);
                      }}
                      className="bg-white h-8 text-xs font-semibold max-w-[180px]"
                    />
                  </div>
                )}

                {/* Tarih Aralığı Seçimi */}
                {logPeriod === "custom_range" && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-emerald-950 shrink-0">Başlangıç:</label>
                      <Input
                        type="date"
                        value={logStartDate}
                        onChange={e => {
                          setLogStartDate(e.target.value);
                          setLogPage(1);
                        }}
                        className="bg-white h-8 text-xs font-semibold w-36"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-emerald-950 shrink-0">Bitiş:</label>
                      <Input
                        type="date"
                        value={logEndDate}
                        onChange={e => {
                          setLogEndDate(e.target.value);
                          setLogPage(1);
                        }}
                        className="bg-white h-8 text-xs font-semibold w-36"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Eylem Kategorisi Pills */}
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-emerald-700" />
                  İşlem Kategorisi
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: "all", label: "Tüm Eylemler" },
                    { id: "mesai", label: "🚛 Mesailer" },
                    { id: "atik", label: "📦 Damperlik Atık" },
                    { id: "konteyner", label: "🏗️ Konteyner Arızası" },
                    { id: "sikayet", label: "🚨 Vatandaş Şikayeti" },
                    { id: "arac", label: "🔧 Araç & Kademe" },
                    { id: "yonetim", label: "⚙️ Yönetim & Sistem" },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setLogActionCategory(cat.id);
                        setLogPage(1);
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium transition border",
                        logActionCategory === cat.id
                          ? "bg-slate-900 text-white border-slate-950 shadow-2xs font-semibold"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Kullanıcı Filtresi ve Metin Arama */}
              <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 pt-1 border-t border-slate-100">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    👤 İşlemi Yapan Personel:
                  </label>
                  <select
                    value={logActorFilter}
                    onChange={e => {
                      setLogActorFilter(e.target.value);
                      setLogPage(1);
                    }}
                    className="input-native text-xs"
                  >
                    <option value="all">Tüm Personeller ({users.length} Kullanıcı)</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.username} (@{u.username}) · {u.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    🔍 Detaylarda Canlı Arama:
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="İşlem detayı, eylem adı, kullanıcı veya ID arayın..."
                      value={logSearchQuery}
                      onChange={e => {
                        setLogSearchQuery(e.target.value);
                        setLogPage(1);
                      }}
                      className="bg-white pl-9 pr-8 text-xs h-9"
                    />
                    {logSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogSearchQuery("");
                          setLogPage(1);
                        }}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Log Kayıtları Tablosu */}
          <Card className="border-0 bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-base">Denetim İzi Kayıt Listesi</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Toplam {filteredLogs.length} kayıttan {filteredLogs.length > 0 ? (logPage - 1) * logPageSize + 1 : 0} - {Math.min(logPage * logPageSize, filteredLogs.length)} arası gösteriliyor
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-bold">
                Sayfa {logPage} / {logTotalPages}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[850px]">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Tarih & Saat</th>
                      <th className="px-5 py-3">Personel / Aktör</th>
                      <th className="px-5 py-3">Eylem Türü</th>
                      <th className="px-5 py-3">Hedef Varlık</th>
                      <th className="px-5 py-3">İşlem Detayı & Açıklama</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-xs text-slate-500 font-medium">
                          Seçilen filtre ve arama kriterlerine uygun denetim logu bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      paginatedLogs.map(log => {
                        const badgeInfo = getActionBadgeInfo(log.action);
                        const isToday = log.createdAt && new Date(log.createdAt).toDateString() === new Date().toDateString();

                        return (
                          <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition">
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 text-xs">
                                  {log.createdAt ? new Date(log.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"}
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  {log.createdAt ? new Date(log.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
                                  {isToday && (
                                    <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1 py-0.2 rounded border border-emerald-200">
                                      Bugün
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200">
                                  {(log.actorName || log.actorUsername || "S")[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 text-xs truncate">
                                    {log.actorName || log.actorUsername || (log.actorId ? `Personel #${log.actorId}` : "Sistem")}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {log.actorUsername && (
                                      <span className="text-[10px] text-slate-500">@{log.actorUsername}</span>
                                    )}
                                    {log.actorRole && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200/70">
                                        {log.actorRole}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-3.5">
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] font-bold inline-flex items-center gap-1 py-1 px-2", badgeInfo.badgeClass)}
                              >
                                <span>{badgeInfo.iconText}</span>
                                <span>{badgeInfo.label}</span>
                              </Badge>
                            </td>

                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span className="text-xs font-semibold text-slate-800 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {log.entityType || "Sistem"}
                                {log.entityId ? ` #${log.entityId}` : ""}
                              </span>
                            </td>

                            <td className="px-5 py-3.5 text-xs text-slate-700 max-w-md">
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-150 font-mono text-[11px] leading-relaxed break-words text-slate-800">
                                {log.details || "Açıklama belirtilmedi"}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sayfalama Kontrolleri */}
              {logTotalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/30">
                  <p className="text-xs text-slate-500">
                    Toplam {filteredLogs.length} kayıttan {(logPage - 1) * logPageSize + 1} - {Math.min(logPage * logPageSize, filteredLogs.length)} arası gösteriliyor
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={logPage <= 1}
                      onClick={() => setLogPage(p => Math.max(1, p - 1))}
                      className="h-8 text-xs border-slate-200"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Önceki
                    </Button>
                    <span className="text-xs font-bold text-slate-700 px-2">
                      {logPage} / {logTotalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={logPage >= logTotalPages}
                      onClick={() => setLogPage(p => Math.min(logTotalPages, p + 1))}
                      className="h-8 text-xs border-slate-200"
                    >
                      Sonraki
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 7. ANALİZ VE DEPOLAMA VERİLERİNİ SIFIRLAMA */}
      {activeTab === "sifirla" && (
        <div className="space-y-6">
          {/* Sunucu Görsel & Depolama Temizleme Kartı */}
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display flex items-center gap-2 text-slate-900 text-base">
                <Camera className="h-5 w-5 text-emerald-700" />
                Sunucu Depolama & Görsel / Fotoğraf Temizleme
              </CardTitle>
              <p className="text-xs text-slate-500">
                Sunucuda disk doluluğunu önlemek için tonaj fişleri, atık, konteyner ve şikayet fotoğraflarını periyodik olarak temizleyebilirsiniz.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3 shadow-2xs">
                  <div>
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>📅</span> Bugünkü Görseller
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">Bugün yüklenen tüm operasyon fotoğraflarını temizler.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={purgePhotosMutation.isPending}
                    onClick={() => {
                      if (confirm("Bugün yüklenen fotoğrafları kalıcı olarak silmek istediğinizden emin misiniz?")) {
                        purgePhotosMutation.mutate({ scope: "today" });
                      }
                    }}
                    className="text-xs font-bold text-amber-700 border-amber-300 hover:bg-amber-50"
                  >
                    {purgePhotosMutation.isPending ? "Siliniyor..." : "Bugünlük Görselleri Sil"}
                  </Button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3 shadow-2xs">
                  <div>
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>⏱️</span> 7 Günlükten Eski
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">1 haftadan eski tüm fotoğrafları diskten siler.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={purgePhotosMutation.isPending}
                    onClick={() => {
                      if (confirm("7 günden eski tüm fotoğrafları kalıcı olarak silmek istediğinizden emin misiniz?")) {
                        purgePhotosMutation.mutate({ scope: "7days" });
                      }
                    }}
                    className="text-xs font-bold text-amber-700 border-amber-300 hover:bg-amber-50"
                  >
                    {purgePhotosMutation.isPending ? "Siliniyor..." : "7+ Günlük Görselleri Sil"}
                  </Button>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3 shadow-2xs">
                  <div>
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>🗓️</span> 30 Günlükten Eski
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">1 aydan eski arşiv fotoğraflarını temizler.</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={purgePhotosMutation.isPending}
                    onClick={() => {
                      if (confirm("30 günden eski arşiv fotoğraflarını kalıcı olarak silmek istediğinizden emin misiniz?")) {
                        purgePhotosMutation.mutate({ scope: "30days" });
                      }
                    }}
                    className="text-xs font-bold text-amber-700 border-amber-300 hover:bg-amber-50"
                  >
                    {purgePhotosMutation.isPending ? "Siliniyor..." : "30+ Günlük Görselleri Sil"}
                  </Button>
                </div>

                <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 flex flex-col justify-between space-y-3 shadow-2xs">
                  <div>
                    <p className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                      <span>⚠️</span> Tüm Görselleri Sıfırla
                    </p>
                    <p className="text-[11px] text-red-700 mt-1">Sistemdeki ve diskteki TÜM fotoğrafları kalıcı olarak siler.</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={purgePhotosMutation.isPending}
                    onClick={() => {
                      if (confirm("DİKKAT: Sistemdeki TÜM fotoğraflar sunucu diskinden silinecektir. Devam etmek istiyor musunuz?")) {
                        purgePhotosMutation.mutate({ scope: "all" });
                      }
                    }}
                    className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
                  >
                    {purgePhotosMutation.isPending ? "Siliniyor..." : "Tüm Görselleri Temizle"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operasyon Verilerini Sıfırlama Kartı */}
          <Card className="border border-red-200 bg-red-50/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-display flex items-center gap-2 text-red-900 text-base">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                Operasyon & Analiz Verilerini Sıfırlama
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { key: "shifts", label: "Tüm Mesai Kayıtları", count: `${shifts.length} kayıt` },
                  { key: "waste", label: "Damperlik Atık Kayıtları", count: `${wasteList.length} kayıt` },
                  { key: "containers", label: "Konteyner Arıza Kayıtları", count: `${containers.length} kayıt` },
                  { key: "complaints", label: "Vatandaş Şikayetleri", count: `${complaints.length} kayıt` },
                  { key: "faults", label: "Araç Arıza Kayıtları", count: "0 kayıt" },
                  { key: "auditLogs", label: "Denetim Logları", count: `${logs.length} kayıt` },
                  { key: "photos", label: "Tüm Fotoğraflar & Görseller", count: "Sunucu Diski" },
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
                      <p className="text-[11px] text-slate-500">{opt.count}</p>
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
        </div>
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
                  <option value="onay_bekliyor">onay_bekliyor (Yönetici Onayı Bekliyor)</option>
                  <option value="onaylandı">onaylandı (Çözüldü & Kapatıldı)</option>
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

      {/* FOTOĞRAF ÖNİZLEME LIGHTBOX MODALI */}
      {previewImage && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-h-[92vh] max-w-2xl overflow-hidden rounded-2xl bg-white p-3 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-emerald-700" />
                {previewImage.title || "Görsel Önizleme"}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[70vh] w-full overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
              <img src={previewImage.url} alt="Fotoğraf" className="max-h-[68vh] w-auto rounded-lg object-contain" />
            </div>
            <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100">
              <a
                href={previewImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Tam Boyutta Aç
              </a>
              <div className="flex items-center gap-2">
                {previewImage.entityType && previewImage.entityId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={deletePhotoMutation.isPending}
                    onClick={() => {
                      if (confirm("Bu görseli sistemden ve sunucu diskinden kalıcı olarak silmek istediğinizden emin misiniz?")) {
                        deletePhotoMutation.mutate({
                          entityType: previewImage.entityType!,
                          entityId: previewImage.entityId!,
                          photoUrl: previewImage.url,
                          photoField: previewImage.photoField,
                        });
                      }
                    }}
                    className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    {deletePhotoMutation.isPending ? "Siliniyor..." : "Görseli Sil"}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setPreviewImage(null)} className="h-8 text-xs">
                  Kapat
                </Button>
              </div>
            </div>
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
                      <div className="flex items-center gap-3">
                        <a
                          href={imgSrc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Tam Boyut
                        </a>
                        <button
                          type="button"
                          disabled={deletePhotoMutation.isPending}
                          onClick={() => {
                            if (confirm("Bu tonaj fişi görselini kalıcı olarak silmek istediğinizden emin misiniz?")) {
                              deletePhotoMutation.mutate({
                                entityType: "shift",
                                entityId: receiptModal.shiftId,
                                photoUrl: imgSrc,
                              });
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline"
                        >
                          <Trash2 className="h-3 w-3" />
                          Sil
                        </button>
                      </div>
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
