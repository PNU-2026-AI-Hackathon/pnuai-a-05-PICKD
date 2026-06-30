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
    <div className="flex items-start gap-3 p-4 hover:bg-blue-50 rounded-xl transition-colors group">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle?.(todo.id)}
        className="mt-1.5 w-5 h-5 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
      />

      <div className="flex-1">
        <div className="flex justify-between items-center">
          <p
            className={`font-medium text-[15px] leading-tight ${
              todo.completed ? "text-gray-400 line-through" : "text-gray-800"
            }`}
          >
            {todo.title}
          </p>

          {isOverdue && (
            <span className="text-xs text-orange-400 bg-orange-50 px-1.5 py-0.5 rounded">
              이월
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              priority === "긴급"
                ? "bg-red-100 text-red-600"
                : "bg-blue-50 text-blue-500"
            }`}
          >
            {priority}
          </span>

          {companyName && (
            <span className="text-[13px] text-gray-500 font-medium">
              {companyName}
            </span>
          )}

          <span className="text-[13px] text-gray-400 flex items-center gap-1">
            <span className="text-[10px] opacity-70">🕒</span>
            {time}
          </span>
        </div>

        {todo.memo && (
          <p className="mt-1 text-[12px] text-gray-400 italic">{todo.memo}</p>
        )}
      </div>
    </div>
  );
};

export default TodoItem;
