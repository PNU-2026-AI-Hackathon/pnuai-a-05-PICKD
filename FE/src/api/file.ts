import { apiRequest } from "./http";

export type FileUploadType =
  | "PROFILE"
  | "LICENSE"
  | "EDUCATION"
  | "LANGUAGE"
  | "AWARD"
  | "TEMP_RESUME"
  | "GENERAL";

export interface UploadedFileResponse {
  id: number;
  fileName: string;
  fileUrl: string;
  uploadType: FileUploadType;
  fileSize: number;
  contentType: string;
  createdAt: string;
}

export async function getUploadedFiles(type?: FileUploadType) {
  const searchParams = new URLSearchParams();
  if (type) searchParams.set("type", type);

  return apiRequest<UploadedFileResponse[]>(
    `/api/files${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
    {
      method: "GET",
      skipJsonContentType: true,
    },
  );
}

export async function uploadFile(file: File, type: FileUploadType) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  return apiRequest<UploadedFileResponse>("/api/files/upload", {
    method: "POST",
    body: formData,
    skipJsonContentType: true,
  });
}
