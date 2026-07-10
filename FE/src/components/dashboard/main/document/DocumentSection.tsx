import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import DocumentCard from "./DocumentCard";
import DocumentList from "./DocumentList";
import type { DocumentItem } from "../../../../types/document";
import { updateDocument } from "../../../../api/document";
import { parseLocalDateTime } from "../../../../utils/date";

interface Props {
  documents?: DocumentItem[];
}

const isWritingDocument = (document: DocumentItem) => {
  const documentStatus = String(document.status ?? "").replace(/\s/g, "");
  return documentStatus === "작성중" && document.application?.status === "WRITING";
};

const getDeadlineTime = (document: DocumentItem) => {
  const parsed = parseLocalDateTime(document.application?.deadlineDate);
  return parsed?.getTime() ?? Number.MAX_SAFE_INTEGER;
};

export default function DocumentSection({
  documents: initialDocuments = [],
}: Props) {
  const [view, setView] = useState<"card" | "list">("card");
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  const displayDocuments = useMemo(() => {
    return documents
      .filter(isWritingDocument)
      .sort((a, b) => {
        const importantDiff =
          Number(Boolean(b.application?.important)) -
          Number(Boolean(a.application?.important));

        if (importantDiff !== 0) return importantDiff;
        return getDeadlineTime(a) - getDeadlineTime(b);
      });
  }, [documents]);

  const handleStatusChange = async (
    id: number,
    status: DocumentItem["status"],
  ) => {
    const target = documents.find((document) => document.id === id);
    if (!target) return;

    setDocuments((prev) =>
      prev.map((document) =>
        document.id === id ? { ...document, status } : document,
      ),
    );

    try {
      await updateDocument(id, { ...target, status });
    } catch (error) {
      console.error("서류 상태 변경 실패:", error);
      setDocuments((prev) =>
        prev.map((document) =>
          document.id === id
            ? { ...document, status: target.status }
            : document,
        ),
      );
      alert("서류 상태 변경에 실패했습니다.");
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-[#E2E8F0] bg-white overflow-visible">
      <div className="flex items-center justify-between px-5 pt-2 pb-1.5">
        <div className="flex items-center gap-2">
          <h2 className="text-ms font-[600] text-[#0F172A]">작성중인 서류</h2>
          <span className="text-sm text-[#94A3B8]">{displayDocuments.length}건</span>
        </div>

        <div className="flex items-center rounded-lg border border-[#D8E0EA] bg-[#F8FAFC] p-[2px]">
          <button
            onClick={() => setView("card")}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
              view === "card"
                ? "bg-white text-[#334155] shadow-sm"
                : "text-[#64748B] hover:bg-white/70"
            }`}
            data-tooltip="카드형" aria-label="카드형"
          >
            <Icon icon="mdi:view-grid-outline" width={16} />
          </button>

          <button
            onClick={() => setView("list")}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
              view === "list"
                ? "bg-white text-[#334155] shadow-sm"
                : "text-[#64748B] hover:bg-white/70"
            }`}
            data-tooltip="리스트형" aria-label="리스트형"
          >
            <Icon icon="mdi:table-large" width={16} />
          </button>
        </div>
      </div>
      {view === "card" ? (
        <div className="max-h-[320px] overflow-y-auto overflow-x-hidden px-5 pb-5">
          {displayDocuments.length === 0 ? (
            <div className="flex h-[140px] items-center justify-center text-sm text-[#94A3B8]">
              작성중인 서류가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-4">
              {displayDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  item={doc}
                  onStatusChange={(status) => handleStatusChange(doc.id, status)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <DocumentList
          documents={displayDocuments}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
