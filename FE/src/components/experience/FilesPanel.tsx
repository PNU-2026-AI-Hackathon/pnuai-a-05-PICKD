import { useEffect, useMemo, useRef, useState } from "react";
import { Check, FileText, Folder, Image as ImageIcon, MoreHorizontal, Star, Trash2, Upload, X } from "lucide-react";

type FileKind =
  | "증명사진"
  | "성적증명서"
  | "졸업증명서"
  | "재학증명서"
  | "어학 성적표"
  | "자격증 사본"
  | "수상 증빙"
  | "교육 수료증"
  | "기타 제출서류";

const FILE_KINDS: FileKind[] = [
  "증명사진",
  "성적증명서",
  "졸업증명서",
  "재학증명서",
  "어학 성적표",
  "자격증 사본",
  "수상 증빙",
  "교육 수료증",
  "기타 제출서류",
];

type FileItem = {
  id: string;
  kind: FileKind;
  name: string;
  fileKind: "pdf" | "image";
  url?: string;
};

const INITIAL_FILES: FileItem[] = [
  { id: "f0", kind: "증명사진", name: "profile_photo.jpg", fileKind: "image" },
  { id: "f1", kind: "성적증명서", name: "성적증명서_2025.pdf", fileKind: "pdf" },
  { id: "f2", kind: "어학 성적표", name: "toeic_score.png", fileKind: "image" },
];

const LS_FILES = "specs.files.v1";
const LS_PHOTO_ID = "specs.basicPhoto.id";

function lsGet<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export default function FilesPanel() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<FileItem[]>(() => lsGet<FileItem[]>(LS_FILES, INITIAL_FILES));
  const [basicPhotoId, setBasicPhotoId] = useState<string>(() => lsGet<string>(LS_PHOTO_ID, "f0"));
  const [preview, setPreview] = useState<FileItem | null>(null);
  const [pendingKind, setPendingKind] = useState<FileKind>("기타 제출서류");
  const [menuFileId, setMenuFileId] = useState<string | null>(null);

  useEffect(() => lsSet(LS_FILES, files), [files]);
  useEffect(() => lsSet(LS_PHOTO_ID, basicPhotoId), [basicPhotoId]);

  useEffect(() => {
    if (!menuFileId) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-file-menu-area]")) {
        setMenuFileId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuFileId]);

  const filesByKind = useMemo(() => {
    const map: Partial<Record<FileKind, FileItem[]>> = {};
    files.forEach((file) => {
      map[file.kind] = [...(map[file.kind] ?? []), file];
    });
    return map;
  }, [files]);

  const handleUpload = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image") || /\.(png|jpe?g|gif|webp)$/i.test(file.name);
    const url = isImage ? URL.createObjectURL(file) : undefined;
    setFiles((prev) => [
      ...prev,
      {
        id: `f${Date.now()}`,
        kind: pendingKind,
        name: file.name,
        fileKind: isImage ? "image" : "pdf",
        url,
      },
    ]);
  };

  const renameFile = (fileId: string) => {
    const target = files.find((file) => file.id === fileId);
    if (!target) return;
    const nextName = window.prompt("파일 이름을 입력해주세요.", target.name);
    if (!nextName?.trim()) return;
    setFiles((prev) => prev.map((file) => (file.id === fileId ? { ...file, name: nextName.trim() } : file)));
    setMenuFileId(null);
  };

  const deleteFile = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
    if (preview?.id === fileId) setPreview(null);
    setMenuFileId(null);
  };

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-[800] text-[#0F172A]">파일함</h2>
          <p className="mt-1 text-[13px] font-[500] text-[#64748B]">
            증명사진, 성적증명서, 어학 성적표처럼 제출 서류를 종류별로 모아둡니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={pendingKind}
            onChange={(event) => setPendingKind(event.target.value as FileKind)}
            className="h-9 rounded-[8px] border border-[#E2E8F0] bg-white px-3 text-[13px] font-[700] text-[#334155] outline-none"
          >
            {FILE_KINDS.map((kind) => (
              <option key={kind} value={kind}>{kind}</option>
            ))}
          </select>

          <input ref={inputRef} type="file" className="hidden" onChange={(event) => handleUpload(event.target.files)} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-[#2563EB] px-3 text-[13px] font-[700] text-white hover:bg-[#1D4ED8]"
          >
            <Upload size={15} />
            파일 업로드
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#CBD5E1] py-16 text-center text-[#94A3B8]">
          <Folder className="mx-auto mb-2" size={34} />
          <p className="text-sm font-[600]">저장된 파일이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {FILE_KINDS.filter((kind) => filesByKind[kind]?.length).map((kind) => (
            <section key={kind}>
              <div className="mb-3 flex items-center gap-2">
                <Folder size={16} className="text-[#64748B]" />
                <h3 className="text-[14px] font-[800] text-[#334155]">{kind}</h3>
                <span className="text-[12px] font-[600] text-[#94A3B8]">{filesByKind[kind]?.length ?? 0}개</span>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {filesByKind[kind]?.map((file) => (
                  <div key={file.id} className="relative rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 hover:bg-white">
                    <button type="button" onClick={() => setPreview(file)} className="flex w-full items-start gap-3 text-left">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#64748B] shadow-sm">
                        {file.fileKind === "image" ? <ImageIcon size={19} /> : <FileText size={19} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-[800] text-[#0F172A]">{file.name}</p>
                        <p className="mt-1 text-[12px] font-[600] text-[#94A3B8]">{file.fileKind.toUpperCase()}</p>
                      </div>
                    </button>

                    {file.kind === "증명사진" && (
                      <button
                        type="button"
                        onClick={() => setBasicPhotoId(file.id)}
                        className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-[700] ${
                          basicPhotoId === file.id ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-white text-[#64748B]"
                        }`}
                      >
                        {basicPhotoId === file.id ? <Check size={12} /> : <Star size={12} />}
                        대표 사진
                      </button>
                    )}

                    <button
                      type="button"
                      data-file-menu-area
                      onClick={() => setMenuFileId((prev) => (prev === file.id ? null : file.id))}
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-white hover:text-[#0F172A]"
                    >
                      <MoreHorizontal size={17} />
                    </button>

                    {menuFileId === file.id && (
                      <div data-file-menu-area className="absolute right-3 top-11 z-20 w-[130px] overflow-hidden rounded-lg border border-[#E2E8F0] bg-white py-1 shadow-lg">
                        <button type="button" onClick={() => renameFile(file.id)} className="block h-8 w-full px-3 text-left text-[13px] font-[600] hover:bg-[#F8FAFC]">이름 변경</button>
                        <button type="button" onClick={() => deleteFile(file.id)} className="flex h-8 w-full items-center gap-2 px-3 text-left text-[13px] font-[600] text-[#EF4444] hover:bg-[#FEF2F2]"><Trash2 size={13} />삭제</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="w-[680px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
              <div>
                <p className="text-[13px] font-[700] text-[#64748B]">{preview.kind}</p>
                <h3 className="mt-1 text-[18px] font-[800] text-[#0F172A]">{preview.name}</h3>
              </div>
              <button type="button" onClick={() => setPreview(null)} className="text-[#64748B] hover:text-[#0F172A]"><X size={22} /></button>
            </div>
            <div className="flex min-h-[360px] items-center justify-center bg-[#F8FAFC] p-8">
              {preview.fileKind === "image" && preview.url ? (
                <img src={preview.url} alt={preview.name} className="max-h-[420px] max-w-full rounded-xl object-contain" />
              ) : (
                <div className="text-center text-[#64748B]">
                  <FileText className="mx-auto mb-3" size={52} />
                  <p className="text-sm font-[700]">PDF 미리보기 영역</p>
                  <p className="mt-1 text-xs">실제 파일 업로드 시 브라우저 미리보기로 확장 가능합니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { FILE_KINDS };
