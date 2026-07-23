import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, LayoutList } from "lucide-react";
import DocumentCard from "./DocumentCard";
import DocumentList from "./DocumentList";
import type { DocumentItem } from "../../../../types/document";
import { parseLocalDateTime } from "../../../../utils/date";
import { useApplication } from "../../../../context/ApplicationContext";

interface Props {
  documents?: DocumentItem[];
}

const isWritingDocument = (document: DocumentItem) => {
  const documentStatus = String(document.status ?? "").replace(/\s/g, "");
  const applicationStatus = String(document.application?.status ?? "");

  return (
    documentStatus === "작성중" &&
    (applicationStatus === "WRITING" || applicationStatus === "작성중")
  );
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
  const { updateApplication } = useApplication();

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

  const handleToggleImportant = async (document: DocumentItem) => {
    const applicationId = document.application?.id ?? document.applicationId;
    if (!applicationId) return;

    const nextImportant = !document.application?.important;

    setDocuments((previous) =>
      previous.map((item) =>
        (item.application?.id ?? item.applicationId) === applicationId
          ? {
              ...item,
              application: item.application
                ? { ...item.application, important: nextImportant }
                : item.application,
            }
          : item,
      ),
    );

    try {
      await updateApplication(applicationId, { important: nextImportant });
    } catch (error) {
      console.error("공고 즐겨찾기 변경 실패:", error);
      setDocuments(initialDocuments);
      alert("즐겨찾기 변경에 실패했습니다.");
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-[#E3E8EF] bg-white">
      <div className="flex items-center justify-between border-b border-[#E3E8EF] px-4 pb-1.5 pt-2">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-semibold text-[#161C26]">
            작성중인 서류
          </h2>
          <span className="text-[13px] text-[#79859A]">
            {displayDocuments.length}건
          </span>
        </div>

        <div className="inline-flex items-center gap-0.5 rounded-md border border-[#E3E8EF] bg-[#F6F8FB] p-0.5">
          <button
            type="button"
            onClick={() => setView("card")}
            aria-label="카드형"
            className={`inline-flex h-[26px] w-[26px] items-center justify-center rounded transition-colors ${
              view === "card"
                ? "bg-white text-[#28303D] shadow-sm"
                : "text-[#79859A] hover:text-[#28303D]"
            }`}
            data-tooltip="카드형"
          >
            <LayoutGrid className="h-4 w-4" strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={() => setView("list")}
            aria-label="리스트형"
            className={`inline-flex h-[26px] w-[26px] items-center justify-center rounded transition-colors ${
              view === "list"
                ? "bg-white text-[#28303D] shadow-sm"
                : "text-[#79859A] hover:text-[#28303D]"
            }`}
            data-tooltip="리스트형"
          >
            <LayoutList className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {displayDocuments.length === 0 ? (
        <div className="px-4 py-8 text-center text-[14px] text-[#79859A]">
          작성 중인 서류가 없어요.
        </div>
      ) : view === "card" ? (
        <div className="grid grid-cols-1 gap-3.5 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {displayDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              item={document}
              onToggleImportant={handleToggleImportant}
            />
          ))}
        </div>
      ) : (
        <DocumentList
          documents={displayDocuments}
          onToggleImportant={handleToggleImportant}
        />
      )}
    </section>
  );
}
