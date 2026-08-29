import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

export default function LocalAuthGate() {
  return <LoginForm />;
}

function InitialAdminForm() {
  const [form, setForm] = useState({ name: "Batuhan Özdemir", username: "admin", password: "" });
  const createAdmin = trpc.auth.createInitialAdmin.useMutation({
    onSuccess: () => {
      toast.success("İlk sistem yöneticisi hesabı oluşturuldu.");
      window.location.reload();
    },
    onError: error => toast.error(error.message),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    createAdmin.mutate(form);
  };

  return (
    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-3">
      <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
        <ShieldCheck className="h-5 w-5 text-emerald-700" />
        <span>İlk Yönetim Hesabını Oluştur</span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">
        Veritabanı yeni oluşturuldu. Sisteme giriş yapmak için ilk Ana Yönetici hesabını tanımlayın.
      </p>

      <form className="space-y-3 pt-2 text-slate-900" onSubmit={submit}>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">Ad Soyad</label>
          <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ad Soyad" />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">Kullanıcı Adı</label>
          <Input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase() })} placeholder="admin" />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">Şifre</label>
          <Input required type="password" minLength={3} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="En az 3 karakter" />
        </div>
        <Button type="submit" disabled={createAdmin.isPending} size="lg" className="w-full bg-emerald-700 font-semibold hover:bg-emerald-800 text-white">
          <UserPlus className="mr-2 h-4 w-4" />
          {createAdmin.isPending ? "Oluşturuluyor..." : "Yöneticiyi Oluştur & Giriş Yap"}
        </Button>
      </form>
    </div>
  );
}

function LoginForm() {
  const [form, setForm] = useState({ username: "", password: "" });
  const login = trpc.auth.login.useMutation({
    onSuccess: () => {
      try {
        localStorage.setItem("tepebasi_app_view", "dashboard");
      } catch {}
      window.location.href = "/";
    },
    onError: error => toast.error(error.message),
  });



  const submit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate(form);
  };

  return (
    <form className="mt-5 sm:mt-6 space-y-3.5" onSubmit={submit}>
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
          Kullanıcı Adı
        </label>
        <Input
          required
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value.toLowerCase() })}
          placeholder="Kullanıcı adınızı girin"
          autoComplete="username"
          className="h-11 text-sm bg-slate-50 border-slate-200 focus:bg-white transition"
        />
      </div>
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
          Şifre
        </label>
        <Input
          required
          type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          placeholder="Şifrenizi girin"
          autoComplete="current-password"
          className="h-11 text-sm bg-slate-50 border-slate-200 focus:bg-white transition"
        />
      </div>
      <Button
        type="submit"
        disabled={login.isPending}
        size="lg"
        className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md active:scale-98 transition rounded-xl"
      >
        <KeyRound className="mr-2 h-4 w-4" />
        {login.isPending ? "Giriş yapılıyor..." : "Sisteme Giriş Yap"}
      </Button>
    </form>
  );
}

