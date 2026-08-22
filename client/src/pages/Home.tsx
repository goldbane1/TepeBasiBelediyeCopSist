import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import OperationsWorkspace, { type AppView } from "@/components/OperationsWorkspace";
import LocalAuthGate from "@/components/LocalAuthGate";
import { AlertTriangle, Archive, ClipboardCheck, FileBarChart, LayoutDashboard, LogOut, Map, MapPin, Menu, Recycle, Settings, Truck, UserCog, Wrench, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import tepebasiLogo from "../../Logo/TepeBasi.png";

export type Role = "şoför" | "kademe personeli" | "kaynak personeli" | "yönetim";

interface NavItem {
  id: AppView;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const allNavItems: NavItem[] = [
  { id: "dashboard", label: "Operasyon Özeti", icon: LayoutDashboard, roles: ["şoför", "kademe personeli", "kaynak personeli", "yönetim"] },
  { id: "mesai", label: "Mesai Yönetimi", icon: ClipboardCheck, roles: ["şoför", "yönetim"] },
  { id: "harita", label: "Operasyon Haritası", icon: Map, roles: ["şoför", "kademe personeli", "kaynak personeli", "yönetim"] },
  { id: "damperlik-çözüm", label: "Damperlik Atık Çözümü", icon: Archive, roles: ["şoför", "yönetim"] },
  { id: "konteyner", label: "Konteyner Arıza Çözümü", icon: Recycle, roles: ["şoför", "kaynak personeli", "yönetim"] },
  { id: "şikayetler", label: "Vatandaş Şikayetleri", icon: AlertTriangle, roles: ["şoför", "yönetim"] },
  { id: "araçlar", label: "Araçlar", icon: Truck, roles: ["şoför", "kademe personeli", "yönetim"] },
  { id: "araç-arızaları", label: "Araç Arızaları", icon: Wrench, roles: ["şoför", "kademe personeli", "yönetim"] },
  { id: "mahalleler", label: "Mahalle Yönetimi", icon: MapPin, roles: ["yönetim"] },
  { id: "raporlar", label: "Yönetim Raporları & Analiz", icon: FileBarChart, roles: ["yönetim"] },
  { id: "personel", label: "Personel Hesapları", icon: UserCog, roles: ["yönetim"] },
];

function getNavItemsForRole(role: Role): NavItem[] {
  if (role === "şoför") {
    // Şoför için mesai en üstte
    return [
      { id: "dashboard", label: "Operasyon Özeti", icon: LayoutDashboard, roles: ["şoför"] },
      { id: "mesai", label: "Mesai Yönetimi", icon: ClipboardCheck, roles: ["şoför"] },
      { id: "harita", label: "Operasyon Haritası", icon: Map, roles: ["şoför"] },
      { id: "damperlik-çözüm", label: "Damperlik Atık Çözümü", icon: Archive, roles: ["şoför"] },
      { id: "konteyner", label: "Konteyner Arıza Çözümü", icon: Recycle, roles: ["şoför"] },
      { id: "şikayetler", label: "Vatandaş Şikayetleri", icon: AlertTriangle, roles: ["şoför"] },
      { id: "araçlar", label: "Araçlar", icon: Truck, roles: ["şoför"] },
      { id: "araç-arızaları", label: "Araç Arızaları", icon: Wrench, roles: ["şoför"] },
    ];
  }

  // Yönetim ve diğer roller için nizamlı menü düzeni
  return [
    { id: "dashboard", label: "Operasyon Özeti", icon: LayoutDashboard, roles: ["kademe personeli", "kaynak personeli", "yönetim"] },
    { id: "harita", label: "Operasyon Haritası", icon: Map, roles: ["kademe personeli", "kaynak personeli", "yönetim"] },
    { id: "damperlik-çözüm", label: "Damperlik Atık Çözümü", icon: Archive, roles: ["yönetim"] },
    { id: "konteyner", label: "Konteyner Arıza Çözümü", icon: Recycle, roles: ["kaynak personeli", "yönetim"] },
    { id: "şikayetler", label: "Vatandaş Şikayetleri", icon: AlertTriangle, roles: ["yönetim"] },
    { id: "araçlar", label: "Araçlar", icon: Truck, roles: ["kademe personeli", "yönetim"] },
    { id: "araç-arızaları", label: "Araç Arızaları", icon: Wrench, roles: ["kademe personeli", "yönetim"] },
    { id: "mesai", label: "Mesai Yönetimi", icon: ClipboardCheck, roles: ["yönetim"] },
    { id: "mahalleler", label: "Mahalle Yönetimi", icon: MapPin, roles: ["yönetim"] },
    { id: "raporlar", label: "Yönetim Raporları & Analiz", icon: FileBarChart, roles: ["yönetim"] },
    { id: "personel", label: "Personel Hesapları", icon: UserCog, roles: ["yönetim"] },
  ];
}

const roleClass: Record<Role, string> = {
  "şoför": "bg-sky-50 text-sky-700 border-sky-100",
  "kademe personeli": "bg-amber-50 text-amber-700 border-amber-100",
  "kaynak personeli": "bg-violet-50 text-violet-700 border-violet-100",
  "yönetim": "bg-emerald-50 text-emerald-800 border-emerald-100",
};

interface MobileNavItem {
  id: AppView;
  shortLabel: string;
  icon: typeof LayoutDashboard;
}

function getMobileQuickNav(role: Role): MobileNavItem[] {
  if (role === "şoför") {
    return [
      { id: "dashboard", shortLabel: "Özet", icon: LayoutDashboard },
      { id: "mesai", shortLabel: "Mesai", icon: ClipboardCheck },
      { id: "harita", shortLabel: "Harita", icon: Map },
      { id: "şikayetler", shortLabel: "Şikayet", icon: AlertTriangle },
    ];
  }
  if (role === "kademe personeli") {
    return [
      { id: "dashboard", shortLabel: "Özet", icon: LayoutDashboard },
      { id: "araç-arızaları", shortLabel: "Arıza", icon: Wrench },
      { id: "araçlar", shortLabel: "Araçlar", icon: Truck },
      { id: "harita", shortLabel: "Harita", icon: Map },
    ];
  }
  if (role === "kaynak personeli") {
    return [
      { id: "dashboard", shortLabel: "Özet", icon: LayoutDashboard },
      { id: "konteyner", shortLabel: "Konteyner", icon: Recycle },
      { id: "harita", shortLabel: "Harita", icon: Map },
    ];
  }
  // Yönetim
  return [
    { id: "dashboard", shortLabel: "Özet", icon: LayoutDashboard },
    { id: "harita", shortLabel: "Harita", icon: Map },
    { id: "mesai", shortLabel: "Mesai", icon: ClipboardCheck },
    { id: "raporlar", shortLabel: "Raporlar", icon: FileBarChart },
  ];
}

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState<AppView>(() => {
    const requested = new URLSearchParams(window.location.search).get("view") as AppView | null;
    return requested && allNavItems.some(item => item.id === requested) ? requested : "dashboard";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const role = user?.role as Role | undefined;

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7fbf8]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
      </div>
    );
  }

  if (!user || !role) return <LoginLanding />;
  const roleNavItems = getNavItemsForRole(role);
  const current = roleNavItems.find(item => item.id === view) ?? allNavItems.find(item => item.id === view) ?? allNavItems[0];

  return (
    <div className="min-h-screen bg-[#f7fbf8] app-grid">
      <div className="flex min-h-screen">
        {/* Sol Kenar Çubuğu (Sidebar) */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[300px] flex-col border-r border-emerald-950/10 bg-[#083d2d] p-5 text-white shadow-2xl transition-transform duration-200 lg:sticky lg:translate-x-0 pt-safe pb-safe",
            menuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Logo ve Beledi̇ye Başlığı (Büyük başlık + Birleştirilmiş Temizlik İşleri Müdürlüğü) */}
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white p-1.5 shadow-lg shadow-emerald-950/40 ring-2 ring-white/20">
                <img src={tepebasiLogo} alt="Tepebaşı Belediyesi" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-base font-extrabold tracking-wide text-white leading-tight">TEPEBAŞI BELEDİYESİ</h2>
                <p className="mt-0.5 text-xs font-semibold text-emerald-300/95 leading-tight">Temizlik İşleri Müdürlüğü</p>
              </div>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="rounded-xl p-1.5 text-emerald-200 hover:bg-white/10 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 mb-2 border-t border-emerald-800/60 pt-4">
            <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-emerald-300/80">Operasyon Menüsü</p>
          </div>

          {/* Navigasyon Listesi */}
          <nav className="space-y-1.5 overflow-y-auto flex-1 pr-1">
            {roleNavItems
              .filter(item => item.roles.includes(role))
              .map(item => {
                const Icon = item.icon;
                const active = item.id === view;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setView(item.id);
                      setMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3.5 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-950/30"
                        : "text-emerald-100/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
          </nav>

          {/* Kullanıcı Profili ve Oturum Kapatma */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.07] p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-emerald-300/30 shadow-xs">
                <AvatarFallback className="bg-emerald-800 text-xs font-bold text-emerald-50">
                  {user.name?.slice(0, 2).toUpperCase() || "TB"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{user.name || "Kullanıcı"}</p>
                <p className="mt-0.5 truncate text-xs font-medium text-emerald-200/90 capitalize">{role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-emerald-50 transition hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />
              Oturumu kapat
            </button>
          </div>
        </aside>

        {menuOpen && (
          <button
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Menüyü kapat"
          />
        )}


        {/* Sağ Ana İçerik Alanı */}
        <main className="min-w-0 flex-1 p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <header className="sticky top-2 z-30 mb-4 sm:mb-5 flex flex-wrap items-center justify-between gap-2.5 bg-white/85 p-3 sm:p-4 rounded-2xl border border-slate-200/70 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Button
                variant="outline"
                size="icon"
                className="bg-white lg:hidden border-slate-200 text-slate-700 h-9 w-9 shrink-0 shadow-2xs"
                onClick={() => setMenuOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] sm:text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 truncate max-w-[200px] sm:max-w-none">
                    TEPEBAŞI BELEDİYESİ
                  </span>
                  <Badge variant="outline" className={cn("sm:hidden border px-1.5 py-0.2 text-[9px] font-bold rounded-md capitalize", roleClass[role])}>
                    {role}
                  </Badge>
                </div>
                <h1 className="font-display text-lg sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
                  {current.label}
                </h1>
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70">
                📅 {new Intl.DateTimeFormat("tr-TR", { dateStyle: "full" }).format(new Date())}
              </span>
              <Badge variant="outline" className={cn("border px-3 py-1.5 text-xs font-bold rounded-xl shadow-2xs", roleClass[role])}>
                👤 {role.toUpperCase()}
              </Badge>
            </div>
          </header>

          <div key={view} className="view-transition">
            <OperationsWorkspace role={role} view={view} onNavigate={setView} />
          </div>
        </main>

        {/* Mobil iOS / Android Alt Hızlı Erişim Çubuğu (Bottom Navigation Bar) */}
        <nav
          aria-label="Mobil Hızlı Menü"
          className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1 flex items-center justify-around lg:hidden pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        >
          {getMobileQuickNav(role).map(item => {
            const Icon = item.icon;
            const active = item.id === view;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setView(item.id);
                  setMenuOpen(false);
                }}
                className={cn(
                  "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[54px]",
                  active ? "text-emerald-700 font-bold" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <div className={cn("p-1 rounded-xl transition", active && "bg-emerald-50 text-emerald-700 shadow-2xs")}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5">{item.shortLabel}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all min-w-[54px] text-slate-500 hover:text-slate-900"
          >
            <div className="p-1 rounded-xl">
              <Menu className="h-5 w-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Tüm Menü</span>
          </button>
        </nav>
      </div>
    </div>
  );
}


function LoginLanding() {
  return (
    <div className="relative grid min-h-screen overflow-hidden bg-[#062f22] px-4 py-6 text-white md:px-5 md:py-8 md:place-items-center">
      <div className="absolute inset-0 opacity-30 app-grid" />
      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl md:rounded-[2.5rem] border border-white/10 bg-white/[.07] shadow-2xl backdrop-blur-md md:grid-cols-[1.1fr_.9fr]">
        <section className="p-6 sm:p-8 md:p-12">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="grid h-16 w-16 sm:h-20 sm:w-20 shrink-0 place-items-center rounded-2xl bg-white p-2 sm:p-2.5 shadow-xl shadow-emerald-950/40">
              <img src={tepebasiLogo} alt="Tepebaşı Belediyesi" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-black tracking-wide text-white">TEPEBAŞI BELEDİYESİ</h1>
              <p className="text-sm sm:text-base font-bold text-emerald-200/90 mt-0.5">Temizlik İşleri Müdürlüğü</p>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 md:mt-12">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-300">Operasyon Yönetim Sistemi</p>
            <h2 className="mt-2.5 max-w-xl font-display text-2xl sm:text-3xl md:text-5xl font-extrabold leading-[1.15]">
              Atık yönetiminde görünür, izlenebilir ve koordineli çalışma.
            </h2>
            <p className="mt-3 sm:mt-4 max-w-lg text-xs sm:text-sm md:text-base leading-relaxed text-emerald-50/80">
              Mesai, araç, arıza, damperlik atık, konteyner ve vatandaş şikayeti süreçlerini tek ekranda yönetin.
            </p>
          </div>
        </section>
        <section className="flex items-center bg-white p-6 sm:p-8 md:p-12 text-slate-900">
          <div className="w-full">
            <div className="grid h-11 w-11 sm:h-12 sm:w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h2 className="mt-4 sm:mt-6 font-display text-xl sm:text-2xl font-bold">Güvenli giriş</h2>
            <p className="mt-1.5 text-xs sm:text-sm leading-5 sm:leading-6 text-slate-500">
              Harici giriş kullanılmaz. Hesap bilgileriniz yönetim tarafından tanımlanır.
            </p>
            <LocalAuthGate />
            <p className="mt-5 text-center text-xs leading-5 text-slate-400 font-medium">
              Şifrenizi unuttuysanız lütfen sistem yöneticisi ile iletişime geçiniz.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

