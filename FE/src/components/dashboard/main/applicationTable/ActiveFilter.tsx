import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { COLUMN_OPTIONS, DEFAULT_COLUMNS } from "../../../../types/application";

interface Props {
  show: boolean;
  setShow: (value: boolean) => void;
  filters: { key: string; value: string }[];
  sort: { key: string; order: "asc" | "desc" } | null;
  groupedFilters: Record<string, string[]>;

  setFilters: React.Dispatch<
    React.SetStateAction<{ key: string; value: string }[]>
  >;
  setSort: React.Dispatch<
    React.SetStateAction<{ key: string; order: "asc" | "desc" } | null>
  >;

  visibleColumns: string[];
  setVisibleColumns: React.Dispatch<React.SetStateAction<string[]>>;
  searchKeyword: string;
  setSearchKeyword: React.Dispatch<React.SetStateAction<string>>;
  viewMode: "table" | "board";
  setViewMode: React.Dispatch<React.SetStateAction<"table" | "board">>;
}

const filterLabelMap: Record<string, string> = {
  company: "기업명",
  jobTitle: "공고명",
  position: "직무",
  industry: "산업",
  status: "지원상태",
  submitted: "제출",
  applyDate: "지원기한",
  dday: "D-day",
  checklistInComplete: "할 일",
};

export default function ActiveFilter({
  show,
  setShow,
  filters,
  sort,
  groupedFilters,
  setFilters,
  setSort,
  visibleColumns,
  setVisibleColumns,
  searchKeyword,
  setSearchKeyword,
  viewMode,
  setViewMode,
}: Props) {
  const filterRef = useRef<HTMLDivElement | null>(null);
  const columnRef = useRef<HTMLDivElement | null>(null);
  const [isColumnOpen, setIsColumnOpen] = useState(false);

  const removeFilter = (key: string, value: string) => {
    setFilters((prev) =>
      prev.filter((f) => !(f.key === key && f.value === value)),
    );
  };

  const removeSort = () => {
    setSort(null);
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (filterRef.current && !filterRef.current.contains(target)) {
        setShow(false);
      }

      if (columnRef.current && !columnRef.current.contains(target)) {
        setIsColumnOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <div className="ml-auto flex items-center gap-2 w-fit">
        <div className="flex items-center rounded-[10px] border border-[#D5DEEA] bg-white p-[2px]">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`flex h-8 w-8 items-center justify-center rounded-[8px] transition ${
              viewMode === "table"
                ? "bg-[#F1F5F9] text-[#111827]"
                : "text-[#64748B] hover:bg-[#F8FAFC]"
            }`}
            title="표 보기"
          >
            <Icon icon="lucide:table-2" width={17} height={17} />
          </button>

          <button
            type="button"
            onClick={() => setViewMode("board")}
            className={`flex h-8 w-8 items-center justify-center rounded-[8px] transition ${
              viewMode === "board"
                ? "bg-[#F1F5F9] text-[#111827]"
                : "text-[#64748B] hover:bg-[#F8FAFC]"
            }`}
            title="카드 보기"
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
        <button
          onClick={() => setShow(!show)}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#F1F5F9] hover:bg-gray-50 transition"
        >
          <Icon
            icon="mdi:filter-variant"
            className="text-[24px] text-[#64748B]"
          />
        </button>
        <div ref={columnRef} className="relative">
          <button
            onClick={() => setIsColumnOpen(!isColumnOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#F1F5F9] hover:bg-gray-50 transition"
          >
            <Icon
              icon="material-symbols:view-column-outline"
              className="text-[24px] text-[#64748B]"
            />
          </button>

          {isColumnOpen && (
            <div className="absolute top-12 right-0 w-[280px] bg-white border border-[#E2E8F0] rounded-2xl shadow-lg z-50 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F1F5F9]">
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
                      className="w-full px-6 py-2 flex items-center justify-between hover:bg-[#F8FAFC]"
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
                className="w-full px-6 py-3 border-t border-[#F1F5F9] flex items-center gap-2 text-[#64748B] hover:bg-[#F8FAFC]"
              >
                <Icon icon="mdi:restore" className="text-[18px]" />
                기본값으로 초기화
              </button>
            </div>
          )}
        </div>
      </div>

      {show && (
        <div
          ref={filterRef}
          className="absolute top-12 right-0 w-[280px] bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-3 z-[40]"
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-[600] text-[#334155]">
              적용된 필터
            </span>

            <button
              onClick={() => setShow(false)}
              className="text-[#94A3B8] hover:text-[#334155]"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {Object.entries(groupedFilters).map(([key, values]) => (
              <div key={key} className="rounded-xl bg-[#F8FAFC] px-3 py-3">
                <span className="text-[11px] text-[#94A3B8]">
                  {filterLabelMap[key] || key}
                </span>

                <div className="mt-2 flex flex-col gap-2">
                  {values.map((value) => (
                    <div
                      key={value}
                      className="flex items-center gap-1 rounded-lg px-2 text-sm text-[#334155]"
                    >
                      <span>{value}</span>
                      <button
                        onClick={() => removeFilter(key, value)}
                        className="text-[#64748B] hover:text-[#334155]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {sort && (
              <div className="flex items-center justify-between gap-3 bg-[#F8FAFC] rounded-xl px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#94A3B8]">정렬</span>

                  <span className="text-sm font-[500] text-[#334155]">
                    {filterLabelMap[sort.key] || sort.key} (
                    {sort.order === "asc" ? "오름차순" : "내림차순"})
                  </span>
                </div>

                <button
                  onClick={removeSort}
                  className="shrink-0 text-[#64748B] hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            )}

            {filters.length === 0 && !sort && (
              <div className="text-sm text-[#94A3B8] text-center py-4">
                적용된 필터가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
