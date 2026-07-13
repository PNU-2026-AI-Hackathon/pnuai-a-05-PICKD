import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import ProgressCircle from "./ProgressCircle";
import SectionHeader from "./SectionHeader";
import TodoItem from "./TodoItem";
import AnnouncementItem from "./AnnouncementItem";
import type { Application } from "../../../../types/application";
import ScheduleItem from "./ScheduleItem";
import { useSidePanelData } from "../../../../hooks/useSidePanelData";
import { parseLocalDateTime } from "../../../../utils/date";

interface Props {
  applications: Application[];
  selectedDate?: Date;
}

type ViewMode = "day" | "all";

const isSameMonth = (date: Date, ref: Date) =>
  date.getFullYear() === ref.getFullYear() && date.getMonth() === ref.getMonth();

const SideDetailPanel = ({ applications: data, selectedDate }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [allViewMonth, setAllViewMonth] = useState(() => new Date());

  const {
    selectedDayTodos,
    selectedDay,
    sortedList,
    selectedDaySchedules,
    calendarItems,
    todos,
    handleAddTodo,
    toggleTodo,
    calculateDDay,
    isAddingTodo,
  } = useSidePanelData(selectedDate);
  const displayItems = isExpanded ? sortedList : sortedList.slice(0, 3);

  const extraCount = sortedList.length - 3;
  const scheduleTitle = "오늘의 일정";
  const todoTitle = "오늘의 할 일";
  const progressTitle = "오늘의 진행률";
  const emptyScheduleMessage = "오늘 일정이 없습니다.";
  const emptyTodoMessage = "오늘 할 일이 없습니다.";

  const selectedDayProgress = selectedDayTodos.length
    ? Math.round(
        (selectedDayTodos.filter((todo) => todo.completed).length /
          selectedDayTodos.length) *
          100,
      )
    : 0;

  const monthLabel = allViewMonth.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
  });

  const monthSchedules = useMemo(() => {
    return calendarItems.filter(
      (item) => item.type !== "todo" && isSameMonth(item.date, allViewMonth),
    );
  }, [calendarItems, allViewMonth]);

  const monthTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (todo.completed) return false;
      if (!todo.dueDateTime) return false;
      const date = parseLocalDateTime(todo.dueDateTime);
      return date ? isSameMonth(date, allViewMonth) : false;
    });
  }, [todos, allViewMonth]);

  const goToPrevMonth = () => {
    setAllViewMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const goToNextMonth = () => {
    setAllViewMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const monthNav = (
    <>
      <span className="text-[11px] font-medium text-gray-500 bg-white border border-gray-200 rounded-md px-2 py-1">
        1개월
      </span>
      <button
        type="button"
        onClick={goToPrevMonth}
        className="p-1 rounded hover:bg-gray-100 text-gray-400"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
        {monthLabel}
      </span>
      <button
        type="button"
        onClick={goToNextMonth}
        className="p-1 rounded hover:bg-gray-100 text-gray-400"
      >
        <ChevronRight size={16} />
      </button>
    </>
  );

  return (
    <div className="w-[480px] h-full bg-[#F8FAFC] border-l border-gray-200 flex flex-col">
      <div className="p-6 flex justify-between items-center">
        {viewMode === "day" ? (
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {selectedDay.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{progressTitle}</p>
          </div>
        ) : (
          <h2 className="text-lg font-bold text-gray-800">전체 일정 · 할일 · 공고</h2>
        )}

        <div className="flex items-center gap-3">
          <ProgressCircle percentage={selectedDayProgress} />

          {viewMode === "day" ? (
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className="text-sm text-gray-500 hover:text-blue-500 hover:underline transition-colors"
            >
              전체보기
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setViewMode("day")}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 transition-colors"
            >
              <ChevronLeft size={16} />
              날짜별
            </button>
          )}
        </div>
      </div>

      <div className="mx-6 border-b border-gray-300" />

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <section className={`px-6 pt-6 ${isAnnouncementOpen ? "pb-6" : "pb-2"}`}>
          <button
            type="button"
            onClick={() => setIsAnnouncementOpen((prev) => !prev)}
            className={`flex items-center gap-1 w-full text-left ${
              isAnnouncementOpen ? "mb-4" : ""
            }`}
          >
            <ChevronDown
              size={18}
              className={`text-gray-400 transition-transform ${
                isAnnouncementOpen ? "" : "-rotate-90"
              }`}
            />

            <h3 className="font-bold text-gray-800 text-sm">다가오는 공고</h3>

            <span className="flex items-center justify-center w-5 h-5 bg-[#F1F5F9] text-gray-500 text-[11px] font-base rounded-full">
              {sortedList.length}
            </span>
          </button>

          {isAnnouncementOpen && (
            <>
              <div className="space-y-6">
                {displayItems.map((item) => (
                  <AnnouncementItem
                    key={item.id}
                    title={item.title}
                    company={item.companyName}
                    step={item.step}
                    dday={calculateDDay(item.date!)}
                  />
                ))}
              </div>

              {sortedList.length > 3 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full text-center text-sm text-gray-400 mt-4 hover:text-blue-500 hover:underline transition-colors"
                >
                  {isExpanded ? "접기" : `더보기 +${extraCount}`}
                </button>
              )}
            </>
          )}
        </section>

        {viewMode === "day" ? (
          <>
            <section className="px-6 pt-6 pb-2">
              <SectionHeader
                title={scheduleTitle}
                count={selectedDaySchedules.length}
                onConfirm={handleAddTodo}
                showAddButton={false}
                applications={data}
              />

              <div className="mt-3 space-y-3">
                {selectedDaySchedules.length > 0 ? (
                  selectedDaySchedules.map((schedule) => (
                    <ScheduleItem key={schedule.id} schedule={schedule} />
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">
                    {emptyScheduleMessage}
                  </p>
                )}
              </div>
            </section>

            <section className="px-6 pt-2 pb-6">
              <SectionHeader
                title={todoTitle}
                count={selectedDayTodos.filter((todo) => !todo.completed).length}
                onConfirm={handleAddTodo}
                showAddButton={true}
                applications={data}
                isSubmitting={isAddingTodo}
              />

              <div className="mt-4 space-y-2">
                {selectedDayTodos.length > 0 ? (
                  selectedDayTodos.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} />
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">
                    {emptyTodoMessage}
                  </p>
                )}
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="px-6 pt-6 pb-2">
              <SectionHeader
                title="전체 일정"
                count={monthSchedules.length}
                onConfirm={handleAddTodo}
                showAddButton={false}
                applications={data}
                isSubmitting={isAddingTodo}
                extra={monthNav}
              />

              <div className="mt-3">
                {monthSchedules.length > 0 ? (
                  monthSchedules.map((item) => (
                    <div key={item.id} className="flex items-baseline gap-2 py-3 px-2">
                      <span className="font-medium text-gray-800 text-[14px] truncate">
                        {item.title}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">
                    {monthLabel}에 일정이 없습니다.
                  </p>
                )}
              </div>
            </section>

            <section className="px-6 pt-2 pb-6">
              <SectionHeader
                title="전체 할 일"
                count={monthTodos.length}
                onConfirm={handleAddTodo}
                showAddButton={true}
                applications={data}
                isSubmitting={isAddingTodo}
                extra={monthNav}
              />

              <div className="mt-4 space-y-2">
                {monthTodos.length > 0 ? (
                  monthTodos.map((todo) => (
                    <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} />
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">
                    {monthLabel}에 할 일이 없습니다.
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default SideDetailPanel;
