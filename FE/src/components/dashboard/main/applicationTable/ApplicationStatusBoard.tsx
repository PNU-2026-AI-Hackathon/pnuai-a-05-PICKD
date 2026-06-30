import { CalendarDays, CheckSquare, GripVertical, Star } from "lucide-react";
import { useMemo, useState } from "react";
import type { Application } from "../../../../types/application";

type BoardViewStatus =
  | "작성 중"
  | "결과 대기"
  | "필기 전형"
  | "면접 전형"
  | "최종 결과";

type ApplicationId = Application["id"];

interface Props {
  applications: Application[];
  onOpenApplication: (application: Application) => void;
  onToggleImportant: (applicationId: ApplicationId) => void;
  onChangeStatus: (applicationId: ApplicationId, nextStatus: string) => void;
}

type FlexibleApplication = Application & {
  company?: string;
  jobTitle?: string;
  position?: string;
  employmentType?: string;
  employType?: string;
  careerType?: string;
  jobType?: string;
  status?: string;
  deadlineDate?: string;
  dday?: string | number;
  important?: boolean;
  scheduleCount?: number;
  todoCount?: number;
  checklistInComplete?: number;
  finalResult?: string | null;
};

const columns: {
  key: BoardViewStatus;
  title: string;
  nextStatus: string;
  headerClassName: string;
  dotClassName: string;
  borderClassName: string;
}[] = [
  {
    key: "작성 중",
    title: "작성 중",
    nextStatus: "작성중",
    headerClassName: "bg-slate-50 text-slate-700",
    dotClassName: "bg-slate-400",
    borderClassName: "border-t-slate-300",
  },
  {
    key: "결과 대기",
    title: "결과 대기",
    nextStatus: "지원완료",
    headerClassName: "bg-blue-50 text-blue-700",
    dotClassName: "bg-blue-600",
    borderClassName: "border-t-blue-600",
  },
  {
    key: "필기 전형",
    title: "필기 전형",
    nextStatus: "필기전형",
    headerClassName: "bg-violet-50 text-violet-700",
    dotClassName: "bg-violet-600",
    borderClassName: "border-t-violet-600",
  },
  {
    key: "면접 전형",
    title: "면접 전형",
    nextStatus: "면접전형",
    headerClassName: "bg-amber-50 text-amber-700",
    dotClassName: "bg-amber-500",
    borderClassName: "border-t-amber-500",
  },
  {
    key: "최종 결과",
    title: "최종 결과",
    nextStatus: "최종결과",
    headerClassName: "bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-600",
    borderClassName: "border-t-emerald-600",
  },
];

const cn = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(" ");

const compact = (value?: string | null) =>
  String(value ?? "").replace(/\s/g, "");

const normalizeStatus = (status?: string | null): BoardViewStatus => {
  const value = compact(status);

  if (
    value === "작성중" ||
    value === "작성" ||
    value === "지원예정" ||
    value === "서류작성"
  ) {
    return "작성 중";
  }

  if (
    value === "지원완료" ||
    value === "제출완료" ||
    value === "결과대기" ||
    value === "서류제출"
  ) {
    return "결과 대기";
  }

  if (value === "필기전형" || value === "필기") {
    return "필기 전형";
  }

  if (value === "면접전형" || value === "면접") {
    return "면접 전형";
  }

  if (
    value === "최종결과" ||
    value === "최종합격" ||
    value === "합격" ||
    value === "불합격" ||
    value === "탈락" ||
    value === "포기"
  ) {
    return "최종 결과";
  }

  return "작성 중";
};

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

const getScheduleCount = (application: Application) => {
  return Number((application as FlexibleApplication).scheduleCount ?? 0);
};

const getTodoCount = (application: Application) => {
  const item = application as FlexibleApplication;
  return Number(item.todoCount ?? item.checklistInComplete ?? 0);
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

const getFinalResult = (application: Application) => {
  const item = application as FlexibleApplication;
  const value = compact(item.finalResult || item.status);

  if (value.includes("불합격") || value.includes("탈락")) return "불합격";
  if (value.includes("합격")) return "합격";
  if (value.includes("포기")) return "포기";

  return "최종 결과";
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

  const groupedApplications = useMemo(() => {
    const grouped = columns.reduce(
      (acc, column) => {
        acc[column.key] = [];
        return acc;
      },
      {} as Record<BoardViewStatus, Application[]>,
    );

    applications.forEach((application) => {
      const status = normalizeStatus(
        (application as FlexibleApplication).status,
      );
      grouped[status].push(application);
    });

    columns.forEach((column) => {
      grouped[column.key].sort(compareApplications);
    });

    return grouped;
  }, [applications]);

  return (
    <div className="h-full overflow-x-auto bg-white">
      <div className="flex min-w-[1180px] gap-5 px-8 py-8">
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
              onDrop={() => {
                if (draggingId === null) return;

                onChangeStatus(draggingId, column.nextStatus);
                setDraggingId(null);
                setDragOverStatus(null);
              }}
              className={cn(
                "min-h-[520px] w-[260px] shrink-0 rounded-2xl bg-slate-50/40 p-4 transition",
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
                    className={cn("h-2 w-2 rounded-full", column.dotClassName)}
                  />
                  <span className="text-sm font-semibold">{column.title}</span>
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
                    const isFinalColumn = column.key === "최종 결과";
                    const isImportant = getImportant(application);
                    const scheduleCount = getScheduleCount(application);
                    const todoCount = getTodoCount(application);

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
                          <span className="rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500">
                            {getEmploymentType(application)}
                          </span>

                          {isFinalColumn ? (
                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold",
                                getFinalResult(application) === "합격" &&
                                  "bg-emerald-50 text-emerald-700",
                                getFinalResult(application) === "불합격" &&
                                  "bg-red-50 text-red-600",
                                getFinalResult(application) === "포기" &&
                                  "bg-slate-100 text-slate-500",
                                getFinalResult(application) === "최종 결과" &&
                                  "bg-emerald-50 text-emerald-700",
                              )}
                            >
                              {getFinalResult(application)}
                            </span>
                          ) : (
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
                          )}
                        </div>

                        {(scheduleCount > 0 || todoCount > 0) && (
                          <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                            {scheduleCount > 0 && (
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                일정 {scheduleCount}
                              </span>
                            )}

                            {todoCount > 0 && (
                              <span className="flex items-center gap-1">
                                <CheckSquare className="h-3.5 w-3.5" />
                                할일 {todoCount}
                              </span>
                            )}
                          </div>
                        )}
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
  );
}
