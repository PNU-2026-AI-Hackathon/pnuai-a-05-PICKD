package back.pickd.user.dto;

import back.pickd.user.entity.enums.DegreeType;
import back.pickd.user.entity.enums.EnrollmentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@Schema(description = "사용자 기본정보 수정 요청. 포함된 필드만 수정하고, 생략한 필드는 기존 값을 유지합니다.")
public class UserProfileUpdateRequest {

    @Schema(description = "이름", example = "홍길동")
    private String name;

    @Schema(description = "닉네임", example = "픽디")
    private String nickname;

    @Schema(description = "전화번호", example = "010-1234-5678")
    private String phone;

    @Pattern(regexp = "^\\d{8}$", message = "생년월일 형식은 YYYYMMDD여야 합니다.")
    @Schema(description = "생년월일", example = "20010315")
    private String birthDate;

    @Schema(description = "한 줄 소개", example = "백엔드 개발자를 준비하고 있습니다.")
    private String intro;

    @Schema(description = "현재 거주지", example = "부산광역시")
    private String currentResidence;

    @Schema(description = "희망 근무지 목록", example = "[\"서울\", \"부산\"]")
    private List<String> desiredLocations;

    @Schema(description = "상세 주소", example = "센텀로 17")
    private String detailedAddress;

    @Schema(description = "학교명", example = "부산대학교")
    private String schoolName;

    @Schema(description = "학과/전공", example = "컴퓨터공학과")
    private String department;

    @Schema(description = "복수전공", example = "경영학과")
    private String doubleMajor;

    @Schema(description = "부전공", example = "통계학과")
    private String minor;

    @Schema(description = "학위구분", example = "BACHELOR")
    private DegreeType degreeType;

    @Schema(description = "학적상태", example = "ENROLLED")
    private EnrollmentStatus enrollmentStatus;

    @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "졸업년월 형식은 YYYY-MM이어야 합니다.")
    @Schema(description = "졸업(예정)년월", example = "2026-02")
    private String graduationDate;

    @Schema(description = "학점", example = "4.1")
    private Double gpa;

    @Schema(description = "캠퍼스", example = "부산")
    private String campus;

    @Schema(description = "관심 산업 목록", example = "[\"IT\", \"금융\"]")
    private List<String> industries;

    @Schema(description = "관심 직무군 목록", example = "[\"백엔드\", \"AI\"]")
    private List<String> jobGroups;

    @Schema(description = "희망 고용형태", example = "FULL_TIME")
    private String employmentType;

    @Schema(description = "희망 기업 유형 목록", example = "[\"스타트업\", \"대기업\"]")
    private List<String> companyTypes;

    @Schema(description = "관심 키워드 목록", example = "[\"Spring\", \"AWS\"]")
    private List<String> keywords;

    @Schema(description = "목표 기업", example = "카카오")
    private String targetCompany;

    @Schema(description = "희망 연봉 범위", example = "3000~4000")
    private String salaryRange;

    @Schema(description = "지원 예정 시기", example = "2026 상반기")
    private String targetPeriod;

    @Schema(description = "현재 준비 단계", example = "서류 준비")
    private String currentStage;

    @Schema(description = "집중 준비 항목 목록", example = "[\"이력서\", \"자소서\"]")
    private List<String> focusItems;

    @Schema(description = "이력서 보유 여부", example = "true")
    private Boolean hasResume;

    @Schema(description = "기본 자소서 보유 여부", example = "false")
    private Boolean hasBaseEssay;

    @Schema(description = "포트폴리오 보유 여부", example = "true")
    private Boolean hasPortfolio;
}
