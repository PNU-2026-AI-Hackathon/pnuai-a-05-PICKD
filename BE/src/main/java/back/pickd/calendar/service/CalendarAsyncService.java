package back.pickd.calendar.service;

import com.google.api.services.calendar.model.Event;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Slf4j
@Service
@RequiredArgsConstructor
public class CalendarAsyncService {

    private final CalendarTaskService calendarTaskService;

    public void createEventAsync(Long applicationId, String eventType,
                                 Authentication authentication, Event event) {
        executeAfterCommit(() ->
                calendarTaskService.createEventAsync(applicationId, eventType, authentication, event));
    }

    public void updateEventAsync(Authentication authentication, String eventId, Event event) {
        executeAfterCommit(() ->
                calendarTaskService.updateEventAsync(authentication, eventId, event));
    }

    public void deleteEventAsync(Authentication authentication, String eventId) {
        if (eventId == null || eventId.isBlank()) {
            return;
        }

        executeAfterCommit(() ->
                calendarTaskService.deleteEventAsync(authentication, eventId));
    }

    public void createTodoEventAsync(Long todoId, Authentication authentication) {
        executeAfterCommit(() ->
                calendarTaskService.createTodoEventAsync(todoId, authentication));
    }

    public void syncTodoEventAsync(Long todoId, Authentication authentication) {
        executeAfterCommit(() ->
                calendarTaskService.syncTodoEventAsync(todoId, authentication));
    }

    private void executeAfterCommit(Runnable task) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()
                || !TransactionSynchronizationManager.isSynchronizationActive()) {
            task.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    task.run();
                } catch (Exception e) {
                    log.error("트랜잭션 커밋 후 캘린더 작업 예약 실패", e);
                }
            }
        });
    }
}
