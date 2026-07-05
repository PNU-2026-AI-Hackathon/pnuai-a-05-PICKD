package back.pickd.global.infra.s3;

import back.pickd.global.config.OpenApiConfig;
import back.pickd.global.error.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "File", description = "S3 파일 업로드 및 조회 API")
@SecurityRequirement(name = OpenApiConfig.COOKIE_AUTH)
public class FileController {

    private final FileService fileService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "파일 업로드",
            description = "이력서, 자격증, 수료증 등을 S3에 업로드하고 CloudFront URL을 반환합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "업로드 성공",
                    content = @Content(schema = @Schema(implementation = UploadedFileResponse.class))),
            @ApiResponse(responseCode = "400", description = "파일 또는 type 누락",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<UploadedFileResponse> uploadFile(
            @Parameter(hidden = true) Authentication authentication,
            @Parameter(description = "업로드할 파일", required = true,
                    content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(type = "string", format = "binary")))
            @RequestParam("file") MultipartFile file,
            @Parameter(description = "파일 유형", required = true) @RequestParam("type") FileUploadType type) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok(fileService.uploadFile(authentication.getName(), file, type));
    }

    @GetMapping
    @Operation(
            summary = "업로드 파일 목록 조회",
            description = "사용자가 업로드한 파일 목록을 반환합니다. type 파라미터로 필터링할 수 있습니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(schema = @Schema(implementation = UploadedFileResponse.class))),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<UploadedFileResponse>> getFiles(
            @Parameter(hidden = true) Authentication authentication,
            @Parameter(description = "파일 유형 필터 (선택)") @RequestParam(required = false) FileUploadType type) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok(fileService.getFiles(authentication.getName(), type));
    }

    @PutMapping("/{fileId}/name")
    @Operation(
            summary = "업로드 파일 이름 변경",
            description = "사용자가 업로드한 파일의 표시 이름을 변경합니다. S3 객체 key는 변경하지 않습니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "이름 변경 성공",
                    content = @Content(schema = @Schema(implementation = UploadedFileResponse.class))),
            @ApiResponse(responseCode = "400", description = "요청 유효성 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<UploadedFileResponse> renameFile(
            @Parameter(hidden = true) Authentication authentication,
            @Parameter(description = "파일 ID", required = true) @PathVariable Long fileId,
            @RequestBody @Valid UploadedFileRenameRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok(fileService.renameFile(authentication.getName(), fileId, request.fileName()));
    }

    @DeleteMapping("/{fileId}")
    @Operation(
            summary = "업로드 파일 삭제",
            description = "사용자가 업로드한 파일을 S3와 파일 보관함에서 삭제합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "삭제 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> deleteFile(
            @Parameter(hidden = true) Authentication authentication,
            @Parameter(description = "파일 ID", required = true) @PathVariable Long fileId) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        fileService.deleteFile(authentication.getName(), fileId);
        return ResponseEntity.noContent().build();
    }
}
