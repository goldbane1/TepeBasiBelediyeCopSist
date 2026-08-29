import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import OperationsWorkspace, { type AppView } from "@/components/OperationsWorkspace";
import LocalAuthGate from "@/components/LocalAuthGate";
import { AlertTriangle, Archive, ClipboardCheck, FileBarChart, LayoutDashboard, LogOut, Map, MapPin, Menu, Recycle, RefreshCw, Settings, Truck, UserCog, Wrench, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { cn, triggerHaptic } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
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
    // Şoför için sadeleştirilmiş ve doğrudan başlıklar
    return [
      { id: "dashboard", label: "Operasyon Özeti", icon: LayoutDashboard, roles: ["şoför"] },
      { id: "mesai", label: "Mesai Başla/Bitir", icon: ClipboardCheck, roles: ["şoför"] },
      { id: "harita", label: "Operasyon Haritası", icon: Map, roles: ["şoför"] },
      { id: "damperlik-çözüm", label: "Damperlik Atık Bildir", icon: Archive, roles: ["şoför"] },
      { id: "konteyner", label: "Arızalı Konteyner Bildir", icon: Recycle, roles: ["şoför"] },
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [view, setView] = useState<AppView>(() => {
    if (typeof window !== "undefined") {
      const requested = new URLSearchParams(window.location.search).get("view") as AppView | null;
      const stored = localStorage.getItem("tepebasi_app_view") as AppView | null;
      const initial = requested || stored;
      if (initial && allNavItems.some(item => item.id === initial)) {
        return initial;
      }
    }
    return "dashboard";
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const role = user?.role as Role | undefined;

  const handleSetView = (newView: AppView) => {
    setView(newView);
    try {
      localStorage.setItem("tepebasi_app_view", newView);
      const url = new URL(window.location.href);
      url.searchParams.set("view", newView);
      window.history.replaceState({}, "", url.toString());
    } catch {}
  };

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
          {/* Logo ve Beledi̇ye Başlığı */}
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-3">
              <div className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-white p-2 shadow-lg shadow-emerald-950/40 ring-2 ring-white/20">
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


          {/* Aktif Oturum, Profil & Çıkış Kartı */}
          <div className="mt-3.5 rounded-2xl border border-white/15 bg-white/[.08] p-2.5 backdrop-blur-sm shadow-inner">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setProfileOpen(true)}
                className="flex items-center gap-2.5 min-w-0 flex-1 text-left rounded-xl p-1 hover:bg-white/10 transition group"
                title="Profil ve Şifre Düzenle"
              >
                <Avatar className="h-8 w-8 shrink-0 border border-emerald-300/40 shadow-xs group-hover:border-emerald-300">
                  <AvatarFallback className="bg-emerald-800 text-[11px] font-bold text-emerald-50">
                    {user.name?.slice(0, 2).toUpperCase() || "TB"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white leading-snug group-hover:text-emerald-200 transition">
                    {user.name || "Kullanıcı"}
                  </p>
                  <p className="truncate text-[10px] font-semibold text-emerald-300 capitalize leading-none flex items-center gap-1">
                    <span>{role}</span>
                    <span className="text-[9px] opacity-70 underline">⚙️ Şifre Değiştir</span>
                  </p>
                </div>
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-red-500/80 px-2.5 py-1.5 text-[11px] font-semibold text-white transition shadow-2xs shrink-0 active:scale-95 border border-white/10"
                title="Oturumu Kapat"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Çıkış</span>
              </button>
            </div>
          </div>

          <div className="mt-3.5 mb-1.5 border-t border-emerald-800/60 pt-2.5">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-emerald-300/80">Operasyon Menüsü</p>
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
                      handleSetView(item.id);
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
        </aside>

        {/* Profil & Şifre Değiştirme Modalı */}
        {profileOpen && (
          <UserProfileModal
            currentUser={user}
            onClose={() => setProfileOpen(false)}
          />
        )}



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

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2.5 sm:flex">
                <span className="text-xs font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/70">
                  📅 {new Intl.DateTimeFormat("tr-TR", { dateStyle: "full" }).format(new Date())}
                </span>
                <Badge variant="outline" className={cn("border px-3 py-1.5 text-xs font-bold rounded-xl shadow-2xs", roleClass[role])}>
                  👤 {role.toUpperCase()}
                </Badge>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.reload();
                }}
                className="rounded-xl border-slate-200 text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 text-xs font-semibold h-8.5 px-2.5 sm:px-3 shadow-2xs flex items-center gap-1.5 active:scale-95 transition"
                title="Tüm verileri ve sayfayı yenile"
              >
                <RefreshCw className="h-3.5 w-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Yenile</span>
              </Button>
            </div>
          </header>


          <div key={view} className="view-transition">
            <OperationsWorkspace role={role} view={view} onNavigate={handleSetView} />
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
                  handleSetView(item.id);
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


function UserProfileModal({ currentUser, onClose }: { currentUser: any; onClose: () => void }) {
  const [name, setName] = useState(currentUser.name || "");
  const [username, setUsername] = useState(currentUser.username || "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const updateProfile = trpc.operations.users.updateMyProfile.useMutation({
    onSuccess: () => {
      triggerHaptic("success");
      toast.success("Profil ve hesap bilgileriniz başarıyla güncellendi.");
      onClose();
      setTimeout(() => window.location.reload(), 500);
    },
    onError: e => {
      triggerHaptic("warning");
      toast.error(e.message);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password && password.length < 3) {
      return toast.error("Şifre en az 3 karakter olmalıdır.");
    }
    if (password && password !== passwordConfirm) {
      return toast.error("Girdiğiniz yeni şifreler birbiriyle eşleşmiyor.");
    }
    updateProfile.mutate({
      name: name.trim() || undefined,
      username: username.trim() || undefined,
      password: password.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 text-slate-900 shadow-2xl border border-slate-200 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">Profil & Şifre Düzenle</h3>
              <p className="text-xs text-slate-500">Hesap bilgilerinizi güncelleyin</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
              Ad Soyad
            </label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Adınız Soyadınız"
              className="h-10 text-sm"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
              Kullanıcı Adı (Giriş İçin)
            </label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase())}
              placeholder="kullanıcı adı"
              className="h-10 text-sm"
              required
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
              Yeni Şifre (Değiştirmek İstemiyorsanız Boş Bırakın)
            </label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Yeni şifrenizi girin..."
              className="h-10 text-sm"
            />
          </div>

          {password && (
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Yeni Şifre Tekrar
              </label>
              <Input
                type="password"
                value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                placeholder="Yeni şifreyi tekrar yazın..."
                className="h-10 text-sm"
              />
            </div>
          )}

          <div className="pt-3 flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="text-xs h-10 px-4">
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={updateProfile.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-10 font-bold px-5"
            >
              {updateProfile.isPending ? "Kaydediliyor..." : "Bilgileri Kaydet"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoginLanding() {
  return (
    <div className="relative grid min-h-screen overflow-hidden bg-[#062f22] px-3.5 py-6 text-white sm:px-6 md:px-8 place-items-center">
      <div className="absolute inset-0 opacity-25 app-grid pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl sm:rounded-[2.5rem] border border-white/15 bg-white/[.08] shadow-2xl shadow-emerald-950/80 backdrop-blur-xl md:grid md:grid-cols-[1.05fr_.95fr]">
        {/* Sol / Üst Tanıtım Bölümü */}
        <section className="p-6 sm:p-8 md:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10">
          <div>
            <div className="flex items-center gap-3.5">
              <div className="grid h-14 w-14 sm:h-16 sm:w-16 shrink-0 place-items-center rounded-2xl bg-white p-2.5 shadow-xl shadow-emerald-950/40 ring-2 ring-white/25">
                <img src={tepebasiLogo} alt="Tepebaşı Belediyesi" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="font-display text-base sm:text-xl font-extrabold tracking-wide text-white leading-tight">
                  TEPEBAŞI BELEDİYESİ
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-emerald-300 mt-0.5">
                  Temizlik İşleri Müdürlüğü
                </p>
              </div>
            </div>

            <div className="mt-6 sm:mt-8">
              <span className="inline-block rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                Saha Operasyon Sistemi
              </span>
              <h2 className="mt-2.5 font-display text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-snug">
                Atık ve Saha Operasyon Yönetimi
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                Vardiya, araç arızaları, damperlik atıklar, konteynerler ve şikayetlerin tek merkezden yönetimi.
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pt-6 text-[11px] text-emerald-300/70 border-t border-white/10 mt-6">
            <span>🛡️ Tepebaşı Belediyesi Bilgi İşlem Altyapısı</span>
          </div>
        </section>

        {/* Sağ / Alt Giriş Kartı */}
        <section className="flex items-center bg-white p-6 sm:p-8 md:p-10 text-slate-900">
          <div className="w-full">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-2xs">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900">Sisteme Giriş</h3>
                <p className="text-xs text-slate-500">Personel / Yönetim Hesabı</p>
              </div>
            </div>

            <LocalAuthGate />

            <p className="mt-4 text-center text-[11px] text-slate-500 font-medium leading-relaxed">
              İlk hesap tanımlamanız yönetim tarafından yapılır. Giriş yaptıktan sonra şifrenizi sol menüden profilinizden değiştirebilirsiniz.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}



