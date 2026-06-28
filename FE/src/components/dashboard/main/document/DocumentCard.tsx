import { type DocumentItem } from "../../../../types/document";
import DocumentStatus from "./DocumentStatus";
import { getDDay, formatApplicationDate } from "../../../../utils/date";
import { getRelativeTime } from "../../../../utils/document";

interface Props {
  item: DocumentItem;
  onStatusChange?: (status: DocumentItem["status"]) => void;
}

export default function DocumentCard({ item, onStatusChange }: Props) {
  return (
    <div className="w-[270px] rounded-[18px] border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[20px] font-[600] text-[#0F172A]">
            {item.title}
          </h3>

          <p className="mt-1 text-sm text-[#64748B]">
            {item.company} · {item.type}
          </p>
        </div>

        <DocumentStatus
          status={item.status}
          onChange={async (status) => {
            onStatusChange?.(status);
          }}
        />
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-[500] text-[#64748B]">작성 진행률</span>

          <span className="text-xs font-[600] text-[#64748B]">
            {item.progress}%
          </span>
        </div>

        <div className="h-[8px] overflow-hidden rounded-full bg-[#F1F5F9]">
          <div
            className="h-full rounded-full bg-[#3B82F6]"
            style={{
              width: `${item.progress}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[#64748B]">
          <span>마감 {formatApplicationDate(item.application?.applyDate)}</span>

          <span>·</span>

          <span>{getDDay(item.application?.applyDate)}</span>
        </div>

        <span className="text-sm text-[#64748B]">
          {getRelativeTime(item.updatedAt)}
        </span>
      </div>
    </div>
  );
}
