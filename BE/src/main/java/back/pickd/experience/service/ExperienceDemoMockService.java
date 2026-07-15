package back.pickd.experience.service;

import back.pickd.experience.entity.ExperienceTemp;
import back.pickd.experience.entity.UserExperience;
import back.pickd.experience.enums.ExperienceGroup;
import back.pickd.experience.enums.ExperienceType;
import back.pickd.experience.enums.Status;
import back.pickd.experience.repository.ExperienceTempRepository;
import back.pickd.experience.repository.UserExperienceRepository;
import back.pickd.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExperienceDemoMockService {

    private static final String DEMO_RESUME_URL_PREFIX = "demo://experience/mock-word/";

    private final ExperienceTempRepository tempRepository;
    private final UserExperienceRepository experienceRepository;

    public boolean supportsFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        return filename.endsWith(".doc")
                || filename.endsWith(".docx")
                || contentType.contains("msword")
                || contentType.contains("officedocument.wordprocessingml.document");
    }

    public boolean isDemoTempBatch(List<ExperienceTemp> temps) {
        return temps != null
                && !temps.isEmpty()
                && temps.stream().allMatch(temp -> temp.getResumeUrl().startsWith(DEMO_RESUME_URL_PREFIX));
    }

    public List<ExperienceTemp> saveDemoTemps(User user, MultipartFile file) {
        tempRepository.deleteByUser(user);
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "demo.docx";
        String resumeUrl = DEMO_RESUME_URL_PREFIX + user.getId() + "/" + filename;

        List<ExperienceTemp> temps = List.of(
                buildTemp(user, "창업지원 프로그램 운영 대외활동", ExperienceType.ACTIVITY, ExperienceGroup.NARRATIVE, resumeUrl),
                buildTemp(user, "스타트업 서비스 기획 공모전", ExperienceType.CONTEST, ExperienceGroup.NARRATIVE, resumeUrl),
                buildTemp(user, "TOEIC 890점 취득", ExperienceType.LANGUAGE, ExperienceGroup.SPEC, resumeUrl)
        );
        return tempRepository.saveAll(temps);
    }

    public List<UserExperience> saveDemoExperiences(User user, List<ExperienceTemp> temps) {
        if (!isDemoTempBatch(temps)) {
            return List.of();
        }

        List<UserExperience> experiences = new ArrayList<>();
        for (ExperienceTemp temp : temps) {
            experiences.add(buildExperienceForTemp(user, temp));
        }
        List<UserExperience> saved = experienceRepository.saveAll(experiences);
        tempRepository.deleteByUser(user);
        return saved;
    }

    private ExperienceTemp buildTemp(User user, String name, ExperienceType type, ExperienceGroup group, String resumeUrl) {
        return ExperienceTemp.builder()
                .user(user)
                .experienceName(name)
                .experienceType(type)
                .experienceGroup(group)
                .resumeUrl(resumeUrl)
                .build();
    }

    private UserExperience buildExperienceForTemp(User user, ExperienceTemp temp) {
        return switch (temp.getExperienceType()) {
            case ACTIVITY -> UserExperience.builder()
                    .id(java.util.UUID.randomUUID().toString())
                    .user(user)
                    .title("창업지원 프로그램 운영 대외활동")
                    .experienceType(ExperienceType.ACTIVITY)
                    .experienceGroup(ExperienceGroup.NARRATIVE)
                    .status(Status.COMPLETED)
                    .documentContent("대학 창업지원단 서포터즈로 활동하며 예비창업자 대상 멘토링 프로그램 운영을 보조하고, 참가자 모집 홍보와 만족도 조사 결과 정리를 담당했다. 이를 통해 공공 창업지원사업 운영 흐름과 참여자 커뮤니케이션 방식을 익혔다.")
                    .attributes(Map.of(
                            "period", "2025-03 ~ 2025-08",
                            "organization", "대학 창업지원단",
                            "role", "프로그램 운영 서포터즈"
                    ))
                    .keywords(List.of("창업지원", "프로그램 운영", "커뮤니케이션", "성과정리"))
                    .important(true)
                    .pin(true)
                    .build();
            case CONTEST -> UserExperience.builder()
                    .id(java.util.UUID.randomUUID().toString())
                    .user(user)
                    .title("스타트업 서비스 기획 공모전")
                    .experienceType(ExperienceType.CONTEST)
                    .experienceGroup(ExperienceGroup.NARRATIVE)
                    .status(Status.COMPLETED)
                    .documentContent("지역 문제 해결을 주제로 한 서비스 기획 공모전에 참여해 초기 사용자 인터뷰, 경쟁 서비스 분석, 비즈니스 모델 수립을 담당했다. 팀 발표 자료를 제작하고 심사 피드백을 반영해 서비스 수익 구조와 운영 계획을 구체화했다.")
                    .attributes(Map.of(
                            "period", "2025-09 ~ 2025-11",
                            "award", "우수상",
                            "role", "서비스 기획 및 발표자료 제작"
                    ))
                    .keywords(List.of("서비스기획", "시장분석", "비즈니스모델", "공모전"))
                    .important(false)
                    .pin(false)
                    .build();
            case LANGUAGE -> UserExperience.builder()
                    .id(java.util.UUID.randomUUID().toString())
                    .user(user)
                    .title("TOEIC 890점 취득")
                    .experienceType(ExperienceType.LANGUAGE)
                    .experienceGroup(ExperienceGroup.SPEC)
                    .status(Status.COMPLETED)
                    .documentContent("글로벌 스타트업 사례와 해외 창업지원 정책 자료를 읽기 위해 영어 독해와 비즈니스 표현을 학습했고 TOEIC 890점을 취득했다.")
                    .attributes(Map.of(
                            "period", "2025-01 ~ 2025-04",
                            "score", "890",
                            "test", "TOEIC"
                    ))
                    .keywords(List.of("TOEIC", "영어", "자료조사"))
                    .important(false)
                    .pin(false)
                    .build();
            default -> UserExperience.builder()
                    .id(java.util.UUID.randomUUID().toString())
                    .user(user)
                    .title(temp.getExperienceName())
                    .experienceType(temp.getExperienceType())
                    .experienceGroup(temp.getExperienceGroup())
                    .status(Status.COMPLETED)
                    .documentContent("데모 시연을 위한 경험 목업 데이터입니다.")
                    .attributes(Map.of("period", "2026-07 ~ 2026-07"))
                    .keywords(List.of("데모", "목업"))
                    .build();
        };
    }
}
