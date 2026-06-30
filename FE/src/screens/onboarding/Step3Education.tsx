import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateOnboarding } from "../../api/onboarding";

export default function Step3Education() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
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

  const submit = async () => {
    if (!form.schoolName) return alert("학교명 입력");
    if (!form.department) return alert("전공 입력");
    if (!form.graduationDate) return alert("졸업일 입력");

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
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow w-[450px]">
        <h2 className="text-xl font-bold mb-6">학력 정보</h2>

        {/* 학교 */}
        <input
          placeholder="학교명"
          value={form.schoolName}
          onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
          className="w-full border px-3 py-2 rounded mb-3"
        />

        {/* 전공 */}
        <input
          placeholder="전공"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          className="w-full border px-3 py-2 rounded mb-3"
        />

        {/* 복수전공 */}
        <input
          placeholder="복수전공 (없으면 비워도 됨)"
          value={form.doubleMajor}
          onChange={(e) => setForm({ ...form, doubleMajor: e.target.value })}
          className="w-full border px-3 py-2 rounded mb-3"
        />

        {/* 부전공 */}
        <input
          placeholder="부전공 (없으면 비워도 됨)"
          value={form.minor}
          onChange={(e) => setForm({ ...form, minor: e.target.value })}
          className="w-full border px-3 py-2 rounded mb-3"
        />

        {/* 학위 */}
        <select
          value={form.degreeType}
          onChange={(e) => setForm({ ...form, degreeType: e.target.value })}
          className="w-full border px-3 py-2 rounded mb-3"
        >
          <option value="ASSOCIATE">전문학사</option>
          <option value="BACHELOR">학사</option>
          <option value="MASTER">석사</option>
          <option value="DOCTOR">박사</option>
        </select>

        {/* 학적 상태 */}
        <select
          value={form.enrollmentStatus}
          onChange={(e) =>
            setForm({ ...form, enrollmentStatus: e.target.value })
          }
          className="w-full border px-3 py-2 rounded mb-3"
        >
          <option value="ENROLLED">재학</option>
          <option value="GRADUATED">졸업</option>
          <option value="EXPECTED">졸업예정</option>
          <option value="LOA">휴학</option>
          <option value="DROPOUT">중퇴</option>
        </select>

        {/* 졸업일 */}
        <input
          type="month"
          value={form.graduationDate}
          onChange={(e) => setForm({ ...form, graduationDate: e.target.value })}
          className="w-full border px-3 py-2 rounded mb-3"
        />

        {/* 학점 */}
        <input
          placeholder="학점 (선택)"
          value={form.gpa}
          onChange={(e) => setForm({ ...form, gpa: e.target.value })}
          className="w-full border px-3 py-2 rounded mb-3"
        />

        {/* 캠퍼스 */}
        <input
          placeholder="캠퍼스 (선택)"
          value={form.campus}
          onChange={(e) => setForm({ ...form, campus: e.target.value })}
          className="w-full border px-3 py-2 rounded mb-3"
        />

        <button
          onClick={submit}
          className="w-full bg-blue-500 text-white py-2 rounded"
        >
          다음
        </button>
      </div>
    </div>
  );
}
