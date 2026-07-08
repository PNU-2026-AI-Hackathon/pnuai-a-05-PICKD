import { createPortal } from "react-dom";
import PostTodo from "../../modal/PostTodo";
import PostDocument from "../../modal/PostDocument";
import { useEffect, useRef, useState } from "react";
import type { DocumentItem } from "../../../types/document";
import type { Application } from "../../../types/application";
import { useApplication } from "../../../context/ApplicationContext";

interface Props {
  row: Application;
  onEdit?: (row: Application) => void;
  onDelete?: () => void | Promise<void>;
  onAddDocument: (applicationId: number, document: DocumentItem) => void | Promise<void>;
  onChange?: () => void | Promise<void>;
}

export default function ApplicationMenu({
  row,
  onEdit,
  onDelete,
  onAddDocument,
  onChange,
}: Props) {
  const { addTodo } = useApplication();
  const [open, setOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedMenu = menuRef.current?.contains(target);
      const clickedButton = buttonRef.current?.contains(target);

      if (!clickedMenu && !clickedButton) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setOpen(false);
    };

    if (open) {
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  return (
    <div className="relative flex justify-center">
      <button
        ref={buttonRef}
        className="w-full h-full py-2 text-[20px] text-gray-400 hover:text-[#334155]"
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const menuWidth = 220;
          const menuHeight = 320;

          let top = rect.bottom + 8;
          let left = rect.left - menuWidth;

          if (top + menuHeight > window.innerHeight) {
            top = rect.top - menuHeight - 8;
          }

          if (left < 8) {
            left = 8;
          }

          setMenuPosition({ top, left });
          setOpen((prev) => !prev);
        }}
      >
        ⋯
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed min-w-[220px] bg-white border border-[#E2E8F0] rounded-2xl shadow-lg p-3 z-40"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[14px] font-bold text-[#334155]">
                  {row.company} 할 일 추가하기
                </p>

                <button
                  onClick={() => {
                    setIsTodoModalOpen(true);
                    setOpen(false);
                  }}
                  className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-[600] text-white"
                >
                  + 추가
                </button>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[14px] font-bold text-[#334155]">
                  {row.company} 서류 추가하기
                </p>

                <button
                  onClick={() => {
                    setIsDocumentModalOpen(true);
                    setOpen(false);
                  }}
                  className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-[600] text-white"
                >
                  + 추가
                </button>
              </div>
            </div>
            <div className="h-[1px] bg-[#E2E8F0] my-2" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(row);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg hover:bg-gray-50"
            >
              ✏️ 수정
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                await onDelete?.();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg text-red-500 hover:bg-red-50"
            >
              🗑️ 삭제
            </button>
          </div>,
          document.body,
        )}
      {isTodoModalOpen && (
        <PostTodo
          application={row}
          onClose={() => setIsTodoModalOpen(false)}
          onConfirm={async (data) => {
            await addTodo({
              title: data.title,
              dueDateTime: data.dueDateTime,
              memo: data.memo,
              applicationId: Number(data.applicationId),
            });

            setIsTodoModalOpen(false);
            await onChange?.();
          }}
        />
      )}

      {isDocumentModalOpen && (
        <PostDocument
          application={row}
          onClose={() => setIsDocumentModalOpen(false)}
          onSubmit={async (document: DocumentItem) => {
            await onAddDocument(row.id, document);
            setIsDocumentModalOpen(false);
            await onChange?.();
          }}
        />
      )}
    </div>
  );
}
