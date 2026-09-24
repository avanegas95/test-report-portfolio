import { useCallback, useId, useState, type ReactNode } from "react";
import {
  statusBgClass,
  statusDotClass,
  statusLabel,
  type Status,
} from "@/lib/status";

interface TestCaseRowProps {
  id: string;
  title: string;
  area: string;
  status: Status;
  defaultOpen?: boolean;
  children: ReactNode;
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-[9px] py-[3px] font-mono text-badge font-semibold uppercase tracking-badge ${statusBgClass(status)}`}
    >
      <span
        className={`size-1.5 shrink-0 rounded-full ${statusDotClass(status)}`}
        aria-hidden="true"
      />
      {statusLabel(status)}
    </span>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`size-[18px] motion-reduce:transition-none ${open ? "rotate-0 text-info" : "-rotate-90 text-faint"} transition-transform duration-200`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

const rowGrid =
  "grid w-full grid-cols-1 gap-2 px-5 py-4 text-left md:grid-cols-[112px_minmax(0,1fr)_150px_96px_24px] md:items-center md:gap-4 md:px-7 md:py-0 md:min-h-[60px]";

export default function TestCaseRow({
  id,
  title,
  area,
  status,
  defaultOpen = false,
  children,
}: TestCaseRowProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const headerId = `${id}-header`;
  const panelId = `story-${id}`;
  const mobileSummaryId = useId();

  const toggle = useCallback(() => {
    setIsOpen((open) => !open);
  }, []);

  return (
    <div className="test-case-row border-t border-rule-soft">
      <button
        type="button"
        id={headerId}
        className={`${rowGrid} ${
          isOpen
            ? "bg-info-surface shadow-[inset_3px_0_0_0_var(--color-info-dot)]"
            : "bg-paper"
        }`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-describedby={mobileSummaryId}
        onClick={toggle}
      >
        <span
          className={`font-mono text-[13px] ${isOpen ? "font-semibold text-info" : "text-muted"}`}
        >
          {id}
        </span>
        <span
          className={`text-row-title-m md:text-row-title ${isOpen ? "font-semibold" : "font-medium"}`}
        >
          <span
            id={mobileSummaryId}
            className="font-mono text-xs text-muted md:hidden"
          >
            {id} · {area} ·{" "}
          </span>
          {title}
        </span>
        <span className="hidden font-mono text-xs text-text-2 md:block">
          {area}
        </span>
        <span className="justify-self-start">
          <StatusBadge status={status} />
        </span>
        <span className="hidden justify-self-end md:block">
          <ChevronIcon open={isOpen} />
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        hidden={!isOpen}
      >
        {children}
      </div>
    </div>
  );
}
