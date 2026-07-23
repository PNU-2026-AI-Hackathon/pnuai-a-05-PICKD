import { FilePlus, Pencil, X } from "lucide-react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  onDirectInput: () => void;
  onImport: () => void;
}

export default function ExperienceEntryModal({
  open,
  onClose,
  onDirectInput,
  onImport,
}: Props) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/35 px-4 backdrop-blur-[1px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="w-full max-w-[420px] overflow-hidden rounded-xl border border-[#E3E8EF] bg-white shadow-[0_24px_60px_-16px_rgba(15,23,42,0.34)]">
        <header className="flex items-start justify-between border-b border-[#E3E8EF] px-5 py-4">
          <div>
            <h2 className="text-[16px] font-[700] text-[#161C26]">경험 추가</h2>
            <p className="mt-1 text-[13px] leading-5 text-[#79859A]">
              시작 방식을 선택하세요. 유형은 작성 화면에서 언제든 바꿀 수 있어요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#79859A] hover:bg-[#EFF2F6] hover:text-[#28303D]"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid gap-2 px-5 py-4">
          <button
            type="button"
            onClick={onDirectInput}
            className="flex w-full items-start gap-3 rounded-lg border border-[#E3E8EF] px-4 py-3.5 text-left transition-colors hover:bg-[#F6F8FB]"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#EFF2F6] text-[#3E4859]">
              <Pencil className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-[600] text-[#28303D]">
                직접 작성하기
              </span>
              <span className="mt-0.5 block text-[12px] text-[#79859A]">
                빈 문서로 시작하고, 작성하면서 유형을 정해요.
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={onImport}
            className="flex w-full items-start gap-3 rounded-lg border border-[#E3E8EF] px-4 py-3.5 text-left transition-colors hover:bg-[#F6F8FB]"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#EFF2F6] text-[#3E4859]">
              <FilePlus className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-[600] text-[#28303D]">
                자소서 파일 불러오기
              </span>
              <span className="mt-0.5 block text-[12px] text-[#79859A]">
                기존 자소서에서 경험을 자동으로 추출해요.
              </span>
            </span>
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
