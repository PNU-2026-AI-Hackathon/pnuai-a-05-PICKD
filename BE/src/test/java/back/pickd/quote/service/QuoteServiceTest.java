package back.pickd.quote.service;

import back.pickd.global.error.ApiException;
import back.pickd.quote.dto.QuoteResponse;
import back.pickd.quote.entity.Quote;
import back.pickd.quote.repository.QuoteRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuoteServiceTest {

    @Mock
    private QuoteRepository quoteRepository;

    @InjectMocks
    private QuoteService quoteService;

    @Test
    void 랜덤_명언을_조회한다() {
        Quote quote = Quote.builder()
                .id(1L)
                .quote("삶이 있는 한 희망은 있다.")
                .author("키케로")
                .source(null)
                .verified(false)
                .active(true)
                .build();
        when(quoteRepository.findAllByActiveTrue()).thenReturn(List.of(quote));

        QuoteResponse response = quoteService.getRandomQuote(null);

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.quote()).isEqualTo("삶이 있는 한 희망은 있다.");
        assertThat(response.author()).isEqualTo("키케로");
        assertThat(response.source()).isNull();
    }

    @Test
    void 제외할_명언만_남으면_전체_활성_명언에서_다시_조회한다() {
        Quote quote = Quote.builder()
                .id(1L)
                .quote("삶이 있는 한 희망은 있다.")
                .author("키케로")
                .source(null)
                .verified(false)
                .active(true)
                .build();
        when(quoteRepository.findAllByActiveTrueAndIdNot(1L)).thenReturn(List.of());
        when(quoteRepository.findAllByActiveTrue()).thenReturn(List.of(quote));

        QuoteResponse response = quoteService.getRandomQuote(1L);

        assertThat(response.id()).isEqualTo(1L);
    }

    @Test
    void 활성_명언이_없으면_예외를_던진다() {
        when(quoteRepository.findAllByActiveTrue()).thenReturn(List.of());

        assertThatThrownBy(() -> quoteService.getRandomQuote(null))
                .isInstanceOf(ApiException.class)
                .hasMessage("활성화된 명언이 없습니다.");
    }
}
