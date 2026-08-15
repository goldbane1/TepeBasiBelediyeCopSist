import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import OperationsWorkspace, { type AppView } from "@/components/OperationsWorkspace";
import LocalAuthGate from "@/components/LocalAuthGate";
import { AlertTriangle, Archive, ClipboardCheck, FileBarChart, LayoutDashboard, LogOut, Map, Menu, Recycle, Settings, Truck, UserCog, Wrench, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const logoUrl = "/manus-storage/tepebasi-logo_4a56fa31.png";
export type Role = "şoför" | "kademe personeli" | "kaynak personeli" | "yönetim";

const navItems: { id: AppView; label: string; icon: typeof LayoutDashboard; roles: Role[] }[] = [
  { id: "dashboard", label: "Operasyon Özeti", icon: LayoutDashboard, roles: ["şoför", "kademe personeli", "kaynak personeli", "yönetim"] },
  { id: "harita", label: "Operasyon Haritası & Bildirimler", icon: Map, roles: ["şoför", "kaynak personeli", "yönetim"] },
  { id: "damperlik-çözüm", label: "Damperlik Atık Çözümü", icon: Archive, roles: ["şoför", "yönetim"] },
  { id: "konteyner", label: "Konteyner Arıza Çözümü", icon: Recycle, roles: ["şoför", "kaynak personeli", "yönetim"] },
  { id: "şikayetler", label: "Vatandaş Şikayetleri", icon: AlertTriangle, roles: ["şoför", "yönetim"] },
  { id: "mesai", label: "Mesai Yönetimi", icon: ClipboardCheck, roles: ["şoför", "yönetim"] },
  { id: "araçlar", label: "Araçlar", icon: Truck, roles: ["şoför", "kademe personeli", "yönetim"] },
  { id: "araç-arızaları", label: "Araç Arızaları", icon: Wrench, roles: ["şoför", "kademe personeli", "yönetim"] },
  { id: "raporlar", label: "Yönetim Raporları", icon: FileBarChart, roles: ["yönetim"] },
  { id: "personel", label: "Personel Hesapları", icon: UserCog, roles: ["yönetim"] },
];

const roleClass: Record<Role, string> = { "şoför": "bg-sky-50 text-sky-700", "kademe personeli": "bg-amber-50 text-amber-700", "kaynak personeli": "bg-violet-50 text-violet-700", "yönetim": "bg-emerald-50 text-emerald-700" };

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState<AppView>(() => {
    const requested = new URLSearchParams(window.location.search).get("view") as AppView | null;
    return requested && navItems.some(item => item.id === requested) ? requested : "dashboard";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const role = user?.role as Role | undefined;
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f7fbf8]"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" /></div>;
  if (!user || !role) return <LoginLanding />;
  const current = navItems.find(item => item.id === view) ?? navItems[0];
  return <div className="min-h-screen bg-[#f7fbf8] app-grid"><div className="flex min-h-screen">
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[286px] flex-col border-r border-emerald-950/10 bg-[#083d2d] px-4 py-5 text-white shadow-2xl transition-transform duration-200 lg:sticky lg:translate-x-0", menuOpen ? "translate-x-0" : "-translate-x-full")}>
      <div className="flex items-center gap-3 px-2"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white p-1.5 shadow-sm"><img src={logoUrl} alt="Tepebaşı Belediyesi" className="h-full w-full object-contain" /></div><div><p className="font-display text-[15px] font-bold leading-tight">TEPEBAŞI</p><p className="mt-0.5 text-xs text-emerald-200">Temizlik İşleri</p></div><button onClick={() => setMenuOpen(false)} className="ml-auto rounded-lg p-1 text-emerald-200 lg:hidden"><X className="h-5 w-5" /></button></div>
      <p className="mt-7 px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300/70">Operasyon Merkezi</p>
      <nav className="mt-3 space-y-1">{navItems.filter(item => item.roles.includes(role)).map(item => { const Icon = item.icon; const active = item.id === view; return <button key={item.id} onClick={() => { setView(item.id); setMenuOpen(false); }} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition", active ? "bg-emerald-500 text-white shadow-lg shadow-emerald-950/20" : "text-emerald-100/75 hover:bg-white/10 hover:text-white")}><Icon className="h-[18px] w-[18px]" />{item.label}</button>; })}</nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[.07] p-3"><div className="flex items-center gap-3"><Avatar className="h-9 w-9 border border-emerald-300/30"><AvatarFallback className="bg-emerald-800 text-xs font-bold text-emerald-50">{user.name?.slice(0, 2).toUpperCase() || "TB"}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate text-sm font-semibold">{user.name || "Kullanıcı"}</p><p className="mt-0.5 truncate text-xs text-emerald-200">{role}</p></div></div><button onClick={logout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-emerald-50 transition hover:bg-white/15"><LogOut className="h-3.5 w-3.5" />Oturumu kapat</button></div>
    </aside>
    {menuOpen && <button className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" onClick={() => setMenuOpen(false)} aria-label="Menüyü kapat" />}
    <main className="min-w-0 flex-1 p-4 md:p-6 lg:p-8"><header className="mb-6 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><Button variant="outline" size="icon" className="bg-white lg:hidden" onClick={() => setMenuOpen(true)}><Menu className="h-5 w-5" /></Button><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Tepebaşı Belediyesi</p><h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">{current.label}</h1></div></div><div className="hidden items-center gap-3 sm:flex"><span className="text-sm text-slate-500">{new Intl.DateTimeFormat("tr-TR", { dateStyle: "full" }).format(new Date())}</span><Badge variant="outline" className={cn("border-0 px-2.5 py-1 text-xs font-semibold", roleClass[role])}>{role}</Badge></div></header><OperationsWorkspace role={role} view={view} onNavigate={setView} /></main>
  </div></div>;
}

function LoginLanding() { return <div className="relative grid min-h-screen overflow-hidden bg-[#062f22] px-5 py-8 text-white md:place-items-center"><div className="absolute inset-0 opacity-30 app-grid" /><div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.07] shadow-2xl backdrop-blur md:grid-cols-[1.1fr_.9fr]"><section className="p-8 md:p-12"><div className="flex items-center gap-3"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-white p-2"><img src={logoUrl} alt="Tepebaşı Belediyesi" className="h-full w-full object-contain" /></div><div><p className="font-display text-lg font-bold">TEPEBAŞI BELEDİYESİ</p><p className="text-sm text-emerald-200">Temizlik İşleri Müdürlüğü</p></div></div><div className="mt-14"><p className="text-sm font-bold uppercase tracking-[.18em] text-emerald-300">Kapalı operasyon platformu</p><h1 className="mt-3 max-w-xl font-display text-4xl font-extrabold leading-[1.08] md:text-5xl">Atık yönetiminde görünür, izlenebilir ve koordineli çalışma.</h1><p className="mt-5 max-w-lg text-base leading-7 text-emerald-50/75">Mesai, araç, arıza, damperlik atık, konteyner ve vatandaş şikayeti süreçlerini tek ekranda yönetin.</p></div><div className="mt-10 grid gap-3 sm:grid-cols-3"><LandingItem icon={Truck} text="Araç ve mesai" /><LandingItem icon={Map} text="Canlı harita" /><LandingItem icon={FileBarChart} text="Yönetim raporu" /></div></section><section className="flex items-center bg-white p-8 text-slate-900 md:p-12"><div className="w-full"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Settings className="h-6 w-6" /></div><h2 className="mt-6 font-display text-2xl font-bold">Güvenli giriş</h2><p className="mt-2 text-sm leading-6 text-slate-500">Harici giriş kullanılmaz. Hesap bilgileriniz yönetim tarafından tanımlanır.</p><LocalAuthGate /><p className="mt-5 text-center text-xs leading-5 text-slate-400">Hesap oluşturma, rol atama ve silme yetkisi yalnızca yönetimdedir.</p></div></section></div></div>; }
function LandingItem({ icon: Icon, text }: { icon: typeof Truck; text: string }) { return <div className="rounded-xl border border-white/10 bg-white/[.06] p-3 text-sm text-emerald-50"><Icon className="mb-2 h-4 w-4 text-emerald-300" />{text}</div>; }
