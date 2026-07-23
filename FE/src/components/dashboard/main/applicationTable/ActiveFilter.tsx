import { Check, Columns3, Search, Table2 } from "lucide-react";
import { createPortal } from "react-dom";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { COLUMN_OPTIONS, DEFAULT_COLUMNS } from "../../../../types/application";


interface PortalTooltipProps {
  label: string;
  children: ReactNode;
  preferredSide?: "top" | "bottom";
}

function PortalTooltip({
  label,
  children,
  preferredSide = "bottom",
}: PortalTooltipProps) {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, ready: false });

  const updatePosition = () => {
    const anchor = anchorRef.current;
    const tooltip = tooltipRef.current;
    if (!anchor || !tooltip) return;

    const viewportPadding = 8;
    const gap = 6;
    const anchorRect = anchor.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const bottomTop = anchorRect.bottom + gap;
    const topTop = anchorRect.top - tooltipRect.height - gap;
    const canUseBottom =
      bottomTop + tooltipRect.height <= window.innerHeight - viewportPadding;
    const canUseTop = topTop >= viewportPadding;

    let top =
      preferredSide === "top"
        ? canUseTop
          ? topTop
          : bottomTop
        : canUseBottom
          ? bottomTop
          : topTop;

    top = Math.min(
      Math.max(viewportPadding, top),
      window.innerHeight - tooltipRect.height - viewportPadding,
    );

    const centeredLeft =
      anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
    const left = Math.min(
      Math.max(viewportPadding, centeredLeft),
      window.innerWidth - tooltipRect.width - viewportPadding,
    );

    setPosition({ top, left, ready: true });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, label, preferredSide]);

  useEffect(() => {
    if (!open) return;

    const handleReposition = () => updatePosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  return (
    <>
      <span
        ref={anchorRef}
        className="inline-flex"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocusCapture={() => setOpen(true)}
        onBlurCapture={() => setOpen(false)}
      >
        {children}
      </span>

      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className="pointer-events-none fixed z-[10050] whitespace-nowrap rounded bg-[#1F2937] px-2 py-1 text-[12px] font-semibold leading-[1.4] text-white shadow-lg"
            style={{
              top: position.top,
              left: position.left,
              visibility: position.ready ? "visible" : "hidden",
            }}
          >
            {label}
          </div>,
          document.body,
        )}
    </>
  );
}

interface Props {
  show: boolean;
  setShow: (value: boolean) => void;
  filters: { key: string; value: string }[];
  sort: { key: string; order: "asc" | "desc" } | null;
  groupedFilters: Record<string, string[]>;
  setFilters: Dispatch<SetStateAction<{ key: string; value: string }[]>>;
  setSort: Dispatch<
    SetStateAction<{ key: string; order: "asc" | "desc" } | null>
  >;
  visibleColumns: string[];
  setVisibleColumns: Dispatch<SetStateAction<string[]>>;
  searchKeyword: string;
  setSearchKeyword: Dispatch<SetStateAction<string>>;
  viewMode: "table" | "board";
  setViewMode: Dispatch<SetStateAction<"table" | "board">>;
}

interface ColumnPickerProps {
  visibleColumns: string[];
  setVisibleColumns: Dispatch<SetStateAction<string[]>>;
}

export function ColumnPicker({
  visibleColumns,
  setVisibleColumns,
}: ColumnPickerProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isColumnOpen, setIsColumnOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    maxHeight: 420,
  });

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 192;
    const viewportPadding = 8;
    const menuGap = 6;
    const measuredHeight = menuRef.current?.getBoundingClientRect().height ?? 420;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const openBelow = spaceBelow >= Math.min(measuredHeight, 280) || spaceBelow >= spaceAbove;
    const availableHeight = Math.max(
      140,
      (openBelow ? spaceBelow : spaceAbove) - menuGap,
    );
    const maxHeight = Math.min(measuredHeight, availableHeight);
    const left = Math.min(
      Math.max(viewportPadding, rect.right - menuWidth),
      window.innerWidth - menuWidth - viewportPadding,
    );
    const top = openBelow
      ? rect.bottom + menuGap
      : Math.max(viewportPadding, rect.top - maxHeight - menuGap);

    setMenuPosition({ top, left, maxHeight });
  };

  useEffect(() => {
    if (!isColumnOpen) return;

    updateMenuPosition();

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsColumnOpen(false);
    };

    const handleReposition = () => updateMenuPosition();

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isColumnOpen]);

  return (
    <div className="relative ml-auto shrink-0">
      <PortalTooltip label="표시할 컬럼">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            updateMenuPosition();
            setIsColumnOpen((prev) => !prev);
          }}
          className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-md border border-[#E3E8EF] text-[#79859A] transition-colors hover:bg-[#F6F8FB] hover:text-[#28303D]"
          aria-label="표시할 컬럼"
        >
          <Columns3 className="h-[14px] w-[14px]" strokeWidth={2} />
        </button>
      </PortalTooltip>

      {isColumnOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] min-w-[192px] overflow-x-hidden overflow-y-auto rounded-lg border border-[#E3E8EF] bg-white py-1 shadow-[0_12px_28px_-6px_rgba(22,28,38,0.16)]"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              maxHeight: menuPosition.maxHeight,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="px-3 py-2 text-[13px] font-medium text-[#79859A]">
              표시할 컬럼 선택
            </p>
            <div className="h-px bg-[#EFF2F6]" />
            {COLUMN_OPTIONS.map((column) => {
              const checked = visibleColumns.includes(column.key);
              return (
                <button
                  key={column.key}
                  type="button"
                  onClick={() => toggleColumn(column.key)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-[14px] text-[#3E4859] hover:bg-[#F6F8FB]"
                >
                  <span>{column.label}</span>
                  {checked && (
                    <Check
                      className="h-4 w-4 text-[#2563EB]"
                      strokeWidth={2.3}
                    />
                  )}
                </button>
              );
            })}
            <div className="h-px bg-[#EFF2F6]" />
            <button
              type="button"
              onClick={() => setVisibleColumns(DEFAULT_COLUMNS)}
              className="w-full px-3 py-2 text-left text-[14px] text-[#79859A] hover:bg-[#F6F8FB]"
            >
              기본값으로 초기화
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default function ActiveFilter({
  setShow,
  setFilters,
  searchKeyword,
  setSearchKeyword,
  viewMode,
  setViewMode,
}: Props) {
  useEffect(() => {
    setShow(false);
    setFilters([]);
  }, [setFilters, setShow]);

  return (
    <div className="ml-auto flex w-fit items-center gap-2">
      <div className="inline-flex items-center gap-0.5 rounded-md border border-[#E3E8EF] bg-[#F6F8FB] p-0.5">
        <PortalTooltip label="표 보기">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`inline-flex h-[22px] w-[22px] items-center justify-center rounded transition-colors ${
              viewMode === "table"
                ? "bg-white text-[#28303D] shadow-sm"
                : "text-[#79859A] hover:text-[#28303D]"
            }`}
            aria-label="표 보기"
          >
            <Table2 className="h-[14px] w-[14px]" strokeWidth={2} />
          </button>
        </PortalTooltip>

        <PortalTooltip label="칸반 보기">
          <button
            type="button"
            onClick={() => setViewMode("board")}
            className={`inline-flex h-[22px] w-[22px] items-center justify-center rounded transition-colors ${
              viewMode === "board"
                ? "bg-white text-[#28303D] shadow-sm"
                : "text-[#79859A] hover:text-[#28303D]"
            }`}
            aria-label="칸반 보기"
          >
            <Columns3 className="h-[14px] w-[14px]" strokeWidth={2} />
          </button>
        </PortalTooltip>
      </div>

      <label className="relative block">
        <Search
          className="pointer-events-none absolute left-2 top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[#79859A]"
          strokeWidth={2}
        />
        <input
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
          placeholder="기업명 / 공고명"
          className="h-7 w-44 rounded-md border border-[#E3E8EF] bg-white pl-6 pr-2 text-[14px] text-[#28303D] outline-none placeholder:text-[#A4AEBE] focus:border-[#93C5FD] focus:ring-2 focus:ring-[#DBEAFE]"
        />
      </label>
    </div>
  );
}
