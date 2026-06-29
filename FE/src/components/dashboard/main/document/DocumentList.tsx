import { formatApplicationDate } from "../../../../utils/date";
import type { DocumentItem } from "../../../../types/document";
import { getRelativeTime } from "../../../../utils/document";
import DocumentStatus from "./DocumentStatus";

interface Props {
  documents: DocumentItem[];
  onStatusChange?: (id: number, status: DocumentItem["status"]) => void;
}

export default function DocumentList({ documents, onStatusChange }: Props) {
  return (
    <div className="max-h-[205px] overflow-y-auto overflow-x-hidden">
      <div className="sticky top-0 z-20 bg-[#F1F5F9] border-b border-[#E2E8F0]">
        <div className="grid grid-cols-[2fr_2.2fr_1fr_1.4fr_1fr_1fr] px-6 py-2 text-[13px] font-[600] text-[#334155]">
          <span>서류명</span>
          <span>연결된 공고</span>
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
            className="grid grid-cols-[2fr_2.2fr_1fr_1.4fr_1fr_1fr] items-center border-b border-[#F1F5F9] px-6 py-2"
          >
            <div className="text-[15px] font-[500] text-[#0F172A]">
              {doc.title}
            </div>
            <div className="text-[14px] text-[#64748B]">
              {doc.company} · {doc.type}
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
            </div>
            <div className="text-[14px] text-[#64748B]">
              {formatApplicationDate(doc.application?.applyDate)}
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
