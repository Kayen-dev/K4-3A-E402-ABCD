import React from 'react';
import { FileText } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onGoToStep1: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onGoToStep1 }) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={onGoToStep1} 
          className="flex items-center space-x-3 cursor-pointer group"
          id="btn-header-home"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-xl tracking-tight text-slate-900">
                ScriptScout
              </span>
              <span className="hidden sm:inline text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs">
                BẢN LÀM VIỆC
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Duyệt nguồn chuẩn giảng viên &amp; Tạo kịch bản có dẫn chứng
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={onReset} className="shrink-0 text-sm text-indigo-700 hover:underline">Các phiên</button>

          <div className="flex items-center space-x-2" id="user-profile-badge">
            <div className="hidden sm:flex w-8 h-8 rounded-full bg-indigo-100 border border-indigo-300 items-center justify-center text-indigo-700 font-bold text-xs shadow-xs">
              GV
            </div>
            <span className="text-xs font-medium text-slate-700 hidden md:inline">
              Giảng viên / Soạn kịch bản
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
