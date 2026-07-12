import { GripVertical, Star } from "lucide-react";
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
  headerClassName: string;
  dotClassName: string;
  borderClassName: string;
}[] = [
  {
    key: "작성중",
    title: "작성중",
    headerClassName: "bg-slate-50 text-slate-700",
    dotClassName: "bg-slate-400",
    borderClassName: "border-t-slate-300",
  },
  {
    key: "지원완료",
    title: "지원완료",
    headerClassName: "bg-blue-50 text-blue-700",
    dotClassName: "bg-blue-600",
    borderClassName: "border-t-blue-600",
  },
  {
    key: "서류전형",
    title: "서류전형",
    headerClassName: "bg-sky-50 text-sky-700",
    dotClassName: "bg-sky-600",
    borderClassName: "border-t-sky-600",
  },
  {
    key: "필기전형",
    title: "필기전형",
    headerClassName: "bg-violet-50 text-violet-700",
    dotClassName: "bg-violet-600",
    borderClassName: "border-t-violet-600",
  },
  {
    key: "면접전형",
    title: "면접전형",
    headerClassName: "bg-amber-50 text-amber-700",
    dotClassName: "bg-amber-500",
    borderClassName: "border-t-amber-500",
  },
  {
    key: "전형완료",
    title: "전형완료",
    headerClassName: "bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-600",
    borderClassName: "border-t-emerald-600",
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
        <div className="flex min-w-[1260px] gap-5 px-8 py-8">
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
                  "min-h-[520px] w-[240px] shrink-0 rounded-2xl bg-slate-50/40 p-4 transition",
                  dragOverStatus === column.key &&
                    "bg-blue-50/70 ring-2 ring-blue-200",
                )}
              >
                <div
                  className={cn(
                    "mb-3 flex h-[54px] items-center justify-between rounded-xl px-4",
                    column.headerClassName,
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        column.dotClassName,
                      )}
                    />
                    <span className="text-sm font-semibold">
                      {column.title}
                    </span>
                  </div>

                  <span className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold">
                    {columnApplications.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {columnApplications.length === 0 ? (
                    <div className="flex h-28 items-center justify-center text-sm text-slate-400">
                      공고 없음
                    </div>
                  ) : (
                    columnApplications.map((application) => {
                      const dday = getDday(application);
                      const isImportant = getImportant(application);

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
                          className={cn(
                            "group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md",
                            "border-t-4",
                            column.borderClassName,
                          )}
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <GripVertical className="h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100" />
                                <h3 className="truncate text-base font-semibold text-slate-900">
                                  {getCompany(application)}
                                </h3>
                              </div>

                              <p className="mt-1 truncate text-sm text-slate-500">
                                {getJobTitle(application)}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onToggleImportant(application.id);
                              }}
                              className="rounded-md p-1 hover:bg-slate-100"
                            >
                              <Star
                                className={cn(
                                  "h-4 w-4",
                                  isImportant
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-slate-300",
                                )}
                              />
                            </button>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-2">
                            <span className="max-w-[130px] truncate rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500">
                              {getEmploymentType(application)}
                            </span>

                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-bold",
                                dday.urgent
                                  ? "bg-red-50 text-red-500"
                                  : "bg-slate-100 text-slate-500",
                              )}
                            >
                              {dday.label}
                            </span>
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
