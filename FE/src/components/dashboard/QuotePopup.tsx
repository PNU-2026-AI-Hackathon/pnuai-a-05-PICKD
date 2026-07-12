import { useEffect, useMemo, useRef, useState } from "react";
import { Quote, X } from "lucide-react";
import { CloverIcon } from "../../assets";
import QUOTES from "../../constants/quotes.json";

export const QuotePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement | null>(null);

  const currentQuote = useMemo(() => {
    const today = new Date();
    const dateSeed =
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();

    const index = dateSeed % QUOTES.length;
    return QUOTES[index];
  }, []);

  const togglePopup = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && popupRef.current && !popupRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={popupRef} className="relative inline-block">
      {/* 클로버 아이콘 버튼 */}
      <button
        onClick={togglePopup}
        className="flex items-center justify-center"
        aria-label="오늘의 명언 보기"
      >
        <CloverIcon size={30} />
      </button>

      {/* 팝업 창 */}
      <div
        className={`absolute top-14 right-[-8px] z-[9999] w-80 origin-top-right rounded-[20px] border border-[#E2E8F0] bg-white shadow-[0_20px_45px_rgba(15,23,42,0.14)] transition-all duration-200 ease-out ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        <div className="absolute -top-2 right-5 h-4 w-4 rotate-45 rounded-tl-[3px] border-l border-t border-[#E2E8F0] bg-white" />

        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-1.5">
            <CloverIcon size={16} />
            <span className="text-[12px] font-semibold text-[#008463]">
              오늘의 응원
            </span>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            aria-label="닫기"
            className="flex h-6 w-6 items-center justify-center rounded-full text-[#94A3B8] transition hover:bg-[#F1F5F9] hover:text-[#475569]"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 px-6 pb-5 pt-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#E6FFF6] to-[#D1FADF] text-[#008463]">
            <Quote size={20} fill="currentColor" strokeWidth={0} />
          </div>

          <p className="text-center text-[15px] font-medium leading-relaxed text-[#1E293B]">
            {currentQuote}
          </p>

          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#008463]">
            <span className="h-px w-4 bg-[#A7F3D0]" />
            Pickd가 응원합니다
            <span className="h-px w-4 bg-[#A7F3D0]" />
          </div>
        </div>
      </div>
    </div>
  );
};
