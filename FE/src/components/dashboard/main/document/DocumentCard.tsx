import { type DocumentItem } from "../../../../types/document";
import DocumentStatus from "./DocumentStatus";
import { getDDay, formatApplicationDate } from "../../../../utils/date";
import { getRelativeTime } from "../../../../utils/document";

interface Props {
  item: DocumentItem;
  onStatusChange?: (status: DocumentItem["status"]) => void;
}

const getEmploymentType = (item: DocumentItem) =>
  item.application?.employmentType ||
  item.application?.employType ||
  item.application?.careerType ||
  item.application?.jobType ||
  "-";

const getDocumentTitle = (item: DocumentItem) => {
  const company = item.application?.company || item.company || "회사명 없음";
  const position = item.application?.position || item.application?.jobTitle || "직무 없음";
  const employmentType = getEmploymentType(item);

  return [company, position, employmentType].filter(Boolean).join(" ");
};

export default function DocumentCard({ item, onStatusChange }: Props) {
  const deadlineDate = item.application?.deadlineDate;

  return (
    <div className="w-[270px] rounded-[18px] border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[18px] font-[600] text-[#0F172A]">
            {getDocumentTitle(item)}
          </h3>

          <p className="mt-1 text-sm text-[#64748B]">
            {item.type} · {item.status}
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

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm text-[#64748B]">
          <span>마감 {formatApplicationDate(deadlineDate)}</span>

          <span>·</span>

          <span>{getDDay(deadlineDate)}</span>
        </div>

        <span className="shrink-0 text-sm text-[#64748B]">
          {getRelativeTime(item.updatedAt)}
        </span>
      </div>
    </div>
  );
}
