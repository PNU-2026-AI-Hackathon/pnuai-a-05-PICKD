package back.pickd.quote.repository;

import back.pickd.quote.entity.Quote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuoteRepository extends JpaRepository<Quote, Long> {

    List<Quote> findAllByActiveTrue();

    List<Quote> findAllByActiveTrueAndIdNot(Long excludeId);
}
