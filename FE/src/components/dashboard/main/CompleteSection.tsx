import { useState } from "react";
import { Icon } from "@iconify/react";

interface CompletedSectionProps {
  applications?: any[];
}

const COMPLETED_STATUSES = new Set(["전형완료"]);

const REGISTRATION_LABEL_MAP: Record<string, string> = {
  MANUAL: "수기등록",
  USER: "수기등록",
  DIRECT: "수기등록",
  AI: "AI등록",
  AUTO: "AI등록",
};

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

function getJobType(app: any) {
  return getText(
    app.jobType,
    app.employmentType,
    app.careerType,
    app.notice?.jobType,
  );
}

function getJobTitle(app: any) {
  return (
    getText(
      app.jobTitle,
      app.position,
      app.notice?.jobTitle,
      app.notice?.position,
    ) ?? "직무 없음"
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

function getResultLabel(app: any) {
  return getText(app.finalResult, app.status) ?? "전형완료";
}

function getRegistrationLabel(app: any) {
  const raw =
    getText(
      app.registrationTypeLabel,
      app.registrationType,
      app.sourceType,
      app.source,
    ) ?? "수기등록";

  return REGISTRATION_LABEL_MAP[raw] ?? raw;
}

export default function CompletedSection({
  applications = [],
}: CompletedSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"file" | "grid">("file");

  const displayApps = applications.filter((app) => {
    const status = String(app.status ?? app.resultStatus ?? "");
    return COMPLETED_STATUSES.has(status);
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

        <div className="flex rounded-lg border border-[#D8E0EA] bg-[#F8FAFC] p-[2px]">
          <button
            type="button"
            onClick={() => setViewMode("file")}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
              viewMode === "file"
                ? "bg-white text-[#334155] shadow-sm"
                : "text-[#64748B] hover:bg-white/70"
            }`}
            title="파일 보기"
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
            title="그리드 보기"
          >
            <Icon icon="lucide:layout-grid" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="px-5 pb-5">
          {displayApps.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-base text-[#64748B]">
              완료된 공고가 없습니다.
            </div>
          ) : viewMode === "file" ? (
            <div className="flex min-h-[150px] flex-wrap items-start gap-8 px-2 pt-4">
              {displayApps.map((app) => {
                const companyName = getCompanyName(app);
                const resultDate =
                  app.resultDate ??
                  app.resultCheckedDate ??
                  app.finalResultDate ??
                  app.updatedAt ??
                  app.deadlineDate;

                return (
                  <div
                    key={app.id}
                    className="group flex w-[96px] flex-col items-center text-center"
                  >
                    <Icon
                      icon="lucide:folder"
                      className="h-[72px] w-[72px] text-[#94A3B8] transition group-hover:text-[#64748B]"
                    />

                    <span className="mt-1 text-xs leading-4 text-[#94A3B8]">
                      {getYear(resultDate)}
                    </span>

                    <span className="max-w-[88px] truncate text-sm font-medium leading-5 text-[#64748B]">
                      {companyName}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[150px] flex-wrap gap-4">
              {displayApps.map((app) => {
                const companyName = getCompanyName(app);
                const jobType = getJobType(app);
                const jobTitle = getJobTitle(app);
                const resultDate = getResultDate(app);
                const registrationLabel = getRegistrationLabel(app);
                const resultLabel = getResultLabel(app);

                return (
                  <div
                    key={app.id}
                    className="relative min-h-[144px] w-full max-w-[568px] rounded-xl border border-[#D8E0EA] bg-[#F8FAFC] p-4 text-left"
                  >
                    <div className="absolute right-4 top-4 flex items-center gap-1.5">
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs text-[#64748B]">
                        {registrationLabel}
                      </span>

                      <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-medium text-[#475569]">
                        {resultLabel}
                      </span>
                    </div>

                    <div className="pr-28">
                      <h3 className="text-[15px] font-semibold text-[#0F172A]">
                        {companyName}
                      </h3>

                      {jobType && (
                        <p className="mt-2 text-sm text-[#64748B]">{jobType}</p>
                      )}

                      <p className="mt-2 text-sm text-[#64748B]">{jobTitle}</p>

                      <p className="mt-3 text-sm text-[#64748B]">
                        결과 확인일 {resultDate}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
