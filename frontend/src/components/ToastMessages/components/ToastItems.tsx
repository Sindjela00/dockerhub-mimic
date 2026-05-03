// ToastItem.tsx

import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { Toast, ToastType } from "../types/types";

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const styles: Record<ToastType, { container: string; icon: React.ReactNode }> =
  {
    success: {
      container: "bg-bg-surface border-green-500/30 text-green-400",
      icon: <CheckCircle size={15} className="text-green-400 shrink-0" />,
    },
    error: {
      container: "bg-bg-surface border-red-500/30 text-red-400",
      icon: <AlertCircle size={15} className="text-red-400 shrink-0" />,
    },
    warning: {
      container: "bg-bg-surface border-yellow-500/30 text-yellow-400",
      icon: <AlertTriangle size={15} className="text-yellow-400 shrink-0" />,
    },
    info: {
      container: "bg-bg-surface border-blue-500/30 text-blue-400",
      icon: <Info size={15} className="text-blue-400 shrink-0" />,
    },
  };

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { container, icon } = styles[toast.type];

  return (
    <div
      className={[
        "pointer-events-auto flex items-center gap-3 px-4 py-3",
        "rounded-lg border shadow-lg min-w-[280px] max-w-[380px]",
        "animate-in fade-in slide-in-from-top-2 duration-200",
        container,
      ].join(" ")}
    >
      {icon}
      <p className="text-sm flex-1 text-text-primary">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-text-muted hover:text-text-primary transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}
