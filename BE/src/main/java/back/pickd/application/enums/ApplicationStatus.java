package back.pickd.application.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

import java.util.Arrays;

@Getter
public enum ApplicationStatus {
    WRITING("작성중", "작성 중"),
    SUBMITTED("지원완료", "지원 완료", "결과 대기"),
    DOCUMENT("서류전형", "서류 전형", "서류 제출", "서류제출"),
    WRITTEN_TEST("필기전형", "필기 전형"),
    INTERVIEW("면접전형", "면접 전형"),
    COMPLETED("전형완료", "최종 결과", "최종결과");

    @JsonValue
    private final String label;
    private final String[] aliases;

    ApplicationStatus(String label, String... aliases) {
        this.label = label;
        this.aliases = aliases;
    }

    @JsonCreator
    public static ApplicationStatus from(String value) {
        if (value == null || value.isBlank()) {
            return WRITING;
        }

        String trimmed = value.trim();
        String normalized = trimmed.replaceAll("\\s+", "");
        for (ApplicationStatus status : values()) {
            if (status.name().equalsIgnoreCase(trimmed)
                    || status.label.equals(trimmed)
                    || status.label.replaceAll("\\s+", "").equals(normalized)
                    || Arrays.stream(status.aliases).anyMatch(alias ->
                    alias.equals(trimmed) || alias.replaceAll("\\s+", "").equals(normalized))) {
                return status;
            }
        }

        throw new IllegalArgumentException("지원하지 않는 지원 상태입니다: " + value);
    }

    public boolean needsApplyEvent() {
        return true;
    }

    public boolean needsInterviewEvent() {
        return true;
    }

    public boolean needsDeadlineEvent() {
        return true;
    }
}
