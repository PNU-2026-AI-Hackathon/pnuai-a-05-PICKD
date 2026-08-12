import type { DocumentStatus } from "../types/document";
import { parseLocalDateTime } from "./date";

export const statusStyle: Record<DocumentStatus, string> = {
  작성중: "bg-[#ECFDF5] text-[#10B981]",
  완료: "bg-[#F9F2FF] text-[#C082F6]",
};

export const getRelativeTime = (dateString?: string) => {
  if (!dateString) return "-";

  const now = new Date();
  const target = parseLocalDateTime(dateString);
  if (!target) return "-";

  const diffMs = now.getTime() - target.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;

  return `${days}일 전`;
};
