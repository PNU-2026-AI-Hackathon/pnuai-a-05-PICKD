import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import DocumentCard from "./DocumentCard";
import DocumentList from "./DocumentList";
import type { DocumentItem } from "../../../../types/document";

interface Props {
  documents?: DocumentItem[];
}

export default function DocumentSection({
  documents: initialDocuments = [],
}: Props) {
  const [view, setView] = useState<"card" | "list">("card");
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);

  useEffect(() => {
    setDocuments(initialDocuments);
  }, [initialDocuments]);

  return (
    <div className="mt-6 rounded-2xl border border-[#E2E8F0] bg-white overflow-visible">
      <div className="flex items-center justify-between px-5 pt-2 pb-1.5">
        <div className="flex items-center gap-2">
          <h2 className="text-ms font-[600] text-[#0F172A]">작성중인 서류</h2>
          <span className="text-sm text-[#94A3B8]">{documents.length}건</span>
        </div>

        <div className="flex items-center rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-0.5">
          <button
            onClick={() => setView("card")}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
              view === "card"
                ? "bg-white text-[#0F172A] shadow-sm"
                : "text-[#64748B]"
            }`}
          >
            <Icon icon="mdi:view-grid-outline" width={16} />
          </button>

          <button
            onClick={() => setView("list")}
            className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
              view === "list"
                ? "bg-white text-[#0F172A] shadow-sm"
                : "text-[#64748B]"
            }`}
          >
            <Icon icon="mdi:table-large" width={16} />
          </button>
        </div>
      </div>
      {view === "card" ? (
        <div className="h-[195px] overflow-y-auto snap-y snap-mandatory px-5 pb-5">
          <div className="flex flex-wrap gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="snap-start">
                <DocumentCard
                  item={doc}
                  onStatusChange={(status) => {
                    setDocuments((prev) =>
                      prev.map((d) => (d.id === doc.id ? { ...d, status } : d)),
                    );
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <DocumentList
          documents={documents}
          onStatusChange={(id, status) => {
            setDocuments((prev) =>
              prev.map((doc) => (doc.id === id ? { ...doc, status } : doc)),
            );
          }}
        />
      )}
    </div>
  );
}
