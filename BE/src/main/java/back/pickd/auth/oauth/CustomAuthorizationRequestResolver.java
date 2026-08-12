package back.pickd.auth.oauth;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * 구글 OAuth2 인가 요청 커스터마이징.
 *
 * <ul>
 *   <li>{@code access_type=offline}, {@code include_granted_scopes=true} 항상 추가
 *       (리프레시 토큰 발급 + 점진적 동의 지원)</li>
 *   <li>요청 파라미터 {@code prompt=consent} 가 있으면 구글 동의 화면을 강제로 다시 노출
 *       (캘린더 스코프 재동의 플로우)</li>
 *   <li>요청 파라미터 {@code returnTo}(상대 경로)를 state 에 인코딩해서
 *       로그인 성공 후 원래 화면으로 돌아갈 수 있게 함</li>
 * </ul>
 */
public class CustomAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    /** state 와 returnTo 인코딩 값을 구분하는 문자 (base64url 알파벳에 포함되지 않음) */
    private static final String RETURN_TO_SEPARATOR = ".";

    private final DefaultOAuth2AuthorizationRequestResolver delegate;

    public CustomAuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
        this.delegate = new DefaultOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository, "/oauth2/authorization");
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        return customize(delegate.resolve(request), request);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        return customize(delegate.resolve(request, clientRegistrationId), request);
    }

    private OAuth2AuthorizationRequest customize(OAuth2AuthorizationRequest authRequest,
                                                 HttpServletRequest request) {
        if (authRequest == null) return null;

        Map<String, Object> additionalParameters = new HashMap<>(authRequest.getAdditionalParameters());
        additionalParameters.put("access_type", "offline");
        additionalParameters.put("include_granted_scopes", "true");

        if ("consent".equals(request.getParameter("prompt"))) {
            additionalParameters.put("prompt", "consent");
        }

        OAuth2AuthorizationRequest.Builder builder = OAuth2AuthorizationRequest.from(authRequest)
                .additionalParameters(additionalParameters);

        String returnTo = request.getParameter("returnTo");
        if (isSafeReturnPath(returnTo)) {
            String encoded = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(returnTo.getBytes(StandardCharsets.UTF_8));
            builder.state(authRequest.getState() + RETURN_TO_SEPARATOR + encoded);
        }

        return builder.build();
    }

    /** 오픈 리다이렉트 방지: 사이트 내 상대 경로만 허용 */
    public static boolean isSafeReturnPath(String path) {
        return path != null
                && path.startsWith("/")
                && !path.startsWith("//")
                && !path.contains("\\");
    }

    /** 콜백으로 돌아온 state 에서 returnTo 경로를 복원. 없거나 유효하지 않으면 null */
    public static String extractReturnTo(String state) {
        if (state == null) return null;
        int idx = state.indexOf(RETURN_TO_SEPARATOR);
        if (idx < 0 || idx == state.length() - 1) return null;
        try {
            String decoded = new String(
                    Base64.getUrlDecoder().decode(state.substring(idx + 1)),
                    StandardCharsets.UTF_8);
            return isSafeReturnPath(decoded) ? decoded : null;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
