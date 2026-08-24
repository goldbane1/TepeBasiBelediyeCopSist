import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, X, Smartphone, PlusSquare, Sparkles } from "lucide-react";
import tepebasiLogo from "../../Logo/TepeBasi.png";
import { triggerHaptic } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Eğer uygulama zaten tam ekran standalone (ana ekrandan) açıldıysa gösterme
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // Kullanıcı daha önce "Daha Sonra" dediyse 2 gün boyunca sorma
    const dismissedAt = localStorage.getItem("tepebasi_pwa_dismissed");
    if (dismissedAt) {
      const daysSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 2) return;
    }

    // iOS kontrolü
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIosDevice(isIos);

    // Android & Chrome: beforeinstallprompt dinleyicisi
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // iOS cihazlarda 2.5 saniye sonra şık bir davet göster
    let iosTimer: NodeJS.Timeout;
    if (isIos) {
      iosTimer = setTimeout(() => {
        setShowPrompt(true);
      }, 2500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    triggerHaptic("success");
    if (deferredPrompt) {
      // Android / Chrome doğal yükleme iletişim kutusu
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // iOS ve diğer tarayıcılar için adım adım rehberi aç
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    triggerHaptic("light");
    setShowPrompt(false);
    setShowIosGuide(false);
    localStorage.setItem("tepebasi_pwa_dismissed", Date.now().toString());
  };



  if (!showPrompt) return null;

  return (
    <>
      {/* Alt Sabit Bildirim Kartı */}
      <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="rounded-2xl border border-emerald-500/30 bg-[#083d2d] p-4 text-white shadow-2xl shadow-emerald-950/60 backdrop-blur-md">
          <div className="flex items-start gap-3">
            {/* Logo */}
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white p-1 ring-2 ring-emerald-400/30 shadow-md">
              <img src={tepebasiLogo} alt="Tepebaşı" className="h-full w-full object-contain" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Uygulama Olarak Kullan
                </span>
              </div>
              <h3 className="font-display text-sm font-bold text-white mt-1 leading-tight">
                Tepebaşı Temizlik'i Ana Ekrana Ekle
              </h3>
              <p className="mt-0.5 text-xs text-emerald-100/80 leading-snug">
                Adres yazmadan tek tıkla açın, tam ekran ve kesintisiz çalışın.
              </p>

              {/* Butonlar */}
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs h-8 px-3.5 rounded-xl shadow-md active:scale-95 transition"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5 stroke-[2.5]" />
                  {isIosDevice ? "Nasıl Eklenir?" : "Ana Ekrana Ekle"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-emerald-200/80 hover:text-white hover:bg-white/10 text-xs h-8 px-2.5 rounded-xl"
                >
                  Daha Sonra
                </Button>
              </div>
            </div>

            {/* Kapat Butonu */}
            <button
              onClick={handleDismiss}
              className="text-emerald-300/60 hover:text-white rounded-lg p-1 transition"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS İçin Adım Adım Resimli Rehber Modalı */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-white/20 bg-[#083d2d] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800/60">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-emerald-400" />
                <h3 className="font-display text-base font-bold text-white">iPhone'a Yükleme Rehberi</h3>
              </div>
              <button onClick={() => setShowIosGuide(false)} className="rounded-lg p-1 text-emerald-200 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-emerald-100">
              <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-emerald-500 font-bold text-emerald-950">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white">Paylaş Butonuna Basın</p>
                  <p className="text-emerald-200/80 mt-0.5 flex items-center gap-1">
                    Safari'nin alt menüsündeki <Share className="inline h-3.5 w-3.5 text-emerald-300" /> (kare içindeki yukarı ok) simgesine dokunun.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-emerald-500 font-bold text-emerald-950">
                  2
                </div>
                <div>
                  <p className="font-semibold text-white">"Ana Ekrana Ekle"yi Seçin</p>
                  <p className="text-emerald-200/80 mt-0.5 flex items-center gap-1">
                    Açılan menüde aşağı kaydırıp <PlusSquare className="inline h-3.5 w-3.5 text-emerald-300" /> <strong>"Ana Ekrana Ekle"</strong> butonuna basın.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-emerald-500 font-bold text-emerald-950">
                  3
                </div>
                <div>
                  <p className="font-semibold text-white">"Ekle" Butonuna Dokunun</p>
                  <p className="text-emerald-200/80 mt-0.5">
                    Sağ üstteki <strong>"Ekle"</strong> butonuna bastığınızda uygulama logonuz ana ekranınıza eklenecektir.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <Button
                onClick={() => {
                  setShowIosGuide(false);
                  setShowPrompt(false);
                  localStorage.setItem("tepebasi_pwa_dismissed", Date.now().toString());
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs h-10 rounded-xl"
              >
                Anladım, Teşekkürler 👍
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
