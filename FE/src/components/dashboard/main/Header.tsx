import { Icon } from "@iconify/react";
import { QuotePopup } from "../../../components/dashboard/QuotePopup";

export default function Header({ user }: { user: any }) {
  return (
    <div className="flex flex-col mt-[60px] mb-6 px-7 w-full gap-2">
      <div className="flex justify-end items-center gap-3 w-full">
        <button className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <Icon
            icon="mdi:bell-outline"
            className="text-[26px] text-[#94A3B8] hover:text-slate-600"
          />
        </button>
        <button className="p-1 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center">
          <QuotePopup />
        </button>
      </div>

      <div className="flex justify-between items-end w-full mt-1">
        <div>
          <h1 className="text-[40px] font-bold text-[#0F172A] font-inter">
            {user ? `${user.nickname}님의 대시보드` : "대시보드"}
          </h1>
          <p className="text-[20px] text-[#64748B] mt-1 font-inter">
            오늘도 한 걸음 더 가까이, 화이팅!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[15px] text-[#334155] font-medium hover:bg-gray-50 hover:border-slate-300 transition-all shadow-sm">
            <Icon
              icon="material-symbols:target"
              className="text-xl text-[#94A3B8]"
              width={20}
              height={20}
            />
            이번 달 목표
          </button>

          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[15px] text-[#334155] font-medium hover:bg-gray-50 hover:border-slate-300 transition-all shadow-sm">
            <Icon
              icon="uis:graph-bar"
              className="text-xl text-[#94A3B8]"
              width={20}
              height={20}
            />
            지난 달 리포트
          </button>
        </div>
      </div>
    </div>
  );
}
