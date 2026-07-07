import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from "../types/application";

export function isFinalStatus(status?: ApplicationStatus | string | null) {
  return status === "최종 결과";
}

export function isActiveStatus(status?: ApplicationStatus | string | null) {
  return !isFinalStatus(status);
}

export function getStatusStyle(status?: ApplicationStatus | string | null) {
  switch (status) {
    case "작성 중":
      return "bg-[#EAF3FF] text-[#2563EB]";
    case "결과 대기":
      return "bg-[#ECFDF5] text-[#10B981]";
    case "필기 전형":
      return "bg-purple-100 text-purple-600";
    case "면접 전형":
      return "bg-yellow-100 text-yellow-600";
    case "최종 결과":
      return "bg-[#F1F5F9] text-[#64748B]";
    default:
      return "bg-[#E2E8F0] text-[#94A3B8]";
  }
}

export function getNextStep(status?: ApplicationStatus | string | null) {
  if (!status) return "-";

  const index = APPLICATION_STATUSES.indexOf(status as ApplicationStatus);
  if (index === -1 || index === APPLICATION_STATUSES.length - 1) {
    return "-";
  }

  return APPLICATION_STATUSES[index + 1];
}
