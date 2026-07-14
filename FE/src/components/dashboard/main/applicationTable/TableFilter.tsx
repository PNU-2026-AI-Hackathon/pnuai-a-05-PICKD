import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  ListFilter,
  Pin,
  PinOff,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";

type SortState = { key: string; order: "asc" | "desc" } | null;
type FilterKind = "text" | "select";

interface Props {
  columnKey: string;
  label: string;
  sort: SortState;
  setSort: Dispatch<SetStateAction<SortState>>;
  filterKind?: FilterKind;
  filterOptions?: string[];
  filterValues?: string[];
  onFilterChange?: (values: string[]) => void;
  pinned?: boolean;
  onTogglePin?: () => void;
  onDeleteColumn?: () => void;
}

const MENU_WIDTH = 264;
const MENU_HEIGHT = 292;
const FILTER_MENU_WIDTH = 244;
const FILTER_MENU_MAX_HEIGHT = 320;
const VIEWPORT_PADDING = 8;
const MENU_GAP = 5;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function TableFilter({
  columnKey,
  label,
  sort,
  setSort,
  filterKind,
  filterOptions = [],
  filterValues = [],
  onFilterChange,
  pinned = false,
  onTogglePin,
  onDeleteColumn,
}: Props) {
  const [open, setOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [filterMenuPosition, setFilterMenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const [filterSearch, setFilterSearch] = useState("");
  const [textFilterValue, setTextFilterValue] = useState(
    filterValues[0] ?? "",
  );

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  const activeOrder = sort?.key === columnKey ? sort.order : null;
  const filterActive = filterValues.length > 0;

  useEffect(() => {
    setTextFilterValue(filterValues[0] ?? "");
  }, [filterValues]);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const maxLeft = Math.max(
      VIEWPORT_PADDING,
      window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING,
    );
    const nextLeft = clamp(rect.left - 12, VIEWPORT_PADDING, maxLeft);

    const belowTop = rect.bottom + MENU_GAP;
    const aboveTop = rect.top - MENU_HEIGHT - MENU_GAP;
    const nextTop =
      belowTop + MENU_HEIGHT <= window.innerHeight - VIEWPORT_PADDING
        ? belowTop
        : Math.max(VIEWPORT_PADDING, aboveTop);

    setMenuPosition({ top: nextTop, left: nextLeft });
  };

  const updateFilterMenuPosition = () => {
    const trigger = filterTriggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const canOpenRight =
      rect.right + MENU_GAP + FILTER_MENU_WIDTH <=
      window.innerWidth - VIEWPORT_PADDING;

    const nextLeft = canOpenRight
      ? rect.right + MENU_GAP
      : Math.max(
          VIEWPORT_PADDING,
          rect.left - FILTER_MENU_WIDTH - MENU_GAP,
        );

    const maxTop = Math.max(
      VIEWPORT_PADDING,
      window.innerHeight - FILTER_MENU_MAX_HEIGHT - VIEWPORT_PADDING,
    );
    const nextTop = clamp(rect.top - 4, VIEWPORT_PADDING, maxTop);

    setFilterMenuPosition({ top: nextTop, left: nextLeft });
  };

  const closeMenu = () => {
    setOpen(false);
    setFilterOpen(false);
    setFilterSearch("");
  };

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target) ||
        filterMenuRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    const handleReposition = () => {
      updateMenuPosition();
      if (filterOpen) updateFilterMenuPosition();
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, filterOpen]);

  useEffect(() => {
    if (!filterOpen) return;
    updateFilterMenuPosition();
  }, [filterOpen]);

  const toggleFilterMenu = () => {
    if (!filterKind || !onFilterChange) return;
    setFilterOpen((previous) => {
      const next = !previous;
      if (next) requestAnimationFrame(updateFilterMenuPosition);
      return next;
    });
  };

  const filteredOptions = filterOptions.filter((option) =>
    option.toLowerCase().includes(filterSearch.trim().toLowerCase()),
  );

  const toggleSelectFilter = (value: string) => {
    if (!onFilterChange) return;
    const next = filterValues.includes(value)
      ? filterValues.filter((item) => item !== value)
      : [...filterValues, value];
    onFilterChange(next);
  };

  const menu = open ? (
    <div
      ref={menuRef}
      className="fixed z-[9999] w-[264px] overflow-hidden rounded-xl border border-[#D9E0E8] bg-white py-1.5 shadow-[0_12px_28px_-6px_rgba(22,28,38,0.20)]"
      style={{ top: menuPosition.top, left: menuPosition.left }}
      onClick={(event) => event.stopPropagation()}
    >
      <MenuButton
        active={activeOrder === "asc"}
        icon={<ArrowUp className="h-[18px] w-[18px]" strokeWidth={1.9} />}
        onClick={() => {
          setSort({ key: columnKey, order: "asc" });
          closeMenu();
        }}
      >
        오름차순
      </MenuButton>

      <MenuButton
        active={activeOrder === "desc"}
        icon={<ArrowDown className="h-[18px] w-[18px]" strokeWidth={1.9} />}
        onClick={() => {
          setSort({ key: columnKey, order: "desc" });
          closeMenu();
        }}
      >
        내림차순
      </MenuButton>

      <MenuButton
        disabled={!activeOrder}
        icon={<X className="h-[18px] w-[18px]" strokeWidth={1.9} />}
        onClick={() => {
          setSort(null);
          closeMenu();
        }}
      >
        정렬 해제
      </MenuButton>

      {filterKind && onFilterChange && (
        <>
          <MenuDivider />
          <button
            ref={filterTriggerRef}
            type="button"
            onMouseEnter={() => {
              if (!filterOpen) {
                setFilterOpen(true);
                requestAnimationFrame(updateFilterMenuPosition);
              }
            }}
            onClick={toggleFilterMenu}
            className={`flex h-[42px] w-full items-center gap-3 px-4 text-left text-[14px] transition-colors hover:bg-[#F5F7FA] ${
              filterOpen ? "bg-[#F5F7FA] text-[#1F2937]" : "text-[#344054]"
            }`}
          >
            <span className="relative flex h-[18px] w-[18px] items-center justify-center">
              <ListFilter className="h-[18px] w-[18px]" strokeWidth={1.9} />
              {filterActive && (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white bg-[#2563EB]" />
              )}
            </span>
            <span className="flex-1">필터</span>
            <ChevronRight className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </button>
        </>
      )}

      {(onTogglePin || onDeleteColumn) && <MenuDivider />}

      {onTogglePin && (
        <MenuButton
          icon={
            pinned ? (
              <PinOff className="h-[18px] w-[18px]" strokeWidth={1.9} />
            ) : (
              <Pin className="h-[18px] w-[18px]" strokeWidth={1.9} />
            )
          }
          onClick={() => {
            onTogglePin();
            closeMenu();
          }}
        >
          {pinned ? "고정 해제" : "왼쪽에 고정"}
        </MenuButton>
      )}

      {onDeleteColumn && (
        <MenuButton
          danger
          icon={<Trash2 className="h-[18px] w-[18px]" strokeWidth={1.9} />}
          onClick={() => {
            onDeleteColumn();
            closeMenu();
          }}
        >
          컬럼 삭제
        </MenuButton>
      )}
    </div>
  ) : null;

  const filterMenu = open && filterOpen && filterKind && onFilterChange ? (
    <div
      ref={filterMenuRef}
      className="fixed z-[10000] w-[244px] overflow-hidden rounded-xl border border-[#D9E0E8] bg-white p-3 shadow-[0_12px_28px_-6px_rgba(22,28,38,0.20)]"
      style={{
        top: filterMenuPosition.top,
        left: filterMenuPosition.left,
        maxHeight: FILTER_MENU_MAX_HEIGHT,
      }}
      onClick={(event) => event.stopPropagation()}
    >
      {filterKind === "text" ? (
        <div className="space-y-3">
          <div className="text-[13px] font-medium text-[#344054]">
            포함하는 글자
          </div>
          <input
            autoFocus
            value={textFilterValue}
            onChange={(event) => setTextFilterValue(event.target.value)}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter") {
                onFilterChange(
                  textFilterValue.trim() ? [textFilterValue.trim()] : [],
                );
              }
            }}
            placeholder={`${label} 검색`}
            className="h-9 w-full rounded-lg border border-[#D9E0E8] px-3 text-[14px] text-[#344054] outline-none placeholder:text-[#A4AEBE] focus:border-[#2563EB] focus:ring-1 focus:ring-[#DBEAFE]"
          />
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setTextFilterValue("");
                onFilterChange([]);
              }}
              className="rounded-md px-2 py-1.5 text-[13px] text-[#79859A] hover:bg-[#F5F7FA] hover:text-[#344054]"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={() =>
                onFilterChange(
                  textFilterValue.trim() ? [textFilterValue.trim()] : [],
                )
              }
              className="rounded-md bg-[#2563EB] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#1D4ED8]"
            >
              적용
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filterOptions.length > 6 && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
              <input
                value={filterSearch}
                onChange={(event) => setFilterSearch(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
                placeholder="검색"
                className="h-9 w-full rounded-lg border border-[#D9E0E8] pl-8 pr-3 text-[14px] text-[#344054] outline-none placeholder:text-[#A4AEBE] focus:border-[#2563EB] focus:ring-1 focus:ring-[#DBEAFE]"
              />
            </div>
          )}

          <div className="max-h-[232px] overflow-y-auto pr-1">
            {filteredOptions.length === 0 ? (
              <p className="px-2 py-5 text-center text-[13px] text-[#98A2B3]">
                선택할 값이 없습니다.
              </p>
            ) : (
              filteredOptions.map((option) => {
                const checked = filterValues.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleSelectFilter(option)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] text-[#344054] hover:bg-[#F5F7FA]"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked
                          ? "border-[#2563EB] bg-[#2563EB] text-white"
                          : "border-[#CBD5E1] bg-white"
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className="truncate">{option}</span>
                  </button>
                );
              })
            )}
          </div>

          {filterActive && (
            <div className="border-t border-[#E3E8EF] pt-2 text-right">
              <button
                type="button"
                onClick={() => onFilterChange([])}
                className="rounded-md px-2 py-1.5 text-[13px] text-[#79859A] hover:bg-[#F5F7FA] hover:text-[#344054]"
              >
                초기화
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          updateMenuPosition();
          setOpen((previous) => {
            const next = !previous;
            if (!next) setFilterOpen(false);
            return next;
          });
        }}
        className={`inline-flex h-5 w-5 items-center justify-center rounded-md transition-colors group-hover/header:opacity-100 ${
          open
            ? "bg-[#EAF2FF] text-[#2563EB] opacity-100"
            : "text-[#98A2B3] opacity-0 hover:bg-[#EEF2F6] hover:text-[#344054]"
        }`}
        aria-label={`${label} 컬럼 메뉴`}
        aria-expanded={open}
      >
        <ChevronDown className="h-4 w-4" strokeWidth={2.1} />
      </button>

      {typeof document !== "undefined" && menu
        ? createPortal(menu, document.body)
        : null}
      {typeof document !== "undefined" && filterMenu
        ? createPortal(filterMenu, document.body)
        : null}
    </>
  );
}

function MenuDivider() {
  return <div className="my-1 h-px bg-[#E3E8EF]" />;
}

function MenuButton({
  children,
  icon,
  active = false,
  disabled = false,
  danger = false,
  onClick,
}: {
  children: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-[42px] w-full items-center gap-3 px-4 text-left text-[14px] transition-colors disabled:pointer-events-none disabled:text-[#C7CDD6] ${
        danger
          ? "text-[#E5484D] hover:bg-[#FFF1F2]"
          : active
            ? "bg-[#EFF6FF] font-medium text-[#2563EB]"
            : "text-[#344054] hover:bg-[#F5F7FA]"
      }`}
    >
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        {icon}
      </span>
      <span>{children}</span>
    </button>
  );
}
