import { FileText, PencilLine, X } from "lucide-react";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
      <div className="w-[460px] rounded-[8px] bg-white px-6 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[18px] font-[800] text-[#0F172A]">경험 추가</h2>
            <p className="mt-2 text-[14px] font-[500] text-[#64748B]">
              시작 방식을 선택하세요. 유형은 작성 화면에서 자유롭게 바꿀 수
              있어요.
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center text-[#64748B] transition-colors hover:text-[#0F172A]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 space-y-2">
          <button
            onClick={onDirectInput}
            className="flex w-full items-center gap-4 rounded-[8px] border border-[#E2E8F0] bg-white px-4 py-4 text-left transition-colors hover:bg-[#F8FAFC]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#F8FAFC] text-[#334155]">
              <PencilLine size={18} />
            </div>

            <div>
              <p className="text-[15px] font-[800] text-[#0F172A]">
                직접 작성하기
              </p>

              <p className="mt-1 text-[13px] font-[500] text-[#64748B]">
                빈 문서로 시작하고, 작성하면서 유형을 정해요.
              </p>
            </div>
          </button>

          <button
            onClick={onImport}
            className="flex w-full items-center gap-4 rounded-[8px] border border-[#E2E8F0] bg-white px-4 py-4 text-left transition-colors hover:bg-[#F8FAFC]"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#F8FAFC] text-[#334155]">
              <FileText size={18} />
            </div>

            <div>
              <p className="text-[15px] font-[800] text-[#0F172A]">
                자소서 파일 불러오기
              </p>

              <p className="mt-1 text-[13px] font-[500] text-[#64748B]">
                기존 자소서에서 경험을 자동으로 추출해요.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
