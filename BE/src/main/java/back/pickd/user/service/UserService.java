package back.pickd.user.service;

import back.pickd.global.infra.s3.FileUploadType;
import back.pickd.global.infra.s3.S3Service;
import back.pickd.user.dto.UserProfileDto;
import back.pickd.user.dto.UserProfileUpdateRequest;
import back.pickd.user.entity.User;
import back.pickd.user.entity.UserEducation;
import back.pickd.user.entity.UserInterest;
import back.pickd.user.entity.UserLocation;
import back.pickd.user.entity.UserPrepStatus;
import back.pickd.user.entity.enums.OnboardingStep;
import back.pickd.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final S3Service s3Service;

    /**
     * Save or Update user info from Google OAuth2 attributes
     */
    @Transactional
    public User saveOrUpdate(String email, String name, String picture) {
        User user = userRepository.findByEmail(email)
                .map(entity -> entity.update(name, picture))
                .orElse(User.builder()
                        .email(email)
                        .name(name)
                        .picture(picture)
                        .onboardingStep(OnboardingStep.NONE)
                        .build());

        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다. email: " + email));
    }

    @Transactional
    public void updateRefreshToken(String email, String refreshToken) {
        User user = findByEmail(email);
        user.updateRefreshToken(refreshToken);
    }

    @Transactional
    public void clearRefreshToken(String email) {
        User user = findByEmail(email);
        user.clearRefreshToken();
    }

    @Transactional
    public UserProfileDto updateProfile(String email, UserProfileUpdateRequest request) {
        User user = findByEmail(email);

        updateUserFields(user, request);
        updateLocation(user, request);
        updateEducation(user, request);
        updateInterest(user, request);
        updatePrepStatus(user, request);

        return UserProfileDto.from(user);
    }

    @Transactional
    public String updateProfileImage(String email, MultipartFile file) {
        User user = findByEmail(email);
        String profileImageUrl = s3Service.uploadFile(file, FileUploadType.PROFILE, user.getId());
        user.updatePicture(profileImageUrl);
        return profileImageUrl;
    }

    @Transactional(readOnly = true)
    public String getProfileImage(String email) {
        return findByEmail(email).getPicture();
    }

    private void updateUserFields(User user, UserProfileUpdateRequest request) {
        user.updateProfile(
                keep(request.getName(), user.getName()),
                keep(request.getNickname(), user.getNickname()),
                keep(request.getPhone(), user.getPhone()),
                keep(request.getBirthDate(), user.getBirthDate()),
                keep(request.getIntro(), user.getIntro())
        );
    }

    private void updateLocation(User user, UserProfileUpdateRequest request) {
        if (!hasAny(request.getCurrentResidence(), request.getDesiredLocations(), request.getDetailedAddress())) {
            return;
        }

        UserLocation location = user.getLocation();
        String currentResidence = keep(request.getCurrentResidence(), location != null ? location.getCurrentResidence() : null);
        if (currentResidence == null) {
            throw new IllegalArgumentException("거주지 정보를 새로 저장하려면 currentResidence가 필요합니다.");
        }

        if (location == null) {
            location = UserLocation.builder().user(user).build();
        }
        location.update(
                currentResidence,
                keepList(request.getDesiredLocations(), location.getDesiredLocations()),
                keep(request.getDetailedAddress(), location.getDetailedAddress())
        );
        user.setLocation(location);
    }

    private void updateEducation(User user, UserProfileUpdateRequest request) {
        if (!hasAny(request.getSchoolName(), request.getDepartment(), request.getDoubleMajor(),
                request.getMinor(), request.getDegreeType(), request.getEnrollmentStatus(),
                request.getGraduationDate(), request.getGpa(), request.getCampus())) {
            return;
        }

        UserEducation education = user.getEducation();
        String schoolName = keep(request.getSchoolName(), education != null ? education.getSchoolName() : null);
        String department = keep(request.getDepartment(), education != null ? education.getDepartment() : null);
        var degreeType = keep(request.getDegreeType(), education != null ? education.getDegreeType() : null);
        var enrollmentStatus = keep(request.getEnrollmentStatus(), education != null ? education.getEnrollmentStatus() : null);
        String graduationDate = keep(request.getGraduationDate(), education != null ? education.getGraduationDate() : null);

        if (schoolName == null || department == null || degreeType == null || enrollmentStatus == null || graduationDate == null) {
            throw new IllegalArgumentException("학력 정보를 새로 저장하려면 schoolName, department, degreeType, enrollmentStatus, graduationDate가 필요합니다.");
        }

        if (education == null) {
            education = UserEducation.builder().user(user).build();
        }
        education.update(
                schoolName,
                department,
                keep(request.getDoubleMajor(), education.getDoubleMajor()),
                keep(request.getMinor(), education.getMinor()),
                degreeType,
                enrollmentStatus,
                graduationDate,
                keep(request.getGpa(), education.getGpa()),
                education.isTransfer(),
                keep(request.getCampus(), education.getCampus()),
                education.getExchangeExperience(),
                education.getCourses()
        );
        user.setEducation(education);
    }

    private void updateInterest(User user, UserProfileUpdateRequest request) {
        if (!hasAny(request.getIndustries(), request.getJobGroups(), request.getEmploymentType(),
                request.getCompanyTypes(), request.getKeywords(), request.getTargetCompany(), request.getSalaryRange())) {
            return;
        }

        UserInterest interest = user.getInterest();
        String employmentType = keep(request.getEmploymentType(), interest != null ? interest.getEmploymentType() : null);
        if (employmentType == null) {
            throw new IllegalArgumentException("관심분야 정보를 새로 저장하려면 employmentType이 필요합니다.");
        }

        if (interest == null) {
            interest = UserInterest.builder().user(user).build();
        }
        interest.update(
                keepList(request.getIndustries(), interest.getIndustries()),
                keepList(request.getJobGroups(), interest.getJobGroups()),
                employmentType,
                keepList(request.getCompanyTypes(), interest.getCompanyTypes()),
                keepList(request.getKeywords(), interest.getKeywords()),
                interest.getSpecificJob(),
                keep(request.getTargetCompany(), interest.getTargetCompany()),
                keep(request.getSalaryRange(), interest.getSalaryRange()),
                interest.getJobPriority(),
                interest.getIndustryPriority(),
                interest.getWorkType(),
                keepList(null, interest.getApplyTypes())
        );
        user.setInterest(interest);
    }

    private void updatePrepStatus(User user, UserProfileUpdateRequest request) {
        if (!hasAny(request.getTargetPeriod(), request.getCurrentStage(), request.getFocusItems(),
                request.getHasResume(), request.getHasBaseEssay(), request.getHasPortfolio())) {
            return;
        }

        UserPrepStatus prepStatus = user.getPrepStatus();
        String targetPeriod = keep(request.getTargetPeriod(), prepStatus != null ? prepStatus.getTargetPeriod() : null);
        String currentStage = keep(request.getCurrentStage(), prepStatus != null ? prepStatus.getCurrentStage() : null);
        if (targetPeriod == null || currentStage == null) {
            throw new IllegalArgumentException("준비상태 정보를 새로 저장하려면 targetPeriod, currentStage가 필요합니다.");
        }

        if (prepStatus == null) {
            prepStatus = UserPrepStatus.builder().user(user).build();
        }
        prepStatus.update(
                targetPeriod,
                currentStage,
                keepList(request.getFocusItems(), prepStatus.getFocusItems()),
                keep(request.getHasResume(), prepStatus.isHasResume()),
                keep(request.getHasBaseEssay(), prepStatus.isHasBaseEssay()),
                keep(request.getHasPortfolio(), prepStatus.isHasPortfolio()),
                keepList(null, prepStatus.getPreparingExams()),
                prepStatus.getTargetApplyCount()
        );
        user.setPrepStatus(prepStatus);
    }

    private <T> T keep(T requestedValue, T currentValue) {
        return requestedValue != null ? requestedValue : currentValue;
    }

    private List<String> keepList(List<String> requestedValue, List<String> currentValue) {
        if (requestedValue != null) {
            return requestedValue;
        }
        return currentValue != null ? currentValue : List.of();
    }

    private boolean hasAny(Object... values) {
        for (Object value : values) {
            if (value != null) {
                return true;
            }
        }
        return false;
    }
}
