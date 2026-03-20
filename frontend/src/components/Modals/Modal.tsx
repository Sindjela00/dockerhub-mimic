import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import Button from "../Button/Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 cursor-pointer"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={[
          "relative w-full z-10",
          "bg-bg-surface border border-border rounded-xl",
          "shadow-2xl",
          maxWidth,
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2
            id="modal-title"
            className="text-sm font-semibold text-text-primary"
          >
            {title}
          </h2>
          <Button
            size="xs"
            onClick={onClose}
            aria-label="Close modal"
            className="p-0 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
