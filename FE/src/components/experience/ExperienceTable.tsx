import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  GripVertical,
  Layers,
  Pencil,
  Pin,
  Sparkles,
  Star,
} from "lucide-react";
import type { ExperienceId, ExperienceItem } from "../../types/experience";
import { ResizeHandle, useResizableCols } from "../../hooks/useResizableCols";

export type ExperienceColumnKey =
  | "type"
  | "name"
  | "org"
  | "period"
  | "keywords"
  | "updated"
  | "status"
  | "manage";

export type ExperienceColumnFilter =
  | { kind: "select"; values: string[] }
  | { kind: "text"; q: string };

interface Props {
  items: ExperienceItem[];
  onRowClick: (item: ExperienceItem) => void;
  selectedIds?: ExperienceId[];
  onToggleSelect?: (id: ExperienceId) => void;
  onToggleSelectAll?: (ids: ExperienceId[]) => void;
  onToggleImportant?: (id: ExperienceId) => void;
  onTogglePin?: (id: ExperienceId) => void;
  onOpenPendingDuplicates?: (item: ExperienceItem) => void;
  visibleColumns?: readonly ExperienceColumnKey[];
  columnFilters?: Partial<Record<ExperienceColumnKey, ExperienceColumnFilter>>;
  filterOptions?: Partial<Record<ExperienceColumnKey, string[]>>;
  onSetSelectFilter?: (key: ExperienceColumnKey, values: string[]) => void;
  onSetTextFilter?: (key: ExperienceColumnKey, q: string) => void;
  sortState?: { key: ExperienceColumnKey; dir: "asc" | "desc" } | null;
  onToggleSort?: (key: ExperienceColumnKey) => void;
}

type LooseExperienceItem = ExperienceItem &
  Record<string, unknown> & {
    pin?: boolean;
    fixed?: boolean;
    organization?: string;
    institution?: string;
    affiliation?: string;
    company?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
    updatedAt?: string;
    modifiedAt?: string;
    fields?: Record<string, unknown>;
  };

const DEFAULT_WIDTHS: Record<ExperienceColumnKey, number> = {
  type: 125,
  name: 300,
  org: 185,
  period: 165,
  keywords: 260,
  updated: 150,
  status: 145,
  manage: 90,
};

const MIN_WIDTHS: Record<ExperienceColumnKey, number> = {
  type: 90,
  name: 180,
  org: 120,
  period: 120,
  keywords: 160,
  updated: 110,
  status: 110,
  manage: 80,
};

export const EXPERIENCE_TABLE_COLUMNS: {
  key: ExperienceColumnKey;
  label: string;
  defaultVisible: boolean;
}[] = [
  { key: "type", label: "유형", defaultVisible: true },
  { key: "name", label: "항목명", defaultVisible: true },
  { key: "org", label: "기관/소속", defaultVisible: true },
  { key: "period", label: "기간", defaultVisible: true },
  { key: "keywords", label: "주요 키워드", defaultVisible: true },
  { key: "updated", label: "최근 수정", defaultVisible: true },
  { key: "status", label: "관리 상태", defaultVisible: true },
];

const STORAGE_ORDER_KEY = "pickd.experience.columnOrder.v3";
const PIN_COLUMN_WIDTH = 48;

export default function ExperienceTable({
  items,
  onRowClick,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onToggleImportant,
  onTogglePin,
  onOpenPendingDuplicates,
  visibleColumns,
  columnFilters = {},
  filterOptions = {},
  onSetSelectFilter,
  onSetTextFilter,
  sortState,
  onToggleSort,
}: Props) {
  const { widths, onMouseDown } = useResizableCols(
    "pickd.experience.colWidths.v3",
    DEFAULT_WIDTHS,
    MIN_WIDTHS,
  );

  const [columnOrder, setColumnOrder] = useState<ExperienceColumnKey[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_ORDER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ExperienceColumnKey[];
        const filtered = parsed.filter((key) =>
          EXPERIENCE_TABLE_COLUMNS.some((column) => column.key === key),
        );
        return [
          ...filtered,
          ...EXPERIENCE_TABLE_COLUMNS.map((column) => column.key).filter(
            (key) => !filtered.includes(key),
          ),
        ];
      }
    } catch {
      // ignore
    }

    return EXPERIENCE_TABLE_COLUMNS.map((column) => column.key);
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(columnOrder));
    } catch {
      // ignore
    }
  }, [columnOrder]);

  const draggingColumn = useRef<ExperienceColumnKey | null>(null);
  const visibleSet = new Set(
    visibleColumns ?? EXPERIENCE_TABLE_COLUMNS.map((column) => column.key),
  );

  const orderedColumns = columnOrder
    .map((key) => EXPERIENCE_TABLE_COLUMNS.find((column) => column.key === key))
    .filter(
      (
        column,
      ): column is {
        key: ExperienceColumnKey;
        label: string;
        defaultVisible: boolean;
      } => Boolean(column),
    )
    .filter((column) => visibleSet.has(column.key));

  const visibleIds = items.map((item) => item.id);
  const allChecked =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const tableWidth =
    48 +
    48 +
    orderedColumns.reduce((sum, column) => sum + widths[column.key], 0) +
    PIN_COLUMN_WIDTH;

  const handleDragStart = (key: ExperienceColumnKey) => {
    draggingColumn.current = key;
  };

  const handleDragOver = (event: DragEvent<HTMLTableCellElement>) => {
    event.preventDefault();
  };

  const handleDrop = (targetKey: ExperienceColumnKey) => {
    const draggingKey = draggingColumn.current;
    draggingColumn.current = null;

    if (!draggingKey || draggingKey === targetKey) return;

    setColumnOrder((prev) => {
      const next = prev.filter((key) => key !== draggingKey);
      const targetIndex = next.indexOf(targetKey);
      next.splice(targetIndex, 0, draggingKey);
      return next;
    });
  };

  return (
    <div className="mt-[18px] h-[600px] overflow-hidden rounded-[16px] border border-[#E2E8F0] bg-white">
      <div className="h-full overflow-auto">
        <table
          className="table-fixed border-separate border-spacing-0"
          style={{ width: tableWidth, minWidth: "100%" }}
        >
          <thead className="sticky top-0 z-20 bg-[#F8FAFC]">
            <tr className="h-[40px] border-b border-[#E2E8F0]">
              <th className="w-[48px] min-w-[48px] max-w-[48px] border-b border-r border-[#E2E8F0]">
                <label
                  className="flex h-full w-full cursor-pointer items-center justify-center p-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={allChecked}
                    onChange={() => onToggleSelectAll?.(visibleIds)}
                  />
                  <div className="flex h-[15px] w-[15px] items-center justify-center rounded-[4px] border-[1.5px] border-[#2563EB]">
                    {allChecked && (
                      <svg
                        className="h-3 w-3 text-[#2563EB]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </label>
              </th>

              <th className="w-[48px] min-w-[48px] max-w-[48px] border-b border-r border-[#E2E8F0] text-center text-[13px] font-[700] text-[#64748B]">
                중요
              </th>

              {orderedColumns.map((column) => (
                <TableHead
                  key={column.key}
                  columnKey={column.key}
                  width={widths[column.key]}
                  filter={
                    onSetSelectFilter && onSetTextFilter ? (
                      <HeaderFilter
                        columnKey={column.key}
                        filter={columnFilters[column.key]}
                        options={filterOptions[column.key] ?? []}
                        kind={
                          column.key === "name" || column.key === "org"
                            ? "text"
                            : "select"
                        }
                        onSetSelectFilter={onSetSelectFilter}
                        onSetTextFilter={onSetTextFilter}
                      />
                    ) : undefined
                  }
                  sortDir={sortState?.key === column.key ? sortState.dir : null}
                  onSort={
                    onToggleSort ? () => onToggleSort(column.key) : undefined
                  }
                  onResize={onMouseDown(column.key)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {column.label}
                </TableHead>
              ))}

              <th
                className="sticky right-0 z-30 w-[48px] min-w-[48px] max-w-[48px] border-b border-l border-[#E2E8F0] bg-[#F8FAFC]"
                style={{ width: PIN_COLUMN_WIDTH }}
              />
            </tr>
          </thead>

          <tbody>
            {items.map((item) => {
              const looseItem = item as LooseExperienceItem;
              const checked = selectedIds.includes(item.id);
              const important = Boolean(item.important);

              return (
                <tr
                  key={item.id}
                  onClick={() => onRowClick(item)}
                  className="group h-[52px] cursor-pointer border-b border-[#F1F5F9] transition-colors last:border-b-0 hover:bg-[#F8FAFC]"
                >
                  <td className="w-[48px] min-w-[48px] max-w-[48px] border-b border-r border-[#F1F5F9] text-sm">
                    <label
                      className="flex cursor-pointer items-center justify-center p-2 -m-1.5"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={() => onToggleSelect?.(item.id)}
                      />
                      <div className="flex h-[15px] w-[15px] items-center justify-center rounded-[4px] border-[1.5px] border-[#2563EB]">
                        {checked && (
                          <svg
                            className="h-3 w-3 text-[#2563EB]"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </label>
                  </td>

                  <td className="w-[48px] min-w-[48px] max-w-[48px] border-b border-r border-[#F1F5F9] text-center">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleImportant?.(item.id);
                      }}
                      className="flex h-[52px] w-full items-center justify-center"
                    >
                      <Star
                        size={18}
                        className={
                          important
                            ? "fill-[#F58A1F] text-[#F58A1F]"
                            : "text-[#94A3B8]"
                        }
                      />
                    </button>
                  </td>

                  {orderedColumns.map((column) => (
                    <td
                      key={column.key}
                      className="border-b border-r border-[#F1F5F9] px-3 text-[14px] font-[500] text-[#475569]"
                      style={{
                        width: widths[column.key],
                        minWidth: widths[column.key],
                        maxWidth: widths[column.key],
                      }}
                    >
                      <CellValue
                        columnKey={column.key}
                        item={item}
                        looseItem={looseItem}
                        onOpenPendingDuplicates={onOpenPendingDuplicates}
                      />
                    </td>
                  ))}

                  <td
                    className="sticky right-0 z-20 w-[48px] min-w-[48px] max-w-[48px] border-b border-l border-[#F1F5F9] bg-white text-center group-hover:bg-[#F8FAFC]"
                    style={{ width: PIN_COLUMN_WIDTH }}
                  >
                    <FixedPinButton item={item} onTogglePin={onTogglePin} />
                  </td>
                </tr>
              );
            })}

            {items.length === 0 && (
              <tr>
                <td
                  colSpan={orderedColumns.length + 3}
                  className="h-[180px] text-center text-[14px] font-[700] text-[#94A3B8]"
                >
                  조건에 맞는 경험이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface TableHeadProps {
  children: ReactNode;
  columnKey: ExperienceColumnKey;
  width: number;
  filter?: ReactNode;
  sortDir?: "asc" | "desc" | null;
  onSort?: () => void;
  onResize: (event: ReactMouseEvent) => void;
  onDragStart: (key: ExperienceColumnKey) => void;
  onDragOver: (event: DragEvent<HTMLTableCellElement>) => void;
  onDrop: (key: ExperienceColumnKey) => void;
}

function TableHead({
  children,
  columnKey,
  width,
  filter,
  sortDir,
  onSort,
  onResize,
  onDragStart,
  onDragOver,
  onDrop,
}: TableHeadProps) {
  void sortDir;
  void onSort;

  return (
    <th
      draggable
      onDragStart={() => onDragStart(columnKey)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(columnKey)}
      className="relative border-b border-r border-[#E2E8F0] bg-[#F8FAFC] px-3 text-left text-[14px] font-[600] text-[#64748B] select-none"
      style={{ width, minWidth: width, maxWidth: width }}
    >
      <div className="flex cursor-grab items-center gap-1 pr-2 active:cursor-grabbing">
        <GripVertical size={13} className="text-[#CBD5E1]" />
        <span className="truncate">{children}</span>
        {filter}
      </div>
      <ResizeHandle onMouseDown={onResize} />
    </th>
  );
}

function HeaderFilter({
  columnKey,
  filter,
  options,
  kind,
  onSetSelectFilter,
  onSetTextFilter,
}: {
  columnKey: ExperienceColumnKey;
  filter?: ExperienceColumnFilter;
  options: string[];
  kind: "select" | "text";
  onSetSelectFilter: (key: ExperienceColumnKey, values: string[]) => void;
  onSetTextFilter: (key: ExperienceColumnKey, q: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [text, setText] = useState(filter?.kind === "text" ? filter.q : "");
  const [search, setSearch] = useState("");
  const selectedSet =
    filter?.kind === "select" ? new Set(filter.values) : new Set<string>();
  const active = Boolean(
    filter &&
    (filter.kind === "text" ? filter.q.trim() : filter.values.length > 0),
  );
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 230;
    const padding = 8;
    const nextLeft = Math.min(
      Math.max(padding, rect.left),
      window.innerWidth - menuWidth - padding,
    );

    setMenuPosition({
      top: rect.bottom + 8,
      left: nextLeft,
    });
  };

  useEffect(() => {
    setText(filter?.kind === "text" ? filter.q : "");
  }, [filter]);

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;

      if (
        target &&
        (triggerRef.current?.contains(target) ||
          menuRef.current?.contains(target))
      ) {
        return;
      }

      setOpen(false);
    };

    const handleReposition = () => {
      updateMenuPosition();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  const menuContent = open
    ? createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] w-[230px] rounded-[10px] border border-[#E2E8F0] bg-white p-2 shadow-[0_14px_34px_rgba(15,23,42,0.16)]"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onClick={(event) => event.stopPropagation()}
        >
          {kind === "text" ? (
            <div className="space-y-2">
              <input
                autoFocus
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onSetTextFilter(columnKey, text);
                    setOpen(false);
                  }
                }}
                placeholder="포함하는 글자"
                className="h-8 w-full rounded-md border border-[#E2E8F0] px-2 text-[12px] font-[600] outline-none focus:border-[#2563EB]"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setText("");
                    onSetTextFilter(columnKey, "");
                  }}
                  className="text-[12px] font-[700] text-[#94A3B8] hover:text-[#64748B]"
                >
                  초기화
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSetTextFilter(columnKey, text);
                    setOpen(false);
                  }}
                  className="h-7 rounded-md bg-[#2563EB] px-3 text-[12px] font-[800] text-white"
                >
                  적용
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {options.length > 6 && (
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="검색"
                  className="h-8 w-full rounded-md border border-[#E2E8F0] px-2 text-[12px] font-[600] outline-none focus:border-[#2563EB]"
                />
              )}
              <div className="max-h-[220px] overflow-y-auto">
                {filteredOptions.length === 0 && (
                  <p className="px-1 py-3 text-[12px] font-[600] text-[#94A3B8]">
                    옵션이 없습니다.
                  </p>
                )}
                {filteredOptions.map((option) => {
                  const checked = selectedSet.has(option);
                  return (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#F8FAFC]"
                    >
                      <span className="flex h-[14px] w-[14px] items-center justify-center rounded-[4px] border border-[#CBD5E1]">
                        {checked && (
                          <Check
                            size={10}
                            strokeWidth={3}
                            className="text-[#2563EB]"
                          />
                        )}
                      </span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = new Set(selectedSet);
                          checked ? next.delete(option) : next.add(option);
                          onSetSelectFilter(columnKey, Array.from(next));
                        }}
                        className="sr-only"
                      />
                      <span className="truncate text-[12px] font-[600] text-[#0F172A]">
                        {option}
                      </span>
                    </label>
                  );
                })}
              </div>
              {active && (
                <div className="border-t border-[#F1F5F9] pt-2 text-right">
                  <button
                    type="button"
                    onClick={() => onSetSelectFilter(columnKey, [])}
                    className="text-[12px] font-[700] text-[#94A3B8] hover:text-[#64748B]"
                  >
                    초기화
                  </button>
                </div>
              )}
            </div>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <span
      className="relative inline-flex"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          updateMenuPosition();
          setOpen((prev) => !prev);
        }}
        className={`flex h-5 w-5 items-center justify-center rounded ${active ? "bg-[#DBEAFE] text-[#2563EB]" : "text-[#CBD5E1] hover:bg-white hover:text-[#64748B]"}`}
        aria-label="컬럼 필터"
      >
        <ChevronDown size={13} />
      </button>

      {menuContent}
    </span>
  );
}

function CellValue({
  columnKey,
  item,
  looseItem,
  onOpenPendingDuplicates,
}: {
  columnKey: ExperienceColumnKey;
  item: ExperienceItem;
  looseItem: LooseExperienceItem;
  onOpenPendingDuplicates?: (item: ExperienceItem) => void;
}) {
  if (columnKey === "type") return <span>{item.type}</span>;

  if (columnKey === "name") {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[16px] font-[700] tracking-[-0.01em] text-[#020617]">
          {item.name || "새 경험"}
        </span>
      </div>
    );
  }

  if (columnKey === "org")
    return <span className="block truncate">{getOrganization(looseItem)}</span>;
  if (columnKey === "period")
    return <span className="block truncate">{getPeriod(looseItem)}</span>;

  if (columnKey === "keywords") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {item.keywords.length > 0 ? (
          item.keywords.slice(0, 3).map((keyword) => (
            <span
              key={keyword}
              className="inline-flex h-[28px] items-center rounded-[6px] bg-[#F1F5F9] px-2 text-[12px] font-[500] text-[#475569]"
            >
              {keyword}
            </span>
          ))
        ) : (
          <span className="text-[14px] text-[#CBD5E1]">—</span>
        )}
      </div>
    );
  }

  if (columnKey === "updated") return <span>{getUpdatedAt(looseItem)}</span>;
  if (columnKey === "status")
    return (
      <ManageStatus
        item={item}
        onOpenPendingDuplicates={onOpenPendingDuplicates}
      />
    );

  return null;
}

function FixedPinButton({
  item,
  onTogglePin,
}: {
  item: ExperienceItem;
  onTogglePin?: (id: ExperienceId) => void;
}) {
  const pin = Boolean(item.pin);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onTogglePin?.(item.id);
      }}
      className="mx-auto flex h-[52px] w-full items-center justify-center text-[#64748B] transition-opacity hover:text-[#2563EB] opacity-0 group-hover:opacity-100"
    >
      <Pin
        size={17}
        strokeWidth={1.9}
        className={pin ? "fill-current text-[#2563EB]" : ""}
      />
    </button>
  );
}

function ManageStatus({
  item,
  onOpenPendingDuplicates,
}: {
  item: ExperienceItem;
  onOpenPendingDuplicates?: (item: ExperienceItem) => void;
}) {
  if (item.hasMergeCandidate || item.status === "병합 필요") {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onOpenPendingDuplicates?.(item);
        }}
        className="className=inline-flex items-center gap-1 text-[13px] font-[700] text-[#64748B]"
        data-tooltip="병합 필요"
        aria-label="병합 필요"
      >
        <Layers size={15} strokeWidth={1.9} />
      </button>
    );
  }

  if (item.hasUnansweredAiQuestion || item.status === "AI 질문 필요") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[13px] font-[700] text-[#64748B]"
        data-tooltip="AI 질문 필요"
        aria-label="AI 질문 필요"
      >
        <Sparkles size={17} strokeWidth={1.8} />
      </span>
    );
  }

  if (["작성중", "보완 필요", "확인 필요", "정보 부족"].includes(item.status)) {
    return (
      <span className="inline-flex items-center gap-1 text-[13px] font-[700] text-[#64748B]">
        <Pencil size={17} strokeWidth={1.8} />
      </span>
    );
  }

  if (item.status === "완료" || item.status === "정리 완료") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[13px] font-[700] text-[#15803D]"
        data-tooltip="완료"
        aria-label="완료"
      >
        -
      </span>
    );
  }

  return <span className="text-[14px] font-[500] text-[#CBD5E1]">—</span>;
}

function getTextValue(item: LooseExperienceItem, keys: string[]) {
  for (const key of keys) {
    const directValue = item[key];

    if (typeof directValue === "string" && directValue.trim()) {
      return directValue;
    }

    if (typeof directValue === "number") {
      return String(directValue);
    }

    const fieldValue = item.fields?.[key];

    if (typeof fieldValue === "string" && fieldValue.trim()) {
      return fieldValue;
    }

    if (typeof fieldValue === "number") {
      return String(fieldValue);
    }
  }

  return "";
}

export function getExperienceColumnValue(
  item: ExperienceItem,
  key: ExperienceColumnKey,
): string | string[] {
  const looseItem = item as LooseExperienceItem;
  switch (key) {
    case "type":
      return item.type;
    case "name":
      return item.name;
    case "org":
      return getOrganization(looseItem) === "—"
        ? ""
        : getOrganization(looseItem);
    case "period":
      return getPeriod(looseItem) === "—" ? "" : getPeriod(looseItem);
    case "keywords":
      return item.keywords;
    case "updated":
      return getUpdatedAt(looseItem) === "—" ? "" : getUpdatedAt(looseItem);
    case "status":
      return item.status;
    case "manage":
      return item.pin ? "고정됨" : "고정";
  }
}

function getOrganization(item: LooseExperienceItem) {
  return (
    getTextValue(item, [
      "org",
      "organization",
      "institution",
      "affiliation",
      "company",
      "host",
      "issuer",
      "school",
      "univ",
      "lab",
      "agency",
      "기관",
      "소속",
      "기관/소속",
    ]) || "—"
  );
}

function getPeriod(item: LooseExperienceItem) {
  const period = getTextValue(item, [
    "period",
    "testDate",
    "issuedAt",
    "awardedAt",
    "semester",
    "기간",
  ]);

  if (period) return period;

  const startDate = getTextValue(item, ["startDate", "startedAt", "시작일"]);
  const endDate = getTextValue(item, ["endDate", "endedAt", "종료일"]);

  if (startDate && endDate) return `${startDate} ~ ${endDate}`;
  if (startDate) return startDate;

  return "—";
}

function getUpdatedAt(item: LooseExperienceItem) {
  return (
    getTextValue(item, [
      "updatedAt",
      "modifiedAt",
      "recentlyUpdatedAt",
      "최근 수정",
      "최근수정",
    ]) || "—"
  );
}
