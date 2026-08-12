package back.pickd.application.repository;

import back.pickd.application.entity.Application;
import back.pickd.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    List<Application> findAllByUserOrderByIdDesc(User user);

    Optional<Application> findByIdAndUser(Long id, User user);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update Application a
        set a.applyEventId = :eventId
        where a.id = :applicationId
          and a.applyEventId is null
          and a.applyDate is not null
          and a.manualRegistration = false
        """)
    int updateApplyEventId(@Param("applicationId") Long applicationId,
                           @Param("eventId") String eventId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update Application a
        set a.interviewEventId = :eventId
        where a.id = :applicationId
          and a.interviewEventId is null
          and a.interviewDate is not null
          and a.manualRegistration = false
        """)
    int updateInterviewEventId(@Param("applicationId") Long applicationId,
                               @Param("eventId") String eventId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update Application a
        set a.deadlineEventId = :eventId
        where a.id = :applicationId
          and a.deadlineEventId is null
          and a.deadlineDate is not null
        """)
    int updateDeadlineEventId(@Param("applicationId") Long applicationId,
                              @Param("eventId") String eventId);
}
