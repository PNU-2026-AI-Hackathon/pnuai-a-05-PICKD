import type { Todo } from "../../types/todo";
import { useApplication } from "../../context/ApplicationContext";
import { formatDate } from "../../utils/date";

interface TodoListModalProps {
  todos: Todo[];
  onClose: () => void;
}

export default function TodoListModal({ todos, onClose }: TodoListModalProps) {
  const { toggleTodo } = useApplication();

  return (
    <div className="py-2">
      <div className="space-y-5 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => toggleTodo?.(todo.id)}
          >
            <div
              className={`w-5 h-5 rounded-full border-1.5 flex items-center justify-center transition-all flex-shrink-0 ${
                todo.completed
                  ? "border-green-500 bg-transparent"
                  : "border-[#D9D9D9] bg-[#D9D9D9] group-hover:border-gray-400"
              }`}
            >
              {todo.completed && (
                <div className="flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-0.5">
              <h3
                className={`text-[15px] font-bold leading-tight ${todo.completed ? "line-through text-gray-400" : "text-gray-800"}`}
              >
                {todo.application?.company && (
                  <span
                    className={`mr-1 ${
                      todo.completed ? "text-gray-400" : "text-[#2563EB]"
                    }`}
                  >
                    [{todo.application.company}]
                  </span>
                )}
                {todo.title}
              </h3>

              <div className="flex items-center gap-3">
                <span className="text-[12px] text-gray-400 tabular-nums font-medium">
                  {formatDate(todo.dueDateTime, "기한 없음")}
                </span>
              </div>
            </div>
          </div>
        ))}

        {todos.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">
            등록된 할 일이 없습니다.
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="w-full mt-10 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-[0.98]"
      >
        닫기
      </button>
    </div>
  );
}
