import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfile, type UserProfileResponse } from "../../api/user";
import { PickdLogoIcon } from "../../assets";

const ENROLLMENT_LABEL: Record<string, string> = {
  ENROLLED: "재학",
  LOA: "휴학",
  EXPECTED: "졸업예정",
  GRADUATED: "졸업",
  DROPOUT: "중퇴",
};

export default function OnboardingComplete() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);

  useEffect(() => {
    getUserProfile().then(setProfile).catch(() => {});
  }, []);

  const tags: { icon: string; label: string }[] = [
    profile?.enrollmentStatus && { icon: "person", label: ENROLLMENT_LABEL[profile.enrollmentStatus] ?? profile.enrollmentStatus },
    profile?.schoolName && { icon: "school", label: profile.schoolName },
    profile?.department && { icon: "none", label: profile.department },
    ...(profile?.jobGroups ?? []).map((j) => ({ icon: "none", label: j })),
    ...(profile?.industries ?? []).map((k) => ({ icon: "none", label: `#${k}` })),
    profile?.targetPeriod && { icon: "calendar", label: profile.targetPeriod },
  ].filter(Boolean) as { icon: string; label: string }[];

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <div className="flex items-center gap-2 px-40 py-5">
        <PickdLogoIcon size={28} />
        <span className="text-base font-bold text-gray-900">Pickd</span>
      </div>

      <div className="flex flex-col items-center justify-center px-4 py-16">
        {/* 헤드라인 */}
        <h1 className="mb-2 text-2xl font-bold text-gray-900">픽 카드가 완성됐어요</h1>
        <p className="mb-10 text-center text-sm text-gray-500 leading-relaxed">
          이 정보로 맞는 공고를 찾아드릴게요.
          <br />
          나머지는 쓰면서 채워도 충분해요.
        </p>

        {/* 픽 카드 */}
        <div className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-sm">
          {/* 카드 헤더 */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              내 픽 카드
            </div>
            <span className="flex items-center gap-1.5 rounded-lg bg-[#EEF0FD] px-2 py-1.5 text-xs font-semibold text-[#2563EB]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              완성
            </span>
          </div>

          {/* 닉네임 */}
          {profile?.nickname && (
            <p className="mb-1 text-lg font-bold text-gray-900">{profile.nickname}님</p>
          )}
          <p className="mb-4 text-sm text-gray-400">입력할수록 공고 추천이 정확해져요</p>

          {/* 태그 */}
          {tags.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 rounded-xl border bg-gray-50 border-gray-200 px-3 py-1 text-xs text-gray-600"
                >
                  {tag.icon === "person" && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  )}
                  {tag.icon === "school" && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                  )}
                  {tag.icon === "calendar" && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  )}
                  {tag.label}
                </span>
              ))}
            </div>
          )}

          <hr className="mb-4 border-gray-100" />

          <p className="text-xs leading-relaxed text-gray-400">
            여기 담긴 정보는 전부 내 자산이 돼요.
            <br />
            언제든 경험/기본정보 페이지에서 수정할 수 있어요.
          </p>
        </div>

        {/* 시작하기 버튼 */}
        <button
          onClick={() => navigate("/main", { replace: true })}
          className="mt-8 flex w-full max-w-[400px] items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3.5 text-base font-semibold text-white transition hover:bg-[#1d4ed8]"
        >
          Pickd 시작하기
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
