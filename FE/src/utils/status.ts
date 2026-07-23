import {
  APPLICATION_STATUSES,
  type ApplicationFinalResult,
  type ApplicationStatus,
} from "../types/application";

const STATUS_DISPLAY_MAP: Record<ApplicationStatus, string> = {
  작성중: "작성중",
  지원완료: "지원완료",
  서류전형: "서류전형",
  필기전형: "필기전형",
  면접전형: "면접전형",
  전형완료: "전형완료",
};

export type StatusTone = {
  backgroundColor: string;
  color: string;
  dotColor: string;
};

const STATUS_TONES: Record<ApplicationStatus, StatusTone> = {
  작성중: {
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    dotColor: "#2563EB",
  },
  지원완료: {
    backgroundColor: "#EFF2F6",
    color: "#28303D",
    dotColor: "#A4AEBE",
  },
  서류전형: {
    backgroundColor: "#EEEEFB",
    color: "#4848B3",
    dotColor: "#5B5BD6",
  },
  필기전형: {
    backgroundColor: "#E6F5F3",
    color: "#1F7A77",
    dotColor: "#2A9D99",
  },
  면접전형: {
    backgroundColor: "#FCF3E2",
    color: "#855906",
    dotColor: "#C5860E",
  },
  전형완료: {
    backgroundColor: "#EFF2F6",
    color: "#28303D",
    dotColor: "#A4AEBE",
  },
};

const FINAL_RESULT_TONES: Record<
  NonNullable<ApplicationFinalResult>,
  StatusTone
> = {
  최종합격: {
    backgroundColor: "#E7F6EF",
    color: "#0C6347",
    dotColor: "#15926A",
  },
  불합격: {
    backgroundColor: "#FCEBEC",
    color: "#932A30",
    dotColor: "#D24545",
  },
  보류: {
    backgroundColor: "#F5F3FF",
    color: "#6D28D9",
    dotColor: "#8B5CF6",
  },
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

export function getStatusTone(
  status?: ApplicationStatus | string | null,
): StatusTone {
  return (
    STATUS_TONES[status as ApplicationStatus] ?? {
      backgroundColor: "#EFF2F6",
      color: "#5A6678",
      dotColor: "#A4AEBE",
    }
  );
}

export function getFinalResultTone(
  result?: ApplicationFinalResult | string | null,
): StatusTone {
  if (!result) {
    return {
      backgroundColor: "#EFF2F6",
      color: "#5A6678",
      dotColor: "#A4AEBE",
    };
  }

  return (
    FINAL_RESULT_TONES[result as NonNullable<ApplicationFinalResult>] ?? {
      backgroundColor: "#EFF2F6",
      color: "#5A6678",
      dotColor: "#A4AEBE",
    }
  );
}

// 기존 호출부 호환용. 새 상태 UI는 getStatusTone의 인라인 스타일을 사용한다.
export function getStatusStyle(status?: ApplicationStatus | string | null) {
  switch (status) {
    case "작성중":
      return "bg-[#EFF6FF] text-[#1D4ED8]";
    case "지원완료":
      return "bg-[#EFF2F6] text-[#28303D]";
    case "서류전형":
      return "bg-[#EEEEFB] text-[#4848B3]";
    case "필기전형":
      return "bg-[#E6F5F3] text-[#1F7A77]";
    case "면접전형":
      return "bg-[#FCF3E2] text-[#855906]";
    case "전형완료":
      return "bg-[#EFF2F6] text-[#28303D]";
    default:
      return "bg-[#EFF2F6] text-[#5A6678]";
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
