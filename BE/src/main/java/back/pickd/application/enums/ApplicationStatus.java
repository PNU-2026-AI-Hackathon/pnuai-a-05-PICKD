package back.pickd.application.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ApplicationStatus {
    WRITING("작성 중"),
    SUBMITTED("결과 대기"),
    WRITTEN_TEST("필기 전형"),
    INTERVIEW("면접 전형"),
    COMPLETED("최종 결과");

    @JsonValue
    private final String label;

    @JsonCreator
    public static ApplicationStatus from(String value) {
        if (value == null || value.isBlank()) {
            return WRITING;
        }

        String trimmed = value.trim();
        for (ApplicationStatus status : values()) {
            if (status.name().equals(trimmed) || status.label.equals(trimmed)) {
                return status;
            }
        }

        throw new IllegalArgumentException("지원하지 않는 지원 상태입니다: " + value);
    }

    public boolean needsApplyEvent() {
        return this != COMPLETED;
    }

    public boolean needsInterviewEvent() {
        return this == INTERVIEW;
    }

    public boolean needsDeadlineEvent() {
        return true;
    }
}
