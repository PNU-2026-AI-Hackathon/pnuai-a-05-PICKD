import type { Schedule } from "../types/schedule";

export const getScheduleCategory = (
  schedule: Schedule,
): "면접" | "마감" | "제출" | "일반" => {
  if (schedule.category) {
    return schedule.category as "면접" | "마감" | "제출" | "일반";
  }
  const text = schedule.summary || "";
  if (text.includes("면접")) return "면접";
  if (text.includes("마감")) return "마감";
  if (text.includes("제출")) return "제출";

  return "일반";
};

export const categoryColor = {
  면접: "bg-[#F9F2FF] text-[#C082F6] text-[12px] font-semibold",
  마감: "bg-[#F9F2FF] text-[#EF4444] text-[12px] font-semibold",
  제출: "bg-blue-100 text-blue-500 text-[12px] font-semibold",
  일반: "bg-gray-100 text-gray-500 text-[12px] font-semibold",
};
