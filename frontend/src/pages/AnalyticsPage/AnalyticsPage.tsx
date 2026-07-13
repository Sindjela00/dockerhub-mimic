import { Clock, Search, SlidersHorizontal, X } from "lucide-react";
import type { LogEntry } from "@/services/admin/logs.api";
import { type AccentClass, getAccent } from "@/utils/accentStyle";
import Button from "@/components/Button/Button";
import InputField from "@/components/InputField/InputField";
import Loader from "@/components/Loader/Loader";
import Pagination from "@/components/Pagination/Pagination";
import Table from "@/components/Table/Table";
import { TagComponent } from "@/components/Tag/Tag";
import { useSearchLogs } from "@/services/admin/useSearchLogs/useSearchLogs";
import { useEffect, useRef, useState } from "react";

const LEVELS = [
  "Critical",
  "Error",
  "Warning",
  "Information",
  "Debug",
  "Verbose",
] as const;

const LEVEL_ACCENT: Record<string, AccentClass> = {
  Critical: "danger",
  Error: "danger",
  Warning: "warning",
  Information: "info",
  Debug: "ghost",
  Verbose: "ghost",
};

const DATE_PRESETS = [
  { label: "Last hour", hours: 1 },
  { label: "Last 24h", hours: 24 },
  { label: "Last 7 days", hours: 24 * 7 },
];

const PAGE_SIZE = 10;

function LevelBadge({ level }: { level: string }) {
  const accent = getAccent(LEVEL_ACCENT[level] ?? "ghost");
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${accent.bg} ${accent.text}`}
    >
      {level}
    </span>
  );
}

function LevelToggle({
  level,
  active,
  onToggle,
}: {
  level: string;
  active: boolean;
  onToggle: () => void;
}) {
  const accent = getAccent(LEVEL_ACCENT[level] ?? "ghost");
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={[
        "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer",
        active
          ? `${accent.bg} ${accent.text} ${accent.border}`
          : "bg-bg-elevated text-text-muted border-border hover:text-text-primary hover:border-border-strong",
      ].join(" ")}
    >
      {level}
    </button>
  );
}

function buildSimpleQuery(levels: string[], text: string): string {
  const parts: string[] = [];

  if (levels.length > 0) {
    const levelExpr = levels
      .map((level) => `level:${level.toLowerCase()}`)
      .join(" OR ");
    parts.push(levels.length > 1 ? `(${levelExpr})` : levelExpr);
  }

  const trimmedText = text.trim();
  if (trimmedText) {
    parts.push(`"${trimmedText.replace(/"/g, "")}"`);
  }

  return parts.join(" AND ");
}

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AnalyticsPage() {
  const [levels, setLevels] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [advancedQuery, setAdvancedQuery] = useState("");
  const [page, setPage] = useState(1);

  const { entries, total, loading, error, handleSearch } = useSearchLogs();

  const textTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialFetchDone = useRef(false);

  const clearTextTimeout = () => {
    if (textTimeoutRef.current) clearTimeout(textTimeoutRef.current);
  };

  useEffect(() => {
    return () => clearTextTimeout();
  }, []);

  type Overrides = Partial<{
    levels: string[];
    text: string;
    from: string;
    to: string;
    advanced: boolean;
    advancedQuery: string;
    page: number;
  }>;

  const runSearch = (overrides: Overrides = {}) => {
    const nextLevels = overrides.levels ?? levels;
    const nextText = overrides.text ?? text;
    const nextFrom = overrides.from ?? from;
    const nextTo = overrides.to ?? to;
    const nextAdvanced = overrides.advanced ?? advanced;
    const nextAdvancedQuery = overrides.advancedQuery ?? advancedQuery;
    const nextPage = overrides.page ?? 1;

    const query = nextAdvanced
      ? nextAdvancedQuery
      : buildSimpleQuery(nextLevels, nextText);

    setPage(nextPage);
    handleSearch({
      query,
      from: nextFrom ? new Date(nextFrom).toISOString() : undefined,
      to: nextTo ? new Date(nextTo).toISOString() : undefined,
      page: nextPage,
      pageSize: PAGE_SIZE,
    });
  };

  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearTextTimeout();
    runSearch();
  };

  const toggleLevel = (level: string) => {
    const next = levels.includes(level)
      ? levels.filter((l) => l !== level)
      : [...levels, level];
    setLevels(next);
    runSearch({ levels: next });
  };

  const handleTextChange = (next: string) => {
    setText(next);
    clearTextTimeout();
    textTimeoutRef.current = setTimeout(() => {
      runSearch({ text: next });
    }, 300);
  };

  const handleFromChange = (next: string) => {
    setFrom(next);
    runSearch({ from: next });
  };

  const handleToChange = (next: string) => {
    setTo(next);
    runSearch({ to: next });
  };

  const applyPreset = (hours: number) => {
    const now = new Date();
    const past = new Date(now.getTime() - hours * 60 * 60 * 1000);
    const nextFrom = toDatetimeLocalValue(past);
    const nextTo = toDatetimeLocalValue(now);
    setFrom(nextFrom);
    setTo(nextTo);
    runSearch({ from: nextFrom, to: nextTo });
  };

  const removeLevel = (level: string) => toggleLevel(level);
  const removeText = () => {
    clearTextTimeout();
    setText("");
    runSearch({ text: "" });
  };
  const removeFrom = () => {
    setFrom("");
    runSearch({ from: "" });
  };
  const removeTo = () => {
    setTo("");
    runSearch({ to: "" });
  };

  const clearAll = () => {
    clearTextTimeout();
    setLevels([]);
    setText("");
    setFrom("");
    setTo("");
    setAdvancedQuery("");
    runSearch({ levels: [], text: "", from: "", to: "", advancedQuery: "" });
  };

  const handlePageChange = (nextPage: number) => runSearch({ page: nextPage });

  const hasActiveFilters = advanced
    ? advancedQuery.trim() !== ""
    : levels.length > 0 || text.trim() !== "" || from !== "" || to !== "";

  return (
    <div className="mx-auto flex flex-col gap-6">
      <div className="bg-bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary">Filters</h2>
          <button
            type="button"
            onClick={() => setAdvanced((a) => !a)}
            className="flex items-center gap-1.5 text-xs font-medium text-brand hover:underline cursor-pointer"
          >
            <SlidersHorizontal size={12} />
            {advanced ? "Use simple filters" : "Advanced query"}
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {advanced ? (
            <>
              <InputField
                label="Advanced query"
                value={advancedQuery}
                onChange={setAdvancedQuery}
                placeholder='(level:warning OR level:error) AND "error occured"'
              />
              <p className="text-xs text-text-muted">
                Combine criteria with <code>AND</code>, <code>OR</code>,{" "}
                <code>NOT</code> and parentheses. Filter by level with{" "}
                <code>level:warning</code>, match text with a bare word or a{" "}
                <code>"quoted phrase"</code>.
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-text-primary">
                  Level
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {LEVELS.map((level) => (
                    <LevelToggle
                      key={level}
                      level={level}
                      active={levels.includes(level)}
                      onToggle={() => toggleLevel(level)}
                    />
                  ))}
                </div>
              </div>

              <InputField
                label="Message contains"
                value={text}
                onChange={handleTextChange}
                placeholder="e.g. connection timeout"
                startIcon={<Search size={14} />}
              />
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <InputField
              label="From"
              type="datetime-local"
              value={from}
              onChange={handleFromChange}
              className="flex-1"
            />
            <InputField
              label="To"
              type="datetime-local"
              value={to}
              onChange={handleToChange}
              className="flex-1"
            />
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={loading}
            >
              <Search size={15} />
              Search
            </Button>
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Clock size={12} />
              Quick range:
            </span>
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.hours)}
                className="text-xs px-2 py-1 rounded-md bg-bg-elevated border border-border
                           text-text-secondary hover:text-text-primary hover:border-border-strong
                           transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </form>

        {error && <p className="text-xs text-danger mt-3">{error}</p>}

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-4 border-t border-border">
            <span className="text-xs text-text-muted">Active filters:</span>

            {advanced ? (
              <TagComponent accentClass="ghost">
                Advanced: {advancedQuery}
              </TagComponent>
            ) : (
              <>
                {levels.map((level) => (
                  <TagComponent
                    key={level}
                    accentClass={LEVEL_ACCENT[level] ?? "ghost"}
                    clickable
                    onClick={() => removeLevel(level)}
                  >
                    {level}
                    <X size={10} />
                  </TagComponent>
                ))}
                {text.trim() && (
                  <TagComponent
                    accentClass="ghost"
                    clickable
                    onClick={removeText}
                  >
                    "{text.trim()}"
                    <X size={10} />
                  </TagComponent>
                )}
                {from && (
                  <TagComponent
                    accentClass="ghost"
                    clickable
                    onClick={removeFrom}
                  >
                    From {new Date(from).toLocaleString()}
                    <X size={10} />
                  </TagComponent>
                )}
                {to && (
                  <TagComponent
                    accentClass="ghost"
                    clickable
                    onClick={removeTo}
                  >
                    To {new Date(to).toLocaleString()}
                    <X size={10} />
                  </TagComponent>
                )}
              </>
            )}

            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-text-muted hover:text-danger ml-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="bg-bg-surface border border-border rounded-xl p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-text-primary">
          Results {total > 0 && `(${total})`}
        </h2>

        {loading ? (
          <Loader />
        ) : (
          <Table<LogEntry>
            columns={[
              {
                key: "timestamp",
                header: "Timestamp",
                width: "w-48",
                render: (entry) => new Date(entry.timestamp).toLocaleString(),
              },
              {
                key: "level",
                header: "Level",
                width: "w-28",
                render: (entry) => <LevelBadge level={entry.level} />,
              },
              {
                key: "message",
                header: "Message",
                render: (entry) => (
                  <span className="break-words">{entry.message}</span>
                ),
              },
            ]}
            data={entries}
            rowKey={(entry) => `${entry.timestamp}-${entry.message}`}
            emptyText="No log entries found. Try adjusting your filters."
          />
        )}

        {!loading && total > 0 && (
          <Pagination
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            onChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
