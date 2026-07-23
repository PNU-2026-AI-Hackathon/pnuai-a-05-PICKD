package back.pickd.quote.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record QuoteSeedItem(
        Long id,
        String quote,
        String author,
        String source,
        @JsonProperty("is_verified")
        boolean verified,
        @JsonProperty("is_active")
        boolean active
) {
}
