package back.pickd.application.enums;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.assertj.core.api.Assertions.*;

@DisplayName("ApplicationStatus 단위 테스트")
class ApplicationStatusTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Nested
    @DisplayName("JSON 직렬화")
    class Serialization {

        @Test
        @DisplayName("SUBMITTED는 '지원완료'로 직렬화된다")
        void serializesSubmitted() throws Exception {
            String json = objectMapper.writeValueAsString(ApplicationStatus.SUBMITTED);
            assertThat(json).isEqualTo("\"지원완료\"");
        }

        @Test
        @DisplayName("모든 enum 값이 label로 직렬화된다")
        void allEnumsSerializeToLabel() throws Exception {
            for (ApplicationStatus status : ApplicationStatus.values()) {
                String json = objectMapper.writeValueAsString(status);
                assertThat(json).isEqualTo("\"" + status.getLabel() + "\"");
            }
        }
    }

    @Nested
    @DisplayName("JSON 역직렬화")
    class Deserialization {

        @Test
        @DisplayName("'면접전형' 문자열을 INTERVIEW로 역직렬화한다")
        void deserializesInterviewLabel() throws Exception {
            ApplicationStatus result = objectMapper.readValue("\"면접전형\"", ApplicationStatus.class);
            assertThat(result).isEqualTo(ApplicationStatus.INTERVIEW);
        }

        @Test
        @DisplayName("모든 label이 올바른 enum으로 역직렬화된다")
        void allLabelsDeserializeCorrectly() throws Exception {
            for (ApplicationStatus expected : ApplicationStatus.values()) {
                ApplicationStatus result = objectMapper.readValue(
                        "\"" + expected.getLabel() + "\"",
                        ApplicationStatus.class
                );
                assertThat(result).isEqualTo(expected);
            }
        }

        @Test
        @DisplayName("모든 enum name이 올바른 enum으로 역직렬화된다")
        void allEnumNamesDeserializeCorrectly() {
            for (ApplicationStatus expected : ApplicationStatus.values()) {
                ApplicationStatus result = ApplicationStatus.from(expected.name());
                assertThat(result).isEqualTo(expected);
            }
        }

        @Test
        @DisplayName("null 또는 빈 문자열이면 WRITING을 반환한다")
        void returnsWritingForBlankValue() {
            assertThat(ApplicationStatus.from(null)).isEqualTo(ApplicationStatus.WRITING);
            assertThat(ApplicationStatus.from("")).isEqualTo(ApplicationStatus.WRITING);
            assertThat(ApplicationStatus.from("   ")).isEqualTo(ApplicationStatus.WRITING);
        }

        @Test
        @DisplayName("지원하지 않는 label이면 IllegalArgumentException이 발생한다")
        void throwsForUnknownLabel() {
            assertThatThrownBy(() -> ApplicationStatus.from("없는상태"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("지원하지 않는 지원 상태입니다");
        }
    }

    @Nested
    @DisplayName("needsApplyEvent")
    class NeedsApplyEvent {

        @ParameterizedTest
        @EnumSource(
                value = ApplicationStatus.class,
                names = {"WRITING", "SUBMITTED", "DOCUMENT", "WRITTEN_TEST", "INTERVIEW"}
        )
        @DisplayName("전형완료 전 상태는 apply 이벤트가 필요하다")
        void returnsTrueBeforeCompleted(ApplicationStatus status) {
            assertThat(status.needsApplyEvent()).isTrue();
        }

        @Test
        @DisplayName("COMPLETED는 apply 이벤트가 필요하지 않다")
        void returnsFalseForCompleted() {
            assertThat(ApplicationStatus.COMPLETED.needsApplyEvent()).isFalse();
        }
    }

    @Nested
    @DisplayName("needsInterviewEvent")
    class NeedsInterviewEvent {

        @Test
        @DisplayName("INTERVIEW만 interview 이벤트가 필요하다")
        void returnsTrueOnlyForInterview() {
            assertThat(ApplicationStatus.INTERVIEW.needsInterviewEvent()).isTrue();
        }

        @ParameterizedTest
        @EnumSource(
                value = ApplicationStatus.class,
                names = {"WRITING", "SUBMITTED", "DOCUMENT", "WRITTEN_TEST", "COMPLETED"}
        )
        @DisplayName("INTERVIEW 외 상태는 interview 이벤트가 필요하지 않다")
        void returnsFalseForOtherStatuses(ApplicationStatus status) {
            assertThat(status.needsInterviewEvent()).isFalse();
        }
    }

    @Nested
    @DisplayName("needsDeadlineEvent")
    class NeedsDeadlineEvent {

        @ParameterizedTest
        @EnumSource(
                value = ApplicationStatus.class,
                names = {"WRITING", "SUBMITTED", "DOCUMENT", "WRITTEN_TEST", "INTERVIEW"}
        )
        @DisplayName("전형완료 전 상태는 deadline 이벤트가 필요하다")
        void returnsTrueBeforeCompleted(ApplicationStatus status) {
            assertThat(status.needsDeadlineEvent()).isTrue();
        }

        @Test
        @DisplayName("COMPLETED는 deadline 이벤트가 필요하지 않다")
        void returnsFalseForCompleted() {
            assertThat(ApplicationStatus.COMPLETED.needsDeadlineEvent()).isFalse();
        }
    }
}