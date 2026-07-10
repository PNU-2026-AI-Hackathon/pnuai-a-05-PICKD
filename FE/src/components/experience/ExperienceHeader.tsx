import { Download } from "lucide-react";

interface Props {
  onOpenPaste?: () => void;
  onExtract?: () => void;
  onExportExcel?: () => void;
}

export default function ExperienceHeader({
  onExportExcel,
}: Props) {
  const actions = [
    {
      label: "Excel 내보내기",
      icon: Download,
      onClick: onExportExcel,
    },
  ];

  return (
    <div className="flex items-start justify-between gap-10">
      <div>
        <h1 className="text-[40px] font-[700] tracking-[-0.02em] text-[#0F172A]">
          경험정리
        </h1>
        <p className="mt-2 text-[16px] text-[#64748B]">
          경험과 스펙을 한 곳에서 정리하고, 자소서·면접에 바로 꺼내 쓰세요.
        </p>
      </div>

      <div className="flex items-center gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="inline-flex h-[44px] items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 text-[14px] font-[500] text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
            >
              {Icon && <Icon size={16} className="text-[#475569]" />}
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
