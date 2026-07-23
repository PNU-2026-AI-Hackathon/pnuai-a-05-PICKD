import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Building2,
  ChevronRight,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  extractDateString,
  formatApplicationDate,
  formatDate,
  getDDay,
  getGoogleEventDate,
} from "../../utils/date";
import PostTodo from "./PostTodo";
import PostSchedule from "./PostSchedule";
import { useApplication } from "../../context/ApplicationContext";
import { useClickOutside } from "../../hooks/useClickOutside";
import {
  getScheduleApplicationId,
  getSchedulesForApplication,
} from "../../utils/calendarEvent";
import {
  APPLICATION_FINAL_RESULTS,
  APPLICATION_STATUSES,
  type ApplicationFinalResult,
  type ApplicationStatus,
} from "../../types/application";
import { updateTodoApi } from "../../api/todo";
import { deleteEvent, updateEvent } from "../../api/calendar";
import { getFinalResultTone } from "../../utils/status";

interface Props {
  open: boolean;
  onClose: () => void;
  application: any;
  calendarEvents?: any[];
  onChange?: () => void | Promise<void>;
}

type ItemStatus = "예정" | "진행 중" | "완료" | "지연";

const ITEM_STATUS_STYLES: Record<ItemStatus, string> = {
  예정: "bg-[#F1F5F9] text-[#64748B]",
  "진행 중": "bg-[#EFF6FF] text-[#2563EB]",
  완료: "bg-[#ECFDF5] text-[#059669]",
  지연: "bg-[#FEF2F2] text-[#DC2626]",
};

const ITEM_STATUS_OPTIONS: ItemStatus[] = [
  "예정",
  "진행 중",
  "완료",
  "지연",
];

const isItemStatus = (value: unknown): value is ItemStatus => {
  return (
    value === "예정" ||
    value === "진행 중" ||
    value === "완료" ||
    value === "지연"
  );
};

const normalizeItemStatus = (value: unknown): ItemStatus => {
  return isItemStatus(value) ? value : "예정";
};

const STATUS_META_PATTERN = /^pickd:status=(예정|진행 중|완료|지연)$/im;

const readStatusMetadata = (value?: string | null): ItemStatus | null => {
  const match = String(value ?? "").match(STATUS_META_PATTERN);
  return (match?.[1] as ItemStatus | undefined) ?? null;
};

const withStatusMetadata = (value: string | undefined, status: ItemStatus) => {
  const lines = String(value ?? "")
    .split("\n")
    .filter((line) => !STATUS_META_PATTERN.test(line.trim()))
    .filter(Boolean);

  lines.push(`pickd:status=${status}`);
  return lines.join("\n");
};

const stripCalendarSystemMetadata = (value?: string) =>
  String(value ?? "")
    .split("\n")
    .filter((line) => {
      const normalized = line.trim();
      return (
        normalized &&
        !STATUS_META_PATTERN.test(normalized) &&
        !/^category:/i.test(normalized) &&
        !/^pickd:eventType=/i.test(normalized) &&
        !/^pickd:applicationId=/i.test(normalized)
      );
    })
    .join("\n");

const getTodoStatus = (todo: any): ItemStatus => {
  if (todo.completed) return "완료";

  const storedStatus = readStatusMetadata(todo.memo);
  if (storedStatus && storedStatus !== "완료") return storedStatus;

  if (todo.dueDateTime) {
    const due = new Date(todo.dueDateTime);
    if (!Number.isNaN(due.getTime()) && due.getTime() < Date.now()) {
      return "지연";
    }
  }

  return "진행 중";
};

const getScheduleStatus = (schedule: any): ItemStatus => {
  const storedStatus = readStatusMetadata(schedule.description);
  if (storedStatus) return storedStatus;

  const eventDate = getGoogleEventDate(schedule);
  if (eventDate && eventDate.getTime() < Date.now()) return "완료";
  return "예정";
};

const getScheduleDateTime = (schedule: any, field: "start" | "end") => {
  const value = schedule?.[field]?.dateTime ?? schedule?.[field]?.date;
  return extractDateString(value);
};

export default function ApplicationDetailModal({
  open,
  onClose,
  application,
  calendarEvents = [],
  onChange,
}: Props) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<ApplicationStatus>("작성중");
  const [draftFinalResult, setDraftFinalResult] =
    useState<ApplicationFinalResult>(null);
  const [draftMemo, setDraftMemo] = useState("");
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [savingApplicationState, setSavingApplicationState] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [openItemStatusId, setOpenItemStatusId] = useState<string | null>(null);
  const [itemStatusOverrides, setItemStatusOverrides] = useState<
    Record<string, ItemStatus>
  >({});
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);
  const { addTodo, applications, updateApplication, toggleTodo, removeTodo } =
    useApplication();

  useClickOutside([addMenuRef], () => setShowAddMenu(false), showAddMenu);
  useClickOutside(
    [statusMenuRef],
    () => setOpenItemStatusId(null),
    Boolean(openItemStatusId),
  );

  const foundApplication = application
    ? applications.find((app) => app.id === application.id) || application
    : null;

  useEffect(() => {
    if (!foundApplication) return;

    setDraftStatus(foundApplication.status ?? "작성중");
    setDraftFinalResult(foundApplication.finalResult ?? null);
    setDraftMemo(foundApplication.memo ?? "");
    setItemStatusOverrides({});
    setOpenItemStatusId(null);
  }, [
    foundApplication?.id,
    foundApplication?.status,
    foundApplication?.finalResult,
    foundApplication?.memo,
  ]);

  if (!open || !application || !foundApplication) return null;

  const linkedCalendarEvents =
    foundApplication.calendarEvents?.length > 0
      ? foundApplication.calendarEvents
      : getSchedulesForApplication(calendarEvents, foundApplication);

  const currentApplication = {
    ...foundApplication,
    status: draftStatus,
    finalResult: draftFinalResult,
    memo: draftMemo,
    calendarEvents: linkedCalendarEvents,
    calendarEventCount: linkedCalendarEvents.length,
  };

  const persistApplicationState = async (
    nextStatus: ApplicationStatus,
    nextFinalResult: ApplicationFinalResult,
  ) => {
    if (savingApplicationState) return;

    try {
      setSavingApplicationState(true);
      await updateApplication(currentApplication.id, {
        ...foundApplication,
        status: nextStatus,
        finalResult: nextStatus === "전형완료" ? nextFinalResult : null,
        memo: draftMemo,
      });
      await onChange?.();
    } catch (error) {
      console.error("지원상태 저장 실패:", error);
      alert("지원상태 저장에 실패했습니다.");
    } finally {
      setSavingApplicationState(false);
    }
  };

  const handleStageChange = async (nextStatus: ApplicationStatus) => {
    const nextFinalResult = nextStatus === "전형완료" ? draftFinalResult : null;

    setDraftStatus(nextStatus);
    setDraftFinalResult(nextFinalResult);
    await persistApplicationState(nextStatus, nextFinalResult);
  };

  const handleFinalResultChange = async (
    nextResult: NonNullable<ApplicationFinalResult>,
  ) => {
    const value = draftFinalResult === nextResult ? null : nextResult;
    setDraftFinalResult(value);
    await persistApplicationState("전형완료", value);
  };

  const handleMemoSave = async () => {
    if (isSavingMemo) return;

    try {
      setIsSavingMemo(true);
      await updateApplication(currentApplication.id, {
        ...foundApplication,
        status: draftStatus,
        finalResult: draftStatus === "전형완료" ? draftFinalResult : null,
        memo: draftMemo,
      });
      await onChange?.();
    } catch (error) {
      console.error("메모 저장 실패:", error);
      alert("메모 저장에 실패했습니다.");
    } finally {
      setIsSavingMemo(false);
    }
  };

  const handleTodoStatusChange = async (todo: any, status: ItemStatus) => {
    const itemId = `todo-${todo.id}`;
    if (updatingItemId) return;

    try {
      setUpdatingItemId(itemId);
      setItemStatusOverrides((prev) => ({ ...prev, [itemId]: status }));

      await updateTodoApi(todo.id, {
        title: todo.title,
        dueDateTime: todo.dueDateTime,
        memo: withStatusMetadata(todo.memo, status),
        applicationId: currentApplication.id,
        company: currentApplication.company,
        jobTitle: currentApplication.jobTitle,
      });

      const shouldBeCompleted = status === "완료";
      if (Boolean(todo.completed) !== shouldBeCompleted) {
        await toggleTodo(todo.id);
      }

      await onChange?.();
    } catch (error) {
      console.error("할 일 상태 변경 실패:", error);
      setItemStatusOverrides((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      alert("할 일 상태 변경에 실패했습니다.");
    } finally {
      setUpdatingItemId(null);
      setOpenItemStatusId(null);
    }
  };

  const handleScheduleStatusChange = async (
    schedule: any,
    status: ItemStatus,
  ) => {
    const itemId = `calendar-${schedule.id}`;
    if (updatingItemId || !schedule.id) return;

    const startDateTime = getScheduleDateTime(schedule, "start");
    const endDateTime = getScheduleDateTime(schedule, "end");

    if (!startDateTime) {
      alert("일정 시작 시간을 확인할 수 없습니다.");
      return;
    }

    try {
      setUpdatingItemId(itemId);
      setItemStatusOverrides((prev) => ({ ...prev, [itemId]: status }));

      await updateEvent(String(schedule.id), {
        summary: schedule.summary || "일정",
        location: schedule.location || "",
        description: withStatusMetadata(
          stripCalendarSystemMetadata(schedule.description),
          status,
        ),
        category: schedule.category,
        applicationId:
          getScheduleApplicationId(schedule) || currentApplication.id,
        start: {
          dateTime: startDateTime,
          timeZone: schedule.start?.timeZone || "Asia/Seoul",
        },
        end: endDateTime
          ? {
              dateTime: endDateTime,
              timeZone:
                schedule.end?.timeZone ||
                schedule.start?.timeZone ||
                "Asia/Seoul",
            }
          : undefined,
      });

      await onChange?.();
    } catch (error) {
      console.error("일정 상태 변경 실패:", error);
      setItemStatusOverrides((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      alert("일정 상태 변경에 실패했습니다.");
    } finally {
      setUpdatingItemId(null);
      setOpenItemStatusId(null);
    }
  };

  const handleDeleteItem = async (item: any) => {
    if (!window.confirm(`${item.title} 항목을 삭제하시겠습니까?`)) return;

    try {
      setUpdatingItemId(item.id);
      if (item.type === "할 일") {
        await removeTodo(item.raw.id);
      } else {
        await deleteEvent(String(item.raw.id));
      }
      await onChange?.();
    } catch (error) {
      console.error("일정·할 일 삭제 실패:", error);
      alert("항목 삭제에 실패했습니다.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const scheduleItems = linkedCalendarEvents.map((schedule: any) => {
    const scheduleDate = getGoogleEventDate(schedule);
    const id = `calendar-${schedule.id}`;

    return {
      id,
      type: "일정" as const,
      title: schedule.summary || "일정",
      date: formatDate(scheduleDate, "기한 없음"),
      status: itemStatusOverrides[id] ?? getScheduleStatus(schedule),
      raw: schedule,
    };
  });

  const todoItems = (currentApplication.todos || []).map((todo: any) => {
    const id = `todo-${todo.id}`;

    return {
      id,
      type: "할 일" as const,
      title: todo.title,
      date: formatDate(todo.dueDateTime, "기한 없음"),
      status: itemStatusOverrides[id] ?? getTodoStatus(todo),
      raw: todo,
    };
  });

  const detailItems = [...scheduleItems, ...todoItems];

  return (
    <>
      <div
        className="fixed inset-0 z-[99] flex items-center justify-center bg-black/35 backdrop-blur-[1px]"
        onClick={onClose}
      >
        <div
          className="w-[94vw] max-w-[860px] overflow-hidden rounded-xl border border-[#E3E8EF] bg-[#FBFCFE] shadow-[0_24px_56px_-12px_rgba(22,28,38,0.20)]"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex items-start justify-between border-b border-[#E3E8EF] bg-white px-6 py-3.5">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-[#79859A]">
                <span>지원 대시보드</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-[#28303D]">상태 관리</span>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#EFF2F6]">
                  <Building2 className="h-4 w-4 text-[#79859A]" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-[15px] font-semibold leading-tight text-[#161C26]">
                    {currentApplication.company}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-[#79859A]">
                    {currentApplication.jobTitle} ·{" "}
                    {currentApplication.position}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="-mt-1 flex h-7 w-7 items-center justify-center rounded-md text-[#79859A] hover:bg-[#EFF2F6] hover:text-[#28303D]"
              aria-label="닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="max-h-[calc(90vh-80px)] space-y-6 overflow-y-auto bg-[#FBFCFE] px-6 py-5">
            <Section title="공고 기본 정보">
              <div className="rounded-lg border border-[#E3E8EF] bg-white px-4 py-2">
                <Field label="기업명">{currentApplication.company}</Field>
                <Field label="공고명">{currentApplication.jobTitle}</Field>
                <Field label="직무">{currentApplication.position}</Field>
                <Field label="마감일">
                  <span className="tabular-nums">
                    {formatApplicationDate(currentApplication.deadlineDate)}
                  </span>
                  <span
                    className={`ml-2 text-[11px] tabular-nums ${
                      String(getDDay(currentApplication.deadlineDate)).match(
                        /^D-[0-3]$|D-Day/,
                      )
                        ? "text-[#D24545]"
                        : "text-[#79859A]"
                    }`}
                  >
                    {getDDay(currentApplication.deadlineDate)}
                  </span>
                </Field>
              </div>
            </Section>

            <Section
              title="전형 흐름"
              action={
                savingApplicationState ? (
                  <span className="text-[10px] text-[#A4AEBE]">저장 중</span>
                ) : null
              }
            >
              <div className="space-y-3 rounded-lg border border-[#E3E8EF] bg-white px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-relaxed">
                  {APPLICATION_STATUSES.map((step, index) => (
                    <span
                      key={step}
                      className="inline-flex items-center gap-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => void handleStageChange(step)}
                        disabled={savingApplicationState}
                        className={`rounded px-1.5 py-0.5 transition-colors disabled:opacity-50 ${
                          step === draftStatus
                            ? "bg-[#EFF6FF] font-medium text-[#1D4ED8]"
                            : "text-[#79859A] hover:bg-[#EFF2F6] hover:text-[#28303D]"
                        }`}
                      >
                        {step}
                      </button>
                      {index < APPLICATION_STATUSES.length - 1 && (
                        <span className="text-[#A4AEBE]/60">→</span>
                      )}
                    </span>
                  ))}
                </div>

                {draftStatus === "전형완료" && (
                  <div className="flex items-center gap-1.5 border-t border-[#E3E8EF]/70 pt-2.5">
                    <span className="mr-1 text-[11px] text-[#79859A]">
                      최종 결과
                    </span>
                    {APPLICATION_FINAL_RESULTS.map((result) => {
                      const tone = getFinalResultTone(result);
                      const active = draftFinalResult === result;

                      return (
                        <button
                          key={result}
                          type="button"
                          onClick={() => void handleFinalResultChange(result)}
                          disabled={savingApplicationState}
                          className="rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors disabled:opacity-50"
                          style={
                            active
                              ? {
                                  backgroundColor: tone.backgroundColor,
                                  color: tone.color,
                                  borderColor: `${tone.dotColor}4D`,
                                }
                              : {
                                  backgroundColor: "white",
                                  color: "#79859A",
                                  borderColor: "#E3E8EF",
                                }
                          }
                        >
                          {result}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </Section>

            <Section
              title="일정 · 할 일"
              action={
                <div ref={addMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAddMenu((prev) => !prev)}
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-[#79859A] hover:bg-[#EFF2F6] hover:text-[#28303D]"
                  >
                    <Plus className="h-3 w-3" /> 추가
                  </button>

                  {showAddMenu && (
                    <div className="absolute right-0 top-7 z-50 w-32 overflow-hidden rounded-md border border-[#E3E8EF] bg-white py-1 shadow-[0_12px_28px_-6px_rgba(22,28,38,0.14)]">
                      <button
                        type="button"
                        className="block w-full px-3 py-1.5 text-left text-xs text-[#3E4859] hover:bg-[#F6F8FB]"
                        onClick={() => {
                          setShowAddMenu(false);
                          setScheduleModalOpen(true);
                        }}
                      >
                        일정 추가
                      </button>
                      <button
                        type="button"
                        className="block w-full px-3 py-1.5 text-left text-xs text-[#3E4859] hover:bg-[#F6F8FB]"
                        onClick={() => {
                          setShowAddMenu(false);
                          setTodoModalOpen(true);
                        }}
                      >
                        할 일 추가
                      </button>
                    </div>
                  )}
                </div>
              }
            >
              <div className="overflow-visible rounded-lg border border-[#E3E8EF] bg-white">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#E3E8EF] bg-[#EFF2F6]/40 text-[10px] text-[#79859A]">
                      <th className="w-16 px-3 py-1.5 text-left font-normal">
                        유형
                      </th>
                      <th className="px-3 py-1.5 text-left font-normal">
                        제목
                      </th>
                      <th className="w-24 px-3 py-1.5 text-left font-normal">
                        날짜
                      </th>
                      <th className="w-24 px-3 py-1.5 text-left font-normal">
                        상태
                      </th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {detailItems.map((item) => (
                      <tr
                        key={item.id}
                        className="group border-b border-[#E3E8EF]/60 last:border-0 hover:bg-[#EFF2F6]/30"
                      >
                        <td className="px-3 py-1.5 text-[#79859A]">
                          {item.type}
                        </td>
                        <td className="max-w-0 px-3 py-1.5 text-[#28303D]">
                          <span className="block truncate">{item.title}</span>
                        </td>
                        <td className="px-3 py-1.5 tabular-nums text-[#79859A]">
                          {item.date}
                        </td>
                        <td className="relative px-3 py-1.5">
                          <div
                            ref={
                              openItemStatusId === item.id
                                ? statusMenuRef
                                : null
                            }
                            className="relative inline-block"
                          >
                            <button
                              type="button"
                              disabled={updatingItemId === item.id}
                              onClick={() =>
                                setOpenItemStatusId((current) =>
                                  current === item.id ? null : item.id,
                                )
                              }
                              className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium disabled:opacity-50 ${
                                ITEM_STATUS_STYLES[
                                  normalizeItemStatus(item.status)
                                ]
                              }`}
                            >
                              {normalizeItemStatus(item.status)}
                            </button>

                            {openItemStatusId === item.id && (
                              <div className="absolute left-0 top-6 z-[80] min-w-[92px] overflow-hidden rounded-md border border-[#E3E8EF] bg-white py-1 shadow-[0_12px_28px_-6px_rgba(22,28,38,0.14)]">
                                {ITEM_STATUS_OPTIONS.map((status) => (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() =>
                                      item.type === "할 일"
                                        ? void handleTodoStatusChange(
                                            item.raw,
                                            status,
                                          )
                                        : void handleScheduleStatusChange(
                                            item.raw,
                                            status,
                                          )
                                    }
                                    className={`block w-full px-2.5 py-1.5 text-left text-xs hover:bg-[#F6F8FB] ${
                                      item.status === status
                                        ? "font-semibold text-[#2563EB]"
                                        : "text-[#5A6678]"
                                    }`}
                                  >
                                    {status}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => void handleDeleteItem(item)}
                            disabled={updatingItemId === item.id}
                            aria-label={`${item.title} 삭제`}
                            className="text-[#A4AEBE] opacity-0 transition-opacity hover:text-[#D24545] disabled:opacity-30 group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {detailItems.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-6 text-center text-[11px] text-[#79859A]"
                        >
                          연결된 일정·할 일이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section
              title="메모"
              action={
                <button
                  type="button"
                  onClick={() => void handleMemoSave()}
                  disabled={isSavingMemo}
                  className="rounded px-1.5 py-0.5 text-[11px] text-[#79859A] hover:bg-[#EFF2F6] hover:text-[#28303D] disabled:opacity-50"
                >
                  {isSavingMemo ? "저장 중" : "저장"}
                </button>
              }
            >
              <textarea
                value={draftMemo}
                onChange={(event) => setDraftMemo(event.target.value)}
                placeholder="이 공고에 대한 메모를 입력하세요"
                rows={3}
                className="w-full resize-none rounded-lg border border-[#E3E8EF] bg-white px-3 py-2.5 text-[13px] text-[#28303D] outline-none placeholder:text-[#A4AEBE] focus:border-[#2563EB] focus:ring-1 focus:ring-[#DBEAFE]"
              />
            </Section>
          </div>
        </div>
      </div>

      {scheduleModalOpen && (
        <PostSchedule
          application={currentApplication}
          onClose={() => setScheduleModalOpen(false)}
          onSuccess={async () => {
            await onChange?.();
          }}
        />
      )}

      {todoModalOpen && (
        <PostTodo
          application={currentApplication}
          applications={[currentApplication]}
          onClose={() => setTodoModalOpen(false)}
          onConfirm={async (data) => {
            await addTodo({
              ...data,
              applicationId: currentApplication.id,
            });

            await onChange?.();
            setTodoModalOpen(false);
          }}
        />
      )}
    </>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-medium uppercase tracking-wide text-[#79859A]">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] items-center gap-3 py-1.5">
      <div className="text-[11px] text-[#79859A]">{label}</div>
      <div className="min-w-0 text-[13px] text-[#28303D]">
        {children || "-"}
      </div>
    </div>
  );
}
