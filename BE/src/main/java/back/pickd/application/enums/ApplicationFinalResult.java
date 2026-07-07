package back.pickd.application.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ApplicationFinalResult {
    PASSED("합격"),
    REJECTED("불합격"),
    WITHDRAWN("포기");

    @JsonValue
    private final String label;

    @JsonCreator
    public static ApplicationFinalResult from(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String trimmed = value.trim();
        for (ApplicationFinalResult result : values()) {
            if (result.name().equals(trimmed) || result.label.equals(trimmed)) {
                return result;
            }
        }

        throw new IllegalArgumentException("지원하지 않는 최종 결과입니다: " + value);
    }
}
