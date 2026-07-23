import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export default function PdfPreview({ file }: { file: string | null }) {
  const [numPages, setNumPages] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  if (!file) return <div className="text-gray-400">미리보기 없음</div>;

  return (
    <>
      {/* 첫페이지 */}
      <div
        onClick={() => setIsOpen(true)}
        className="cursor-pointer flex justify-center"
      >
        <Document file={file}>
          <Page
            pageNumber={1}
            width={350}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>

      {/* 전체 페이지 미리보기 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white w-[1100px] h-[600px] rounded-lg flex gap-4 overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 left-4 text-xl font-bold z-10 hover:scale-110"
            >
              ✕
            </button>
            {/* 왼쪽 큰 화면 */}
            <div className="w-[70%] h-full flex justify-center items-center bg-gray-100">
              <Document file={file}>
                <Page
                  pageNumber={currentPage}
                  width={500}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </div>

            {/* 오른쪽 미리보기 */}
            <div className="w-[30%] h-full overflow-y-auto pr-2">
              <Document
                file={file}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              >
                {Array.from({ length: numPages }, (_, i) => (
                  <div
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`mb-2 cursor-pointer ${
                      currentPage === i + 1 ? "border-2 border-green-500" : ""
                    }`}
                  >
                    <Page
                      pageNumber={i + 1}
                      width={120}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </div>
                ))}
              </Document>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
