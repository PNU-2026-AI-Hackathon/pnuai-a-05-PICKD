import { Icon } from "@iconify/react";
import { useState, useRef, useEffect } from "react";

interface Props {
  columnKey: string;
  values: string[];
  onSelect: (value: string | null) => void;
}

export default function TableFilterDropdown({
  columnKey,
  values,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

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
        <Icon icon="mdi:chevron-down" width={18} />
      </button>

      {open && (
        <div className="absolute top-10 left-0 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-2 z-[999] min-w-[120px]">
          {values.map((value) => (
            <div
              key={value}
              onClick={() => {
                onSelect(value);
                setOpen(false);
              }}
              className="px-2 py-2 text-sm font-medium hover:bg-gray-100 rounded-lg cursor-pointer whitespace-nowrap"
            >
              {columnKey === "applyDate" && value ? value.split("T")[0] : value}
            </div>
          ))}
          <div
            onClick={() => {
              onSelect(null);
              setOpen(false);
            }}
            className="px-2 py-2 text-sm font-medium hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            전체
          </div>
        </div>
      )}
    </div>
  );
}
