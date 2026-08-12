package back.pickd.auth.cookie;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class AuthCookieManager {

    private static final String ACCESS_TOKEN = "accessToken";
    private static final String REFRESH_TOKEN = "refreshToken";

    @Value("${auth.cookie.secure:true}")
    private boolean secure;

    @Value("${auth.cookie.same-site:Lax}")
    private String sameSite;

    public void addAccessToken(HttpServletResponse response, String token, long maxAgeMs) {
        addCookie(response, ACCESS_TOKEN, token, maxAgeMs);
    }

    public void addRefreshToken(HttpServletResponse response, String token, long maxAgeMs) {
        addCookie(response, REFRESH_TOKEN, token, maxAgeMs);
    }

    public void clearAccessToken(HttpServletResponse response) {
        clearCookie(response, ACCESS_TOKEN);
    }

    public void clearRefreshToken(HttpServletResponse response) {
        clearCookie(response, REFRESH_TOKEN);
    }

    public void clearAuthCookies(HttpServletResponse response) {
        clearAccessToken(response);
        clearRefreshToken(response);
    }

    private void addCookie(HttpServletResponse response, String name, String value, long maxAgeMs) {
        ResponseCookie cookie = baseCookie(name, value)
                .maxAge(maxAgeMs / 1000)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearCookie(HttpServletResponse response, String name) {
        ResponseCookie cookie = baseCookie(name, "")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private ResponseCookie.ResponseCookieBuilder baseCookie(String name, String value) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/");
    }
}
