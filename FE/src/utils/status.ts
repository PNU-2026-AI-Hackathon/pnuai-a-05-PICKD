import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from "../types/application";

const STATUS_DISPLAY_MAP: Record<ApplicationStatus, string> = {
  WRITING: "작성 중",
  SUBMITTED: "결과 대기",
  WRITTEN_TEST: "필기 전형",
  INTERVIEW: "면접 전형",
  COMPLETED: "최종 결과",
};

export function getStatusDisplay(status?: ApplicationStatus | string | null) {
  if (!status) return "-";
  return STATUS_DISPLAY_MAP[status as ApplicationStatus] || status;
}

export function isFinalStatus(status?: ApplicationStatus | string | null) {
  return status === "전형완료";
}

export function isActiveStatus(status?: ApplicationStatus | string | null) {
  return !isFinalStatus(status);
}

export function getStatusStyle(status?: ApplicationStatus | string | null) {
  switch (status) {
    case "작성중":
      return "bg-[#EAF3FF] text-[#2563EB]";
    case "지원완료":
      return "bg-[#ECFDF5] text-[#10B981]";
    case "서류전형":
      return "bg-[#EFF6FF] text-[#2563EB]";
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

export function getNextStep(status?: ApplicationStatus | string | null) {
  if (!status) return "-";

  const index = APPLICATION_STATUSES.indexOf(status as ApplicationStatus);
  if (index === -1 || index === APPLICATION_STATUSES.length - 1) {
    return "-";
  }

  return APPLICATION_STATUSES[index + 1];
}
