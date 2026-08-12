import { Star } from "lucide-react";
import { useMemo, useState } from "react";
import {
  APPLICATION_FINAL_RESULTS,
  type Application,
  type ApplicationFinalResult,
  type ApplicationStatus,
} from "../../../../types/application";
type BoardViewStatus = ApplicationStatus;

type ApplicationId = Application["id"];

interface Props {
  applications: Application[];
  onOpenApplication: (application: Application) => void;
  onToggleImportant: (applicationId: ApplicationId) => void;
  onChangeStatus: (
    applicationId: ApplicationId,
    nextStatus: string,
    finalResult?: ApplicationFinalResult,
  ) => void;
}

type FlexibleApplication = Application & {
  company?: string;
  jobTitle?: string;
  position?: string;
  employmentType?: string;
  employType?: string;
  careerType?: string;
  jobType?: string;
  status?: ApplicationStatus | string;
  deadlineDate?: string;
  dday?: string | number;
  important?: boolean;
};

const columns: {
  key: BoardViewStatus;
  title: string;
  backgroundColor: string;
  color: string;
  borderColor: string;
}[] = [
  {
    key: "작성중",
    title: "작성중",
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    borderColor: "#2563EB",
  },
  {
    key: "지원완료",
    title: "지원완료",
    backgroundColor: "#EFF2F6",
    color: "#28303D",
    borderColor: "#A4AEBE",
  },
  {
    key: "서류전형",
    title: "서류전형",
    backgroundColor: "#EEEEFB",
    color: "#4848B3",
    borderColor: "#5B5BD6",
  },
  {
    key: "필기전형",
    title: "필기전형",
    backgroundColor: "#E6F5F3",
    color: "#1F7A77",
    borderColor: "#2A9D99",
  },
  {
    key: "면접전형",
    title: "면접전형",
    backgroundColor: "#FCF3E2",
    color: "#855906",
    borderColor: "#C5860E",
  },
  {
    key: "전형완료",
    title: "전형완료",
    backgroundColor: "#EFF2F6",
    color: "#28303D",
    borderColor: "#A4AEBE",
  },
] as const;

const cn = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(" ");

const parseDate = (date?: string) => {
  if (!date) return null;

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
};

const getCompany = (application: Application) => {
  const item = application as FlexibleApplication;
  return item.company || "-";
};

const getJobTitle = (application: Application) => {
  const item = application as FlexibleApplication;
  return item.jobTitle || "-";
};

const getEmploymentType = (application: Application) => {
  const item = application as FlexibleApplication;

  return (
    item.employmentType ||
    item.employType ||
    item.careerType ||
    item.jobType ||
    "-"
  );
};

const getImportant = (application: Application) => {
  return Boolean((application as FlexibleApplication).important);
};

const getDday = (application: Application) => {
  const item = application as FlexibleApplication;

  if (item.dday !== undefined && item.dday !== null && item.dday !== "") {
    if (typeof item.dday === "number") {
      if (item.dday === 0) return { label: "D-DAY", urgent: true };
      if (item.dday > 0)
        return { label: `D-${item.dday}`, urgent: item.dday <= 3 };
      return { label: `D+${Math.abs(item.dday)}`, urgent: true };
    }

    const label = String(item.dday);
    const number = Number(label.replace(/[^0-9-]/g, ""));

    return {
      label,
      urgent: label.includes("DAY") || (!Number.isNaN(number) && number <= 3),
    };
  }

  const deadlineDate = parseDate(item.deadlineDate);
  if (!deadlineDate) return { label: "-", urgent: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = Math.ceil(
    (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diff === 0) return { label: "D-DAY", urgent: true };
  if (diff > 0) return { label: `D-${diff}`, urgent: diff <= 3 };
  return { label: `D+${Math.abs(diff)}`, urgent: true };
};

const getFinalResultClassName = (result?: ApplicationFinalResult) => {
  switch (result) {
    case "최종합격":
      return "bg-[#E7F6EF] text-[#0C6347]";
    case "불합격":
      return "bg-[#FCEBEC] text-[#932A30]";
    case "보류":
      return "bg-[#F5F3FF] text-[#6D28D9]";
    default:
      return "bg-[#EFF2F6] text-[#79859A]";
  }
};

const compareApplications = (a: Application, b: Application) => {
  const importantDiff = Number(getImportant(b)) - Number(getImportant(a));
  if (importantDiff !== 0) return importantDiff;

  const aDate = parseDate((a as FlexibleApplication).deadlineDate);
  const bDate = parseDate((b as FlexibleApplication).deadlineDate);

  if (!aDate && !bDate) return 0;
  if (!aDate) return 1;
  if (!bDate) return -1;

  return aDate.getTime() - bDate.getTime();
};

type PendingFinalMove = {
  applicationId: ApplicationId;
  application: Application | null;
};

export default function ApplicationStatusBoard({
  applications,
  onOpenApplication,
  onToggleImportant,
  onChangeStatus,
}: Props) {
  const [draggingId, setDraggingId] = useState<ApplicationId | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<BoardViewStatus | null>(
    null,
  );
  const [pendingFinalMove, setPendingFinalMove] =
    useState<PendingFinalMove | null>(null);
  const [selectedFinalResult, setSelectedFinalResult] =
    useState<ApplicationFinalResult | null>(null);

  const groupedApplications = useMemo(() => {
    const grouped = columns.reduce(
      (acc, column) => {
        acc[column.key] = [];
        return acc;
      },
      {} as Record<BoardViewStatus, Application[]>,
    );

    applications.forEach((application) => {
      const status = (application as FlexibleApplication).status ?? "작성중";
      if (status in grouped) {
        grouped[status as BoardViewStatus].push(application);
      }
    });

    columns.forEach((column) => {
      grouped[column.key].sort(compareApplications);
    });

    return grouped;
  }, [applications]);

  const handleDrop = (column: BoardViewStatus) => {
    if (draggingId === null) return;

    if (column === "전형완료") {
      const draggedApplication =
        applications.find((application) => application.id === draggingId) ??
        null;

      setPendingFinalMove({
        applicationId: draggingId,
        application: draggedApplication,
      });
      setSelectedFinalResult(null);
      setDraggingId(null);
      setDragOverStatus(null);
      return;
    }

    onChangeStatus(draggingId, column, null);
    setDraggingId(null);
    setDragOverStatus(null);
  };

  const closeFinalResultModal = () => {
    setPendingFinalMove(null);
    setSelectedFinalResult(null);
  };

  const confirmFinalResult = () => {
    if (!pendingFinalMove || !selectedFinalResult) return;

    onChangeStatus(
      pendingFinalMove.applicationId,
      "전형완료",
      selectedFinalResult,
    );
    closeFinalResultModal();
  };

  return (
    <>
      <div className="h-full overflow-x-auto bg-white">
        <div className="flex min-w-[1120px] gap-4 p-5">
          {columns.map((column) => {
            const columnApplications = groupedApplications[column.key];

            return (
              <section
                key={column.key}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverStatus(column.key);
                }}
                onDragLeave={() => setDragOverStatus(null)}
                onDrop={() => handleDrop(column.key)}
                className={cn(
                  "min-h-[320px] min-w-[170px] max-w-[240px] flex-1 rounded-xl border-2 border-transparent bg-[#F6F8FB]/30 p-2 transition-colors",
                  dragOverStatus === column.key &&
                    "border-[#93C5FD] bg-[#EFF6FF]",
                )}
              >
                <div
                  className="mb-2 flex items-center gap-2 rounded-lg px-2.5 py-2"
                  style={{ backgroundColor: column.backgroundColor }}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: column.borderColor }}
                  />
                  <span
                    className="min-w-0 flex-1 truncate text-xs font-semibold"
                    style={{ color: column.color }}
                  >
                    {column.title}
                  </span>
                  <span
                    className="shrink-0 rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums"
                    style={{ color: column.color }}
                  >
                    {columnApplications.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {columnApplications.length === 0 ? (
                    <div className="px-2 py-4 text-center text-[11px] text-[#A4AEBE]">
                      공고 없음
                    </div>
                  ) : (
                    columnApplications.map((application) => {
                      const dday = getDday(application);
                      const isImportant = getImportant(application);
                      const finalResult = application.finalResult;

                      return (
                        <div
                          key={String(application.id)}
                          role="button"
                          tabIndex={0}
                          draggable
                          onClick={() => onOpenApplication(application)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              onOpenApplication(application);
                            }
                          }}
                          onDragStart={(event) => {
                            setDraggingId(application.id);
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDragOverStatus(null);
                          }}
                          className="group cursor-grab overflow-hidden rounded-lg border border-[#E3E8EF] bg-white transition-all hover:border-[#BFDBFE] hover:shadow-sm active:cursor-grabbing"
                        >
                          <div
                            className="h-0.5 w-full"
                            style={{ backgroundColor: column.borderColor }}
                          />
                          <div className="p-3">
                            <div className="mb-1 flex items-center justify-between gap-1">
                              <span className="truncate text-[13px] font-bold leading-tight text-[#161C26]">
                                {getCompany(application)}
                              </span>

                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onToggleImportant(application.id);
                                }}
                                className={cn(
                                  "shrink-0 rounded p-0.5 transition-opacity hover:bg-[#F6F8FB]",
                                  !isImportant &&
                                    "opacity-0 group-hover:opacity-100",
                                )}
                                aria-label={
                                  isImportant ? "즐겨찾기 해제" : "즐겨찾기"
                                }
                              >
                                <Star
                                  className={cn(
                                    "h-3 w-3",
                                    isImportant
                                      ? "fill-[#F5B800] text-[#F5B800]"
                                      : "text-[#A4AEBE]",
                                  )}
                                />
                              </button>
                            </div>

                            <p className="truncate text-[11px] leading-tight text-[#79859A]">
                              {getJobTitle(application)}
                            </p>

                            <div className="mt-2.5 flex items-center justify-between gap-1">
                              <span className="max-w-[105px] shrink-0 truncate rounded-sm bg-[#EFF2F6]/70 px-1.5 py-0.5 text-[10px] text-[#79859A]">
                                {getEmploymentType(application)}
                              </span>

                              {column.key === "전형완료" && finalResult ? (
                                <span
                                  className={cn(
                                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                    getFinalResultClassName(finalResult),
                                  )}
                                >
                                  {finalResult}
                                </span>
                              ) : (
                                <span
                                  className={cn(
                                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
                                    dday.urgent
                                      ? "bg-[#FCEBEC] text-[#D24545]"
                                      : "bg-[#EFF2F6] text-[#79859A]",
                                  )}
                                >
                                  {dday.label}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {pendingFinalMove && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 px-4"
          onClick={closeFinalResultModal}
        >
          <div
            className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5">
              <p className="text-sm font-semibold text-blue-600">
                전형완료 선택
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {pendingFinalMove.application
                  ? getCompany(pendingFinalMove.application)
                  : "선택한 공고"}
              </h2>
              {pendingFinalMove.application && (
                <p className="mt-1 text-sm text-slate-500">
                  {getJobTitle(pendingFinalMove.application)} ·{" "}
                  {getEmploymentType(pendingFinalMove.application)}
                </p>
              )}
              <p className="mt-4 text-sm leading-6 text-slate-500">
                이 공고를 전형완료로 이동하려면 결과를 선택해주세요.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {APPLICATION_FINAL_RESULTS.map((result) => (
                <button
                  key={result}
                  type="button"
                  onClick={() => setSelectedFinalResult(result)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm font-semibold transition",
                    selectedFinalResult === result
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50",
                  )}
                >
                  {result}
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeFinalResultModal}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmFinalResult}
                disabled={!selectedFinalResult}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
