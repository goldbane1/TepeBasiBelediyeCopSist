import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast !opacity-100 !bg-slate-900 !text-white !border !border-slate-700 !shadow-2xl font-sans text-sm rounded-xl py-3.5 px-4.5 font-medium tracking-normal",
          description: "!text-slate-200 !opacity-100",
          actionButton:
            "!bg-emerald-600 !text-white font-bold px-3 py-1.5 rounded-lg",
          cancelButton:
            "!bg-slate-800 !text-slate-200 font-semibold px-3 py-1.5 rounded-lg",
          success:
            "!bg-[#064e3b] !text-white !border-emerald-500 !shadow-2xl !opacity-100 font-semibold",
          error:
            "!bg-[#7f1d1d] !text-white !border-red-500 !shadow-2xl !opacity-100 font-semibold",
          warning:
            "!bg-[#78350f] !text-white !border-amber-500 !shadow-2xl !opacity-100 font-semibold",
          info:
            "!bg-[#0c4a6e] !text-white !border-sky-500 !shadow-2xl !opacity-100 font-semibold",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

