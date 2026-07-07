import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateOnboarding, type DegreeType, type EnrollmentStatus } from "../../api/onboarding";
import { PickdLogoIcon } from "../../assets";

const DEGREE_OPTIONS: { value: DegreeType; label: string }[] = [
  { value: "ASSOCIATE", label: "전문학사" },
  { value: "BACHELOR", label: "학사" },
  { value: "MASTER", label: "석사" },
  { value: "DOCTOR", label: "박사" },
];

const STATUS_OPTIONS: { value: EnrollmentStatus; label: string }[] = [
  { value: "ENROLLED", label: "재학" },
  { value: "LOA", label: "휴학" },
  { value: "EXPECTED", label: "졸업예정" },
  { value: "GRADUATED", label: "졸업" },
  { value: "DROPOUT", label: "중퇴" },
];

const inputClass =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20";

const selectClass =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 bg-white";

export default function Step3Education() {
  const navigate = useNavigate();

  const [form, setForm] = useState<{
    schoolName: string;
    department: string;
    doubleMajor: string;
    minor: string;
    degreeType: DegreeType;
    enrollmentStatus: EnrollmentStatus;
    graduationDate: string;
    gpa: string;
    campus: string;
  }>({
    schoolName: "",
    department: "",
    doubleMajor: "",
    minor: "",
    degreeType: "BACHELOR",
    enrollmentStatus: "ENROLLED",
    graduationDate: "",
    gpa: "",
    campus: "",
  });

  const isValid = form.schoolName.trim().length > 0 && form.department.trim().length > 0 && form.graduationDate.length > 0;

  const submit = async () => {
    if (!isValid) return;

    try {
      await updateOnboarding({
        schoolName: form.schoolName,
        department: form.department,
        doubleMajor: form.doubleMajor,
        minor: form.minor,
        degreeType: form.degreeType,
        enrollmentStatus: form.enrollmentStatus,
        graduationDate: form.graduationDate,
        gpa: form.gpa ? Number(form.gpa) : null,
        campus: form.campus,
      });
      navigate("/onboarding/step4");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      {/* Top-left logo */}
      <div className="flex items-center gap-2 px-40 py-5">
        <PickdLogoIcon size={28} />
        <span className="text-base font-bold text-gray-900">Pickd</span>
      </div>

      <div className="flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-[600px] rounded-2xl bg-white p-10 shadow-sm">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">학력 정보를 알려주세요</h1>
          <p className="mb-8 text-sm text-gray-400">자소서·이력서에 바로 활용할 수 있어요.</p>

          {/* 학교 / 전공 */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">학교</label>
              <input
                placeholder="학교명"
                value={form.schoolName}
                onChange={(e) => setForm((prev) => ({ ...prev, schoolName: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">전공</label>
              <input
                placeholder="전공"
                value={form.department}
                onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          {/* 복수전공 / 부전공 */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                복수전공 <span className="font-normal text-gray-400">(선택)</span>
              </label>
              <input
                placeholder="복수전공"
                value={form.doubleMajor}
                onChange={(e) => setForm((prev) => ({ ...prev, doubleMajor: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                부전공 <span className="font-normal text-gray-400">(선택)</span>
              </label>
              <input
                placeholder="부전공"
                value={form.minor}
                onChange={(e) => setForm((prev) => ({ ...prev, minor: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          {/* 학위 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">학위</label>
            <select
              value={form.degreeType}
              onChange={(e) => setForm((prev) => ({ ...prev, degreeType: e.target.value as DegreeType }))}
              className={selectClass}
            >
              {DEGREE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* 학적 상태 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-800">학적 상태</label>
            <div className="flex w-full rounded-xl bg-gray-100 p-1">
              {STATUS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, enrollmentStatus: o.value }))}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                    form.enrollmentStatus === o.value
                      ? "bg-white font-bold text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* 졸업 시기 / 학점 */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">졸업 시기</label>
              <input
                type="month"
                value={form.graduationDate}
                onChange={(e) => setForm((prev) => ({ ...prev, graduationDate: e.target.value }))}
                className={inputClass + " text-gray-700"}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">
                학점 <span className="font-normal text-gray-400">(선택)</span>
              </label>
              <input
                placeholder="예: 3.8"
                value={form.gpa}
                onChange={(e) => setForm((prev) => ({ ...prev, gpa: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          {/* 캠퍼스 */}
          <div className="mb-8">
            <label className="mb-2 block text-sm font-bold text-gray-800">
              캠퍼스 <span className="font-normal text-gray-400">(선택)</span>
            </label>
            <input
              placeholder="예: 부산캠퍼스"
              value={form.campus}
              onChange={(e) => setForm((prev) => ({ ...prev, campus: e.target.value }))}
              className={inputClass}
            />
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={submit}
            disabled={!isValid}
            className={`w-full rounded-xl py-4 text-base font-semibold transition-colors ${
              isValid
                ? "bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                : "cursor-not-allowed bg-gray-200 text-gray-400"
            }`}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
