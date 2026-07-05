package back.pickd.global.infra.s3;

import io.awspring.cloud.s3.S3Template;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Template s3Template;

    @Value("${spring.cloud.aws.s3.bucket}")
    private String bucket;

    @Value("${aws.cloudfront.domain}")
    private String cloudFrontDomain;

    /**
     * 파일을 S3에 업로드하고 CloudFront CDN 주소를 반환합니다.
     *
     * @param file           업로드할 파일
     * @param uploadType     파일 분류 타입 (LICENSE, EDUCATION 등)
     * @param userId         사용자 ID (디렉터리 구분에 사용)
     * @return CloudFront CDN 파일 주소
     */
    public String uploadFile(MultipartFile file, FileUploadType uploadType, Long userId) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 비어있습니다.");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        
        // 파일명 중복 방지를 위한 UUID 파일명 생성
        String uniqueFileName = UUID.randomUUID() + extension;
        
        // 최종 S3 적재 경로 생성
        String s3Key = uploadType.getFullPath(userId, uniqueFileName);

        try (InputStream inputStream = file.getInputStream()) {
            s3Template.upload(bucket, s3Key, inputStream);
            log.info("Successfully uploaded file to S3: bucket={}, key={}", bucket, s3Key);
        } catch (IOException e) {
            log.error("Failed to upload file to S3", e);
            throw new RuntimeException("파일 업로드 중 오류가 발생했습니다.", e);
        }

        // TEMP_RESUME 타입의 경우 AI 서버 접근용으로 60분짜리 Presigned URL 발급
        if (uploadType == FileUploadType.TEMP_RESUME) {
            return s3Template.createSignedGetURL(bucket, s3Key, java.time.Duration.ofMinutes(60)).toString();
        }

        // S3 Direct URL 대신 CloudFront URL을 조합하여 반환
        return combineCloudFrontUrl(s3Key);
    }

    public void deleteFile(String fileUrl) {
        String s3Key = extractS3Key(fileUrl);
        s3Template.deleteObject(bucket, s3Key);
        log.info("Successfully deleted file from S3: bucket={}, key={}", bucket, s3Key);
    }

    private String getFileExtension(String filename) {
        if (filename == null) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf(".");
        return (lastDotIndex == -1) ? "" : filename.substring(lastDotIndex);
    }

    private String combineCloudFrontUrl(String s3Key) {
        String domain = cloudFrontDomain.endsWith("/") 
                ? cloudFrontDomain.substring(0, cloudFrontDomain.length() - 1) 
                : cloudFrontDomain;
        return domain + "/" + s3Key;
    }

    private String extractS3Key(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            throw new IllegalArgumentException("삭제할 파일 URL이 비어있습니다.");
        }

        String normalizedDomain = cloudFrontDomain.endsWith("/")
                ? cloudFrontDomain.substring(0, cloudFrontDomain.length() - 1)
                : cloudFrontDomain;
        if (fileUrl.startsWith(normalizedDomain + "/")) {
            return fileUrl.substring(normalizedDomain.length() + 1);
        }

        try {
            URI uri = new URI(fileUrl);
            String path = uri.getPath();
            if (path == null || path.isBlank() || "/".equals(path)) {
                throw new IllegalArgumentException("파일 URL에서 S3 key를 찾을 수 없습니다.");
            }
            String key = path.startsWith("/") ? path.substring(1) : path;
            String bucketPrefix = bucket + "/";
            return key.startsWith(bucketPrefix) ? key.substring(bucketPrefix.length()) : key;
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("파일 URL 형식이 올바르지 않습니다.", e);
        }
    }
}
