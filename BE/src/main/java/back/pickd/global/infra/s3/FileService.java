package back.pickd.global.infra.s3;

import back.pickd.user.entity.User;
import back.pickd.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FileService {

    private final S3Service s3Service;
    private final UserService userService;
    private final UploadedFileRepository uploadedFileRepository;

    @Transactional
    public UploadedFileResponse uploadFile(String email, MultipartFile file, FileUploadType type) {
        User user = userService.findByEmail(email);
        String fileUrl = s3Service.uploadFile(file, type, user.getId());

        UploadedFile uploadedFile = UploadedFile.builder()
                .user(user)
                .fileName(resolveFileName(file))
                .fileUrl(fileUrl)
                .uploadType(type)
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .build();

        return new UploadedFileResponse(uploadedFileRepository.save(uploadedFile));
    }

    public List<UploadedFileResponse> getFiles(String email, FileUploadType type) {
        User user = userService.findByEmail(email);
        List<UploadedFile> files = type == null
                ? uploadedFileRepository.findByUserOrderByCreatedAtDesc(user)
                : uploadedFileRepository.findByUserAndUploadTypeOrderByCreatedAtDesc(user, type);

        return files.stream()
                .map(UploadedFileResponse::new)
                .toList();
    }

    @Transactional
    public UploadedFileResponse renameFile(String email, Long fileId, String fileName) {
        UploadedFile uploadedFile = findOwnedFile(email, fileId);
        uploadedFile.rename(fileName);
        return new UploadedFileResponse(uploadedFile);
    }

    @Transactional
    public void deleteFile(String email, Long fileId) {
        UploadedFile uploadedFile = findOwnedFile(email, fileId);
        s3Service.deleteFile(uploadedFile.getFileUrl());
        uploadedFileRepository.delete(uploadedFile);
    }

    private String resolveFileName(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        return (originalFilename == null || originalFilename.isBlank()) ? "unknown" : originalFilename;
    }

    private UploadedFile findOwnedFile(String email, Long fileId) {
        User user = userService.findByEmail(email);
        return uploadedFileRepository.findByIdAndUser(fileId, user)
                .orElseThrow(() -> new IllegalArgumentException("파일을 찾을 수 없습니다. id: " + fileId));
    }
}
