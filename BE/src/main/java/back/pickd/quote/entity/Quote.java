package back.pickd.quote.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "quotes")
public class Quote {

    @Id
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String quote;

    private String author;

    private String source;

    @Column(name = "is_verified", nullable = false)
    private boolean verified;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @Builder
    public Quote(Long id, String quote, String author, String source, boolean verified, boolean active) {
        this.id = id;
        this.quote = quote;
        this.author = author;
        this.source = source;
        this.verified = verified;
        this.active = active;
    }
}
