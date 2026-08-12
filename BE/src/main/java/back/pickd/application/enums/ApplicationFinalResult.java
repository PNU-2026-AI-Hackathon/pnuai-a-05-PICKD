package back.pickd.application.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.Getter;

import java.util.Arrays;

@Getter
public enum ApplicationFinalResult {
    PASSED("최종합격", "합격"),
    REJECTED("불합격"),
    PENDING("보류", "포기");

    @JsonValue
    private final String label;
    private final String[] aliases;

    ApplicationFinalResult(String label, String... aliases) {
        this.label = label;
        this.aliases = aliases;
    }

    @JsonCreator
    public static ApplicationFinalResult from(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String trimmed = value.trim();
        String normalized = trimmed.replaceAll("\\s+", "");
        for (ApplicationFinalResult result : values()) {
            if (result.name().equalsIgnoreCase(trimmed)
                    || result.label.equals(trimmed)
                    || result.label.replaceAll("\\s+", "").equals(normalized)
                    || Arrays.stream(result.aliases).anyMatch(alias ->
                    alias.equals(trimmed) || alias.replaceAll("\\s+", "").equals(normalized))) {
                return result;
            }
        }

        throw new IllegalArgumentException("지원하지 않는 최종 결과입니다: " + value);
    }
}
