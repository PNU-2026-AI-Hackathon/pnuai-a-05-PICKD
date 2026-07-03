import { apiRequest } from "./http";

export type OnboardingStep =
  | "NONE"
  | "TERMS"
  | "VERIFICATION"
  | "BASIC"
  | "EDUCATION"
  | "INTERESTS"
  | "PREP"
  | "COMPLETED";

export type DegreeType = "ASSOCIATE" | "BACHELOR" | "MASTER" | "DOCTOR";
export type EnrollmentStatus =
  | "ENROLLED"
  | "GRADUATED"
  | "LOA"
  | "EXPECTED"
  | "DROPOUT";

export type OnboardingUserResponse = {
  email: string;
  name: string;
  nickname?: string | null;
  picture?: string | null;
  onboardingStep: OnboardingStep;
  currentResidence?: string | null;
  schoolName?: string | null;
  major?: string | null;
  targetPeriod?: string | null;
};

export type OnboardingExperience = {
  type: string;
  title: string;
  startDate?: string;
  endDate?: string;
};

export type OnboardingCertification = {
  name: string;
  score?: string;
  acquisitionDate?: string;
};

export type OnboardingPayload = Partial<{
  serviceAgreed: boolean;
  privacyAgreed: boolean;
  marketingAgreed: boolean;
  pushAgreed: boolean;

  name: string;
  birthDate: string;
  phone: string;

  nickname: string;
  intro: string;
  currentResidence: string;
  desiredLocations: string[];
  detailedAddress: string;

  schoolName: string;
  department: string;
  doubleMajor: string;
  minor: string;
  degreeType: DegreeType;
  enrollmentStatus: EnrollmentStatus;
  graduationDate: string;
  gpa: number | null;
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
  experiences: OnboardingExperience[];
  certifications: OnboardingCertification[];
}>;

export function getOnboardingStatus() {
  return apiRequest<OnboardingUserResponse>("/api/onboarding/status");
}

export function updateOnboarding(data: OnboardingPayload) {
  return apiRequest<OnboardingUserResponse>("/api/onboarding", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function resetOnboarding() {
  return apiRequest<string>("/api/onboarding/reset", {
    method: "POST",
  });
}
