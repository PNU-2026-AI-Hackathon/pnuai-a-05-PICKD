import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CalendarBox from "./CalendarBox";
import TodoSection from "./TodoSection";
import ScheduleSection from "./ScheduleSection";
import PostTodo from "../../modal/PostTodo";
import { useApplication } from "../../../context/ApplicationContext";
import { getCurrentDeadlineInfo } from "../../../utils/applicationDeadline";
import { parseLocalDateTime } from "../../../utils/date";
import { isActiveStatus } from "../../../utils/status";

const startOfDay = (value: Date) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const getDaysUntil = (value?: string | null) => {
  const date = parseLocalDateTime(value);
  if (!date) return null;

  const today = startOfDay(new Date());
  const target = startOfDay(date);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
};

const ddayLabel = (days: number) => {
  if (days === 0) return "오늘";
  if (days < 0) return `D+${Math.abs(days)}`;
  return `D-${days}`;
};

const ddayClass = (days: number) => {
  if (days <= 1) return "text-[#D24545]";
  if (days <= 3) return "text-[#F06A12]";
  return "text-[#64748B]";
};

export default function RightTab({
  todoData,
  googleEvents,
  focusedApplication,
}: any) {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedEvents, setSelectedEvents] = useState<any[]>([]);
  const [weeklyEvents, setWeeklyEvents] = useState<any[]>([]);
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const { applications, addTodo, loadData } = useApplication();

  const selectedDay = selectedDate ?? new Date();
  const isSelectedToday = isSameDay(selectedDay, new Date());
  const dateText = selectedDay.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const deadlineItems = useMemo(() => {
    return applications
      .filter((application) => isActiveStatus(application.status))
      .map((application) => {
        const deadlineInfo = getCurrentDeadlineInfo(application);
        const days = getDaysUntil(deadlineInfo.date);

        return {
          id: application.id,
          company: application.company,
          title: application.jobTitle,
          days,
        };
      })
      .filter(
        (item) => item.days !== null && item.days >= 0 && item.days <= 14,
      )
      .map((item) => ({ ...item, days: item.days as number }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 5);
  }, [applications]);

  const selectedDayTodos = useMemo(() => {
    const source = Array.isArray(todoData) ? todoData : [];

    return source
      .filter((todo: any) => {
        if (!todo.dueDateTime) {
          return isSelectedToday && !todo.completed;
        }

        const date = parseLocalDateTime(todo.dueDateTime);
        return date ? isSameDay(date, selectedDay) : false;
      })
      .sort((a: any, b: any) => Number(a.completed) - Number(b.completed));
  }, [todoData, isSelectedToday, selectedDay]);

  const handleRefresh = async () => {
    await loadData();
    window.dispatchEvent(new Event("googleCalendarUpdated"));
  };

  return (
    <div className="min-w-[400px] space-y-5 px-5 py-5">
      <button
        type="button"
        onClick={() => navigate("/calendar")}
        className="group w-full text-left"
      >
        <p className="text-[13px] font-medium text-[#64748B] transition-colors group-hover:text-[#2563EB]">
          {isSelectedToday ? "오늘" : "선택 날짜"}
        </p>
        <p className="mt-1 text-[19px] font-semibold leading-tight text-[#161C26] transition-colors group-hover:text-[#2563EB]">
          {dateText}
        </p>
      </button>

      <CalendarBox
        defaultEvents={googleEvents}
        applications={applications}
        todos={Array.isArray(todoData) ? todoData : []}
        setWeeklyEvents={setWeeklyEvents}
        setSelectedDate={setSelectedDate}
        setSelectedEvents={setSelectedEvents}
        onOpenCalendar={() => navigate("/calendar")}
      />

      <section>
        <h3 className="mb-2.5 text-[12px] font-medium text-[#71809A]">
          마감 임박 공고
        </h3>

        {deadlineItems.length === 0 ? (
          <p className="px-2 py-1 text-[12px] text-[#8A96A9]">
            2주 내 마감 공고가 없어요
          </p>
        ) : (
          <ul className="space-y-1">
            {deadlineItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] hover:bg-white"
              >
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#A7B2C3]" />
                <span className="min-w-0 flex-1 truncate leading-snug text-[#28303D]">
                  <span className="mr-1.5 text-[11px] text-[#71809A]">
                    {item.company}
                  </span>
                  {item.title}
                </span>
                <span
                  className={`shrink-0 text-[12px] font-medium tabular-nums ${ddayClass(
                    item.days,
                  )}`}
                >
                  {ddayLabel(item.days)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ScheduleSection
        weeklyEvents={weeklyEvents}
        selectedEvents={selectedEvents}
        selectedDate={selectedDate}
        onClick={() => navigate("/calendar")}
      />

      <TodoSection
        todos={selectedDayTodos}
        selectedDate={selectedDate}
        focusedApplication={focusedApplication}
        onClick={() => navigate("/calendar")}
        onAdd={() => setTodoModalOpen(true)}
      />

      {todoModalOpen && (
        <PostTodo
          application={focusedApplication ?? undefined}
          applications={applications}
          onClose={() => setTodoModalOpen(false)}
          onConfirm={async (data) => {
            await addTodo({
              title: data.title,
              dueDateTime: data.dueDateTime,
              memo: data.memo,
              applicationId:
                data.applicationId || focusedApplication?.id || undefined,
            });
            await handleRefresh();
            setTodoModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
