import { Icon } from "@iconify/react";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { COLUMN_OPTIONS, DEFAULT_COLUMNS } from "../../../../types/application";

interface Props {
  show: boolean;
  setShow: (value: boolean) => void;
  filters: { key: string; value: string }[];
  sort: { key: string; order: "asc" | "desc" } | null;
  groupedFilters: Record<string, string[]>;

  setFilters: Dispatch<SetStateAction<{ key: string; value: string }[]>>;
  setSort: Dispatch<SetStateAction<{ key: string; order: "asc" | "desc" } | null>>;

  visibleColumns: string[];
  setVisibleColumns: Dispatch<SetStateAction<string[]>>;
  searchKeyword: string;
  setSearchKeyword: Dispatch<SetStateAction<string>>;
  viewMode: "table" | "board";
  setViewMode: Dispatch<SetStateAction<"table" | "board">>;
}

const SORT_OPTIONS = [
  { key: "deadlineDate", order: "asc", label: "마감일 가까운 순" },
  { key: "deadlineDate", order: "desc", label: "마감일 먼 순" },
  { key: "createdAt", order: "desc", label: "최근 등록 순" },
  { key: "createdAt", order: "asc", label: "오래된 등록 순" },
  { key: "updatedAt", order: "desc", label: "최근 수정 순" },
  { key: "company", order: "asc", label: "기업명 가나다 순" },
] as const;

export const getSortLabel = (sort: Props["sort"]) => {
  if (!sort) return "정렬";

  return (
    SORT_OPTIONS.find(
      (option) => option.key === sort.key && option.order === sort.order,
    )?.label ?? "정렬"
  );
};

export default function ActiveFilter({
  setShow,
  setFilters,
  setSort,
  visibleColumns,
  setVisibleColumns,
  searchKeyword,
  setSearchKeyword,
  viewMode,
  setViewMode,
  sort,
}: Props) {
  const columnRef = useRef<HTMLDivElement | null>(null);
  const sortRef = useRef<HTMLDivElement | null>(null);
  const [isColumnOpen, setIsColumnOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  useEffect(() => {
    setShow(false);
    setFilters([]);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (columnRef.current && !columnRef.current.contains(target)) {
        setIsColumnOpen(false);
      }

      if (sortRef.current && !sortRef.current.contains(target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <div className="ml-auto flex w-fit items-center gap-2">
        <div ref={sortRef} className="relative">
          <button
            type="button"
            onClick={() => setIsSortOpen((prev) => !prev)}
            className="flex h-10 items-center gap-2 rounded-xl border border-[#D8E0EA] bg-white px-3 text-sm font-medium text-[#334155] hover:bg-[#F8FAFC]"
            title="정렬"
          >
            <Icon icon="lucide:arrow-up-down" width={16} height={16} />
            <span>{getSortLabel(sort)}</span>
            <Icon icon="mdi:chevron-down" width={18} />
          </button>

          {isSortOpen && (
            <div className="absolute right-0 top-12 z-50 w-[190px] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-lg">
              {SORT_OPTIONS.map((option) => {
                const active = sort?.key === option.key && sort?.order === option.order;

                return (
                  <button
                    key={`${option.key}-${option.order}`}
                    type="button"
                    onClick={() => {
                      setSort({ key: option.key, order: option.order });
                      setIsSortOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[#F8FAFC] ${
                      active ? "font-semibold text-[#2563EB]" : "text-[#334155]"
                    }`}
                  >
                    <span>{option.label}</span>
                    {active && <Icon icon="mdi:check" className="text-[18px]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center rounded-lg border border-[#D8E0EA] bg-[#F8FAFC] p-[2px]">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
              viewMode === "table"
                ? "bg-white text-[#334155] shadow-sm"
                : "text-[#64748B] hover:bg-white/70"
            }`}
            title="표 보기"
          >
            <Icon icon="lucide:table-2" width={17} height={17} />
          </button>

          <button
            type="button"
            onClick={() => setViewMode("board")}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
              viewMode === "board"
                ? "bg-white text-[#334155] shadow-sm"
                : "text-[#64748B] hover:bg-white/70"
            }`}
            title="칸반 보기"
          >
            <Icon icon="lucide:columns-3" width={17} height={17} />
          </button>
        </div>

        <div className="flex h-10 w-[280px] items-center gap-2 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] px-3 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#BFDBFE]">
          <Icon icon="mdi:magnify" className="text-[20px] text-[#64748B]" />

          <input
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="기업명 / 공고명"
            className="w-full bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#64748B]"
          />
        </div>

        <div ref={columnRef} className="relative">
          <button
            onClick={() => setIsColumnOpen(!isColumnOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#F1F5F9] transition hover:bg-gray-50"
            title="컬럼 설정"
          >
            <Icon
              icon="material-symbols:view-column-outline"
              className="text-[24px] text-[#64748B]"
            />
          </button>

          {isColumnOpen && (
            <div className="absolute right-0 top-12 z-50 w-[280px] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-lg">
              <div className="border-b border-[#F1F5F9] px-6 py-4">
                <p className="text-[15px] font-semibold text-[#334155]">
                  표시할 컬럼 선택
                </p>
              </div>

              <div className="py-2">
                {COLUMN_OPTIONS.map((column) => {
                  const checked = visibleColumns.includes(column.key);

                  return (
                    <button
                      key={column.key}
                      onClick={() => toggleColumn(column.key)}
                      className="flex w-full items-center justify-between px-6 py-2 hover:bg-[#F8FAFC]"
                    >
                      <span className="text-[15px] text-[#334155]">
                        {column.label}
                      </span>

                      {checked && (
                        <Icon
                          icon="mdi:check"
                          className="text-[20px] text-[#3B82F6]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setVisibleColumns(DEFAULT_COLUMNS)}
                className="flex w-full items-center gap-2 border-t border-[#F1F5F9] px-6 py-3 text-[#64748B] hover:bg-[#F8FAFC]"
              >
                <Icon icon="mdi:restore" className="text-[18px]" />
                기본값으로 초기화
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
