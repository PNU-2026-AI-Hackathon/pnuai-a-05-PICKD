package back.pickd.calendar.service;

import back.pickd.application.entity.Todo;
import back.pickd.application.repository.ApplicationRepository;
import back.pickd.application.repository.TodoRepository;
import com.google.api.services.calendar.model.Event;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CalendarTaskService {

    private final TodoRepository todoRepository;
    private final CalendarService calendarService;
    private final ApplicationRepository applicationRepository;

    @Async
    @Transactional
    public void createEventAsync(Long applicationId, String eventType,
                                 Authentication authentication, Event event) {
        try {
            if (!applicationRepository.existsById(applicationId)) {
                log.warn("캘린더 생성 대상 지원 정보가 없어 작업을 건너뜁니다: applicationId={}", applicationId);
                return;
            }

            Event createdEvent = calendarService.createEvent(authentication, event);
            if (createdEvent == null || createdEvent.getId() == null || createdEvent.getId().isBlank()) {
                throw new IllegalStateException("Google Calendar가 일정 ID를 반환하지 않았습니다.");
            }

            int updatedRows = switch (eventType) {
                case "apply" -> applicationRepository.updateApplyEventId(applicationId, createdEvent.getId());
                case "interview" -> applicationRepository.updateInterviewEventId(applicationId, createdEvent.getId());
                case "deadline" -> applicationRepository.updateDeadlineEventId(applicationId, createdEvent.getId());
                default -> throw new IllegalArgumentException("지원하지 않는 캘린더 일정 유형입니다: " + eventType);
            };

            if (updatedRows == 0) {
                try {
                    calendarService.deleteEvent(authentication, createdEvent.getId());
                } catch (Exception cleanupException) {
                    log.error("DB 저장 실패 후 생성된 캘린더 일정 정리 실패: eventId={}",
                            createdEvent.getId(), cleanupException);
                }
                throw new IllegalStateException("생성된 캘린더 일정 ID를 지원 정보에 저장하지 못했습니다.");
            }
        } catch (Exception e) {
            log.error("구글 캘린더 일정 생성 실패: applicationId={}, eventType={}",
                    applicationId, eventType, e);
        }
    }

    @Async
    public void updateEventAsync(Authentication authentication, String eventId, Event event) {
        try {
            calendarService.updateEvent(authentication, eventId, event);
        } catch (Exception e) {
            log.error("구글 캘린더 일정 수정 실패: eventId={}", eventId, e);
        }
    }

    @Async
    public void deleteEventAsync(Authentication authentication, String eventId) {
        try {
            if (eventId == null || eventId.isBlank()) {
                return;
            }

            calendarService.deleteEvent(authentication, eventId);
        } catch (Exception e) {
            log.error("구글 캘린더 일정 삭제 실패: eventId={}", eventId, e);
        }
    }

    @Async
    @Transactional
    public void createTodoEventAsync(Long todoId, Authentication authentication) {
        try {
            Todo todo = todoRepository.findById(todoId)
                    .orElseThrow(() -> new IllegalStateException("할 일을 찾을 수 없습니다."));

            if (todo.getDueDateTime() == null) {
                return;
            }

            Event createdEvent = calendarService.createTodoEvent(authentication, todo);

            if (createdEvent != null && createdEvent.getId() != null) {
                todo.assignCalendarEventId(createdEvent.getId());
            }
        } catch (Exception e) {
            log.error("할 일 구글 캘린더 생성 실패: todoId={}", todoId, e);
        }
    }

    @Async
    @Transactional
    public void syncTodoEventAsync(Long todoId, Authentication authentication) {
        try {
            Todo todo = todoRepository.findById(todoId)
                    .orElseThrow(() -> new IllegalStateException("할 일을 찾을 수 없습니다."));

            if (todo.getDueDateTime() == null) {
                if (todo.getCalendarEventId() != null && !todo.getCalendarEventId().isBlank()) {
                    calendarService.deleteEvent(authentication, todo.getCalendarEventId());
                    todo.clearCalendarEventId();
                }
                return;
            }

            if (todo.getCalendarEventId() != null && !todo.getCalendarEventId().isBlank()) {
                calendarService.updateTodoEvent(authentication, todo.getCalendarEventId(), todo);
            } else {
                Event createdEvent = calendarService.createTodoEvent(authentication, todo);
                if (createdEvent != null && createdEvent.getId() != null) {
                    todo.assignCalendarEventId(createdEvent.getId());
                }
            }
        } catch (Exception e) {
            log.error("할 일 구글 캘린더 동기화 실패: todoId={}", todoId, e);
        }
    }
}
