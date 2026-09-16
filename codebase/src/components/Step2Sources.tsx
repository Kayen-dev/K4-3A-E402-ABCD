import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ArrowRight, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Slash, 
  Plus, 
  ExternalLink,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { SourceItem } from '../types';

interface Step2SourcesProps {
  topic: string;
  sources: SourceItem[];
  onToggleExclude: (id: string) => void;
  onOpenModal: (id: string) => void;
  onGoBack: () => void;
  onProceed: () => void;
  onAddCustomSource?: (source: SourceItem) => void;
}

export const Step2Sources: React.FC<Step2SourcesProps> = ({
  topic,
  sources,
  onToggleExclude,
  onOpenModal,
  onGoBack,
  onProceed,
  onAddCustomSource,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customOrg, setCustomOrg] = useState('');
  const [customLink, setCustomLink] = useState('');
  const [customQuote, setCustomQuote] = useState('');

  const excludedCount = sources.filter((s) => s.isExcluded).length;
  const sourceC = sources.find((s) => s.id === 'C');
  const isSourceCExcluded = sourceC ? sourceC.isExcluded : false;

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !onAddCustomSource) return;

    const newCode = `Nguồn ${String.fromCharCode(65 + sources.length)}`;
    const newId = String.fromCharCode(65 + sources.length);

    const newSource: SourceItem = {
      id: newId,
      code: newCode,
      name: customName,
      org: customOrg || 'Tài liệu tham khảo bổ sung',
      year: '2025',
      link: customLink || 'https://scholar.google.com',
      quote: customQuote || `Nội dung đối chiếu học thuật cho bài giảng ${topic}.`,
      reliability: 'high',
      isExcluded: false,
      statusText: 'Độ tin cậy: Cao (Giảng viên bổ sung)',
      reason: 'Nguồn được giảng viên tự cung cấp và bảo đảm nội dung học thuật.',
      isAutoApproved: true,
    };

    onAddCustomSource(newSource);
    setCustomName('');
    setCustomOrg('');
    setCustomLink('');
    setCustomQuote('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6" id="step-2-container">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <span>Bước 2 / 3</span>
            <span>•</span>
            <span className="truncate max-w-md">Chủ đề: {topic}</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight mt-1">
            Duyệt nguồn trước khi viết
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Giảng viên thẩm định độ tin cậy của nguồn. Nguồn bị loại sẽ không được thuật toán AI dùng để sinh hay bảo chứng câu kịch bản.
          </p>
        </div>

        <button
          id="btn-back-to-step1"
          onClick={onGoBack}
          className="self-start sm:self-center px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Sửa yêu cầu</span>
        </button>
      </div>

      {/* Alert banner when any source is excluded (highlighting Source C) */}
      {isSourceCExcluded && (
        <div
          id="excluded-source-c-banner"
          className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm flex items-start gap-3 shadow-xs transition-all"
        >
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Thông báo kiểm duyệt: </span>
            Nguồn C đã bị loại và sẽ không được dùng để tạo hoặc bảo chứng kịch bản. Các câu sử dụng nguồn C sẽ được phát hiện và gắn cảnh báo ở Bước 3 để giảng viên viết lại.
          </div>
        </div>
      )}

      {/* Source Cards List */}
      <div className="grid grid-cols-1 gap-5">
        {sources.map((source) => {
          const isExcluded = source.isExcluded;
          const isHigh = source.reliability === 'high';

          return (
            <div
              key={source.id}
              id={`source-card-${source.id}`}
              className={`rounded-2xl border transition-all duration-200 p-5 sm:p-6 ${
                isExcluded
                  ? 'bg-slate-100/70 border-rose-300 opacity-65'
                  : 'bg-white border-slate-200 shadow-sm hover:border-indigo-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Left details */}
                <div className="space-y-2.5 flex-1">
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md font-bold text-xs ${
                        source.id === 'C'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {source.code}
                    </span>

                    {isHigh ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Độ tin cậy: Cao
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        Độ tin cậy: Thấp
                      </span>
                    )}

                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                        isExcluded
                          ? 'bg-rose-100 text-rose-700 border border-rose-200 font-bold'
                          : source.isAutoApproved
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isExcluded ? 'Đã loại' : source.isAutoApproved ? 'Được duyệt' : 'Chưa duyệt'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className={`text-base sm:text-lg font-heading font-bold ${
                      isExcluded ? 'text-slate-600 line-through' : 'text-slate-900'
                    }`}
                  >
                    {source.name}
                  </h3>

                  {/* Meta details */}
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="font-medium text-slate-700">Tổ chức / Tác giả: {source.org}</span>
                    <span>•</span>
                    {source.year && (
                      <>
                        <span>Năm: {source.year}</span>
                        <span>•</span>
                      </>
                    )}
                    <span className="text-indigo-600 truncate max-w-xs sm:max-w-md">
                      {source.link}
                    </span>
                  </div>

                  {/* Reasoning box */}
                  <div className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100/80 leading-relaxed">
                    <strong className="text-slate-700 font-semibold">Lý do đánh giá: </strong>
                    {source.reason}
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2.5 shrink-0 pt-2 sm:pt-0">
                  <button
                    id={`btn-view-source-${source.id}`}
                    onClick={() => onOpenModal(source.id)}
                    className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors w-full sm:w-36 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem nguồn</span>
                  </button>

                  {source.isAutoApproved && !isExcluded ? (
                    <span className="text-[11px] text-emerald-600 font-medium px-2 py-1 bg-emerald-50 rounded-lg text-center w-full sm:w-36">
                      Đã duyệt tự động
                    </span>
                  ) : (
                    <button
                      id={`btn-toggle-exclude-${source.id}`}
                      onClick={() => onToggleExclude(source.id)}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all w-full sm:w-36 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 ${
                        isExcluded
                          ? 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-300'
                          : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300'
                      }`}
                    >
                      <Slash className="w-3.5 h-3.5" />
                      <span>{isExcluded ? 'Khôi phục nguồn' : 'Loại nguồn'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Source form toggle */}
      {onAddCustomSource && (
        <div>
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 hover:bg-indigo-50 px-4 py-2.5 rounded-xl border border-indigo-200/80 border-dashed transition-colors flex items-center gap-2 cursor-pointer w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm nguồn tài liệu học thuật khác</span>
            </button>
          ) : (
            <form onSubmit={handleCreateCustom} className="bg-white rounded-2xl border border-indigo-200 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-sm text-slate-900">
                  Thêm nguồn học liệu thẩm định
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Hủy bỏ
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Tên tài liệu / bài báo khoa học *"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Tổ chức / Nhà xuất bản / Tác giả"
                  value={customOrg}
                  onChange={(e) => setCustomOrg(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Đường dẫn URL / DOI"
                  value={customLink}
                  onChange={(e) => setCustomLink(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Đoạn trích dẫn chứng quan trọng..."
                  value={customQuote}
                  onChange={(e) => setCustomQuote(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                >
                  Lưu nguồn mới
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Bottom navigation footer */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          * Đề xuất: Giảng viên nên bấm <span className="font-semibold text-rose-600">"Loại nguồn"</span> ở Nguồn C để kiểm tra cơ chế phát hiện &amp; viết lại câu sai lệch ở Bước 3.
        </div>

        <button
          id="btn-generate-script"
          onClick={onProceed}
          className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-200/60 hover:shadow-indigo-300 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Tạo kịch bản từ nguồn đã duyệt</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
