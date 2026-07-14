import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

import Button from "@/components/Button/Button";

interface ErrorPageProps {
  title?: string;
  message?: string;
  onBack?: () => void;
  onRetry?: () => void;
}

export default function ErrorPage({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onBack,
  onRetry,
}: ErrorPageProps) {
  return (
    <div className="page-wrapper items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-danger-muted border border-danger/20 flex items-center justify-center">
          <AlertTriangle size={28} className="text-danger" />
        </div>

        {/* Text */}
        <div className="flex flex-col gap-2">
          <h2 className="text-text-primary">{title}</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        {(onBack || onRetry) && (
          <div className="flex items-center gap-3">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft size={13} />
                Go back
              </Button>
            )}
            {onRetry && (
              <Button variant="primary" size="sm" onClick={onRetry}>
                <RefreshCw size={13} />
                Try again
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
