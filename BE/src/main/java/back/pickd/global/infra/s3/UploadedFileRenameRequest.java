package back.pickd.global.infra.s3;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "업로드 파일 이름 변경 요청")
public record UploadedFileRenameRequest(
        @NotBlank(message = "파일명은 비어 있을 수 없습니다.")
        @Schema(description = "변경할 파일명", example = "수정된_이력서.pdf")
        String fileName
) {
}
