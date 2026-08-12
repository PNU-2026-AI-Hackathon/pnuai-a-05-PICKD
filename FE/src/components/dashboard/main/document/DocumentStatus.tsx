import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { statusStyle } from "../../../../utils/document";
import type { DocumentItem } from "../../../../types/document";

const statuses: DocumentItem["status"][] = ["작성중", "완료"];

interface Props {
  status: DocumentItem["status"];
  onChange?: (status: DocumentItem["status"]) => Promise<void> | void;
}

export default function DocumentStatus({ status, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedDropdown = dropdownRef.current?.contains(target);
      const clickedButton = buttonRef.current?.contains(target);

      if (!clickedDropdown && !clickedButton) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    const handleScroll = () => {
      setOpen(false);
    };

    if (open) {
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          const rect = buttonRef.current?.getBoundingClientRect();
          if (rect) {
            setPosition({
              top: rect.bottom + window.scrollY + 8,
              left: rect.left + window.scrollX,
            });
          }
          setOpen((prev) => !prev);
        }}
        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-[4px] text-[11px] font-semibold ${
          statusStyle[status as keyof typeof statusStyle]
        }`}
      >
        <span>{status}</span>

        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className="absolute z-[9999]"
            style={{ top: position.top, left: position.left }}
          >
            <div className="absolute -top-[7px] left-5 w-4 h-4 bg-white border-l border-t border-[#E2E8F0] rotate-45 pointer-events-none z-10" />

            <div className="relative z-20 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-1 min-w-[110px]">
              {statuses.map((s) => (
                <div
                  key={s}
                  onClick={async (e) => {
                    e.stopPropagation();
                    await onChange?.(s);
                    setOpen(false);
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-lg cursor-pointer whitespace-nowrap transition-colors
                  ${
                    status === s
                      ? "bg-[#2563EB] text-white"
                      : "text-[#334155] hover:bg-gray-100"
                  }
                  `}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
