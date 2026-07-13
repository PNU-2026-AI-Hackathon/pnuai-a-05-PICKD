import { useState } from "react";
import { ChevronDown } from "lucide-react";
import ProgressCircle from "./ProgressCircle";
import SectionHeader from "./SectionHeader";
import TodoItem from "./TodoItem";
import AnnouncementItem from "./AnnouncementItem";
import type { Application } from "../../../../types/application";
import ScheduleItem from "./ScheduleItem";
import { useSidePanelData } from "../../../../hooks/useSidePanelData";

interface Props {
  applications: Application[];
  selectedDate?: Date;
}

const SideDetailPanel = ({ applications: data, selectedDate }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    selectedDayTodos,
    selectedDay,
    sortedList,
    selectedDaySchedules,
    handleAddTodo,
    toggleTodo,
    calculateDDay,
    isAddingTodo,
  } = useSidePanelData(selectedDate);
  const displayItems = isExpanded ? sortedList : sortedList.slice(0, 3);

  const extraCount = sortedList.length - 3;
  const hasSelectedDate = Boolean(selectedDate);
  const selectedDayLabel = selectedDay.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
  const scheduleTitle = "오늘의 일정";
  const todoTitle = "오늘의 할 일";
  const progressTitle = hasSelectedDate ? `${selectedDayLabel}의 진행률` : "오늘의 진행률";
  const emptyScheduleMessage = hasSelectedDate
    ? `${selectedDayLabel}에 일정이 없습니다.`
    : "오늘 일정이 없습니다.";
  const emptyTodoMessage = hasSelectedDate
    ? `${selectedDayLabel}에 할 일이 없습니다.`
    : "오늘 할 일이 없습니다.";

  const selectedDayProgress = selectedDayTodos.length
    ? Math.round(
        (selectedDayTodos.filter((todo) => todo.completed).length /
          selectedDayTodos.length) *
          100,
      )
    : 0;
  
  return (
    <div className="w-[480px] h-full bg-gray-50 border-l border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
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

        <ProgressCircle percentage={selectedDayProgress} />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <section className="p-6">
          <div className="flex items-center gap-1 mb-4">
            <ChevronDown size={18} className="text-gray-400" />

            <h3 className="font-bold text-gray-800 text-sm">다가오는 공고</h3>

            <span className="flex items-center justify-center w-5 h-5 bg-[#F1F5F9] text-[#94A3B8] text-[10px] font-bold rounded-full">
              {sortedList.length}
            </span>
          </div>

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
        </section>

        <section className="px-6 pt-6 pb-4">
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

        <section className="px-6 pt-4 pb-6">
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
      </div>
    </div>
  );
};

export default SideDetailPanel;
