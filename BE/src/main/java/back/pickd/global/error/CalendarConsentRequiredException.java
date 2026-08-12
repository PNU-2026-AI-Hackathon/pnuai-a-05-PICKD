package back.pickd.global.error;

/**
 * 구글 캘린더 스코프가 동의되지 않았거나 구글 토큰 권한이 부족할 때 발생.
 * GlobalExceptionHandler 에서 403 + code=CALENDAR_CONSENT_REQUIRED 로 변환되어
 * 프론트엔드가 재동의 플로우를 트리거하는 데 사용된다.
 */
public class CalendarConsentRequiredException extends RuntimeException {

    public static final String ERROR_CODE = "CALENDAR_CONSENT_REQUIRED";

    public CalendarConsentRequiredException(String message) {
        super(message);
    }
}
