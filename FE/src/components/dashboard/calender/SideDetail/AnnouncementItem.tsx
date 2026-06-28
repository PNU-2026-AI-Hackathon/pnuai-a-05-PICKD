// AnnouncementItem.tsx 예시
interface AnnouncementItemProps {
  title: string;
  company: string;
  step: string;
  dday: string;
}

const AnnouncementItem = ({
  title,
  company,
  step,
  dday,
}: AnnouncementItemProps) => {
  return (
    <div className="flex items-start justify-between group cursor-pointer">
      <div className="flex gap-3">
        <div className="mt-1">
          <svg
            className="w-4 h-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </div>

        <div>
          <h4 className="font-semibold text-[#334155] text-[15px] mb-1">{title}</h4>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{company}</span>
            <span
              className={`px-2 py-0.5 text-[11px] rounded-md font-medium ${
                step.includes("면접")
                  ? "bg-[#C082F6]/10 text-[#C082F6]"
                  : step.includes("제출")
                    ? "bg-[#79AF86]/10 text-[#79AF86]"
                    : step.includes("마감")
                      ? "bg-[#E77975]/10 text-[#E77975]"
                      : "bg-[#CBD5E1]/10 text-[#64748B]"
              }`}
            >
              {step}
            </span>
          </div>
        </div>
      </div>

      <div
        className={`px-2.5 py-1 rounded-full text-[12px] font-bold ${
          dday === "D-Day" || dday === "D-1"
            ? "bg-red-50 text-red-600"
            : "bg-orange-50 text-orange-600"
        }`}
      >
        {dday}
      </div>
    </div>
  );
};

export default AnnouncementItem;
