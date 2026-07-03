import { useState } from "react";
import { Icon } from "@iconify/react";

interface CompletedSectionProps {
  applications?: any[];
  onCompanyClick?: (application: any) => void;
}

export default function CompletedSection({
  applications = [],
  onCompanyClick = () => {},
}: CompletedSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"file" | "grid">("grid");

  const realCompletedApps = applications.filter(
    (app) =>
      app.status === "COMPLETED" ||
      app.status === "완료" ||
      app.status === "불합격" ||
      app.status === "합격" ||
      app.status === "최종 결과",
  );

  const displayApps = realCompletedApps;

  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white">
      <div className="flex items-center justify-between px-5 py-4">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2"
        >
          <Icon
            icon={isOpen ? "lucide:chevron-down" : "lucide:chevron-right"}
            className="text-[#64748B]"
          />
          <h2 className="text-[16px] font-semibold text-[#0F172A]">
            완료된 지원
          </h2>
          <span className="text-sm text-[#64748B]">{displayApps.length}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`rounded-md px-2 py-1 text-sm ${
              viewMode === "grid"
                ? "bg-[#EEF2FF] text-[#4F46E5]"
                : "text-[#64748B]"
            }`}
          >
            그리드
          </button>
          <button
            type="button"
            onClick={() => setViewMode("file")}
            className={`rounded-md px-2 py-1 text-sm ${
              viewMode === "file"
                ? "bg-[#EEF2FF] text-[#4F46E5]"
                : "text-[#64748B]"
            }`}
          >
            파일
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="px-5 pb-5">
          {displayApps.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#64748B]">
              완료된 지원 내역이 없습니다.
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {displayApps.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => onCompanyClick(app)}
                  className="rounded-xl border border-[#E5E7EB] bg-white p-4 text-left transition hover:border-[#CBD5E1] hover:bg-[#F8FAFC]"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-[#0F172A]">
                      {app.companyName ?? app.company ?? "회사명 없음"}
                    </h3>
                    <span className="rounded-full bg-[#F1F5F9] px-2 py-1 text-xs text-[#475569]">
                      {app.status}
                    </span>
                  </div>

                  <p className="text-sm text-[#334155]">
                    {app.jobTitle ?? app.position ?? "직무 없음"}
                  </p>

                  <p className="mt-2 text-xs text-[#94A3B8]">
                    결과일:{" "}
                    {app.resultDate ?? app.updatedAt ?? app.deadlineDate ?? "-"}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {displayApps.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => onCompanyClick(app)}
                  className="flex w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-left transition hover:bg-[#F8FAFC]"
                >
                  <div>
                    <p className="font-medium text-[#0F172A]">
                      {app.companyName ?? app.company ?? "회사명 없음"}
                    </p>
                    <p className="text-sm text-[#64748B]">
                      {app.jobTitle ?? app.position ?? "직무 없음"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-[#475569]">{app.status}</p>
                    <p className="text-xs text-[#94A3B8]">
                      {app.resultDate ??
                        app.updatedAt ??
                        app.deadlineDate ??
                        "-"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
