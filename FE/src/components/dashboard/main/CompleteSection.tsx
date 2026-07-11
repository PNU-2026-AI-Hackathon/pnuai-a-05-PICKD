import { useState } from "react";
import { Icon } from "@iconify/react";

interface CompletedSectionProps {
  applications?: any[];
  onOpenApplication?: (application: any) => void;
}

function getText(...values: unknown[]) {
  const value = values.find(
    (v) => typeof v === "string" && v.trim().length > 0,
  );

  return typeof value === "string" ? value : undefined;
}

function formatDate(value: unknown) {
  if (!value) return "-";
  return String(value).slice(0, 10);
}

function getYear(value: unknown) {
  if (!value) return "연도";
  const match = String(value).match(/\d{4}/);
  return match?.[0] ?? "연도";
}

function getCompanyName(app: any) {
  return (
    getText(app.companyName, app.company, app.notice?.companyName) ??
    "회사명 없음"
  );
}

function getEmploymentType(app: any) {
  return getText(
    app.employmentType,
    app.employType,
    app.careerType,
    app.jobType,
    app.notice?.jobType,
  ) ?? "고용형태 없음";
}

function getPosition(app: any) {
  return (
    getText(
      app.position,
      app.notice?.position,
      app.notice?.jobTitle,
    ) ?? "직무 없음"
  );
}

function getJobTitle(app: any) {
  return (
    getText(
      app.jobTitle,
      app.noticeName,
      app.notice?.noticeName,
      app.notice?.jobTitle,
    ) ?? "공고명 없음"
  );
}


function getFinalResult(app: any) {
  return (
    getText(
      app.finalResult,
      app.finalResultLabel,
      app.resultDetail,
      app.resultStatusDetail,
      app.resultStatus,
    ) ?? "세부 결과 미선택"
  );
}

function getResultDate(app: any) {
  return formatDate(
    app.resultDate ??
      app.resultCheckedDate ??
      app.finalResultDate ??
      app.updatedAt ??
      app.deadlineDate,
  );
}

function getFileTitle(app: any) {
  const year = getYear(
    app.resultDate ?? app.updatedAt ?? app.deadlineDate ?? app.createdAt,
  );

  return [year, getCompanyName(app), getPosition(app), getEmploymentType(app)].join("_");
}

export default function CompletedSection({
  applications = [],
  onOpenApplication,
}: CompletedSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"file" | "grid">("file");

  const displayApps = applications.filter((app) => {
    return (app.status ?? app.resultStatus) === "전형완료";
  });

  return (
    <section className="rounded-2xl border border-[#D8E0EA] bg-white mt-4">
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
            완료된 공고
          </h2>

          <span className="text-sm text-[#64748B]">{displayApps.length}건</span>
        </button>

        {isOpen && (
          <div className="flex rounded-lg border border-[#D8E0EA] bg-[#F8FAFC] p-[2px]">
            <button
              type="button"
              onClick={() => setViewMode("file")}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                viewMode === "file"
                  ? "bg-white text-[#334155] shadow-sm"
                  : "text-[#64748B] hover:bg-white/70"
              }`}
              data-tooltip="파일함형" aria-label="파일함형"
            >
              <Icon icon="lucide:folder" className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                viewMode === "grid"
                  ? "bg-white text-[#334155] shadow-sm"
                  : "text-[#64748B] hover:bg-white/70"
              }`}
              data-tooltip="카드형" aria-label="카드형"
            >
              <Icon icon="lucide:layout-grid" className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="px-5 pb-5">
          {displayApps.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-base text-[#64748B]">
              완료된 공고가 없습니다.
            </div>
          ) : viewMode === "file" ? (
            <div className="grid min-h-[150px] grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-6 px-2 pt-4">
              {displayApps.map((app) => {
                const finalResult = getFinalResult(app);
                const isUnselected = finalResult === "세부 결과 미선택";

                return (
                  <button
                    type="button"
                    key={app.id}
                    onClick={() => onOpenApplication?.(app)}
                    className="group flex w-[132px] flex-col items-center text-center"
                    data-tooltip={isUnselected ? "클릭해서 결과 선택" : undefined}
                  >
                    <Icon
                      icon="lucide:folder"
                      className="h-[72px] w-[72px] text-[#94A3B8] transition group-hover:text-[#64748B]"
                    />

                    <span className="mt-2 line-clamp-2 max-w-[128px] text-sm font-medium leading-5 text-[#64748B]">
                      {getFileTitle(app)}
                    </span>

                    <span
                      className={`mt-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                        isUnselected
                          ? "bg-[#FFF7ED] text-[#EA580C] ring-[#FED7AA]"
                          : "bg-white text-[#475569] ring-[#D8E0EA]"
                      }`}
                    >
                      {finalResult}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid min-h-[150px] grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-4">
              {displayApps.map((app) => {
                const companyName = getCompanyName(app);
                const employmentType = getEmploymentType(app);
                const position = getPosition(app);
                const jobTitle = getJobTitle(app);
                const resultDate = getResultDate(app);
                const finalResult = getFinalResult(app);
                const isUnselected = finalResult === "세부 결과 미선택";

                return (
                  <button
                    type="button"
                    key={app.id}
                    onClick={() => onOpenApplication?.(app)}
                    className="min-h-[144px] rounded-xl border border-[#D8E0EA] bg-[#F8FAFC] p-4 text-left transition hover:border-[#94A3B8] hover:bg-white"
                    data-tooltip={isUnselected ? "클릭해서 결과 선택" : undefined}
                  >
                    <h3 className="truncate text-[15px] font-semibold text-[#0F172A]">
                      {companyName}
                    </h3>

                    <p className="mt-2 truncate text-sm text-[#64748B]">
                      {jobTitle}
                    </p>

                    <p className="mt-2 text-sm text-[#64748B]">
                      {position} · {employmentType}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#64748B]">
                      <span>결과 확인일 {resultDate}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ring-1 ${
                          isUnselected
                            ? "bg-[#FFF7ED] text-[#EA580C] ring-[#FED7AA]"
                            : "bg-white text-[#475569] ring-[#D8E0EA]"
                        }`}
                      >
                        {finalResult}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
