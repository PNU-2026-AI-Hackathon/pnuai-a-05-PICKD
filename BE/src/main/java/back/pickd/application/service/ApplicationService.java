package back.pickd.application.service;

import back.pickd.application.dto.request.ApplicationRequest;
import back.pickd.application.dto.response.ApplicationResponse;
import back.pickd.application.entity.Application;
import back.pickd.application.enums.ApplicationFinalResult;
import back.pickd.application.enums.ApplicationStatus;
import back.pickd.application.repository.ApplicationRepository;
import back.pickd.calendar.service.CalendarAsyncService;
import back.pickd.notice.entity.Notice;
import back.pickd.notice.enums.JobCategory;
import back.pickd.notice.repository.NoticeRepository;
import back.pickd.user.entity.User;
import back.pickd.user.service.UserService;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private static final String TIME_ZONE = "Asia/Seoul";
    private static final ZoneId SEOUL_ZONE = ZoneId.of(TIME_ZONE);

    private final ApplicationRepository applicationRepository;
    private final NoticeRepository noticeRepository;
    private final CalendarAsyncService calendarAsyncService;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplications(Authentication auth) {
        User user = userService.findByEmail(auth.getName());
        return applicationRepository.findAllByUserOrderByIdDesc(user)
                .stream().map(ApplicationResponse::from).toList();
    }

    @Transactional
    public void addApplication(ApplicationRequest dto, Authentication auth) throws Exception {
        User user = userService.findByEmail(auth.getName());
        ApplicationStatus status = dto.getStatus();
        ApplicationFinalResult finalResult = normalizeFinalResult(status, dto.getFinalResult());

        Notice notice;
        if (dto.getNoticeId() != null) {
            notice = noticeRepository.findByIdAndUser(dto.getNoticeId(), user)
                    .orElseThrow(() -> new IllegalArgumentException("공고를 찾을 수 없습니다."));
        } else {
            String companyName = dto.getCompany() != null ? dto.getCompany() : "미입력";
            String noticeName  = dto.getJobTitle() != null ? dto.getJobTitle() : "미입력";
            JobCategory category = dto.getCategory() != null ? dto.getCategory() : JobCategory.FULL_TIME;
            String startedAt = dto.getStartedAt() != null ? dto.getStartedAt()
                    : java.time.LocalDate.now().toString();

            notice = noticeRepository.save(
                    Notice.builder()
                            .user(user)
                            .companyName(companyName)
                            .noticeName(noticeName)
                            .category(category)
                            .startedAt(startedAt)
                            .endedAt(dto.getEndedAt())
                            .build()
            );
        }

        Application app = Application.builder()
                .user(user)
                .notice(notice)
                .company(dto.getCompany())
                .jobTitle(dto.getJobTitle())
                .position(dto.getPosition())
                .industry(dto.getIndustry())
                .status(status)
                .finalResult(finalResult)
                .important(dto.isImportant())
                .memo(dto.getMemo())
                .applyDate(dto.getApplyDate())
                .interviewDate(dto.getInterviewDate())
                .deadlineDate(dto.getDeadlineDate())
                .build();

        Application saved = applicationRepository.save(app);
        syncCalendarEvents(saved, dto, auth);
    }

    @Transactional
    public void deleteApplication(Long id, Authentication auth) throws Exception {
        User user = userService.findByEmail(auth.getName());
        Application app = applicationRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("지원 공고를 찾을 수 없습니다."));

        if (app.getApplyEventId() != null) {
            calendarAsyncService.deleteEventAsync(auth, app.getApplyEventId());
        }
        if (app.getDeadlineEventId() != null) {
            calendarAsyncService.deleteEventAsync(auth, app.getDeadlineEventId());
        }
        if (app.getInterviewEventId() != null) {
            calendarAsyncService.deleteEventAsync(auth, app.getInterviewEventId());
        }
        applicationRepository.delete(app);
    }

    @Transactional
    public void updateApplication(Long id, ApplicationRequest dto, Authentication auth) throws Exception {
        User user = userService.findByEmail(auth.getName());
        Application app = applicationRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("지원 공고를 찾을 수 없습니다."));

        ApplicationStatus status = dto.getStatus();
        ApplicationFinalResult finalResult = normalizeFinalResult(status, dto.getFinalResult());

        app.update(
                dto.getCompany(), dto.getJobTitle(), dto.getPosition(), dto.getIndustry(),
                status, finalResult, dto.isImportant(), dto.getMemo(),
                dto.getApplyDate(), dto.getInterviewDate(), dto.getDeadlineDate()
        );

        syncCalendarEvents(app, dto, auth);
        applicationRepository.save(app);
    }

    /**
     * MVP 결정사항 기준 캘린더 자동생성 우선순위:
     * 1) 지원마감일(deadlineDate) 2) 서류제출일(applyDate) 3) 면접일(interviewDate).
     * 직접등록 일정과 할 일은 각각 Calendar/Todo API에서 별도 생성한다.
     */
    private void syncCalendarEvents(Application app, ApplicationRequest dto, Authentication auth) {
        syncDeadlineEvent(app, dto, auth);
        syncApplyEvent(app, dto, auth);
        syncInterviewEvent(app, dto, auth);
    }

    private void syncDeadlineEvent(Application app, ApplicationRequest dto, Authentication auth) {
        if (dto.getDeadlineDate() != null) {
            Event event = buildEvent("지원마감", dto.getCompany(), dto.getJobTitle(), dto.getDeadlineDate());
            if (app.getDeadlineEventId() != null) {
                calendarAsyncService.updateEventAsync(auth, app.getDeadlineEventId(), event);
            } else {
                calendarAsyncService.createEventAsync(app.getId(), "deadline", auth, event);
            }
        } else if (app.getDeadlineEventId() != null) {
            calendarAsyncService.deleteEventAsync(auth, app.getDeadlineEventId());
            app.clearDeadlineEventId();
        }
    }

    private void syncApplyEvent(Application app, ApplicationRequest dto, Authentication auth) {
        if (dto.getApplyDate() != null) {
            Event event = buildEvent("서류제출", dto.getCompany(), dto.getJobTitle(), dto.getApplyDate());
            if (app.getApplyEventId() != null) {
                calendarAsyncService.updateEventAsync(auth, app.getApplyEventId(), event);
            } else {
                calendarAsyncService.createEventAsync(app.getId(), "apply", auth, event);
            }
        } else if (app.getApplyEventId() != null) {
            calendarAsyncService.deleteEventAsync(auth, app.getApplyEventId());
            app.clearApplyEventId();
        }
    }

    private void syncInterviewEvent(Application app, ApplicationRequest dto, Authentication auth) {
        if (dto.getInterviewDate() != null) {
            Event event = buildEvent("면접", dto.getCompany(), dto.getJobTitle(), dto.getInterviewDate());
            if (app.getInterviewEventId() != null) {
                calendarAsyncService.updateEventAsync(auth, app.getInterviewEventId(), event);
            } else {
                calendarAsyncService.createEventAsync(app.getId(), "interview", auth, event);
            }
        } else if (app.getInterviewEventId() != null) {
            calendarAsyncService.deleteEventAsync(auth, app.getInterviewEventId());
            app.clearInterviewEventId();
        }
    }

    private ApplicationFinalResult normalizeFinalResult(ApplicationStatus status, ApplicationFinalResult finalResult) {
        if (status == ApplicationStatus.COMPLETED) {
            return finalResult;
        }
        return null;
    }

    private Event buildEvent(String type, String company, String jobTitle, LocalDateTime dateTime) {
        String safeCompany = company != null && !company.isBlank() ? company : "미입력";
        String safeJobTitle = jobTitle != null && !jobTitle.isBlank() ? jobTitle : "공고";
        ZonedDateTime startDateTime = dateTime.atZone(SEOUL_ZONE);
        ZonedDateTime endDateTime = startDateTime.plusMinutes(30);

        Event event = new Event();
        event.setSummary("[PICKD] " + safeCompany + " " + safeJobTitle + " " + type);
        event.setDescription("category:application\npickd:eventType=" + type);
        event.setStart(new EventDateTime()
                .setDateTime(new DateTime(startDateTime.toInstant().toEpochMilli()))
                .setTimeZone(TIME_ZONE));
        event.setEnd(new EventDateTime()
                .setDateTime(new DateTime(endDateTime.toInstant().toEpochMilli()))
                .setTimeZone(TIME_ZONE));
        return event;
    }
}
