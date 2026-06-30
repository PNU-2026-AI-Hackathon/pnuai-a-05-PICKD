import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

const MENU_WIDTH = 160;
const VIEWPORT_PADDING = 8;

export default function TableFilter({
  columnKey,
  values = [],
  mode = "filter",
  handleSort,
  setFilters,
  setSort,
}: Props) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const nextLeft = Math.min(
      Math.max(VIEWPORT_PADDING, rect.left - 24),
      window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING,
    );

    setMenuPosition({
      top: rect.bottom + 8,
      left: nextLeft,
    });
  };

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
    if (!open) return;

    updateMenuPosition();

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;

      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
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
          className="fixed z-[9999]"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative min-w-[140px] rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-xl">
            <div className="absolute -top-2 left-6 h-4 w-4 rotate-45 border-l border-t border-[#E2E8F0] bg-white" />
            {mode === "sort" ? (
              <>
                <div
                  onClick={() => {
                    handleSort?.(columnKey, "asc");
                    setOpen(false);
                  }}
                  className="cursor-pointer whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium hover:bg-gray-100"
                >
                  오름차순
                </div>

                <div
                  onClick={() => {
                    handleSort?.(columnKey, "desc");
                    setOpen(false);
                  }}
                  className="cursor-pointer whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium hover:bg-gray-100"
                >
                  내림차순
                </div>

                <div
                  onClick={() => {
                    setSort?.(null);
                    setOpen(false);
                  }}
                  className="cursor-pointer whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium hover:bg-gray-100"
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
                    className="cursor-pointer whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium hover:bg-gray-100"
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
                  className="cursor-pointer rounded-lg px-2 py-2 text-sm font-medium hover:bg-gray-100"
                >
                  전체
                </div>
              </>
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={(event) => {
          event.stopPropagation();
          updateMenuPosition();
          setOpen((prev) => !prev);
        }}
        className="flex items-center"
      >
        <Icon icon="mdi:chevron-down" width={18} />
      </button>

      {menuContent}
    </div>
  );
}
