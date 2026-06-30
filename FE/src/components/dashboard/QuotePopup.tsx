import { useEffect, useMemo, useRef, useState } from "react";
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
      {isOpen && (
        <div className="absolute top-14 right-[-8px] w-80 p-5 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] animate-fade-in">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 font-sans text-xl leading-none"
          >
            &times;
          </button>

          <div className="flex flex-col items-center gap-4 mt-2">
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
            <div className="flex flex-col gap-3 text-center">
              <p className="text-[15px] font-medium text-gray-800 leading-relaxed px-2">
                "{currentQuote}"
              </p>
              <p className="text-xs text-green-600 font-semibold">
                — Pickd가 응원합니다
              </p>
            </div>
          </div>

          <div className="absolute -top-2 right-5 w-4 h-4 bg-white border-t border-l border-gray-100 rotate-45"></div>
        </div>
      )}
    </div>
  );
};
