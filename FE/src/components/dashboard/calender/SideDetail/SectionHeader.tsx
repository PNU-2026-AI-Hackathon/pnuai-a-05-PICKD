import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import PostTodo from "../../../modal/PostTodo";
import { useApplication } from "../../../../context/ApplicationContext";
import type { Application } from "../../../../types/application";

interface SectionHeaderProps {
  title: string;
  count: number;
  showAddButton?: boolean;
  onConfirm?: (data: {
    title: string;
    dueDateTime?: string;
    applicationId: string;
    memo: string;
  }) => void | Promise<void>;
  applications?: Application[];
  isSubmitting?: boolean;
}

const SectionHeader = ({
  title,
  count,
  onConfirm,
  showAddButton = true,
  applications: propApplications,
  isSubmitting = false,
}: SectionHeaderProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const isConfirmingRef = useRef(false);

  const { applications: contextApplications } = useApplication();

  const todoApplications = propApplications ?? contextApplications;
  const submitting = isSubmitting || isConfirming;

  const handlePostTodo = async (data: {
    title: string;
    dueDateTime?: string;
    applicationId: string;
    memo: string;
  }) => {
    if (isConfirmingRef.current || isSubmitting) {
      return;
    }

    isConfirmingRef.current = true;
    setIsConfirming(true);

    try {
      await onConfirm?.(data);
      setIsModalOpen(false);
    } catch (error) {
      console.error("할 일 추가 실패:", error);
      alert("할 일 추가에 실패했습니다.");
    } finally {
      isConfirmingRef.current = false;
      setIsConfirming(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-800 text-sm">{title}</h3>

          {count !== undefined && (
            <span className="flex items-center justify-center w-5 h-5 bg-[#F1F5F9] text-[#94A3B8] text-[10px] font-bold rounded-full">
              {count}
            </span>
          )}
        </div>

        {showAddButton && (
          <button
            onClick={() => {
              if (submitting) return;
              setIsModalOpen(true);
            }}
            className={`p-1 rounded-md transition-colors group ${
              submitting ? "cursor-not-allowed opacity-50" : "hover:bg-gray-100"
            }`}
            title="새 할 일 추가"
            disabled={submitting}
          >
            <Plus
              size={20}
              className={`${
                submitting
                  ? "text-gray-300"
                  : "text-gray-400 group-hover:text-blue-500"
              }`}
            />
          </button>
        )}
      </div>

      {isModalOpen && (
        <PostTodo
          onClose={() => {
            if (submitting) return;
            setIsModalOpen(false);
          }}
          onConfirm={handlePostTodo}
          applications={todoApplications}
        />
      )}
    </>
  );
};

export default SectionHeader;
