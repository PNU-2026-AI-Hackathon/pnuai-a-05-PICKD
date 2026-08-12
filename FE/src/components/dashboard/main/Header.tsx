import { CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { QuotePopup } from "../../../components/dashboard/QuotePopup";

export default function Header({ user }: { user: any }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col mt-[60px] mb-6 px-7 w-full gap-2">
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
        <button
          type="button"
          onClick={() => navigate("/calendar")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-slate-500 hover:ring-2 hover:ring-blue-200"
          data-tooltip="캘린더 바로가기"
          aria-label="캘린더 바로가기"
        >
            <CalendarDays size={25} />
        </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-slate-500 hover:ring-2 hover:ring-blue-200">
            <QuotePopup />
          </div>
        </div>
      </div>
    </div>
  );
}
