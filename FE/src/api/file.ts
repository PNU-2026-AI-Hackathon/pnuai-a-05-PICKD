import { apiRequest } from "./http";

export type FileUploadType =
  | "PROFILE"
  | "LICENSE"
  | "EDUCATION"
  | "LANGUAGE"
  | "AWARD"
  | "TEMP_RESUME"
  | "GENERAL";

export interface FileUploadResponse {
  id: number;
  fileName: string;
  fileUrl: string;
  uploadType: FileUploadType;
  fileSize: number;
  contentType: string;
  createdAt: string;
}

export async function getFiles(
  type?: FileUploadType
): Promise<FileUploadResponse[]> {
  const query = type ? `?type=${type}` : "";
  return apiRequest<FileUploadResponse[]>(`/api/files${query}`, {
    method: "GET",
    skipJsonContentType: true,
  });
}

export async function renameFile(
  fileId: number,
  fileName: string
): Promise<FileUploadResponse> {
  return apiRequest<FileUploadResponse>(`/api/files/${fileId}/name`, {
    method: "PUT",
    body: JSON.stringify({ fileName }),
  });
}

export async function uploadFile(
  type: FileUploadType,
  file: File
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<FileUploadResponse>(`/api/files/upload?type=${type}`, {
    method: "POST",
    body: formData,
    skipJsonContentType: true,
  });
}