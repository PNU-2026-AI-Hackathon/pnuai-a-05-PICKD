package back.pickd.quote.service;

import back.pickd.global.error.ApiException;
import back.pickd.quote.dto.QuoteResponse;
import back.pickd.quote.entity.Quote;
import back.pickd.quote.repository.QuoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class QuoteService {

    private final QuoteRepository quoteRepository;

    public QuoteResponse getRandomQuote(Long excludeId) {
        Quote quote = findRandomQuote(excludeId);
        return QuoteResponse.from(quote);
    }

    private Quote findRandomQuote(Long excludeId) {
        List<Quote> quotes = excludeId == null
                ? quoteRepository.findAllByActiveTrue()
                : quoteRepository.findAllByActiveTrueAndIdNot(excludeId);

        if (quotes.isEmpty() && excludeId != null) {
            quotes = quoteRepository.findAllByActiveTrue();
        }

        if (quotes.isEmpty()) {
            throw ApiException.notFound("활성화된 명언이 없습니다.");
        }

        return quotes.get(ThreadLocalRandom.current().nextInt(quotes.size()));
    }
}
