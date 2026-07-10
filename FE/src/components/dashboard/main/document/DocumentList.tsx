import { formatApplicationDate } from "../../../../utils/date";
import type { DocumentItem } from "../../../../types/document";
import { getRelativeTime } from "../../../../utils/document";
import DocumentStatus from "./DocumentStatus";

interface Props {
  documents: DocumentItem[];
  onStatusChange?: (id: number, status: DocumentItem["status"]) => void;
}

const getEmploymentType = (doc: DocumentItem) =>
  doc.application?.employmentType ||
  doc.application?.employType ||
  doc.application?.careerType ||
  doc.application?.jobType ||
  "-";

const getDocumentTitle = (doc: DocumentItem) => {
  const company = doc.application?.company || doc.company || "회사명 없음";
  const position = doc.application?.position || doc.application?.jobTitle || "직무 없음";
  const employmentType = getEmploymentType(doc);

  return [company, position, employmentType].filter(Boolean).join(" ");
};

export default function DocumentList({ documents, onStatusChange }: Props) {
  return (
    <div className="max-h-[260px] overflow-y-auto overflow-x-hidden">
      <div className="sticky top-0 z-20 bg-[#F1F5F9] border-b border-[#E2E8F0]">
        <div className="grid grid-cols-[2.3fr_1fr_1.2fr_1fr_1fr] px-6 py-2 text-[13px] font-[600] text-[#334155]">
          <span>서류명</span>
          <span>상태</span>
          <span>진행률</span>
          <span>마감일</span>
          <span>최근 수정일</span>
        </div>
      </div>
      {documents.length === 0 ? (
        <div className="flex h-[140px] items-center justify-center text-sm text-[#94A3B8]">
          작성중인 서류가 없습니다.
        </div>
      ) : (
        documents.map((doc) => (
          <div
            key={doc.id}
            className="grid grid-cols-[2.3fr_1fr_1.2fr_1fr_1fr] items-center border-b border-[#F1F5F9] px-6 py-2"
          >
            <div className="min-w-0">
              <div className="truncate text-[15px] font-[500] text-[#0F172A]">
                {getDocumentTitle(doc)}
              </div>
              <div className="mt-0.5 text-[13px] text-[#94A3B8]">
                {doc.type}
              </div>
            </div>
            <div>
              <DocumentStatus
                status={doc.status}
                onChange={async (status) => {
                  onStatusChange?.(doc.id, status);
                }}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-[4px] w-[120px] overflow-hidden rounded-full bg-[#E2E8F0]">
                <div
                  className="h-full rounded-full bg-[#3B82F6]"
                  style={{
                    width: `${doc.progress}%`,
                  }}
                />
              </div>
              <span className="text-xs text-[#64748B]">{doc.progress}%</span>
            </div>
            <div className="text-[14px] text-[#64748B]">
              {formatApplicationDate(doc.application?.deadlineDate)}
            </div>
            <div className="text-[14px] text-[#64748B]">
              {getRelativeTime(doc.updatedAt)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
