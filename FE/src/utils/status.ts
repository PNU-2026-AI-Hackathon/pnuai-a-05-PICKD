import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from "../types/application";

export function getStatusStyle(status: ApplicationStatus) {
  switch (status) {
    case "작성중":
      return "bg-[#EAF3FF] text-[#2563EB]";
    case "지원완료":
      return "bg-[#ECFDF5] text-[#10B981]";
    case "서류전형":
      return "bg-[#EEF2FF] text-[#4F46E5]";
    case "필기전형":
      return "bg-purple-100 text-purple-600";
    case "면접전형":
      return "bg-yellow-100 text-yellow-600";
    case "전형완료":
      return "bg-[#F1F5F9] text-[#64748B]";
    default:
      return "bg-[#E2E8F0] text-[#94A3B8]";
  }
}

export function getNextStep(status?: ApplicationStatus) {
  if (!status) return "-";

  const index = APPLICATION_STATUSES.indexOf(status);
  if (index === -1 || index === APPLICATION_STATUSES.length - 1) {
    return "-";
  }

  return APPLICATION_STATUSES[index + 1];
}
