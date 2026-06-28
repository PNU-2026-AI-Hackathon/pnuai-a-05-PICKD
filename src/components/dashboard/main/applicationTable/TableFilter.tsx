import { Icon } from "@iconify/react";
import { useState, useRef, useEffect } from "react";

interface Props {
  columnKey: string;
  values?: string[];
  mode?: "filter" | "sort";

  handleSort?: (key: string, order: "asc" | "desc") => void;

  setFilters: React.Dispatch<
    React.SetStateAction<{ key: string; value: string }[]>
  >;
  setSort?: React.Dispatch<
    React.SetStateAction<{ key: string; order: "asc" | "desc" } | null>
  >;
}

export default function TableFilter({
  columnKey,
  values = [],
  mode = "filter",
  handleSort,
  setFilters,
  setSort,
}: Props) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  const addFilter = (key: string, value: string | null) => {
    if (value == null || value === "전체" || value.trim() === "") {
      setFilters((prev) => prev.filter((f) => f.key !== key));
      return;
    }

    setFilters((prev) => {
      const alreadyExists = prev.some(
        (f) => f.key === key && f.value === value,
      );
      if (alreadyExists) return prev;

      return [...prev, { key, value }];
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menu.current && !menu.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menu}>
      <button onClick={() => setOpen(!open)} className="flex items-center">
        <Icon icon={"mdi:chevron-down"} width={18} />
      </button>

      {open && (
        <div className="absolute top-5 -ml-6 z-[999]">
          <div className="relative bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-2 min-w-[140px]">
            <div className=" absolute -top-2 left-6 w-4 h-4 bg-white border-l border-t border-[#E2E8F0] rotate-45" />
            {mode === "sort" ? (
              <>
                <div
                  onClick={() => {
                    handleSort?.(columnKey, "asc");
                    setOpen(false);
                  }}
                  className="px-2 py-2 text-sm font-medium hover:bg-gray-100 rounded-lg cursor-pointer whitespace-nowrap"
                >
                  오름차순
                </div>

                <div
                  onClick={() => {
                    handleSort?.(columnKey, "desc");
                    setOpen(false);
                  }}
                  className="px-2 py-2 text-sm font-medium hover:bg-gray-100 rounded-lg cursor-pointer whitespace-nowrap"
                >
                  내림차순
                </div>

                <div
                  onClick={() => {
                    setSort?.(null);
                    setOpen(false);
                  }}
                  className="px-2 py-2 text-sm font-medium hover:bg-gray-100 rounded-lg cursor-pointer whitespace-nowrap"
                >
                  정렬 해제
                </div>
              </>
            ) : (
              <>
                {values.map((value) => (
                  <div
                    key={value}
                    onClick={() => {
                      addFilter(columnKey, value);
                      setOpen(false);
                    }}
                    className="px-2 py-2 text-sm font-medium hover:bg-gray-100 rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    {columnKey === "applyDate" && value
                      ? value.split("T")[0]
                      : value}
                  </div>
                ))}
                <div
                  onClick={() => {
                    addFilter(columnKey, null);
                    setOpen(false);
                  }}
                  className="px-2 py-2 text-sm font-medium hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  전체
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
