package back.pickd.global.infra.s3;

import back.pickd.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UploadedFileRepository extends JpaRepository<UploadedFile, Long> {

    List<UploadedFile> findByUserOrderByCreatedAtDesc(User user);

    List<UploadedFile> findByUserAndUploadTypeOrderByCreatedAtDesc(User user, FileUploadType uploadType);

    Optional<UploadedFile> findByIdAndUser(Long id, User user);
}
