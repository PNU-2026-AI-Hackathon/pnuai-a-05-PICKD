package back.pickd.calendar.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionSynchronizationUtils;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class CalendarAsyncServiceTest {

    @Mock
    private CalendarTaskService calendarTaskService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private CalendarAsyncService calendarAsyncService;

    @AfterEach
    void clearTransactionSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
        TransactionSynchronizationManager.setActualTransactionActive(false);
    }

    @Test
    void transactionCommitBeforeCalendarTaskExecution() {
        TransactionSynchronizationManager.setActualTransactionActive(true);
        TransactionSynchronizationManager.initSynchronization();

        calendarAsyncService.deleteEventAsync(authentication, "event-1");

        verifyNoInteractions(calendarTaskService);

        TransactionSynchronizationUtils.triggerAfterCommit();

        verify(calendarTaskService).deleteEventAsync(authentication, "event-1");
    }

    @Test
    void executeImmediatelyWithoutTransaction() {
        calendarAsyncService.deleteEventAsync(authentication, "event-2");

        verify(calendarTaskService).deleteEventAsync(authentication, "event-2");
    }
}
