import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  GripVertical,
  Layers,
  Pencil,
  Pin,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { ExperienceId, ExperienceItem } from "../../types/experience";
import {
  useResizableCols,
  useTableDividers,
} from "../../hooks/useResizableCols";

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
  onClearSort?: () => void;
  applications?: {
    id: string | number;
    company: string;
    title: string;
  }[];
  typeOptions?: readonly string[];
  onEditItem?: (item: ExperienceItem) => void;
  onDuplicateItem?: (item: ExperienceItem) => void;
  onLinkApplication?: (
    item: ExperienceItem,
    applicationId: string | number,
  ) => void;
  onChangeType?: (item: ExperienceItem, type: string) => void;
  onDeleteItem?: (item: ExperienceItem) => void;
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

const GUTTER_COLUMN_WIDTH = 48;
const IMPORTANT_COLUMN_WIDTH = 48;
const PIN_COLUMN_WIDTH = 48;
const FIXED_COLUMN_KEYS: ExperienceColumnKey[] = ["type", "name"];
const FIXED_COLUMN_KEY_SET = new Set<ExperienceColumnKey>(FIXED_COLUMN_KEYS);
const STORAGE_ORDER_KEY = "pickd.experience.columnOrder.v5";
const ROW_ORDER_STORAGE_KEY = "pickd.experience.rowOrder.v1";
const ROW_MENU_WIDTH = 290;
const ROW_SUBMENU_WIDTH = 236;
const VIEWPORT_PADDING = 8;

type RowMenuState = {
  item: ExperienceItem;
  trigger: HTMLButtonElement;
  top: number;
  left: number;
};

type RowSubmenuState = {
  kind: "applications" | "types";
  top: number;
  left: number;
};

const DEFAULT_WIDTHS: Record<ExperienceColumnKey, number> = {
  type: 90,
  name: 260,
  org: 160,
  period: 140,
  keywords: 220,
  updated: 110,
  status: 90,
  manage: 80,
};

const MIN_WIDTHS: Record<ExperienceColumnKey, number> = {
  type: 56,
  name: 100,
  org: 72,
  period: 72,
  keywords: 80,
  updated: 64,
  status: 64,
  manage: 60,
};

const MAX_WIDTHS: Record<ExperienceColumnKey, number> = {
  type: 160,
  name: 420,
  org: 280,
  period: 220,
  keywords: 340,
  updated: 170,
  status: 140,
  manage: 140,
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
  { key: "status", label: "관리", defaultVisible: true },
];

const REORDERABLE_COLUMN_KEYS = EXPERIENCE_TABLE_COLUMNS.map(
  (column) => column.key,
).filter((key) => !FIXED_COLUMN_KEY_SET.has(key));

const TYPE_CHIP_TONES: Record<
  string,
  { background: string; color: string; border: string }
> = {
  프로젝트: {
    background: "rgba(98,174,240,.12)",
    color: "#2F6799",
    border: "rgba(98,174,240,.22)",
  },
  대외활동: {
    background: "rgba(26,174,57,.12)",
    color: "#146F28",
    border: "rgba(26,174,57,.22)",
  },
  인턴: {
    background: "rgba(214,182,246,.18)",
    color: "#6F4A93",
    border: "rgba(214,182,246,.32)",
  },
  공모전: {
    background: "rgba(221,91,0,.10)",
    color: "#994300",
    border: "rgba(221,91,0,.20)",
  },
  봉사활동: {
    background: "rgba(42,157,153,.12)",
    color: "#176F6C",
    border: "rgba(42,157,153,.22)",
  },
  교환학생: {
    background: "rgba(255,100,200,.10)",
    color: "#A8327D",
    border: "rgba(255,100,200,.20)",
  },
  알바: {
    background: "rgba(82,52,16,.10)",
    color: "#523410",
    border: "rgba(82,52,16,.18)",
  },
  학부연구생: {
    background: "rgba(214,182,246,.18)",
    color: "#6F4A93",
    border: "rgba(214,182,246,.32)",
  },
};

function TypeChip({ type }: { type: string }) {
  const tone = TYPE_CHIP_TONES[type] ?? {
    background: "rgba(107,114,128,.10)",
    color: "#5A6678",
    border: "rgba(107,114,128,.18)",
  };

  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-[600]"
      style={{
        backgroundColor: tone.background,
        color: tone.color,
        borderColor: tone.border,
      }}
    >
      {type}
    </span>
  );
}

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
  onClearSort,
  applications = [],
  typeOptions = [],
  onEditItem,
  onDuplicateItem,
  onLinkApplication,
  onChangeType
}: Props) {
  const { widths, onMouseDown, resizingKey } = useResizableCols(
    "pickd.experience.colWidths.v5",
    DEFAULT_WIDTHS,
    MIN_WIDTHS,
    MAX_WIDTHS,
  );
  const tableWrapRef = useRef<HTMLDivElement | null>(null);
  const draggingColumn = useRef<ExperienceColumnKey | null>(null);
  const dragJustEndedRef = useRef(false);
  const rowMenuRef = useRef<HTMLDivElement | null>(null);
  const rowSubmenuRef = useRef<HTMLDivElement | null>(null);
  const [rowMenu, setRowMenu] = useState<RowMenuState | null>(null);
  const [rowMenuSearch, setRowMenuSearch] = useState("");
  const [rowSubmenu, setRowSubmenu] = useState<RowSubmenuState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExperienceItem | null>(null);

  const [columnOrder, setColumnOrder] = useState<ExperienceColumnKey[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_ORDER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ExperienceColumnKey[];
        const filtered = parsed.filter((key) =>
          REORDERABLE_COLUMN_KEYS.includes(key),
        );
        return [
          ...filtered,
          ...REORDERABLE_COLUMN_KEYS.filter((key) => !filtered.includes(key)),
        ];
      }
    } catch {
      // ignore
    }

    return [...REORDERABLE_COLUMN_KEYS];
  });

  const [rowOrder, setRowOrder] = useState<ExperienceId[]>(() => {
    try {
      const raw = localStorage.getItem(ROW_ORDER_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [draggingRowId, setDraggingRowId] = useState<ExperienceId | null>(null);
  const [rowDropTarget, setRowDropTarget] = useState<{
    id: ExperienceId;
    position: "before" | "after";
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(columnOrder));
    } catch {
      // ignore
    }
  }, [columnOrder]);

  useEffect(() => {
    setRowOrder((previous) => {
      const seen = new Set(previous.map(String));
      const additions = items
        .map((item) => item.id)
        .filter((id) => !seen.has(String(id)));
      return additions.length ? [...previous, ...additions] : previous;
    });
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(ROW_ORDER_STORAGE_KEY, JSON.stringify(rowOrder));
    } catch {
      // ignore
    }
  }, [rowOrder]);

  const closeRowMenu = () => {
    setRowMenu(null);
    setRowSubmenu(null);
    setRowMenuSearch("");
  };

  const openRowMenu = (
    event: ReactMouseEvent<HTMLButtonElement>,
    item: ExperienceItem,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (dragJustEndedRef.current) return;

    if (rowMenu?.item.id === item.id) {
      closeRowMenu();
      return;
    }

    const trigger = event.currentTarget;
    const rect = trigger.getBoundingClientRect();
    const estimatedHeight = 350;
    const belowTop = rect.bottom + 4;
    const top =
      belowTop + estimatedHeight <= window.innerHeight - VIEWPORT_PADDING
        ? belowTop
        : Math.max(VIEWPORT_PADDING, rect.top - estimatedHeight - 4);
    const left = Math.min(
      Math.max(VIEWPORT_PADDING, rect.left),
      window.innerWidth - ROW_MENU_WIDTH - VIEWPORT_PADDING,
    );

    setRowMenu({ item, trigger, top, left });
    setRowMenuSearch("");
    setRowSubmenu(null);
  };

  const openRowSubmenu = (
    kind: RowSubmenuState["kind"],
    trigger: HTMLButtonElement,
  ) => {
    const rect = trigger.getBoundingClientRect();
    const estimatedHeight = kind === "applications" ? 280 : 330;
    const openToRight =
      rect.right + 4 + ROW_SUBMENU_WIDTH <=
      window.innerWidth - VIEWPORT_PADDING;
    const left = openToRight
      ? rect.right + 4
      : Math.max(VIEWPORT_PADDING, rect.left - ROW_SUBMENU_WIDTH - 4);
    const top = Math.min(
      Math.max(VIEWPORT_PADDING, rect.top - 4),
      window.innerHeight - estimatedHeight - VIEWPORT_PADDING,
    );

    setRowSubmenu({ kind, top, left });
  };

  useEffect(() => {
    if (!rowMenu) return;

    const handleOutside = (event: globalThis.MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (
        rowMenu.trigger.contains(target) ||
        rowMenuRef.current?.contains(target) ||
        rowSubmenuRef.current?.contains(target)
      ) {
        return;
      }

      closeRowMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRowMenu();
    };

    const handleScroll = (event: Event) => {
      const target = event.target as Node | null;
      if (
        target &&
        (rowMenuRef.current?.contains(target) ||
          rowSubmenuRef.current?.contains(target))
      ) {
        return;
      }
      closeRowMenu();
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleScroll);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [rowMenu]);

  const visibleSet = new Set(
    visibleColumns ?? EXPERIENCE_TABLE_COLUMNS.map((column) => column.key),
  );
  FIXED_COLUMN_KEYS.forEach((key) => visibleSet.add(key));

  const fixedColumns = FIXED_COLUMN_KEYS.map((key) =>
    EXPERIENCE_TABLE_COLUMNS.find((column) => column.key === key),
  ).filter(
    (
      column,
    ): column is {
      key: ExperienceColumnKey;
      label: string;
      defaultVisible: boolean;
    } => Boolean(column),
  );

  const reorderableColumns = columnOrder
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

  const orderedColumns = [...fixedColumns, ...reorderableColumns];
  const visibleIds = items.map((item) => item.id);
  const allChecked =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const orderedItems = useMemo(() => {
    if (sortState) return items;
    const index = new Map(
      rowOrder.map((id, position) => [String(id), position]),
    );
    return [...items].sort(
      (a, b) =>
        (index.get(String(a.id)) ?? Number.MAX_SAFE_INTEGER) -
        (index.get(String(b.id)) ?? Number.MAX_SAFE_INTEGER),
    );
  }, [items, rowOrder, sortState]);

  const tableWidth =
    GUTTER_COLUMN_WIDTH +
    IMPORTANT_COLUMN_WIDTH +
    orderedColumns.reduce((sum, column) => sum + widths[column.key], 0) +
    PIN_COLUMN_WIDTH;

  const visibleColumnSignature = orderedColumns
    .map((column) => column.key)
    .join("|");
  const dividerBounds = useTableDividers(tableWrapRef, [
    visibleColumnSignature,
    widths,
    orderedItems.length,
  ]);

  const stickyProps = (
    key: "__gutter__" | "__important__" | ExperienceColumnKey,
    header = false,
  ): { className: string; style: CSSProperties } => {
    let left = 0;
    if (key === "__gutter__") left = 0;
    else if (key === "__important__") left = GUTTER_COLUMN_WIDTH;
    else if (key === "type")
      left = GUTTER_COLUMN_WIDTH + IMPORTANT_COLUMN_WIDTH;
    else if (key === "name")
      left =
        GUTTER_COLUMN_WIDTH +
        IMPORTANT_COLUMN_WIDTH +
        (widths.type ?? DEFAULT_WIDTHS.type);
    else return { className: "", style: {} };

    return {
      className: `${
        header ? "z-40 bg-[#F8FAFC]" : "z-10 bg-white group-hover:bg-[#F6F8FB]"
      } sticky`,
      style: { left },
    };
  };

  const handleColumnDragStart = (key: ExperienceColumnKey) => {
    if (FIXED_COLUMN_KEY_SET.has(key)) return;
    draggingColumn.current = key;
  };

  const handleColumnDragOver = (event: DragEvent<HTMLTableCellElement>) => {
    event.preventDefault();
  };

  const handleColumnDrop = (targetKey: ExperienceColumnKey) => {
    const draggingKey = draggingColumn.current;
    draggingColumn.current = null;

    if (
      !draggingKey ||
      draggingKey === targetKey ||
      FIXED_COLUMN_KEY_SET.has(draggingKey) ||
      FIXED_COLUMN_KEY_SET.has(targetKey)
    ) {
      return;
    }

    setColumnOrder((previous) => {
      const next = previous.filter((key) => key !== draggingKey);
      const targetIndex = next.indexOf(targetKey);
      if (targetIndex < 0) return [...next, draggingKey];
      next.splice(targetIndex, 0, draggingKey);
      return next;
    });
  };

  const handleRowDragStart = (
    event: DragEvent<HTMLButtonElement>,
    id: ExperienceId,
  ) => {
    closeRowMenu();
    onClearSort?.();
    setDraggingRowId(id);
    setRowDropTarget(null);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(id));
  };

  const handleRowDragOver = (
    event: DragEvent<HTMLTableRowElement>,
    id: ExperienceId,
  ) => {
    event.preventDefault();
    if (draggingRowId == null || String(draggingRowId) === String(id)) {
      setRowDropTarget(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const position =
      event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    setRowDropTarget({ id, position });
  };

  const handleRowDrop = (
    event: DragEvent<HTMLTableRowElement>,
    targetId: ExperienceId,
  ) => {
    event.preventDefault();
    const sourceId = draggingRowId;
    if (sourceId == null || String(sourceId) === String(targetId)) {
      setDraggingRowId(null);
      setRowDropTarget(null);
      return;
    }

    const position = rowDropTarget?.position ?? "before";
    setRowOrder((previous) => {
      const visible = orderedItems.map((item) => item.id);
      const normalized = [...previous];
      const known = new Set(normalized.map(String));
      visible.forEach((id) => {
        if (!known.has(String(id))) normalized.push(id);
      });

      const withoutSource = normalized.filter(
        (id) => String(id) !== String(sourceId),
      );
      const targetIndex = withoutSource.findIndex(
        (id) => String(id) === String(targetId),
      );
      if (targetIndex < 0) return normalized;
      withoutSource.splice(
        position === "after" ? targetIndex + 1 : targetIndex,
        0,
        sourceId,
      );
      return withoutSource;
    });

    dragJustEndedRef.current = true;
    window.setTimeout(() => {
      dragJustEndedRef.current = false;
    }, 0);
    setDraggingRowId(null);
    setRowDropTarget(null);
  };

  const handleRowDragEnd = () => {
    dragJustEndedRef.current = true;
    window.setTimeout(() => {
      dragJustEndedRef.current = false;
    }, 0);
    setDraggingRowId(null);
    setRowDropTarget(null);
  };

  return (
    <div className="mt-3 min-h-[360px] overflow-hidden rounded-xl border border-[#E3E8EF] bg-white">
      <div
        ref={tableWrapRef}
        className="relative max-h-[560px] min-h-[360px] overflow-auto"
      >
        {dividerBounds.map((divider) => {
          const active = resizingKey === divider.key;
          return (
            <div
              key={divider.key}
              className="group/experience-resize absolute inset-y-0 z-[60]"
              style={{ left: Math.round(divider.left) }}
            >
              <div
                className={`pointer-events-none absolute inset-y-0 left-0 w-px transition-colors duration-150 ${
                  active
                    ? "bg-[#94A3B8]"
                    : "bg-transparent group-hover/experience-resize:bg-[#CBD5E1]"
                }`}
              />
              <div
                className="absolute inset-y-0 left-0 w-2 -translate-x-1/2 cursor-col-resize select-none"
                style={{ touchAction: "none" }}
                onMouseDown={onMouseDown(divider.key)}
              />
            </div>
          );
        })}

        <table
          className="table-fixed border-separate border-spacing-0"
          style={{ width: tableWidth, minWidth: "100%" }}
        >
          <colgroup>
            <col style={{ width: GUTTER_COLUMN_WIDTH }} />
            <col style={{ width: IMPORTANT_COLUMN_WIDTH }} />
            {orderedColumns.map((column) => (
              <col key={column.key} style={{ width: widths[column.key] }} />
            ))}
            <col style={{ width: PIN_COLUMN_WIDTH }} />
          </colgroup>

          <thead className="sticky top-0 z-30 bg-[#F8FAFC]">
            <tr className="h-[40px] border-b border-[#E3E8EF] text-[12px] font-[500] text-[#5A6678]">
              <th
                className={`w-[48px] min-w-[48px] max-w-[48px] border-b border-[#E3E8EF] ${stickyProps("__gutter__", true).className}`}
                style={stickyProps("__gutter__", true).style}
              >
                <label
                  className="ml-5 flex h-full w-[15px] cursor-pointer items-center justify-center"
                  onClick={(event) => event.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={allChecked}
                    onChange={() => onToggleSelectAll?.(visibleIds)}
                  />
                  <span className="flex h-[15px] w-[15px] items-center justify-center rounded-[4px] border-[1.5px] border-[#2563EB]">
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
                  </span>
                </label>
              </th>

              <th
                className={`w-[48px] min-w-[48px] max-w-[48px] border-b border-[#E3E8EF] text-center text-[12px] font-[500] text-[#5A6678] ${stickyProps("__important__", true).className}`}
                style={stickyProps("__important__", true).style}
              >
                중요
              </th>

              {orderedColumns.map((column) => (
                <TableHead
                  key={column.key}
                  columnKey={column.key}
                  width={widths[column.key]}
                  fixed={FIXED_COLUMN_KEY_SET.has(column.key)}
                  stickyClassName={stickyProps(column.key, true).className}
                  stickyStyle={stickyProps(column.key, true).style}
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
                  onDragStart={handleColumnDragStart}
                  onDragOver={handleColumnDragOver}
                  onDrop={handleColumnDrop}
                >
                  {column.label}
                </TableHead>
              ))}

              <th
                className="sticky right-0 z-40 w-[48px] min-w-[48px] max-w-[48px] border-b border-[#E3E8EF] bg-[#F8FAFC]"
                style={{ width: PIN_COLUMN_WIDTH }}
              />
            </tr>
          </thead>

          <tbody>
            {orderedItems.map((item) => {
              const looseItem = item as LooseExperienceItem;
              const checked = selectedIds.includes(item.id);
              const important = Boolean(item.important);
              const dropPosition =
                rowDropTarget && String(rowDropTarget.id) === String(item.id)
                  ? rowDropTarget.position
                  : null;

              return (
                <tr
                  key={item.id}
                  onClick={() => {
                    if (!dragJustEndedRef.current) onRowClick(item);
                  }}
                  onDragOver={(event) => handleRowDragOver(event, item.id)}
                  onDrop={(event) => handleRowDrop(event, item.id)}
                  className={`group relative h-[48px] cursor-pointer border-b border-[#E3E8EF]/70 transition-colors last:border-b-0 hover:bg-[#F6F8FB] ${
                    draggingRowId != null &&
                    String(draggingRowId) === String(item.id)
                      ? "opacity-40"
                      : ""
                  } ${
                    dropPosition === "before"
                      ? "shadow-[inset_0_2px_0_#2563EB]"
                      : dropPosition === "after"
                        ? "shadow-[inset_0_-2px_0_#2563EB]"
                        : ""
                  }`}
                >
                  <td
                    className={`relative w-[48px] min-w-[48px] max-w-[48px] border-b border-[#E3E8EF]/70 text-sm ${stickyProps("__gutter__").className}`}
                    style={stickyProps("__gutter__").style}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      draggable
                      onClick={(event) => openRowMenu(event, item)}
                      onDragStart={(event) =>
                        handleRowDragStart(event, item.id)
                      }
                      onDragEnd={handleRowDragEnd}
                      className={`absolute left-0.5 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 cursor-grab items-center justify-center rounded text-[#A4AEBE] transition-opacity hover:bg-[#EFF2F6] hover:text-[#64748B] active:cursor-grabbing ${
                        rowMenu?.item.id === item.id
                          ? "bg-[#EFF2F6] text-[#64748B] opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                      aria-label="드래그하여 순서 변경 · 클릭하여 메뉴 열기"
                    >
                      <GripVertical className="h-[14px] w-[14px]" />
                    </button>

                    <label className="ml-5 flex h-[48px] w-[15px] cursor-pointer items-center justify-center">
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={() => onToggleSelect?.(item.id)}
                      />
                      <span className="flex h-[15px] w-[15px] items-center justify-center rounded-[4px] border-[1.5px] border-[#2563EB]">
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
                      </span>
                    </label>
                  </td>

                  <td
                    className={`w-[48px] min-w-[48px] max-w-[48px] border-b border-[#E3E8EF]/70 text-center ${stickyProps("__important__").className}`}
                    style={stickyProps("__important__").style}
                  >
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleImportant?.(item.id);
                      }}
                      className="flex h-[48px] w-full items-center justify-center"
                    >
                      <Star
                        size={15}
                        className={
                          important
                            ? "fill-[#F58A1F] text-[#F58A1F]"
                            : "text-[#94A3B8]"
                        }
                      />
                    </button>
                  </td>

                  {orderedColumns.map((column) => {
                    const sticky = stickyProps(column.key);
                    return (
                      <td
                        key={column.key}
                        className={`border-b border-[#E3E8EF]/70 px-3 text-[13px] text-[#3E4859] ${sticky.className}`}
                        style={{
                          width: widths[column.key],
                          minWidth: widths[column.key],
                          maxWidth: widths[column.key],
                          ...sticky.style,
                        }}
                      >
                        <CellValue
                          columnKey={column.key}
                          item={item}
                          looseItem={looseItem}
                          onOpenPendingDuplicates={onOpenPendingDuplicates}
                        />
                      </td>
                    );
                  })}

                  <td
                    className="sticky right-0 z-20 w-[48px] min-w-[48px] max-w-[48px] border-b border-[#E3E8EF]/70 bg-white text-center group-hover:bg-[#F6F8FB]"
                    style={{ width: PIN_COLUMN_WIDTH }}
                  >
                    <FixedPinButton item={item} onTogglePin={onTogglePin} />
                  </td>
                </tr>
              );
            })}

            {orderedItems.length === 0 && (
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

      {rowMenu &&
        createPortal(
          <>
            <div
              ref={rowMenuRef}
              className="fixed z-[10000] w-[230px] overflow-hidden rounded-lg border border-[#DCE3EC] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.18)]"
              style={{ top: rowMenu.top, left: rowMenu.left }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="px-2 pb-1 pt-2">
                <div className="flex h-9 items-center gap-2 rounded-lg border border-[#93C5FD] bg-white px-2.5 ring-2 ring-[#DBEAFE]">
                  <Search className="h-4 w-4 shrink-0 text-[#64748B]" />
                  <input
                    autoFocus
                    value={rowMenuSearch}
                    onChange={(event) => setRowMenuSearch(event.target.value)}
                    onKeyDown={(event) => event.stopPropagation()}
                    placeholder="작업을 검색하세요"
                    className="min-w-0 flex-1 bg-transparent text-[14px] text-[#334155] outline-none placeholder:text-[#64748B]"
                  />
                </div>
              </div>

              <div className="px-3 pb-1 pt-0.5 text-[11px] font-medium text-[#64748B]">
                경험
              </div>

              {(!rowMenuSearch.trim() ||
                "경험 편집".includes(rowMenuSearch.trim())) && (
                <button
                  type="button"
                  onMouseEnter={() => setRowSubmenu(null)}
                  onClick={() => {
                    onEditItem?.(rowMenu.item);
                    closeRowMenu();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] text-[#28303D] hover:bg-[#F6F8FB]"
                >
                  <Pencil className="h-[17px] w-[17px] text-[#F97316]" />
                  경험 편집
                </button>
              )}

              {(!rowMenuSearch.trim() ||
                "복제".includes(rowMenuSearch.trim())) && (
                <button
                  type="button"
                  onMouseEnter={() => setRowSubmenu(null)}
                  onClick={() => {
                    onDuplicateItem?.(rowMenu.item);
                    closeRowMenu();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] text-[#28303D] hover:bg-[#F6F8FB]"
                >
                  <Copy className="h-[17px] w-[17px]" />
                  복제
                </button>
              )}

              {(!rowMenuSearch.trim() ||
                "공고에 연결".includes(rowMenuSearch.trim())) && (
                <button
                  type="button"
                  onMouseEnter={(event) =>
                    openRowSubmenu("applications", event.currentTarget)
                  }
                  onClick={(event) =>
                    openRowSubmenu("applications", event.currentTarget)
                  }
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] text-[#28303D] hover:bg-[#F6F8FB]"
                >
                  <ArrowRight className="h-[17px] w-[17px] text-[#334155]" />
                  <span className="flex-1">공고에 연결</span>
                  <ChevronRight className="h-4 w-4 text-[#334155]" />
                </button>
              )}

              {onChangeType &&
                typeOptions.length > 0 &&
                (!rowMenuSearch.trim() ||
                  "유형 변경".includes(rowMenuSearch.trim())) && (
                  <button
                    type="button"
                    onMouseEnter={(event) =>
                      openRowSubmenu("types", event.currentTarget)
                    }
                    onClick={(event) =>
                      openRowSubmenu("types", event.currentTarget)
                    }
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] text-[#28303D] hover:bg-[#F6F8FB]"
                  >
                    <RefreshCw className="h-[17px] w-[17px] text-[#3B82F6]" />
                    <span className="flex-1">유형 변경</span>
                    <ChevronRight className="h-4 w-4 text-[#334155]" />
                  </button>
                )}

              <div className="my-1 border-t border-[#E5EAF0]" />

              {(!rowMenuSearch.trim() ||
                "삭제".includes(rowMenuSearch.trim())) && (
                <button
                  type="button"
                  onMouseEnter={() => setRowSubmenu(null)}
                  onClick={() => {
                    setDeleteTarget(rowMenu.item);
                    closeRowMenu();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] text-[#EF4444] hover:bg-[#FEF2F2]"
                >
                  <Trash2 className="h-[17px] w-[17px]" />
                  삭제
                </button>
              )}

              {rowMenu.item.updatedAt && (
                <>
                  <div className="border-t border-[#E5EAF0]" />
                  <div className="px-4 py-2 text-[11px] leading-4 text-[#94A3B8]">
                    <div>최종 편집</div>
                    <div>{rowMenu.item.updatedAt}</div>
                  </div>
                </>
              )}
            </div>

            {rowSubmenu && (
              <div
                ref={rowSubmenuRef}
                className="fixed z-[10001] w-[236px] overflow-hidden rounded-lg border border-[#DCE3EC] bg-white py-1 shadow-[0_14px_34px_rgba(15,23,42,0.18)]"
                style={{ top: rowSubmenu.top, left: rowSubmenu.left }}
                onClick={(event) => event.stopPropagation()}
              >
                {rowSubmenu.kind === "applications" ? (
                  applications.length === 0 ? (
                    <p className="px-3 py-3 text-[13px] text-[#79859A]">
                      연결 가능한 공고가 없어요.
                    </p>
                  ) : (
                    <div className="max-h-[280px] overflow-y-auto py-1">
                      {applications.map((application) => {
                        const linkedIds = String(
                          rowMenu.item.fields.linkedApplicationIds ?? "",
                        )
                          .split(",")
                          .map((value) => value.trim())
                          .filter(Boolean);
                        const linked = linkedIds.includes(
                          String(application.id),
                        );

                        return (
                          <button
                            key={application.id}
                            type="button"
                            onClick={() => {
                              if (!linked) {
                                onLinkApplication?.(
                                  rowMenu.item,
                                  application.id,
                                );
                              }
                              closeRowMenu();
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#F6F8FB]"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[13px] font-semibold text-[#28303D]">
                                {application.company}
                              </div>
                              <div className="truncate text-[12px] text-[#79859A]">
                                {application.title}
                              </div>
                            </div>
                            {linked && (
                              <Check className="h-4 w-4 shrink-0 text-[#2563EB]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="max-h-[320px] overflow-y-auto py-1">
                    {typeOptions.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          onChangeType?.(rowMenu.item, type);
                          closeRowMenu();
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-[#F6F8FB] ${
                          rowMenu.item.type === type
                            ? "font-semibold text-[#2563EB]"
                            : "text-[#334155]"
                        }`}
                      >
                        <span>{type}</span>
                        {rowMenu.item.type === type && (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>,
          document.body,
        )}
      {deleteTarget &&
        createPortal(
          <DeleteConfirmModal
            onCancel={() => setDeleteTarget(null)}
            onConfirm={() => {
              setDeleteTarget(null);
            }}
          />,
          document.body,
        )}
    </div>
  );
}

interface DeleteConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({ onCancel, onConfirm }: DeleteConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-[10020] flex items-center justify-center bg-black/70 px-4"
      onMouseDown={(event) => {
        event.stopPropagation();

        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="experience-delete-confirm-title"
        className="w-[570px] max-w-[calc(100vw-32px)] rounded-[12px] border border-[#E2E8F0] bg-[#FBFCFE] px-9 pb-7 pt-8 shadow-[0_26px_90px_rgba(15,23,42,0.35)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2
              id="experience-delete-confirm-title"
              className="text-[20px] font-[800] tracking-[-0.03em] text-[#0F172A]"
            >
              휴지통으로 옮길까요?
            </h2>

            <p className="mt-3 text-[16px] font-[600] tracking-[-0.03em] text-[#64748B]">
              이 경험을 휴지통으로 옮겨요. 14일 안에 복원할 수 있어요.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[#475569] hover:bg-[#F8FAFC]"
            aria-label="삭제 확인 창 닫기"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-10 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-[8px] border border-[#E2E8F0] bg-white px-5 text-[14px] font-[800] text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            취소
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-[8px] bg-[#E0525D] px-5 text-[14px] font-[800] text-white hover:bg-[#DC4450]"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

interface TableHeadProps {
  children: ReactNode;
  columnKey: ExperienceColumnKey;
  width: number;
  fixed: boolean;
  stickyClassName?: string;
  stickyStyle?: CSSProperties;
  filter?: ReactNode;
  sortDir?: "asc" | "desc" | null;
  onSort?: () => void;
  onDragStart: (key: ExperienceColumnKey) => void;
  onDragOver: (event: DragEvent<HTMLTableCellElement>) => void;
  onDrop: (key: ExperienceColumnKey) => void;
}

function TableHead({
  children,
  columnKey,
  width,
  fixed,
  stickyClassName = "",
  stickyStyle,
  filter,
  sortDir,
  onSort,
  onDragStart,
  onDragOver,
  onDrop,
}: TableHeadProps) {
  return (
    <th
      data-resizable-column={columnKey}
      draggable={!fixed}
      onDragStart={() => onDragStart(columnKey)}
      onDragOver={fixed ? undefined : onDragOver}
      onDrop={fixed ? undefined : () => onDrop(columnKey)}
      className={`group/header relative border-b border-[#E3E8EF] bg-[#F8FAFC] px-3 text-left text-[12px] font-[500] text-[#5A6678] select-none ${stickyClassName}`}
      style={{ width, minWidth: width, maxWidth: width, ...stickyStyle }}
    >
      <div
        className={`flex items-center gap-1 pr-2 ${fixed ? "" : "cursor-grab active:cursor-grabbing"}`}
      >
        {!fixed && (
          <GripVertical
            size={12}
            className="text-[#A4AEBE] opacity-0 transition-opacity group-hover/header:opacity-100"
          />
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSort?.();
          }}
          className="min-w-0 truncate text-left hover:text-[#28303D]"
        >
          {children}
          {sortDir === "asc" ? " ↑" : sortDir === "desc" ? " ↓" : ""}
        </button>
        {filter}
      </div>
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
  if (columnKey === "type") return <TypeChip type={item.type} />;

  if (columnKey === "name") {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[13px] font-[600] tracking-[-0.01em] text-[#28303D]">
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
              className="inline-flex h-5 items-center rounded-md border border-[#E3E8EF] bg-[#F6F8FB] px-1.5 text-[11px] text-[#5A6678]"
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
      className="mx-auto flex h-[48px] w-full items-center justify-center text-[#79859A] opacity-0 transition-opacity hover:text-[#2563EB] group-hover:opacity-100"
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
      <ManageStatusTooltip
        label="비슷한 항목이 있어요"
        className="rounded text-[#C5860E] hover:bg-[#FCF3E2]"
        onClick={(event) => {
          event.stopPropagation();
          onOpenPendingDuplicates?.(item);
        }}
      >
        <Layers className="h-3.5 w-3.5" />
      </ManageStatusTooltip>
    );
  }

  if (item.hasUnansweredAiQuestion || item.status === "AI 질문 필요") {
    return (
      <ManageStatusTooltip
        label="미답변 AI 질문이 있어요"
        className="text-[#2563EB]"
      >
        <Sparkles className="h-3.5 w-3.5" />
      </ManageStatusTooltip>
    );
  }

  if (["작성중", "보완 필요", "확인 필요", "정보 부족"].includes(item.status)) {
    return (
      <ManageStatusTooltip label="아직 정리 중" className="text-[#A4AEBE]">
        <Pencil className="h-3.5 w-3.5" />
      </ManageStatusTooltip>
    );
  }

  return <span className="text-[11px] text-[#CDD5E0]">—</span>;
}

function ManageStatusTooltip({
  label,
  className = "",
  onClick,
  children,
}: {
  label: string;
  className?: string;
  onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}) {
  const anchorRef = useRef<HTMLElement | null>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    placement: "top" | "bottom";
  } | null>(null);

  const showTooltip = () => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const estimatedWidth = Math.max(112, label.length * 13 + 20);
    const left = Math.min(
      window.innerWidth - estimatedWidth / 2 - 8,
      Math.max(estimatedWidth / 2 + 8, rect.left + rect.width / 2),
    );
    const placement = rect.top >= 44 ? "top" : "bottom";

    setPosition({
      top: placement === "top" ? rect.top - 7 : rect.bottom + 7,
      left,
      placement,
    });
  };

  const hideTooltip = () => setPosition(null);
  const commonProps = {
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip,
    "aria-label": label,
  };

  return (
    <>
      {onClick ? (
        <button
          ref={(node) => {
            anchorRef.current = node;
          }}
          type="button"
          onClick={onClick}
          className={`inline-flex h-5 w-5 items-center justify-center ${className}`}
          {...commonProps}
        >
          {children}
        </button>
      ) : (
        <span
          ref={(node) => {
            anchorRef.current = node;
          }}
          tabIndex={0}
          className={`inline-flex h-5 w-5 items-center justify-center ${className}`}
          {...commonProps}
        >
          {children}
        </span>
      )}

      {position &&
        createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-[10000] whitespace-nowrap rounded bg-[#1F2937] px-2 py-1 text-[12px] font-semibold leading-[1.4] text-white shadow-lg"
            style={{
              top: position.top,
              left: position.left,
              transform:
                position.placement === "top"
                  ? "translate(-50%, -100%)"
                  : "translateX(-50%)",
            }}
          >
            {label}
          </div>,
          document.body,
        )}
    </>
  );
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
