import React, { useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, ExternalLink, BookOpen } from 'lucide-react';
import { SourceItem } from '../types';

interface EvidenceModalProps {
  source: SourceItem | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({ source, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!source) return null;

  const isHigh = source.reliability === 'high';

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      id="evidence-modal-backdrop"
    >
      <div 
        className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
        id="evidence-modal-content"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                source.id === 'C'
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {source.code}
            </span>
            <h3 className="font-heading font-bold text-slate-900 text-base">
              Chi tiết căn cứ học thuật
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-sm">
          {/* Document name & Link */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Tên tài liệu &amp; Đường dẫn nguồn
            </label>
            <p className="font-semibold text-slate-900 text-base">
              {source.name} — {source.org}
            </p>
            <a
              href={`https://${source.link}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-1 break-all font-medium"
            >
              <span>{source.link}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>

          {/* Direct Excerpt */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Đoạn trích dẫn chứng trực tiếp (Căn cứ)
            </label>
            <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-indigo-500 text-slate-700 italic font-serif leading-relaxed text-sm">
              {source.quote}
            </div>
          </div>

          {/* Reliability assessment */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Thẩm định độ tin cậy
            </label>
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                isHigh
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/90 border-rose-200 text-rose-950'
              }`}
            >
              {isHigh ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              )}
              <div>
                <div className="font-bold text-xs">
                  {source.statusText}
                </div>
                <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
                  {source.reason}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer active:scale-95"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
