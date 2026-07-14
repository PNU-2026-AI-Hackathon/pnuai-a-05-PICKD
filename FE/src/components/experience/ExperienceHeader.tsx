import { Download } from "lucide-react";

interface Props {
  onOpenPaste?: () => void;
  onExtract?: () => void;
  onExportExcel?: () => void;
}

export default function ExperienceHeader({
  onExtract,
  onExportExcel,
}: Props) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-[800] leading-tight tracking-[-0.04em] text-[#161C26]">
          경험·스펙 DB
        </h1>
        <p className="mt-1.5 text-[14px] text-[#79859A]">
          경험과 스펙을 한 곳에서 정리하고, 자소서·면접에 바로 꺼내 쓰세요.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onExportExcel}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E3E8EF] bg-white px-3 text-[15px] font-[600] text-[#3E4859] transition-colors hover:bg-[#F6F8FB]"
        >
          <Download className="h-4 w-4" />
          내보내기
        </button>
      </div>
    </div>
  );
}
