import React from 'react';
import { Pencil, Clock, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { LectureForm } from '../types';
import { sampleTopics } from '../data/defaultData';

interface Step1InputProps {
  form: LectureForm;
  onChange: (field: keyof LectureForm, value: string) => void;
  onSubmit: () => void;
  onSelectPreset: (preset: LectureForm) => void;
}

export const Step1Input: React.FC<Step1InputProps> = ({
  form,
  onChange,
  onSubmit,
  onSelectPreset,
}) => {
  return (
    <div className="space-y-6" id="step-1-container">
      {/* Title & Description */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
          Tạo yêu cầu kịch bản bài giảng
        </h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Điền thông tin bài học mục tiêu để hệ thống đề xuất các nguồn học liệu uy tín cho giảng viên thẩm định trước khi sinh kịch bản.
        </p>

        {/* Quick sample topics for quick switching */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Gợi ý nhanh:
          </span>
          {sampleTopics.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPreset(item)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                form.topic === item.topic
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {item.topic}
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Card */}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="space-y-5">
          {/* CHỦ ĐỀ BÀI GIẢNG */}
          <div>
            <label 
              htmlFor="input-lecture-topic"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Chủ đề bài giảng
            </label>
            <div className="relative">
              <input
                id="input-lecture-topic"
                type="text"
                value={form.topic}
                onChange={(e) => onChange('topic', e.target.value)}
                placeholder="Nhập chủ đề bài giảng..."
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <Pencil className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* MỤC TIÊU BÀI HỌC */}
          <div>
            <label 
              htmlFor="input-lecture-goal"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Mục tiêu bài học
            </label>
            <textarea
              id="input-lecture-goal"
              rows={2}
              value={form.goal}
              onChange={(e) => onChange('goal', e.target.value)}
              placeholder="Ví dụ: Người học nắm được khái niệm và cách ứng dụng thực tế..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          {/* 2-Column Grid: ĐỐI TƯỢNG & THỜI LƯỢNG */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ĐỐI TƯỢNG NGƯỜI HỌC */}
            <div>
              <label 
                htmlFor="input-lecture-audience"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Đối tượng người học
              </label>
              <input
                id="input-lecture-audience"
                type="text"
                value={form.audience}
                onChange={(e) => onChange('audience', e.target.value)}
                placeholder="Ví dụ: Sinh viên năm 1, người mới..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* THỜI LƯỢNG VIDEO DỰ KIẾN */}
            <div>
              <label 
                htmlFor="input-lecture-duration"
                className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Thời lượng video dự kiến
              </label>
              <div className="relative">
                <input
                  id="input-lecture-duration"
                  type="text"
                  value={form.duration}
                  onChange={(e) => onChange('duration', e.target.value)}
                  placeholder="Ví dụ: 5 phút, 10 phút..."
                  className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Chế độ duyệt học thuật kích hoạt</span>
          </div>

          <button
            id="btn-search-sources"
            type="button"
            onClick={onSubmit}
            className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-200/60 hover:shadow-indigo-300 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Tìm nguồn</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Helper info pill */}
      <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
        <span>Hệ thống tự động tra cứu danh mục tài liệu tiêu chuẩn, tài liệu học thuật và giáo trình mở</span>
      </div>
    </div>
  );
};
