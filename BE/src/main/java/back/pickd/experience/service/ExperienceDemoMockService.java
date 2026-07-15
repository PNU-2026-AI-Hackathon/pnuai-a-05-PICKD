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
                buildTemp(user, "부산 청년 창업경진대회 최우수상", ExperienceType.CONTEST, ExperienceGroup.NARRATIVE, resumeUrl),
                buildTemp(user, "청년창업 서포터즈 3기", ExperienceType.ACTIVITY, ExperienceGroup.NARRATIVE, resumeUrl),
                buildTemp(user, "TOEIC 875 · OPIc IH 취득", ExperienceType.LANGUAGE, ExperienceGroup.SPEC, resumeUrl)
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
                    .title("청년창업 서포터즈 3기")
                    .experienceType(ExperienceType.ACTIVITY)
                    .experienceGroup(ExperienceGroup.NARRATIVE)
                    .status(Status.COMPLETED)
                    .documentContent("청년창업 서포터즈 3기로 활동하며 창업 프로그램 홍보, 참가자 모집, 현장 운영과 만족도 조사 정리를 담당했다. SNS 홍보 콘텐츠와 학교 커뮤니티 안내문을 제작해 참가자 모집 목표의 130%를 달성했고 누적 260명의 참여를 이끌었다.")
                    .attributes(Map.of(
                            "period", "2025-03 ~ 2025-08",
                            "organization", "청년창업 서포터즈 3기",
                            "role", "홍보 및 프로그램 운영",
                            "result", "참가자 모집 목표 130%, 누적 260명 참여"
                    ))
                    .keywords(List.of("프로그램 운영", "홍보", "행정", "참가자 관리", "커뮤니케이션"))
                    .important(true)
                    .pin(true)
                    .build();
            case CONTEST -> UserExperience.builder()
                    .id(java.util.UUID.randomUUID().toString())
                    .user(user)
                    .title("부산 청년 창업경진대회 최우수상")
                    .experienceType(ExperienceType.CONTEST)
                    .experienceGroup(ExperienceGroup.NARRATIVE)
                    .status(Status.COMPLETED)
                    .documentContent("부산 지역 청년 문제 해결을 주제로 창업 아이템을 기획하고 시장조사, 사업계획 수립, 발표 전략을 담당했다. 32팀 중 1위로 최우수상을 수상했고 상금 200만원을 받았다. 사업성 검증을 위해 사용자 인터뷰 25건을 진행하고 핵심 고객군과 수익 모델을 구체화했다.")
                    .attributes(Map.of(
                            "period", "2025-09 ~ 2025-11",
                            "award", "최우수상",
                            "rank", "32팀 중 1위",
                            "prize", "상금 200만원",
                            "role", "사업계획 수립, 시장조사, 팀 리딩"
                    ))
                    .keywords(List.of("사업계획 수립", "시장조사", "팀 리딩", "창업 공모전", "발표"))
                    .important(true)
                    .pin(true)
                    .build();
            case LANGUAGE -> UserExperience.builder()
                    .id(java.util.UUID.randomUUID().toString())
                    .user(user)
                    .title("TOEIC 875 · OPIc IH 취득")
                    .experienceType(ExperienceType.LANGUAGE)
                    .experienceGroup(ExperienceGroup.SPEC)
                    .status(Status.COMPLETED)
                    .documentContent("TOEIC 875점과 OPIc IH를 취득했고, 글로벌 창업 프로그램에서 해외 참가자 안내와 발표 Q&A 통역 서포터로 활동했다. 영어 자료 조사와 현장 커뮤니케이션을 맡으며 창업지원 프로그램 운영 과정에서 필요한 대외 소통 역량을 강화했다.")
                    .attributes(Map.of(
                            "period", "2025-01 ~ 2025-04",
                            "toeic", "875",
                            "opic", "IH",
                            "activity", "글로벌 창업 프로그램 통역 서포터"
                    ))
                    .keywords(List.of("영어 커뮤니케이션", "행사 운영", "통역", "자료조사"))
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
