package back.pickd.quote.dto;

import back.pickd.quote.entity.Quote;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "명언 응답")
public record QuoteResponse(
        @Schema(description = "명언 ID", example = "1")
        Long id,

        @Schema(description = "명언 본문", example = "삶이 있는 한 희망은 있다.")
        String quote,

        @Schema(description = "저자명. 알 수 없으면 null", example = "키케로", nullable = true)
        String author,

        @Schema(description = "출처. 없으면 null", example = "채근담", nullable = true)
        String source
) {
    public static QuoteResponse from(Quote quote) {
        return new QuoteResponse(
                quote.getId(),
                quote.getQuote(),
                quote.getAuthor(),
                quote.getSource()
        );
    }
}
