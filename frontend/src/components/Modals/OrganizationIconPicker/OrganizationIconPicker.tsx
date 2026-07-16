import { ImagePlus } from "lucide-react";
import { useEffect, useState } from "react";

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

export interface OrganizationAvatarInput {
  file: File | null;
  url?: string;
}

interface OrganizationIconPickerProps {
  currentAvatarUrl?: string | null;
  disabled?: boolean;
  onChange: (value: OrganizationAvatarInput) => void;
}

export default function OrganizationIconPicker({
  currentAvatarUrl,
  disabled = false,
  onChange,
}: OrganizationIconPickerProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [urlValue, setUrlValue] = useState(currentAvatarUrl || "");
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const switchMode = (next: "upload" | "url") => {
    if (next === mode) return;
    setMode(next);
    setError(undefined);
    if (next === "upload") {
      onChange({ file, url: undefined });
    } else {
      onChange({ file: null, url: urlValue.trim() || undefined });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (!selected) return;

    if (!ALLOWED_AVATAR_TYPES.includes(selected.type)) {
      setError("Icon must be a PNG, JPEG, GIF, or WEBP image.");
      return;
    }
    if (selected.size > MAX_AVATAR_SIZE_BYTES) {
      setError("Icon must not exceed 5 MB.");
      return;
    }

    setError(undefined);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFile(selected);
    setFilePreview(URL.createObjectURL(selected));
    onChange({ file: selected, url: undefined });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrlValue(value);
    const trimmed = value.trim();

    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      setError("Icon URL must start with http:// or https://");
      return;
    }

    setError(undefined);
    onChange({ file: null, url: trimmed || undefined });
  };

  const previewSrc =
    mode === "upload"
      ? filePreview || currentAvatarUrl
      : urlValue.trim() || currentAvatarUrl;

  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1.5">
        Organization icon
      </label>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-14 h-14 min-w-[56px] rounded-2xl bg-brand-muted border border-brand/20 overflow-hidden flex items-center justify-center">
          {previewSrc ? (
            <img
              src={previewSrc}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <ImagePlus size={20} className="text-text-muted" />
          )}
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => switchMode("upload")}
            disabled={disabled}
            className={[
              "px-3 py-1.5 transition-colors",
              mode === "upload"
                ? "bg-brand-muted text-brand font-medium"
                : "text-text-muted hover:text-text-primary",
            ].join(" ")}
          >
            Upload file
          </button>
          <button
            type="button"
            onClick={() => switchMode("url")}
            disabled={disabled}
            className={[
              "px-3 py-1.5 border-l border-border transition-colors",
              mode === "url"
                ? "bg-brand-muted text-brand font-medium"
                : "text-text-muted hover:text-text-primary",
            ].join(" ")}
          >
            Paste URL
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        <label className="cursor-pointer text-xs font-medium text-brand hover:underline">
          Choose file
          <input
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
        </label>
      ) : (
        <input
          type="url"
          value={urlValue}
          onChange={handleUrlChange}
          placeholder="https://example.com/icon.png"
          disabled={disabled}
          autoComplete="off"
          className="w-full px-3 py-2 bg-bg-surface border border-border rounded-lg text-text-primary text-sm placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
        />
      )}

      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
