package back.pickd.quote.config;

import back.pickd.quote.dto.QuoteSeedItem;
import back.pickd.quote.entity.Quote;
import back.pickd.quote.repository.QuoteRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class QuoteDataSeeder implements CommandLineRunner {

    private final QuoteRepository quoteRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (quoteRepository.count() > 0) {
            return;
        }

        ClassPathResource resource = new ClassPathResource("data/pickd_quotes.json");
        List<QuoteSeedItem> items = objectMapper.readValue(
                resource.getInputStream(),
                new TypeReference<>() {
                }
        );

        List<Quote> quotes = items.stream()
                .map(item -> Quote.builder()
                        .id(item.id())
                        .quote(item.quote())
                        .author(item.author())
                        .source(item.source())
                        .verified(item.verified())
                        .active(item.active())
                        .build())
                .toList();

        quoteRepository.saveAll(quotes);
    }
}
