import { useState } from "react";
import { formatDate } from "../../../utils/date";
import type { Todo } from "../../../types/todo";
import { useApplication } from "../../../context/ApplicationContext";

interface TodoSectionProps {
  todos: Todo[];
  onClick: () => void;
  focusedApplication?: any;
}

export default function TodoSection({
  todos,
  focusedApplication,
  onClick,
}: TodoSectionProps) {
  const [mode, setMode] = useState<"all" | "focused">("all");
  const { toggleTodo } = useApplication();

  const formatDateTime = (dateTime?: string) => {
    if (!dateTime) return "기한 없음";
    else return formatDate(dateTime);
  };

  const targetApplication = focusedApplication || todos[0];

  const filteredTodos =
    mode === "focused"
      ? focusedApplication
        ? todos.filter((todo) => todo.application?.id === targetApplication?.id)
        : []
      : todos;

  return (
    <div
      onClick={onClick}
      className="mt-4 bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-[0px_1px_3px_0px_#00000040] cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-lg text-[#0F172A] font-bold mb-[15px] mt-2">
          {mode === "all"
            ? "전체 할 일"
            : focusedApplication
              ? `${targetApplication?.company} 할 일`
              : "선택된 공고 할 일"}
        </h4>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMode(mode === "all" ? "focused" : "all");
            }}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            {mode === "all" ? "선택한 공고 할 일" : "전체 할 일"}
          </button>
        </div>
      </div>

      <div
        className={`h-[220px] overflow-y-auto pr-1 ${
          filteredTodos.length === 0 ? "flex items-center justify-center" : ""
        }`}
      >
        {filteredTodos.length === 0 ? (
          <p className="text-base text-gray-400">
            {mode === "focused" && !focusedApplication
              ? "공고를 선택하시오"
              : "할 일 없음"}
          </p>
        ) : (
          filteredTodos.map((t) => {
            const companyName = t.company || t.application?.company;

            return (
              <div
                key={t.id}
                className="flex items-center gap-4 mb-3 last:mb-0"
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTodo(t.id);
                  }}
                  className={`
                    w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0
                    ${
                      t.completed
                        ? "border-2 border-green-500 bg-white"
                        : "bg-[#D9D9D9]"
                    }
                  `}
                >
                  {t.completed && (
                    <svg
                      className="w-3 h-3 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="4"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>

                <div className="flex flex-col gap-0.5">
                  <h3
                    className={`text-[14px] font-semibold leading-tight ${
                      t.completed
                        ? "line-through text-gray-400"
                        : "text-[#0F172A]"
                    }`}
                  >
                    {mode === "all" && companyName && (
                      <span
                        className={`mr-1 ${
                          t.completed ? "text-gray-400" : "text-[#64748B]"
                        }`}
                      >
                        [{companyName}]
                      </span>
                    )}

                    {t.title}
                  </h3>

                  <span className="text-[12px] text-gray-400">
                    {formatDateTime(t.dueDateTime)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
