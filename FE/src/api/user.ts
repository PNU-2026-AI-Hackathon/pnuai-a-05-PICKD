import { apiRequest } from "./http";

export interface ProfileImageResponse {
  profileImageUrl: string;
}

export interface UserProfileResponse {
  email: string;
  name: string;
  nickname: string;
  picture: string;
  phone: string;
  birthDate: string;
  intro: string;
  onboardingStep: "NONE" | string;
  currentResidence: string;
  desiredLocations: string[];
  detailedAddress: string;
  schoolName: string;
  department: string;
  doubleMajor: string;
  minor: string;
  degreeType: "ASSOCIATE" | string;
  enrollmentStatus: "ENROLLED" | string;
  graduationDate: string;
  gpa: number;
  campus: string;
  industries: string[];
  jobGroups: string[];
  employmentType: string;
  companyTypes: string[];
  keywords: string[];
  targetCompany: string;
  salaryRange: string;
  targetPeriod: string;
  currentStage: string;
  focusItems: string[];
  hasResume: boolean;
  hasBaseEssay: boolean;
  hasPortfolio: boolean;
}

export async function getProfileImageUrl(): Promise<ProfileImageResponse> {
  return apiRequest<ProfileImageResponse>("/api/user/profile-image", {
    method: "GET",
    skipJsonContentType: true,
  });
}

export async function uploadProfileImage(file: File): Promise<ProfileImageResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<ProfileImageResponse>("/api/user/profile-image", {
    method: "POST",
    body: formData,
    skipJsonContentType: true,
  });
}

export interface UpdateUserProfileRequest {
  name: string;
  nickname: string;
  phone: string;
  birthDate: string;
  intro: string;
  currentResidence: string;
  desiredLocations: string[];
  detailedAddress: string;
  schoolName: string;
  department: string;
  doubleMajor: string;
  minor: string;
  degreeType: string;
  enrollmentStatus: string;
  graduationDate: string;
  gpa: number;
  campus: string;
  industries: string[];
  jobGroups: string[];
  employmentType: string;
  companyTypes: string[];
  keywords: string[];
  targetCompany: string;
  salaryRange: string;
  targetPeriod: string;
  currentStage: string;
  focusItems: string[];
}

export async function updateUserProfile(data: UpdateUserProfileRequest): Promise<UserProfileResponse> {
  return apiRequest<UserProfileResponse>("/api/user", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getUserProfile(): Promise<UserProfileResponse> {
  return apiRequest<UserProfileResponse>("/api/user", {
    method: "GET",
    skipJsonContentType: true,
  });
}
