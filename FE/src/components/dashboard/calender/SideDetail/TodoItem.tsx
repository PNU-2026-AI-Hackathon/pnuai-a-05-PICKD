import { Icon } from "@iconify/react";
import type { Todo } from "../../../../types/todo";
import { parseLocalDateTime } from "../../../../utils/date";

interface TodoProps {
  todo: Todo;
  onToggle?: (id: number) => void;
}

const TodoItem = ({ todo, onToggle }: TodoProps) => {
  const companyName = todo.company;

  const isUrgent =
    todo.dueDateTime &&
    (parseLocalDateTime(todo.dueDateTime)?.getTime() ?? Number.POSITIVE_INFINITY) -
      new Date().getTime() <
      12 * 60 * 60 * 1000;

  const priority = isUrgent ? "긴급" : "보통";

  const time = todo.dueDateTime
    ? parseLocalDateTime(todo.dueDateTime)?.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }) ?? "시간 미정"
    : "시간 미정";

  const isOverdue = todo.dueDateTime
    ? (parseLocalDateTime(todo.dueDateTime)?.getTime() ?? 0) < new Date().getTime() && !todo.completed
    : false;

  return (
    <div
      className={`flex items-start gap-3 py-3 px-2 rounded-xl transition-colors group ${
        isOverdue ? "bg-orange-50/40 hover:bg-orange-50" : "hover:bg-blue-50"
      }`}
    >
      <label className="mt-0.5 flex cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle?.(todo.id)}
          className="hidden"
        />
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
            todo.completed
              ? "border-indigo-300 bg-indigo-300"
              : "border-blue-500 bg-white"
          }`}
        >
          {todo.completed && (
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </label>

      <div className="flex-1">
        <div className="flex justify-between items-center">
          <p
            className={`font-medium text-[13px] leading-tight ${
              todo.completed ? "text-gray-400 line-through" : "text-gray-900"
            }`}
          >
            {todo.title}
          </p>

          {isOverdue && (
            <span className="text-[11px] font-semibold text-orange-500 bg-orange-100 border border-orange-500 px-2 py-0.5 rounded-full">
              이월
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-[11px] px-1 py-0.5 rounded-xl font-semibold ${
              priority === "긴급"
                ? "bg-red-100 text-red-600"
                : "bg-blue-50 text-blue-500"
            }`}
          >
            {priority}
          </span>

          {companyName && (
            <span className="text-[12px] text-gray-500 font-medium">
              {companyName}
            </span>
          )}

          <span className="text-[12px] text-gray-400 font-medium flex items-center gap-1">
            <Icon icon="lucide:clock" className="w-3 h-3 opacity-70" />
            {time}
          </span>
        </div>

        {todo.memo && (
          <p className="mt-1 text-[11px] text-gray-400 italic">{todo.memo}</p>
        )}
      </div>
    </div>
  );
};

export default TodoItem;
