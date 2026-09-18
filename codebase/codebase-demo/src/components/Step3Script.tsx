import React, { useState } from 'react';
import { 
  ChevronLeft, 
  RotateCcw, 
  Download, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  ExternalLink,
  Presentation,
  Share2,
  Sparkles
} from 'lucide-react';
import { ScriptSentence, SourceItem } from '../types';

interface Step3ScriptProps {
  topic: string;
  sources: SourceItem[];
  sentences: ScriptSentence[];
  isSourceCExcluded: boolean;
  isSentence3Rewritten: boolean;
  onRewriteSentence3: () => void;
  onOpenSourceModal: (sourceId: string) => void;
  onGoBackToSources: () => void;
  onResetToStep1: () => void;
  onShowToast: (msg: string) => void;
  onOpenTeleprompter: () => void;
}

export const Step3Script: React.FC<Step3ScriptProps> = ({
  topic,
  sources,
  sentences,
  isSourceCExcluded,
  isSentence3Rewritten,
  onRewriteSentence3,
  onOpenSourceModal,
  onGoBackToSources,
  onResetToStep1,
  onShowToast,
  onOpenTeleprompter,
}) => {
  const [copied, setCopied] = useState(false);

  const getSourceCode = (sourceId: string) => {
    const s = sources.find((src) => src.id === sourceId);
    if (!s) return `Nguồn ${sourceId}`;
    if (sourceId === 'A') return 'Nguồn A (OpenAI)';
    if (sourceId === 'B') return 'Nguồn B (Google)';
    if (sourceId === 'C') return 'Nguồn C (Blog cá nhân)';
    return s.code;
  };

  const handleExport = () => {
    const fullText = [
      `KỊCH BẢN BÀI GIẢNG: ${topic.toUpperCase()}`,
      `Thời gian xuất bản: ${new Date().toLocaleString('vi-VN')}`,
      `Tiêu chuẩn: Kiểm duyệt học thuật ScriptScout CP2\n`,
      `--- NỘI DUNG KỊCH BẢN ---`,
      sentences
        .map((s) => {
          let text = s.originalText;
          let srcInfo = s.sourceIds.join(', ');

          if (s.id === 3) {
            if (isSentence3Rewritten) {
              text = s.rewrittenText || text;
              srcInfo = 'Nguồn A, Nguồn B (Đã thẩm định lại)';
            } else if (isSourceCExcluded) {
              srcInfo = 'Nguồn C (Cảnh báo: Đã bị loại)';
            }
          }
          return `[Câu ${s.id < 10 ? '0' + s.id : s.id}] ${text}\n  -> Dẫn chứng: ${srcInfo}`;
        })
        .join('\n\n'),
      `\n--- DANH MỤC TÀI LIỆU CĂN CỨ ---`,
      sources
        .filter((s) => !s.isExcluded)
        .map((s) => `• [${s.code}] ${s.name} - ${s.org} (${s.link})`)
        .join('\n'),
    ].join('\n');

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Kich_ban_${topic.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onShowToast('Đã tải xuống file kịch bản kèm danh mục căn cứ học thuật.');
  };

  const handleCopy = () => {
    const textOnly = sentences
      .map((s) => {
        if (s.id === 3 && isSentence3Rewritten && s.rewrittenText) {
          return s.rewrittenText;
        }
        return s.currentText;
      })
      .join('\n\n');

    navigator.clipboard.writeText(textOnly);
    setCopied(true);
    onShowToast('Đã sao chép 5 câu kịch bản vào bộ nhớ tạm.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6" id="step-3-container">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <span>Bước 3 / 3</span>
            <span>•</span>
            <span>Kết quả kịch bản truy vết</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight mt-1">
            5 câu mở đầu: {topic}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Mỗi câu được liên kết chặt chẽ với nguồn đã thẩm định. Giảng viên có thể kiểm tra căn cứ hoặc viết lại câu có rủi ro.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-back-to-sources"
            onClick={onGoBackToSources}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Xem lại nguồn</span>
          </button>

          <button
            onClick={onOpenTeleprompter}
            className="px-3.5 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
            title="Mở chế độ phóng đại để giảng viên đọc thử khi quay video"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chế độ đọc thử</span>
          </button>
        </div>
      </div>

      {/* 5 Sentence Cards */}
      <div className="space-y-4">
        {/* Câu 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all hover:border-indigo-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 flex-1">
              <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                01
              </span>
              <div className="space-y-2 flex-1">
                <p className="text-slate-900 font-medium text-base sm:text-lg leading-relaxed">
                  “Prompt là hướng dẫn mà bạn cung cấp để AI hiểu nhiệm vụ cần thực hiện.”
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500 font-medium">Nguồn chứng minh:</span>
                  <button
                    onClick={() => onOpenSourceModal('A')}
                    className="px-2.5 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Nguồn A (OpenAI)</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
                    Hợp lệ
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenSourceModal('A')}
              className="hidden sm:flex px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors shrink-0 items-center gap-1 cursor-pointer"
            >
              Xem căn cứ
            </button>
          </div>
        </div>

        {/* Câu 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all hover:border-indigo-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 flex-1">
              <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                02
              </span>
              <div className="space-y-2 flex-1">
                <p className="text-slate-900 font-medium text-base sm:text-lg leading-relaxed">
                  “Một prompt hiệu quả thường nêu rõ vai trò, mục tiêu và bối cảnh.”
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500 font-medium">Nguồn chứng minh:</span>
                  <button
                    onClick={() => onOpenSourceModal('A')}
                    className="px-2.5 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Nguồn A</span>
                  </button>
                  <button
                    onClick={() => onOpenSourceModal('B')}
                    className="px-2.5 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Nguồn B (Google)</span>
                  </button>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
                    Hợp lệ (Đối chiếu 2 nguồn)
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenSourceModal('A')}
              className="hidden sm:flex px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors shrink-0 items-center gap-1 cursor-pointer"
            >
              Xem căn cứ
            </button>
          </div>
        </div>

        {/* Câu 3 (TƯƠNG TÁC THÔNG MINH THEO TRẠNG THÁI NGUỒN C & VIẾT LẠI) */}
        <div
          id="sentence-3-interactive-card"
          className={`rounded-2xl border transition-all duration-300 p-5 shadow-xs ${
            isSentence3Rewritten
              ? 'bg-emerald-50/70 border-2 border-emerald-300'
              : isSourceCExcluded
              ? 'bg-amber-50/80 border-2 border-amber-300'
              : 'bg-white border-slate-200 hover:border-indigo-200'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 flex-1">
              <span
                className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 ${
                  isSentence3Rewritten
                    ? 'bg-emerald-200 text-emerald-900'
                    : isSourceCExcluded
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                03
              </span>

              <div className="space-y-2.5 flex-1">
                {/* Text Content */}
                <p className="text-slate-900 font-medium text-base sm:text-lg leading-relaxed">
                  {isSentence3Rewritten
                    ? '“Độ dài của prompt không quyết định chất lượng; điều quan trọng là yêu cầu rõ ràng và có đủ ngữ cảnh.”'
                    : '“Prompt dài hơn 100 từ luôn cho kết quả tốt hơn.”'}
                </p>

                {/* Sources & Badge Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500 font-medium">Nguồn chứng minh:</span>

                  {isSentence3Rewritten ? (
                    <>
                      <button
                        onClick={() => onOpenSourceModal('A')}
                        className="px-2.5 py-0.5 rounded-md bg-white text-indigo-700 font-semibold text-xs border border-indigo-200 hover:bg-indigo-50 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        Nguồn A
                      </button>
                      <button
                        onClick={() => onOpenSourceModal('B')}
                        className="px-2.5 py-0.5 rounded-md bg-white text-indigo-700 font-semibold text-xs border border-indigo-200 hover:bg-indigo-50 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        Nguồn B
                      </button>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Đã viết lại từ nguồn được duyệt
                      </span>
                    </>
                  ) : isSourceCExcluded ? (
                    <>
                      <button
                        onClick={() => onOpenSourceModal('C')}
                        className="px-2.5 py-0.5 rounded-md bg-amber-200 text-amber-900 font-bold text-xs border border-amber-300 hover:bg-amber-300 transition-colors flex items-center gap-1 line-through opacity-80 cursor-pointer"
                      >
                        Nguồn C (Đã loại)
                      </button>
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Cần viết lại — phụ thuộc nguồn C đã bị loại
                      </span>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => onOpenSourceModal('C')}
                        className="px-2.5 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        Nguồn C (Blog cá nhân)
                      </button>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                        Dựa trên nguồn C
                      </span>
                    </>
                  )}
                </div>

                {/* Banner cảnh báo & Nút Viết lại câu nếu Nguồn C bị loại và chưa viết lại */}
                {isSourceCExcluded && !isSentence3Rewritten && (
                  <div className="pt-2 animate-fade-in">
                    <div className="p-3.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="font-medium">
                          Khẳng định này phụ thuộc nguồn C đã bị loại. Bạn nên cập nhật lại câu theo nguồn A &amp; B chuẩn mực.
                        </span>
                      </div>
                      <button
                        id="btn-rewrite-sentence-3"
                        onClick={onRewriteSentence3}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Viết lại câu này</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => onOpenSourceModal(isSentence3Rewritten ? 'A' : 'C')}
              className="hidden sm:flex px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors shrink-0 items-center gap-1 cursor-pointer"
            >
              Xem căn cứ
            </button>
          </div>
        </div>

        {/* Câu 4 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all hover:border-indigo-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 flex-1">
              <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                04
              </span>
              <div className="space-y-2 flex-1">
                <p className="text-slate-900 font-medium text-base sm:text-lg leading-relaxed">
                  “Hãy bắt đầu bằng một yêu cầu cụ thể, sau đó thử và chỉnh sửa dần.”
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500 font-medium">Nguồn chứng minh:</span>
                  <button
                    onClick={() => onOpenSourceModal('A')}
                    className="px-2.5 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Nguồn A (OpenAI)</span>
                  </button>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
                    Hợp lệ
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenSourceModal('A')}
              className="hidden sm:flex px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors shrink-0 items-center gap-1 cursor-pointer"
            >
              Xem căn cứ
            </button>
          </div>
        </div>

        {/* Câu 5 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all hover:border-indigo-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 flex-1">
              <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                05
              </span>
              <div className="space-y-2 flex-1">
                <p className="text-slate-900 font-medium text-base sm:text-lg leading-relaxed">
                  “Bạn có thể so sánh nhiều phiên bản prompt để chọn kết quả phù hợp.”
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500 font-medium">Nguồn chứng minh:</span>
                  <button
                    onClick={() => onOpenSourceModal('B')}
                    className="px-2.5 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Nguồn B (Google)</span>
                  </button>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
                    Hợp lệ
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenSourceModal('B')}
              className="hidden sm:flex px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors shrink-0 items-center gap-1 cursor-pointer"
            >
              Xem căn cứ
            </button>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Kịch bản đã sẵn sàng chuyển sang phần ghi hình hoặc sản xuất slide giảng dạy.</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            id="btn-copy-script"
            onClick={handleCopy}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
          </button>

          <button
            id="btn-export-script"
            onClick={handleExport}
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Xuất kịch bản &amp; căn cứ</span>
          </button>

          <button
            id="btn-create-new-script"
            onClick={onResetToStep1}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tạo kịch bản mới</span>
          </button>
        </div>
      </div>
    </div>
  );
};
