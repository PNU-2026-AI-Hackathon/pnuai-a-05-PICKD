import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, type DragEvent } from "react";
import {
  ChevronRight,
  Copy,
  ExternalLink,
  GripVertical,
  Pencil,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { getNoticeDetail } from "../../../api/notice";
import { getRelativeTime } from "../../../utils/document";
import {
  APPLICATION_STATUSES,
  type Application,
  type ApplicationStatus,
} from "../../../types/application";

interface Props {
  row: Application;
  onEdit?: (row: Application) => void;
  onDelete?: () => void | Promise<void>;
  onToggleImportant?: () => void | Promise<void>;
  onDuplicate?: () => void | Promise<void>;
  onChangeStatus?: (status: ApplicationStatus) => void | Promise<void>;
  isDragging?: boolean;
  onRowDragStart?: () => void;
  onRowDragEnd?: () => void;
}

const MENU_WIDTH = 224;
const VIEWPORT_PADDING = 8;

export default function ApplicationMenu({
  row,
  onDelete,
  onToggleImportant,
  onDuplicate,
  onChangeStatus,
  isDragging = false,
  onRowDragStart,
  onRowDragEnd,
}: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    maxHeight: 320,
  });

  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const suppressClickRef = useRef(false);

  const sourceUrl = row.sourceUrl || row.url;
  const canOpenSource = Boolean(sourceUrl || row.noticeId);
  const query = search.trim().toLowerCase();
  const matches = (label: string) =>
    !query || label.toLowerCase().includes(query);
  const showStatus =
    matches("상태 변경") ||
    APPLICATION_STATUSES.some((status) => status.toLowerCase().includes(query));

  const closeMenu = () => {
    setOpen(false);
    setSearch("");
    setStatusOpen(false);
  };

  const updateMenuPosition = () => {
    const trigger = buttonRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const left = Math.min(
      Math.max(VIEWPORT_PADDING, rect.left),
      window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING,
    );
    // 기준 프로젝트처럼 항상 트리거 아래에서 열고, 화면 아래 공간이
    // 부족한 경우 메뉴 자체에 스크롤을 적용한다. 마지막 행만 위로
    // 튀어 올라가는 동작을 없애기 위한 처리다.
    const top = rect.bottom + 4;
    const availableHeight = Math.max(
      120,
      window.innerHeight - top - VIEWPORT_PADDING,
    );

    setMenuPosition({
      top,
      left,
      maxHeight: Math.min(420, availableHeight),
    });
  };

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      )
        return;
      closeMenu();
    };
    const handleScroll = () => closeMenu();

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  const run = async (callback?: () => void | Promise<void>) => {
    await callback?.();
    closeMenu();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        draggable
        onDragStart={(event: DragEvent<HTMLButtonElement>) => {
          suppressClickRef.current = true;
          closeMenu();
          event.stopPropagation();
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData(
            "application/x-pickd-application-row",
            String(row.id),
          );
          onRowDragStart?.();
        }}
        onDragEnd={(event) => {
          event.stopPropagation();
          onRowDragEnd?.();
          window.setTimeout(() => {
            suppressClickRef.current = false;
          }, 0);
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (suppressClickRef.current) return;
          updateMenuPosition();
          setOpen((prev) => !prev);
        }}
        className={`absolute left-0.5 top-1/2 z-20 flex h-6 w-6 -translate-y-1/2 cursor-grab items-center justify-center rounded text-[#A4AEBE] transition-all hover:bg-[#EFF2F6] hover:text-[#5A6678] active:cursor-grabbing ${
          open || isDragging
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        } ${isDragging ? "bg-[#DBEAFE] text-[#2563EB]" : ""}`}      >
        <GripVertical className="h-4 w-4" strokeWidth={2} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] w-56 overflow-x-hidden overflow-y-auto rounded-lg border border-[#E3E8EF] bg-white shadow-[0_12px_28px_-6px_rgba(22,28,38,0.18)]"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              maxHeight: menuPosition.maxHeight,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <label className="relative block px-2 pb-1 pt-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A4AEBE]" />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
                placeholder="작업을 검색하세요"
                className="h-7 w-full rounded-md border border-[#BFDBFE] bg-white pl-7 pr-2 text-xs text-[#28303D] outline-none focus:ring-2 focus:ring-[#DBEAFE]"
              />
            </label>

            <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-[#79859A]">
              공고
            </p>

            {matches(row.important ? "즐겨찾기 해제" : "즐겨찾기 토글") && (
              <button
                type="button"
                onClick={() => run(onToggleImportant)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#3E4859] hover:bg-[#F6F8FB]"
              >
                <Star
                  className={`h-4 w-4 ${row.important ? "fill-[#F5B800] text-[#F5B800]" : "text-[#79859A]"}`}
                />
                {row.important ? "즐겨찾기 해제" : "즐겨찾기 토글"}
              </button>
            )}

            {matches("공고 편집") && (
              <button
                type="button"
                onClick={() => run(() => navigate(`/applications/${row.id}`))}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#3E4859] hover:bg-[#F6F8FB]"
              >
                <Pencil className="h-4 w-4 text-[#79859A]" />
                공고 편집
              </button>
            )}

            {matches("공고 URL 열기") && (
              <button
                type="button"
                disabled={!canOpenSource}
                onClick={async () => {
                  let targetUrl = sourceUrl;
                  if (!targetUrl && row.noticeId) {
                    try {
                      const notice = await getNoticeDetail(row.noticeId);
                      targetUrl = notice.noticeUrl || undefined;
                    } catch (error) {
                      console.error("공고 원문 조회 실패:", error);
                    }
                  }

                  if (targetUrl) {
                    window.open(targetUrl, "_blank", "noopener,noreferrer");
                  } else {
                    alert("연결된 공고 원문 URL이 없습니다.");
                  }
                  closeMenu();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#3E4859] hover:bg-[#F6F8FB] disabled:pointer-events-none disabled:opacity-35"
              >
                <ExternalLink className="h-4 w-4 text-[#79859A]" />
                공고 URL 열기
              </button>
            )}

            {matches("복제") && (
              <button
                type="button"
                onClick={() => run(onDuplicate)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#3E4859] hover:bg-[#F6F8FB]"
              >
                <Copy className="h-4 w-4 text-[#79859A]" />
                복제
              </button>
            )}

            {showStatus && (
              <div>
                <button
                  type="button"
                  onClick={() => setStatusOpen((prev) => !prev)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#3E4859] hover:bg-[#F6F8FB]"
                >
                  <ChevronRight
                    className={`h-4 w-4 text-[#79859A] transition-transform ${statusOpen ? "rotate-90" : ""}`}
                  />
                  상태 변경
                </button>
                {(statusOpen || query) && (
                  <div className="mx-2 mb-1 rounded-md bg-[#F6F8FB] p-1">
                    {APPLICATION_STATUSES.filter(
                      (status) =>
                        !query ||
                        status.toLowerCase().includes(query) ||
                        "상태 변경".includes(query),
                    ).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => run(() => onChangeStatus?.(status))}
                        className={`block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-white ${
                          row.status === status
                            ? "font-semibold text-[#2563EB]"
                            : "text-[#5A6678]"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {matches("삭제") && (
              <>
                <div className="mx-2 h-px bg-[#EFF2F6]" />
                <button
                  type="button"
                  onClick={() => run(onDelete)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-[#D24545] hover:bg-[#FCEBEC]"
                >
                  <Trash2 className="h-4 w-4" />
                  삭제
                </button>
              </>
            )}

            <div className="border-t border-[#EFF2F6] px-3 py-2 text-[10px] leading-relaxed text-[#A4AEBE]">
              <div>최종 편집</div>
              <div className="opacity-60">
                {getRelativeTime(row.updatedAt || row.recentUpdated)}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
