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
}

const SideDetailPanel = ({ applications: data }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    todayTodos,
    today,
    sortedList,
    todaySchedules,
    handleAddTodo,
    toggleTodo,
    calculateDDay,
    isAddingTodo,
  } = useSidePanelData();
  const displayItems = isExpanded ? sortedList : sortedList.slice(0, 3);

  const extraCount = sortedList.length - 3;

  return (
    <div className="w-[400px] h-full bg-white border-l border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {today.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <p className="text-sm text-gray-500 mt-1">오늘의 진행률</p>
        </div>

        <ProgressCircle percentage={13} />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <section className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-1 mb-4">
            <ChevronDown size={18} className="text-gray-400" />

            <h3 className="font-bold text-gray-800 text-base">다가오는 공고</h3>

            <span className="flex items-center justify-center w-5 h-5 bg-[#F1F5F9] text-[#94A3B8] text-[11px] font-bold rounded-full">
              {sortedList.length}
            </span>
          </div>

          <div className="space-y-4">
            {displayItems.map((item) => (
              <AnnouncementItem
                key={item.id}
                title={item.title}
                company={item.company}
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

        <section className="p-6 border-b border-gray-100">
          <SectionHeader
            title="오늘의 일정"
            count={todaySchedules.length}
            onConfirm={handleAddTodo}
            showAddButton={false}
            applications={data}
          />

          <div className="mt-3 space-y-3">
            {todaySchedules.length > 0 ? (
              todaySchedules.map((schedule) => (
                <ScheduleItem key={schedule.id} schedule={schedule} />
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                오늘 예정된 일정이 없습니다.
              </p>
            )}
          </div>
        </section>

        <section className="p-6">
          <SectionHeader
            title="오늘의 할 일"
            count={todayTodos.filter((todo) => !todo.completed).length}
            onConfirm={handleAddTodo}
            showAddButton={true}
            applications={data}
            isSubmitting={isAddingTodo}
          />

          <div className="mt-4 space-y-2">
            {todayTodos.length > 0 ? (
              todayTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} />
              ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                할 일이 없습니다. 새로운 할 일을 추가해보세요!
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SideDetailPanel;
