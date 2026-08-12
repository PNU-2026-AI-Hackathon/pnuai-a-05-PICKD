package back.pickd.quote.controller;

import back.pickd.global.config.OpenApiConfig;
import back.pickd.global.error.ErrorResponse;
import back.pickd.quote.dto.QuoteResponse;
import back.pickd.quote.service.QuoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/quotes")
@RequiredArgsConstructor
@Tag(name = "Quote", description = "명언 API")
@SecurityRequirement(name = OpenApiConfig.COOKIE_AUTH)
public class QuoteController {

    private final QuoteService quoteService;

    @GetMapping("/random")
    @Operation(
            summary = "랜덤 명언 조회",
            description = "활성화된 명언 중 랜덤으로 1건을 조회합니다. excludeId를 전달하면 직전 명언을 제외하고 조회합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = QuoteResponse.class))),
            @ApiResponse(responseCode = "404", description = "활성화된 명언 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<QuoteResponse> getRandomQuote(
            @Parameter(description = "직전에 노출된 명언 ID. 전달 시 해당 ID를 제외하고 랜덤 조회합니다.")
            @RequestParam(required = false) Long excludeId
    ) {
        return ResponseEntity.ok(quoteService.getRandomQuote(excludeId));
    }
}
