import React from "react";
import { FileText, Home, LogOut } from "lucide-react";

interface HeaderProps {
  onReset: () => void;
  onGoToStep1: () => void;
  userEmail: string;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onGoToStep1, userEmail, onLogout }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 shadow-xs backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          onClick={onGoToStep1}
          className="group flex items-center gap-3 text-left"
          id="btn-header-home"
        >
          <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-950 via-indigo-700 to-sky-500 text-white shadow-md shadow-indigo-200 transition-transform group-hover:scale-105">
            <FileText className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-xl font-black tracking-tight text-slate-950">
                ScriptScout
              </span>
              <span className="hidden rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-indigo-700 sm:inline">
                Studio
              </span>
            </div>
            <p className="hidden text-xs font-medium text-slate-500 sm:block">
              Research nguồn · Viết kịch bản · Duyệt bằng chứng
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onReset}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Home className="size-4" />
            <span className="hidden sm:inline">Trang chính</span>
          </button>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm md:flex">
            <span className="flex size-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
              GV
            </span>
            {userEmail}
          </div>
          <button onClick={onLogout} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"><LogOut className="size-4" /><span className="hidden sm:inline">Đăng xuất</span></button>
        </div>
      </div>
    </header>
  );
};
