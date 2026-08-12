package back.pickd.auth.controller;

import back.pickd.auth.cookie.AuthCookieManager;
import back.pickd.auth.jwt.JwtTokenProvider;
import back.pickd.user.entity.User;
import back.pickd.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@Tag(name = "Auth", description = "인증/토큰 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private static final String REFRESH_TOKEN = "refreshToken";

    private final JwtTokenProvider jwtTokenProvider;
    private final AuthCookieManager authCookieManager;
    private final UserService userService;

    @Operation(
            summary = "accessToken 재발급",
            description = "refreshToken 쿠키를 검증하고 저장된 refreshToken과 일치하면 새 accessToken 쿠키를 발급합니다."
    )
    @PostMapping("/reissue")
    public ResponseEntity<Void> reissue(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = getCookieValue(request, REFRESH_TOKEN);
        if (refreshToken == null || !jwtTokenProvider.validateRefreshToken(refreshToken)) {
            return ResponseEntity.status(401).build();
        }

        String email = jwtTokenProvider.getEmail(refreshToken);
        User user;
        try {
            user = userService.findByEmail(email);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).build();
        }
        if (user.getRefreshToken() == null || !user.getRefreshToken().equals(refreshToken)) {
            return ResponseEntity.status(401).build();
        }

        String accessToken = jwtTokenProvider.createAccessToken(
                email,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        authCookieManager.addAccessToken(response, accessToken, jwtTokenProvider.getAccessExpirationMs());
        return ResponseEntity.noContent().build();
    }

    @Operation(
            summary = "로그아웃",
            description = "accessToken, refreshToken 쿠키를 삭제하고 저장된 refreshToken을 비웁니다."
    )
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = getCookieValue(request, REFRESH_TOKEN);
        if (refreshToken != null && jwtTokenProvider.validateRefreshToken(refreshToken)) {
            try {
                userService.clearRefreshToken(jwtTokenProvider.getEmail(refreshToken));
            } catch (IllegalArgumentException ignored) {
                // 이미 삭제된 사용자여도 클라이언트 쿠키는 정리한다.
            }
        }

        authCookieManager.clearAuthCookies(response);
        return ResponseEntity.noContent().build();
    }

    private String getCookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        return Arrays.stream(cookies)
                .filter(cookie -> name.equals(cookie.getName()))
                .findFirst()
                .map(Cookie::getValue)
                .orElse(null);
    }
}
