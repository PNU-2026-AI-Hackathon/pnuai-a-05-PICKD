package back.pickd.notice.service;

import back.pickd.notice.entity.ApplicationDocument;
import back.pickd.notice.entity.Notice;
import back.pickd.notice.entity.NoticeProcess;
import back.pickd.notice.entity.NoticeSection;
import back.pickd.notice.entity.SectionPreference;
import back.pickd.notice.entity.SectionQualification;
import back.pickd.notice.enums.EmploymentType;
import back.pickd.notice.enums.JobCategory;
import back.pickd.notice.repository.ApplicationDocumentRepository;
import back.pickd.notice.repository.NoticeProcessRepository;
import back.pickd.notice.repository.NoticeRepository;
import back.pickd.notice.repository.NoticeSectionRepository;
import back.pickd.notice.repository.SectionPreferenceRepository;
import back.pickd.notice.repository.SectionQualificationRepository;
import back.pickd.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NoticeDemoMockService {

    private static final String BUSAN_DEMO_NOTICE_URL = "busan.go.kr/depart/jobgonji01/1740668";

    private final NoticeRepository noticeRepository;
    private final NoticeSectionRepository noticeSectionRepository;
    private final SectionQualificationRepository sectionQualificationRepository;
    private final SectionPreferenceRepository sectionPreferenceRepository;
    private final NoticeProcessRepository noticeProcessRepository;
    private final ApplicationDocumentRepository applicationDocumentRepository;

    public boolean supportsUrl(String url) {
        return url != null && url.contains(BUSAN_DEMO_NOTICE_URL);
    }

    public Long saveBusanStartupPackageNotice(User user, String url) {
        Notice notice = Notice.builder()
                .user(user)
                .companyName("(재)부산창조경제혁신센터")
                .noticeName("2026년 초기창업패키지 사업 2명")
                .category(JobCategory.CONTRACT)
                .startedAt("2026-07-14")
                .endedAt("2026-07-27 18:00")
                .employmentType(EmploymentType.CONTRACT)
                .headcount("2명")
                .region1depth("부산")
                .workplaceAddress("부산광역시 해운대구 센텀중앙로 78 센텀그린타워")
                .noticeUrl(url)
                .build();

        Notice savedNotice = noticeRepository.save(notice);

        NoticeSection section = noticeSectionRepository.save(NoticeSection.builder()
                .notice(savedNotice)
                .sectionName("2026년 초기창업패키지 사업")
                .jobTitle("창업지원 사업 운영 담당자")
                .responsibilities("초기창업패키지 사업 운영, 창업기업 발굴 및 지원, 사업비 집행 관리, 창업 프로그램 운영, 참여기업 성과관리 및 행정 지원")
                .headcount("2명")
                .workplace("부산창조경제혁신센터")
                .build());
        savedNotice.addSection(section);

        sectionQualificationRepository.save(SectionQualification.builder()
                .section(section)
                .generalQualification("창업지원사업, 정부지원사업, 스타트업 보육 및 사업 운영에 관심과 이해가 있는 자")
                .mandatoryQualification("공고문 기준 응시자격 충족자")
                .build());

        sectionPreferenceRepository.save(SectionPreference.builder()
                .section(section)
                .generalPreference("창업지원기관, 공공기관, 정부지원사업 운영 경험자 우대")
                .additionalPoints("스타트업 보육, 사업계획서 검토, 성과관리, 정산 업무 경험 우대")
                .certificatePreference("창업보육전문매니저, 컴퓨터활용능력 등 관련 자격 우대")
                .build());

        noticeProcessRepository.save(NoticeProcess.builder()
                .notice(savedNotice)
                .processName("지원서 접수")
                .applicationPeriod("2026-07-14 ~ 2026-07-27 18:00")
                .scheduleNotes("부산광역시 공고 및 첨부 응시원서 기준 접수")
                .build());
        noticeProcessRepository.save(NoticeProcess.builder()
                .notice(savedNotice)
                .processName("서류전형")
                .documentScreenSchedule("접수 마감 후 진행")
                .scheduleNotes("응시자격 및 제출서류 검토")
                .build());
        noticeProcessRepository.save(NoticeProcess.builder()
                .notice(savedNotice)
                .processName("면접전형")
                .interviewSchedule("서류전형 합격자 대상 별도 안내")
                .scheduleNotes("직무역량, 사업 이해도, 커뮤니케이션 역량 평가")
                .build());
        noticeProcessRepository.save(NoticeProcess.builder()
                .notice(savedNotice)
                .processName("임용예정")
                .joinDate("2026-08-10")
                .scheduleNotes("기간제 근로자 사업전담")
                .build());

        applicationDocumentRepository.save(ApplicationDocument.builder()
                .notice(savedNotice)
                .mandatoryDocuments("응시원서, 자기소개서, 개인정보 수집·이용 동의서")
                .proofDocuments("경력증명서, 자격증 사본, 우대사항 증빙서류")
                .applyMethod("첨부 응시원서 작성 후 공고문 기준 제출")
                .applyUrlOrEmail("부산광역시 채용공고 첨부파일 참고")
                .submissionNotes("상세 제출 방식은 첨부 공고문 및 응시원서 참고")
                .build());

        return savedNotice.getId();
    }
}
