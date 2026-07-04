package back.pickd.user.service;

import back.pickd.global.infra.s3.FileUploadType;
import back.pickd.global.infra.s3.S3Service;
import back.pickd.user.dto.UserProfileDto;
import back.pickd.user.dto.UserProfileUpdateRequest;
import back.pickd.user.entity.User;
import back.pickd.user.entity.UserLocation;
import back.pickd.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private S3Service s3Service;

    @InjectMocks
    private UserService userService;

    @Test
    void updateProfileImageUploadsFileAndUpdatesPicture() {
        User user = User.builder()
                .email("user@example.com")
                .name("테스트")
                .build();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "profile.png",
                "image/png",
                "image".getBytes()
        );
        String imageUrl = "https://cdn.example.com/user/profile/1/profile.png";

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(s3Service.uploadFile(file, FileUploadType.PROFILE, user.getId()))
                .thenReturn(imageUrl);

        String result = userService.updateProfileImage("user@example.com", file);

        assertEquals(imageUrl, result);
        assertEquals(imageUrl, user.getPicture());
        verify(s3Service).uploadFile(file, FileUploadType.PROFILE, user.getId());
    }

    @Test
    void getProfileImageReturnsUserPicture() {
        User user = User.builder()
                .email("user@example.com")
                .name("테스트")
                .picture("https://cdn.example.com/user/profile/1/profile.png")
                .build();

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        String result = userService.getProfileImage("user@example.com");

        assertEquals("https://cdn.example.com/user/profile/1/profile.png", result);
    }

    @Test
    void updateProfileUpdatesOnlyRequestedFields() {
        User user = User.builder()
                .email("user@example.com")
                .name("기존 이름")
                .nickname("기존 닉네임")
                .build();
        user.verify("기존 이름", "20000101", "010-0000-0000");
        user.updateIntro("기존 소개");
        user.setLocation(UserLocation.builder()
                .user(user)
                .currentResidence("부산광역시")
                .desiredLocations(List.of("서울"))
                .detailedAddress("해운대구")
                .build());
        UserProfileUpdateRequest request = new UserProfileUpdateRequest();
        ReflectionTestUtils.setField(request, "nickname", "새 닉네임");
        ReflectionTestUtils.setField(request, "desiredLocations", List.of("서울", "판교"));

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        UserProfileDto result = userService.updateProfile("user@example.com", request);

        assertEquals("기존 이름", result.getName());
        assertEquals("새 닉네임", result.getNickname());
        assertEquals("20000101", result.getBirthDate());
        assertEquals("010-0000-0000", result.getPhone());
        assertEquals("기존 소개", result.getIntro());
        assertEquals("부산광역시", result.getCurrentResidence());
        assertEquals(List.of("서울", "판교"), result.getDesiredLocations());
        assertEquals("해운대구", result.getDetailedAddress());
    }
}
