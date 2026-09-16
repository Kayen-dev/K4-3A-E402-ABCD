import React, { useState } from 'react';
import { X, Play, Pause, ChevronRight, ChevronLeft, Type } from 'lucide-react';
import { ScriptSentence } from '../types';

interface TeleprompterModalProps {
  topic: string;
  sentences: ScriptSentence[];
  isSentence3Rewritten: boolean;
  onClose: () => void;
}

export const TeleprompterModal: React.FC<TeleprompterModalProps> = ({
  topic,
  sentences,
  isSentence3Rewritten,
  onClose,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('large');

  const getText = (s: ScriptSentence) => {
    if (s.id === 3 && isSentence3Rewritten && s.rewrittenText) {
      return s.rewrittenText;
    }
    return s.currentText;
  };

  const getFontSizeClass = () => {
    if (fontSize === 'normal') return 'text-xl sm:text-2xl leading-relaxed';
    if (fontSize === 'large') return 'text-2xl sm:text-3xl leading-relaxed';
    return 'text-3xl sm:text-4xl leading-relaxed';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full text-white overflow-hidden flex flex-col h-[520px] shadow-2xl">
        {/* Top bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
              Chế độ tập huấn &amp; Ghi hình giảng viên
            </span>
            <h3 className="font-heading font-bold text-base text-slate-100 truncate max-w-md">
              {topic}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Font size picker */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 rounded cursor-pointer ${fontSize === 'normal' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 rounded font-bold cursor-pointer ${fontSize === 'large' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                A+
              </button>
              <button
                onClick={() => setFontSize('huge')}
                className={`px-2 py-1 rounded font-extrabold cursor-pointer ${fontSize === 'huge' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                A++
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Presentation Stage */}
        <div className="flex-1 p-8 sm:p-12 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/60 mb-6">
            Câu {currentIdx + 1} / {sentences.length}
          </span>

          <p className={`font-heading font-semibold text-slate-100 max-w-2xl transition-all duration-300 ${getFontSizeClass()}`}>
            {getText(sentences[currentIdx])}
          </p>

          <div className="mt-8 text-xs text-slate-400">
            Dẫn chứng: {sentences[currentIdx].sourceIds.map((id) => `Nguồn ${id}`).join(', ')}
          </div>
        </div>

        {/* Bottom controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Câu trước</span>
          </button>

          <div className="flex items-center gap-1.5">
            {sentences.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === currentIdx ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentIdx((prev) => Math.min(sentences.length - 1, prev + 1))}
            disabled={currentIdx === sentences.length - 1}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
          >
            <span>Câu kế tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
