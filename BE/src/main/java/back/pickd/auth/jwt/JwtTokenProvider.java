package back.pickd.auth.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret:very-secret-key-that-should-be-at-least-32-bytes}")
    private String secretKeyPlain;

    private SecretKey key;

    @Value("${jwt.access-expiration-ms:86400000}")
    private long accessExpirationMs;

    @Value("${jwt.refresh-expiration-ms:1209600000}") // Default 14 days
    private long refreshExpirationMs;

    @PostConstruct
    protected void init() {
        this.key = Keys.hmacShaKeyFor(secretKeyPlain.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Generate JWT Token from Email and Authorities
     */
    public String createToken(String email, Collection<? extends GrantedAuthority> authoritiesList) {
        return createAccessToken(email, authoritiesList);
    }

    public String createAccessToken(String email, Collection<? extends GrantedAuthority> authoritiesList) {
        String authorities = authoritiesList.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        return createToken(email, authorities, "access", accessExpirationMs);
    }

    public String createRefreshToken(String email) {
        return createToken(email, "", "refresh", refreshExpirationMs);
    }

    private String createToken(String email, String authorities, String tokenType, long expirationMs) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .setSubject(email)
                .claim("auth", authorities)
                .claim("type", tokenType)
                .setIssuedAt(now)
                .setExpiration(validity)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Generate JWT Token from Authentication object
     */
    public String createToken(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        String email;

        if (principal instanceof org.springframework.security.oauth2.core.user.OAuth2User oauthUser) {
            email = (String) oauthUser.getAttributes().get("email");
        } else if (principal instanceof User user) {
            email = user.getUsername();
        } else {
            throw new RuntimeException("Unknown principal type");
        }

        return createToken(email, authentication.getAuthorities());
    }

    /**
     * Extract Authentication from JWT Token
     */
    public Authentication getAuthentication(String token) {
        Claims claims = parseClaims(token);

        Collection<? extends GrantedAuthority> authorities =
                Arrays.stream(claims.get("auth").toString().split(","))
                        .filter(authority -> !authority.isBlank())
                        .map(SimpleGrantedAuthority::new)
                        .collect(Collectors.toList());

        User principal = new User(claims.getSubject(), "", authorities);
        return new UsernamePasswordAuthenticationToken(principal, token, authorities);
    }

    public String getEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean validateAccessToken(String token) {
        if (!validateToken(token)) {
            return false;
        }
        return "access".equals(parseClaims(token).get("type", String.class));
    }

    public boolean validateRefreshToken(String token) {
        if (!validateToken(token)) {
            return false;
        }
        return "refresh".equals(parseClaims(token).get("type", String.class));
    }

    /**
     * Validate JWT Token string
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            log.error("Invalid JWT signature.");
        } catch (ExpiredJwtException e) {
            log.error("Expired JWT token.");
        } catch (UnsupportedJwtException e) {
            log.error("Unsupported JWT token.");
        } catch (IllegalArgumentException e) {
            log.error("JWT token compact of handler are invalid.");
        }
        return false;
    }

    public long getAccessExpirationMs() {
        return accessExpirationMs;
    }

    public long getRefreshExpirationMs() {
        return refreshExpirationMs;
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
