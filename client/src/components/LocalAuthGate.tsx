import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { KeyRound, LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

export default function LocalAuthGate() {
  const status = trpc.auth.setupStatus.useQuery(undefined, { retry: false });
  if (status.isLoading) return <div className="mt-8 h-11 animate-pulse rounded-xl bg-slate-100" />;
  if (!status.data?.ready) return <div className="mt-7 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-800"><LockKeyhole className="mb-2 h-5 w-5" /><p className="font-semibold">Yönetim hesabı gerekli</p><p className="mt-1">İlk yerel yönetim hesabı sistem yöneticisi tarafından tanımlanmalıdır. Bu ekrandan anonim hesap oluşturulamaz.</p></div>;
  return <LoginForm />;
}

function LoginForm() {
  const [form, setForm] = useState({ username: "", password: "" });
  const login = trpc.auth.login.useMutation({
    onSuccess: () => { window.location.reload(); },
    onError: error => toast.error(error.message),
  });
  const submit = (event: FormEvent) => { event.preventDefault(); login.mutate(form); };
  return <form className="mt-7 space-y-3" onSubmit={submit}><Input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase() })} placeholder="Kullanıcı adı" autoComplete="username" /><Input required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Şifre" autoComplete="current-password" /><Button type="submit" disabled={login.isPending} size="lg" className="w-full bg-emerald-700 font-semibold hover:bg-emerald-800"><KeyRound className="mr-2 h-4 w-4" />Giriş yap</Button></form>;
}
