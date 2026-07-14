import { ChevronRight, Plus } from "lucide-react";
import type { Todo } from "../../../types/todo";
import { useApplication } from "../../../context/ApplicationContext";

interface TodoSectionProps {
  todos: Todo[];
  onClick: () => void;
  onAdd?: () => void;
  focusedApplication?: any;
  selectedDate: Date | null;
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export default function TodoSection({
  todos,
  onClick,
  onAdd,
  selectedDate,
}: TodoSectionProps) {
  const { toggleTodo } = useApplication();
  const displayTodos = todos.slice(0, 7);
  const selectedDay = selectedDate ?? new Date();
  const isToday = isSameDay(selectedDay, new Date());
  const sectionTitle = isToday
    ? "오늘의 할일"
    : `${selectedDay.getMonth() + 1}/${selectedDay.getDate()} 할일`;

  return (
    <section>
      <div className="mb-2.5 flex items-center gap-1">
        <button
          type="button"
          onClick={onClick}
          className="group flex flex-1 items-center gap-1 text-left text-[12px] font-medium text-[#71809A] hover:text-[#28303D]"
        >
          {sectionTitle}
          <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
        </button>
        <button
          type="button"
          onClick={onAdd}
          aria-label="할 일 추가"
          className="flex h-5 w-5 items-center justify-center rounded text-[#A4AEBE] hover:bg-[#EFF2F6] hover:text-[#28303D]"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {displayTodos.length === 0 ? (
        <p className="px-2 py-1 text-[12px] text-[#8A96A9]">
          {isToday
            ? "오늘 할 일이 없어요"
            : "선택한 날짜의 할 일이 없어요"}
        </p>
      ) : (
        <ul className="space-y-1">
          {displayTodos.map((todo) => (
            <li
              key={todo.id}
              className="flex cursor-pointer items-start gap-2.5 rounded-md px-2.5 py-2 text-[13px] hover:bg-white"
              onClick={() => void toggleTodo(todo.id)}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${
                  todo.completed
                    ? "border-[#2563EB] bg-[#2563EB] text-white"
                    : "border-[#A4AEBE]/70 bg-transparent"
                }`}
              >
                {todo.completed && (
                  <span className="text-[10px] leading-none">✓</span>
                )}
              </span>
              <span
                className={`min-w-0 flex-1 leading-snug ${
                  todo.completed
                    ? "text-[#79859A] line-through"
                    : "text-[#28303D]"
                }`}
              >
                {(todo.company || todo.application?.company) && (
                  <span className="mr-1 text-[11px] text-[#71809A]">
                    [{todo.company || todo.application?.company}]
                  </span>
                )}
                {todo.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
