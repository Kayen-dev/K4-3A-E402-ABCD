import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Header } from "./components/Header";
import { LoginScreen, StudentPortal, TeacherFeedbackPanel } from "./components/RolePortal";
import { Toast } from "./components/Toast";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  projectAction,
  getSession,
  login as loginAccount,
  logout as logoutAccount,
  type Finding,
  type Project,
  type User,
  type Source,
  type ResearchMedia,
  type Summary,
} from "./api";

const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950";
const primary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
const secondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
const input =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100";
const card = "rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm";

type BusyKind =
  | "research"
  | "add-source"
  | "generate"
  | "review"
  | "rewrite"
  | "save"
  | null;

type BriefForm = {
  topic: string;
  goal: string;
  audience: string;
  duration: string;
};

const categoryLabel: Record<string, string> = {
  "xung-ho": "Xưng hô chưa thống nhất",
  "cau-dai": "Câu quá dài",
  "lap-filler": "Lặp từ hoặc từ đệm",
  translationese: "Cách diễn đạt gượng",
  "sai-nghia": "Có thể sai nghĩa",
  "sai-sac-thai": "Sắc thái chưa phù hợp",
  register: "Giọng văn chưa phù hợp",
  "thieu-can-cu": "Chưa đủ căn cứ",
  "pronunciation-only": "Chỉ ảnh hưởng cách đọc",
  "gop-y-da-duyet": "Theo góp ý đã duyệt",
};

function canUseSource(source: Source) {
  if (["dung", "dung-canh-bao"].includes(source.trang_thai)) return true;
  const scores = source.diem_tieu_chi;
  return source.trang_thai === "loai" && scores?.[0] === 0 &&
    scores[3] === 1 && scores[4] === 1 && !!source.snapshot &&
    !source.cach_ly?.length;
}

function speechChunks(text: string): string[] {
  const chunks: string[] = [];
  let chunk = "";
  for (const word of text.trim().split(/\s+/)) {
    if (chunk && `${chunk} ${word}`.length > 180) {
      chunks.push(chunk);
      chunk = word;
    } else {
      chunk = chunk ? `${chunk} ${word}` : word;
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}

function statusLabel(source: Source) {
  if (source.trang_thai === "dung" || source.trang_thai === "dung-canh-bao") {
    return "Có thể dùng";
  }
  if (source.trang_thai === "khong-doc-duoc") return "Không đọc được";
  if (canUseSource(source)) return "Cần tự kiểm tra";
  if (source.trang_thai === "loai") return "Không nên dùng";
  return "Chưa đánh giá được";
}

function statusTone(source: Source) {
  if (source.trang_thai === "dung" || source.trang_thai === "dung-canh-bao") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (canUseSource(source)) return "border-amber-200 bg-amber-50 text-amber-800";
  if (source.trang_thai === "khong-doc-duoc" || source.trang_thai === "loai") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function download(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function exportMarkdown(project: Project) {
  return [
    `# ${project.brief.topic || "Kịch bản"}`,
    "",
    ...project.sentences.flatMap(sentence => [
      `## Cảnh ${sentence.scene}`,
      "",
      `Lời đọc: ${sentence.text}`,
      "",
    ]),
    "## Ngữ cảnh",
    "",
    ...(project.scriptContext ? [project.scriptContext] : [
      `Chủ đề: ${project.brief.topic}`,
      `Mục tiêu học xong: ${project.brief.goal}`,
      `Người học: ${project.brief.audience}`,
      "",
      ...project.sources.filter(source => source.approved).flatMap(source => [
        `### ${source.meta?.tieu_de || source.url}`,
        `Link tham khảo: ${source.url}`,
        ...(source.trich_dan || []).map(quote => `Đoạn căn cứ: ${quote}`),
        "",
      ]),
    ]),
  ].join("\n");
}

function ProgressPill({
  active,
  done,
  label,
}: {
  active?: boolean;
  done?: boolean;
  label: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
        done
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : active
            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
            : "border-slate-200 bg-white text-slate-500"
      }`}
    >
      <span
        className={`flex size-5 items-center justify-center rounded-full ${
          done
            ? "bg-emerald-600 text-white"
            : active
              ? "bg-indigo-600 text-white"
              : "bg-slate-100 text-slate-500"
        }`}
      >
        {done ? (
          <Check className="size-3" />
        ) : active ? (
          <Loader2 className="size-3 animate-spin" />
        ) : null}
      </span>
      {label}
    </div>
  );
}

function LoadingPanel({
  busy,
  kind,
  message,
  log,
}: {
  busy: boolean;
  kind: BusyKind;
  message: string;
  log: string[];
}) {
  if (!busy) return null;
  const title =
    kind === "generate"
      ? "Đang viết kịch bản từ tài liệu đã chọn"
      : kind === "review"
        ? "Đang rà soát kịch bản"
        : kind === "rewrite"
          ? "Đang viết lại phần bị ảnh hưởng"
          : kind === "research" || kind === "add-source"
            ? "Đang research và đọc tài liệu"
            : "Đang lưu thay đổi";
  return (
    <section
      role="status"
      aria-live="polite"
      className="overflow-hidden rounded-[1.75rem] border border-indigo-200 bg-white shadow-sm"
    >
      <div className="flex flex-col gap-4 bg-gradient-to-r from-indigo-50 via-sky-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
            <Loader2 className="size-5 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-950">{title}</p>
            <p className="mt-1 text-sm text-slate-600">
              {message ||
                "Hệ thống đang xử lý. Bạn có thể theo dõi từng bước bên dưới."}
            </p>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white sm:w-48">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-indigo-600" />
        </div>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <ProgressPill
          active={kind === "research" || kind === "add-source"}
          done={kind !== "research" && kind !== "add-source"}
          label="Tìm nguồn"
        />
        <ProgressPill
          active={kind === "research" || kind === "add-source"}
          done={kind === "generate" || kind === "review" || kind === "rewrite"}
          label="Đọc & chấm nguồn"
        />
        <ProgressPill
          active={kind === "generate" || kind === "review" || kind === "rewrite"}
          label="Tạo kết quả"
        />
      </div>
      {log.length > 0 && (
        <div className="border-t border-slate-100 px-5 pb-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Tiến trình vừa nhận
          </p>
          <ol className="space-y-2 text-sm text-slate-600">
            {log.slice(-5).map((item, index) => (
              <li key={`${item}-${index}`} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-indigo-500" />
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function LandingPage({
  mode,
  setMode,
}: {
  mode: "research" | "qa";
  setMode: (mode: "research" | "qa") => void;
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-8 bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_32%),linear-gradient(135deg,#ffffff,#f8fafc)] p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-indigo-700 shadow-sm">
            <Sparkles className="size-4" /> ScriptScout
          </div>
          <h1 className="font-heading text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Viết kịch bản bài giảng có nguồn, dễ duyệt, ít ảo tưởng.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Nhập bài học, để hệ thống research tài liệu, chọn nguồn đáng tin,
            rồi tạo kịch bản có dẫn chứng theo từng câu. Giảng viên có thể xem
            lại nguồn, sửa câu và tải hồ sơ kiểm chứng.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className={button}
              onClick={() =>
                document
                  .getElementById("start")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              Bắt đầu soạn bài <ArrowRight className="size-4" />
            </button>
            <button className={secondary} onClick={() => setMode("qa")}>
              Rà soát kịch bản có sẵn
            </button>
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-4 shadow-xl shadow-slate-900/10 backdrop-blur">
          <div className="rounded-[1.4rem] border border-slate-200 bg-slate-950 p-4 text-white">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm font-semibold">Luồng làm việc</span>
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                Live research
              </span>
            </div>
            {[
              ["01", "Nhập bài học", "Chủ đề, mục tiêu, người học, thời lượng"],
              ["02", "Research tài liệu", "Theo dõi đã đọc đến đâu, thêm URL nếu cần"],
              ["03", "Chọn nguồn", "Tick tài liệu dùng để viết kịch bản"],
              ["04", "Duyệt kết quả", "Rà soát, sửa câu, tải markdown"],
            ].map(([n, title, desc]) => (
              <div
                key={n}
                className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3 last:mb-0"
              >
                <div className="flex gap-3">
                  <span className="font-mono text-xs text-indigo-200">{n}</span>
                  <div>
                    <p className="text-sm font-bold">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-300">
                      {desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4 border-t border-slate-100 p-5 sm:grid-cols-3">
        <button
          className={`rounded-3xl border p-4 text-left transition ${
            mode === "research"
              ? "border-indigo-300 bg-indigo-50 ring-4 ring-indigo-100"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
          onClick={() => setMode("research")}
        >
          <BookOpen className="mb-3 size-5 text-indigo-600" />
          <strong>Tìm nguồn và viết</strong>
          <p className="mt-1 text-sm text-slate-600">
            Phù hợp khi chưa có kịch bản.
          </p>
        </button>
        <button
          className={`rounded-3xl border p-4 text-left transition ${
            mode === "qa"
              ? "border-indigo-300 bg-indigo-50 ring-4 ring-indigo-100"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
          onClick={() => setMode("qa")}
        >
          <FileCheck className="mb-3 size-5 text-indigo-600" />
          <strong>Rà soát bản có sẵn</strong>
          <p className="mt-1 text-sm text-slate-600">
            Dán lời đọc để kiểm tra văn nói.
          </p>
        </button>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <ClipboardCheck className="mb-3 size-5 text-slate-700" />
          <strong>Xuất hồ sơ nguồn</strong>
          <p className="mt-1 text-sm text-slate-600">
            Tải markdown và audit JSON sau khi duyệt.
          </p>
        </div>
      </div>
    </section>
  );
}

function LessonForm({
  mode,
  brief,
  script,
  busy,
  briefReady,
  setBrief,
  setScript,
  onSubmit,
}: {
  mode: "research" | "qa";
  brief: BriefForm;
  script: string;
  busy: boolean;
  briefReady: boolean;
  setBrief: (brief: BriefForm) => void;
  setScript: (script: string) => void;
  onSubmit: () => void;
}) {
  const [importError, setImportError] = useState("");
  return (
    <section
      id="start"
      className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            Bước 1
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            {mode === "research"
              ? "Nhập bài học"
              : "Dán kịch bản cần rà soát"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {mode === "research"
              ? "Càng rõ mục tiêu và người học, tài liệu tìm được càng sát với bài giảng."
              : "Mỗi dòng nên là một câu hoặc một cảnh để góp ý dễ đọc hơn."}
          </p>
        </div>
        {mode === "research" && (
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span className="font-bold text-slate-900">
              {briefReady ? "Đã đủ thông tin" : "Còn thiếu thông tin"}
            </span>
            <br />
            Cần chủ đề, mục tiêu, người học và 1–120 phút.
          </div>
        )}
      </div>
      {mode === "research" ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <label className="lg:col-span-2">
            <span className="mb-2 block text-sm font-bold text-slate-800">
              Chủ đề bài học
            </span>
            <input
              className={input}
              value={brief.topic}
              required
              maxLength={300}
              placeholder="Ví dụ: Kỹ năng phản hồi trong lớp học trực tuyến"
              onChange={(event) =>
                setBrief({ ...brief, topic: event.target.value })
              }
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-bold text-slate-800">
              Mục tiêu học xong
            </span>
            <textarea
              className={`${input} min-h-32`}
              value={brief.goal}
              required
              maxLength={2000}
              placeholder="Sau bài học, người học có thể..."
              onChange={(event) =>
                setBrief({ ...brief, goal: event.target.value })
              }
            />
          </label>
          <div className="grid gap-4">
            <label>
              <span className="mb-2 block text-sm font-bold text-slate-800">
                Người học
              </span>
              <input
                className={input}
                value={brief.audience}
                required
                maxLength={300}
                placeholder="Ví dụ: Sinh viên năm 2, giáo viên mới..."
                onChange={(event) =>
                  setBrief({ ...brief, audience: event.target.value })
                }
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold text-slate-800">
                Thời lượng
              </span>
              <div className="relative">
                <input
                  className={`${input} pr-16`}
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={brief.duration}
                  onChange={(event) =>
                    setBrief({ ...brief, duration: event.target.value })
                  }
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  phút
                </span>
              </div>
            </label>
          </div>
        </div>
      ) : (
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-800">
            Lời đọc / kịch bản
          </span>
          <span className="mb-3 flex flex-wrap items-center gap-3">
            <span className={`${secondary} cursor-pointer`}>
              Nhập file .md
              <input
                className="sr-only"
                type="file"
                accept=".md,.markdown,text/markdown"
                disabled={busy}
                onChange={async event => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  setImportError("");
                  try {
                    if (!/\.(md|markdown)$/i.test(file.name) || file.size > 120000) throw new Error("Chọn file Markdown tối đa 120 KB.");
                    const text = await file.text();
                    if (!text.trim() || text.length > 30000) throw new Error("Kịch bản phải có nội dung và tối đa 30.000 ký tự.");
                    setScript(text);
                  } catch (error) {
                    setImportError(error instanceof Error ? error.message : "Không đọc được file.");
                  }
                }}
              />
            </span>
            <span className="text-xs text-slate-500">Nhập file hoặc dán lời đọc. Feedback đã duyệt được dùng khi rà soát.</span>
          </span>
          {importError && <span role="alert" className="mb-2 block text-sm text-red-600">{importError}</span>}
          <textarea
            className={`${input} min-h-72`}
            value={script}
            maxLength={30000}
            placeholder="Dán kịch bản tại đây..."
            onChange={(event) => setScript(event.target.value)}
          />
        </label>
      )}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          className={primary}
          disabled={busy || (mode === "research" ? !briefReady : !script.trim())}
          title={
            mode === "research" && !briefReady
              ? "Điền đủ chủ đề, mục tiêu, người học và thời lượng từ 1 đến 120 phút"
              : ""
          }
          onClick={onSubmit}
        >
          {mode === "research" ? (
            <Search className="size-4" />
          ) : (
            <FileCheck className="size-4" />
          )}
          {mode === "research" ? "Tìm tài liệu" : "Xem góp ý"}
        </button>
        <p className="text-sm text-slate-500">
          {mode === "research"
            ? "Sau khi tìm xong, bạn sẽ chọn tài liệu dùng để viết kịch bản."
            : "Kết quả sẽ hiển thị theo từng câu để bạn duyệt nhanh."}
        </p>
      </div>
    </section>
  );
}

function ProjectsList({
  projects,
  open,
  remove,
}: {
  projects: Summary[];
  open: (id: string) => void;
  remove: (id: string) => void;
}) {
  const pageSize = 5;
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(projects.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  useEffect(() => {
    setPage(previous => Math.min(previous, pageCount));
  }, [pageCount]);
  const start = (currentPage - 1) * pageSize;
  const visibleProjects = projects.slice(start, start + pageSize);
  return (
    <section className={`${card} min-w-0 self-start`}>
      <h2 className="font-bold text-slate-950">Mở lại phiên làm việc</h2>
      <p className="mt-1 text-sm text-slate-500">
        Tiếp tục từ phiên đã lưu trên máy chủ.
      </p>
      {projects.length ? (
        <ul className="mt-4 divide-y divide-slate-100">
          {visibleProjects.map((project) => (
            <li
              key={project.id}
              className="flex min-h-16 items-center justify-between gap-3 py-2"
            >
              <button className="min-w-0 flex-1 text-left focus-visible:outline-indigo-600" title={project.title} onClick={() => open(project.id)}>
                <span className="block truncate font-semibold text-slate-800">
                  {project.title}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {new Date(project.updatedAt).toLocaleString("vi-VN")} · v
                  {project.revision}
                </span>
              </button>
              <button
                className="min-h-11 shrink-0 px-2 text-sm font-semibold text-rose-600 hover:underline focus-visible:outline-indigo-600"
                aria-label={`Xóa phiên ${project.title}`}
                onClick={() => remove(project.id)}
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          Chưa có phiên nào. Tạo bài học mới để bắt đầu.
        </div>
      )}
      {projects.length > pageSize && (
        <nav aria-label="Phân trang phiên làm việc" className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <p aria-live="polite" className="text-xs text-slate-500">
            {start + 1}–{Math.min(start + pageSize, projects.length)} / {projects.length} phiên · Trang {currentPage}/{pageCount}
          </p>
          <div className="flex gap-2">
            <button type="button" className={`${secondary} min-h-11`} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Trang phiên trước">Trước</button>
            <button type="button" className={`${secondary} min-h-11`} disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Trang phiên tiếp theo">Sau</button>
          </div>
        </nav>
      )}
    </section>
  );
}

function SourceMediaPreview({ media, index }: { media: ResearchMedia; index: number }) {
  const [failed, setFailed] = useState(false);
  return <figure className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
    {media.kind === 'image' && !failed ? <a href={media.url} target="_blank" rel="noopener noreferrer" aria-label={`Mở ảnh gốc ${index + 1}`} className="block focus-visible:outline-2 focus-visible:outline-indigo-600">
      <img src={media.url} alt={`Ảnh ${index + 1} từ tài liệu`} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-48 w-full object-contain p-2" />
    </a> : <div className="flex h-48 items-center justify-center p-4 text-center text-sm text-slate-500">{failed ? 'Không tải được ảnh xem trước. Bạn có thể mở ảnh gốc bên dưới.' : 'Video tham khảo · mở link để xem'}</div>}
    <figcaption className="border-t border-slate-200 bg-white p-3">
      <a className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-indigo-700 underline" href={media.url} target="_blank" rel="noopener noreferrer">{media.kind === 'image' ? 'Mở ảnh gốc' : 'Mở video'} {index + 1}<ExternalLink className="size-4" /></a>
    </figcaption>
  </figure>;
}

function ResearchPanel({
  project,
  selected,
  setSelected,
  busy: requestBusy,
  message,
  progressLog,
  researchOpen,
  setResearchOpen,
  url,
  setUrl,
  run,
  viewSource,
}: {
  project: Project;
  selected: string[];
  setSelected: (ids: string[]) => void;
  busy: boolean;
  message: string;
  progressLog: string[];
  researchOpen: boolean;
  setResearchOpen: (open: boolean) => void;
  url: string;
  setUrl: (url: string) => void;
  run: (
    action: string,
    extra?: object,
    kind?: BusyKind,
    baseProject?: Project,
  ) => Promise<Project | null>;
  viewSource: (id: string) => void;
}) {
  const [writingPhase, setWritingPhase] = useState<'saving' | 'generating' | null>(null);
  const writingLock = useRef(false);
  const busy = requestBusy || writingPhase !== null;
  const usable = project.sources.filter(canUseSource).length;
  const readCount = project.sources.filter((source) => !!source.snapshot?.trim() && source.trang_thai !== 'khong-doc-duoc').length;
  const checkedUsable = selected.filter((id) =>
    project.sources.some((source) => source.nguon_id === id && canUseSource(source)),
  ).length;

  const toggle = (source: Source) => {
    if (!canUseSource(source)) return;
    setSelected(
      selected.includes(source.nguon_id)
        ? selected.filter((id) => id !== source.nguon_id)
        : [...selected, source.nguon_id],
    );
  };

  async function writeScript() {
    if (busy || writingLock.current || checkedUsable === 0) return;
    writingLock.current = true;
    setWritingPhase('saving');
    try {
      const approvedProject = await run("approve-sources", { sourceIds: selected }, "save");
      if (approvedProject) {
        setWritingPhase('generating');
        await run("generate", {}, "generate", approvedProject);
      }
    } finally {
      writingLock.current = false;
      setWritingPhase(null);
    }
  }

  return (
    <section className="min-w-0 space-y-4">
      <div className="rounded-[2rem] border border-indigo-100 bg-white shadow-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-4 p-5 text-left"
          onClick={() => setResearchOpen(!researchOpen)}
          aria-expanded={researchOpen}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              Bước 2 · Research
            </p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">
              Đã đọc {readCount}/{Math.max(project.sources.length, readCount, 1)} tài
              liệu
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Chọn tài liệu dùng để viết kịch bản. Có thể mở panel để xem hệ
              thống đang đọc đến đâu hoặc thêm tài liệu mới.
            </p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
            {researchOpen ? (
              <ChevronUp className="size-5" />
            ) : (
              <ChevronDown className="size-5" />
            )}
          </span>
        </button>
        {researchOpen && (
          <div className="border-t border-slate-100 p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <ProgressPill
                done={project.sources.length > 0}
                active={busy && project.sources.length === 0}
                label="Tìm danh sách URL"
              />
              <ProgressPill
                done={readCount > 0}
                active={busy}
                label={`Đọc ${readCount}/${Math.max(project.sources.length, 1)}`}
              />
              <ProgressPill
                done={usable > 0}
                active={busy && usable === 0}
                label={`${usable} nguồn dùng được`}
              />
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-800">Nhật ký research</p>
              <ol className="mt-3 space-y-2 text-sm text-slate-600">
                {(progressLog.length
                  ? progressLog
                  : [
                      message ||
                        "Chưa có tiến trình mới. Bấm tìm thêm hoặc thêm URL để research tiếp.",
                    ]
                )
                  .slice(-6)
                  .map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-indigo-500" />
                      <span>{item}</span>
                    </li>
                  ))}
              </ol>
            </div>
            <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-slate-700">
              <p className="font-bold text-slate-950">Phạm vi tìm tài liệu</p>
              <p className="mt-2 break-words"><strong>Chủ đề bài học · trọng tâm:</strong> {project.brief.topic}</p>
              <p className="mt-1 whitespace-pre-wrap break-words"><strong>Mục tiêu học xong · ngữ cảnh bổ sung:</strong> {project.brief.goal}</p>
              {!!project.researchQueries?.length && <details className="mt-3">
                <summary className="cursor-pointer font-semibold text-indigo-700">Xem {project.researchQueries.length} truy vấn đã tìm</summary>
                <ul className="mt-2 list-disc space-y-1 pl-5">{project.researchQueries.map(query => <li key={query} className="break-words">{query}</li>)}</ul>
              </details>}
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
              <label>
                <span className="mb-2 block text-sm font-bold text-slate-800">
                  Thêm URL tài liệu
                </span>
                <input
                  className={input}
                  value={url}
                  placeholder="https://..."
                  onChange={(event) => setUrl(event.target.value)}
                />
              </label>
              <button
                className={`${secondary} self-end`}
                disabled={busy || !url.trim()}
                onClick={() =>
                  run("add-source", { url }, "add-source").then(() => setUrl(""))
                }
              >
                <Plus className="size-4" /> Đọc URL này
              </button>
              <button
                className={`${secondary} self-end`}
                disabled={busy}
                onClick={() => run("research", {}, "research")}
              >
                <RefreshCw className="size-4" /> Tìm thêm tự động
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-3">
          {project.sources.length ? (
            [...project.sources].sort((a, b) =>
              Number(!!b.snapshot?.trim() && b.trang_thai !== 'khong-doc-duoc') - Number(!!a.snapshot?.trim() && a.trang_thai !== 'khong-doc-duoc')
              || Number(!!b.trich_dan?.length) - Number(!!a.trich_dan?.length)
            ).map((source, index) => {
              const isUsable = canUseSource(source);
              const isSelected = selected.includes(source.nguon_id) && isUsable;
              return (
                <article
                  key={source.nguon_id}
                  className={`min-w-0 rounded-[1.5rem] border bg-white p-4 shadow-sm transition ${
                    isSelected
                      ? "border-indigo-300 ring-4 ring-indigo-50"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <label
                      className={`flex flex-1 gap-3 ${
                        isUsable ? "cursor-pointer" : "cursor-not-allowed opacity-80"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 size-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={isSelected}
                        disabled={!isUsable || busy}
                        onChange={() => toggle(source)}
                      />
                      <span className="min-w-0">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                          Tài liệu {index + 1}
                        </span>
                        <strong className="block break-words text-slate-950">
                          {source.meta?.tieu_de || source.url}
                        </strong>
                        <span className="mt-1 block break-all text-sm text-slate-500">
                          {source.url}
                        </span>
                      </span>
                    </label>
                    <span
                      className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${statusTone(source)}`}
                    >
                      {statusLabel(source)}
                    </span>
                  </div>
                  <p className="mt-3 break-words text-sm leading-6 text-slate-600">
                    {source.ly_do || "Chưa có ghi chú đánh giá nguồn."}
                  </p>
                  {source.snapshot && source.trang_thai !== 'khong-doc-duoc' && <p className="mt-2 line-clamp-3 break-words text-sm leading-6 text-slate-600">{source.snapshot.slice(0, 350)}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      className={secondary}
                      onClick={() => viewSource(source.nguon_id)}
                    >
                      <FileText className="size-4" /> Xem đoạn đã đọc
                    </button>
                    {source.trich_dan?.length ? (
                      <span className="text-xs font-semibold text-slate-500">
                        {source.trich_dan.length} đoạn trích có thể dùng
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700">
                        Chưa có đoạn làm căn cứ {isUsable ? '· vẫn có thể chọn' : ''}
                      </span>
                    )}
                    {!!source.snapshot && source.trang_thai !== 'khong-doc-duoc' && <span className="text-xs font-semibold text-emerald-700">Đã lấy nội dung · {source.snapshot.length.toLocaleString('vi-VN')} ký tự</span>}
                    {!!source.media?.length && <span className="text-xs font-semibold text-indigo-700">{source.media.length} ảnh/video tham khảo</span>}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              Chưa có tài liệu. Bấm "Tìm tài liệu" hoặc thêm URL để bắt đầu
              research.
            </div>
          )}
        </div>
        <aside className="h-fit rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            Nguồn được chọn
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {checkedUsable}/{usable}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Kịch bản dựa vào nội dung các nguồn đã chọn và mục tiêu học xong.
            Nguồn có nội dung được xếp trước; mỗi thông tin cần đoạn làm căn cứ để kiểm chứng.
          </p>
          {writingPhase ? <div role="status" aria-live="polite" className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-800">
              <Loader2 className="size-5 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              {writingPhase === 'saving' ? 'Đang lưu nguồn đã chọn…' : 'Đang viết kịch bản…'}
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-600">{writingPhase === 'generating' && message ? message : 'Đang chuẩn bị nội dung từ các tài liệu bạn đã chọn.'}</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">Kịch bản sẽ tự mở khi hoàn tất.</p>
          </div> : <button
            className={`${primary} mt-5 w-full`}
            disabled={busy || checkedUsable === 0}
            onClick={writeScript}
          >
            <Sparkles className="size-4" /> Viết kịch bản
          </button>}
          {checkedUsable === 0 && (
            <p className="mt-3 text-xs text-amber-700">
              Chọn ít nhất một tài liệu có thể dùng.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

function TeacherApp({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Summary[]>([]);
  const [mode, setMode] = useState<"research" | "qa">("research");
  const [step, setStep] = useState(1);
  const [findingEdits, setFindingEdits] = useState<Record<string, string>>({});
  const [brief, setBrief] = useState<BriefForm>({
    topic: "",
    goal: "",
    audience: "",
    duration: "5",
  });
  const [script, setScript] = useState("");
  const [url, setUrl] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [source, setSource] = useState<Source | null>(null);
  const [focusQuote, setFocusQuote] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyKind, setBusyKind] = useState<BusyKind>(null);
  const [message, setMessage] = useState("");
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [researchOpen, setResearchOpen] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [teleprompter, setTeleprompter] = useState(false);
  const [spoken, setSpoken] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const speechRun = useRef(0);
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const vietnameseVoice = useRef<SpeechSynthesisVoice | null>(null);

  const briefReady =
    !!brief.topic.trim() &&
    !!brief.goal.trim() &&
    !!brief.audience.trim() &&
    Number(brief.duration) >= 1 &&
    Number(brief.duration) <= 120;
  const affected =
    project?.sentences.filter((sentence) => sentence.needsRewrite).length || 0;
  const unverified =
    project?.sentences.filter((sentence) => sentence.needsVerification).length ||
    0;
  const pending = project?.findings.filter((finding) => !finding.decision).length || 0;
  const canApprove =
    project?.mode === 'qa'
      ? !!project.sentences.length && ['complete', 'stale', 'partial'].includes(project.reviewStatus) && !pending
      : project?.reviewStatus === "complete" &&
    !affected &&
    !unverified &&
    !project.findings.some(
      (finding) =>
        (finding.category === "thieu-can-cu" &&
          finding.decision !== "accepted") ||
        (finding.severity === "cao" && !finding.decision),
    );

  const qualityStats = useMemo(() => {
    if (!project) return null;
    return {
      approved: project.sources.filter((source) => source.approved).length,
      evidence: project.sources.flatMap((source) => source.evidence || []).length,
      sentences: project.sentences.length,
    };
  }, [project]);

  useEffect(() => {
    listProjects().then(setProjects).catch(() => {});
  }, []);

  useEffect(() => {
    if (!teleprompter || !("speechSynthesis" in window)) return;
    const updateVoices = () => {
      vietnameseVoice.current = window.speechSynthesis.getVoices()
        .find((voice) => voice.lang.toLowerCase().startsWith("vi")) || null;
    };
    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
  }, [teleprompter]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSource(null);
        setTeleprompter(false);
        speechRun.current++;
        window.speechSynthesis?.cancel();
        currentUtterance.current = null;
        setSpoken(false);
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);

  useEffect(() => {
    if (!source && !teleprompter) return;
    const before = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    dialog?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialog) return;
      const elements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, textarea, [tabindex="0"]',
        ),
      );
      if (!elements.length) {
        event.preventDefault();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      document.body.style.overflow = oldOverflow;
      before?.focus();
    };
  }, [source, teleprompter]);

  useEffect(() => {
    if (!project) return;
    setSelected(project.sources.filter((source) => source.approved).map((source) => source.nguon_id));
    setStep(project.sentences.length ? 3 : project.sources.length ? 2 : 1);
  }, [project?.id]);

  const notify = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 3500);
  };
  const refreshList = () => listProjects().then(setProjects).catch(() => {});
  const onProgress = (text: string) => {
    if (!text) return;
    setMessage(text);
    setProgressLog((items) =>
      items.at(-1) === text ? items : [...items, text].slice(-20),
    );
  };

  async function run(
    action: string,
    extra: object = {},
    kind: BusyKind = null,
    baseProject: Project | null = project,
  ): Promise<Project | null> {
    if (!baseProject || busy) return null;
    setBusy(true);
    setBusyKind(kind || (action as BusyKind));
    setError("");
    onProgress(action === "generate" ? "Đang chuẩn bị nguồn đã chọn..." : "Đang xử lý...");
    try {
      const nextProject = await projectAction(baseProject, action, extra, onProgress);
      setProject(nextProject);
      setSelected(nextProject.sources.filter((s) => s.approved).map((s) => s.nguon_id));
      if (action === "generate" || action === "rewrite" || action === "review") { setStep(3); setFindingEdits({}); }
      refreshList();
      notify(action === "generate" ? "Đã tạo kịch bản nháp." : "Đã lưu kết quả.");
      return nextProject;
    } catch (err) {
      setError((err as Error).message);
      const latest = await getProject(baseProject.id).catch(() => null);
      if (latest) setProject(latest);
      return null;
    } finally {
      setBusy(false);
      setBusyKind(null);
      setMessage("");
    }
  }

  async function start() {
    setBusy(true);
    setBusyKind(mode === "research" ? "research" : "review");
    setError("");
    setProgressLog([]);
    onProgress(
      mode === "research"
        ? "Đang kiểm tra nội dung bài học và chuẩn bị tìm tài liệu..."
        : "Đang tạo phiên rà soát...",
    );
    try {
      const newProject = await createProject(
        mode === "research"
          ? { mode, brief: { ...brief, duration: Number(brief.duration) } }
          : { mode, script },
      );
      setProject(newProject);
      setStep(2);
      refreshList();
      const updated = await projectAction(
        newProject,
        mode === "research" ? "research" : "review",
        {},
        onProgress,
      );
      setProject(updated);
      if (mode === "research") {
        setResearchOpen(true);
        notify("Đã tìm và đọc tài liệu. Chọn nguồn để viết.");
      } else {
        setStep(3);
        setFindingEdits({});
        notify("Đã rà soát kịch bản.");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      setBusyKind(null);
      setMessage("");
    }
  }

  async function open(id: string) {
    try {
      setError("");
      setProject(await getProject(id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Xóa phiên này và toàn bộ dữ liệu đã lưu?")) return;
    try {
      await deleteProject(id);
      if (project?.id === id) setProject(null);
      refreshList();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function viewSource(id: string) {
    const match = project?.sources
      .flatMap((source) =>
        (source.evidence || [])
          .filter((evidence) => evidence.id === id)
          .map((evidence) => ({ source, quote: evidence.quote })),
      )
      .at(0);
    const found = match?.source || project?.sources.find((item) => item.nguon_id === id);
    if (found) {
      setFocusQuote(match?.quote || null);
      setSource(found);
    }
  }

  function stopReading() {
    speechRun.current++;
    window.speechSynthesis?.cancel();
    currentUtterance.current = null;
    setSpoken(false);
  }

  function readAloud() {
    if (!project?.sentences.length) return;
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setSpeechError("Trình duyệt này chưa hỗ trợ đọc thành tiếng.");
      return;
    }
    stopReading();
    setSpeechError("");
    const chunks = project.sentences.flatMap((sentence) => speechChunks(sentence.text));
    const run = ++speechRun.current;
    let index = 0;
    const speakNext = () => {
      if (run !== speechRun.current) return;
      if (index >= chunks.length) {
        currentUtterance.current = null;
        setSpoken(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(chunks[index++]);
      const voice = vietnameseVoice.current || window.speechSynthesis.getVoices()
        .find((item) => item.lang.toLowerCase().startsWith("vi"));
      if (voice) utterance.voice = voice;
      utterance.lang = "vi-VN";
      utterance.rate = 0.95;
      utterance.onstart = () => { if (run === speechRun.current) setSpoken(true); };
      utterance.onend = () => { if (run === speechRun.current) speakNext(); };
      utterance.onerror = () => {
        if (run !== speechRun.current) return;
        currentUtterance.current = null;
        setSpoken(false);
        setSpeechError("Không phát được giọng đọc. Hãy kiểm tra âm lượng hoặc giọng tiếng Việt trên thiết bị.");
      };
      currentUtterance.current = utterance;
      window.speechSynthesis.speak(utterance);
    };
    window.speechSynthesis.resume();
    setSpoken(true);
    speakNext();
  }

  function findingView(finding: Finding) {
    const sentence = project?.sentences.find((item) => item.id === finding.sentenceId);
    return (
      <article key={finding.id} className={`${card} space-y-3`}>
        <div className="flex flex-wrap items-center gap-2">
          <strong>{categoryLabel[finding.category] || "Góp ý"}</strong>
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
            Mức độ: {finding.severity}
          </span>
          <span className="text-xs text-slate-500">Câu {sentence?.scene}</span>
        </div>
        <p><span className="font-semibold">Đoạn nào:</span> {finding.quote || sentence?.text}</p>
        {finding.feedbackTitle && <p className="text-sm text-indigo-700"><span className="font-semibold">Góp ý đã duyệt:</span> {finding.feedbackTitle}</p>}
        <p><span className="font-semibold">Vì sao:</span> {finding.reason}</p>
        <p><span className="font-semibold">Sửa thành gì:</span> {finding.suggestion || "Cần tự kiểm tra"}</p>
        {finding.replacement && (
          <p className="rounded-2xl bg-indigo-50 p-3 text-sm leading-6 text-indigo-950">
            Trước: {finding.quote}<br />Sau: {finding.replacement}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {finding.decision ? (
            <>
              <span className="py-2 text-sm font-semibold text-slate-600">
                {finding.decision === "accepted" ? "Đã chấp nhận" : "Đã giữ nguyên"}
              </span>
              <button
                className={secondary}
                disabled={busy}
                onClick={() => run("decision", { findingId: finding.id, decision: "undo" }, "save")}
              >
                Hoàn tác
              </button>
            </>
          ) : (
            <>
              <label className="w-full text-sm font-semibold text-slate-700">
                Nội dung sửa {finding.quote ? '(thay đoạn được đánh dấu)' : '(thay toàn bộ câu)'}
                <textarea className={`${input} mt-2 min-h-24`} maxLength={2000} disabled={busy} value={findingEdits[finding.id] ?? finding.replacement ?? ''} placeholder="Nhập nội dung sửa nếu agent chưa có bản thay thế..." onChange={event => setFindingEdits(previous => ({ ...previous, [finding.id]: event.target.value }))} />
              </label>
              <button
                className={primary}
                disabled={busy || !(findingEdits[finding.id] ?? finding.replacement ?? '').trim()}
                title="Áp dụng nội dung sửa vào lời đọc"
                onClick={() => run("decision", { findingId: finding.id, decision: "accept", replacement: findingEdits[finding.id] ?? finding.replacement }, "save")}
              >
                Chấp nhận sửa
              </button>
              <button
                className={secondary}
                disabled={busy}
                onClick={() => run("decision", { findingId: finding.id, decision: "reject" }, "save")}
              >
                Giữ nguyên
              </button>
            </>
          )}
        </div>
      </article>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-800">
      <Header
        userEmail={user.email}
        onLogout={onLogout}
        onReset={() => {
          setProject(null);
          setStep(1);
          refreshList();
        }}
        onGoToStep1={() => {
          setProject(null);
          setStep(1);
        }}
      />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        {error && (
          <div role="alert" className="flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <span className="flex gap-2"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}</span>
            <button className="font-semibold underline" onClick={() => setError("")}>Đóng</button>
          </div>
        )}
        <LoadingPanel busy={busy} kind={busyKind} message={message} log={progressLog} />
        <TeacherFeedbackPanel />

        {!project && (
          <>
            <LandingPage mode={mode} setMode={setMode} />
            <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
              <LessonForm
                mode={mode}
                brief={brief}
                script={script}
                busy={busy}
                briefReady={briefReady}
                setBrief={setBrief}
                setScript={setScript}
                onSubmit={start}
              />
              <ProjectsList projects={projects} open={open} remove={remove} />
            </div>
          </>
        )}

        {project && (
          <>
            <section className="grid gap-2 sm:grid-cols-4">
              {["Nhập bài học", `Research (${project.sources.length})`, "Kịch bản", "Tải về"].map((label, index) => (
                <button
                  key={label}
                  className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold ${
                    step === index + 1
                      ? "border-indigo-300 bg-indigo-50 text-indigo-800 ring-4 ring-indigo-100"
                      : index + 1 < step
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-500"
                  }`}
                  disabled={index === 0 || (index === 1 && project.mode === 'qa') || (index === 2 && !project.sentences.length)}
                  onClick={() => setStep(index + 1)}
                >
                  <span className="mb-1 block text-xs uppercase tracking-[0.14em] opacity-70">Bước {index + 1}</span>
                  {label}
                </button>
              ))}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Phiên đang làm</p>
                  <h1 className="mt-1 text-2xl font-black text-slate-950">{project.brief.topic || "Kịch bản rà soát"}</h1>
                  <p className="mt-1 text-sm text-slate-600">{project.mode === "research" ? `${project.brief.audience} · ${project.brief.duration} phút` : "Rà soát kịch bản có sẵn"}</p>
                </div>
                {qualityStats && (
                  <div className="grid grid-cols-3 gap-2 text-center sm:min-w-96">
                    <div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-black text-slate-950">{qualityStats.approved}</p><p className="text-xs text-slate-500">nguồn chọn</p></div>
                    <div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-black text-slate-950">{qualityStats.evidence}</p><p className="text-xs text-slate-500">trích dẫn</p></div>
                    <div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-black text-slate-950">{qualityStats.sentences}</p><p className="text-xs text-slate-500">câu/cảnh</p></div>
                  </div>
                )}
              </div>
            </section>

            {project.mode === "research" && step === 2 && (
              <ResearchPanel
                project={project}
                selected={selected}
                setSelected={setSelected}
                busy={busy}
                message={message}
                progressLog={progressLog}
                researchOpen={researchOpen}
                setResearchOpen={setResearchOpen}
                url={url}
                setUrl={setUrl}
                run={run}
                viewSource={viewSource}
              />
            )}

            {step === 3 && (
              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Bước 3 · Kịch bản</p>
                    <h1 className="mt-1 text-2xl font-black text-slate-950">Kịch bản nháp</h1>
                    <p className="mt-1 text-sm text-slate-600">Đọc từng cảnh, mở nguồn để kiểm tra căn cứ, rồi chạy rà soát trước khi duyệt.</p>
                    {project.mode === "qa" && project.reviewFeedbackIds && <p className="mt-1 text-xs font-semibold text-indigo-700">Lượt rà soát này đã nhận {project.reviewFeedbackIds.length} góp ý được duyệt.</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.mode === "research" && <button className={secondary} onClick={() => setStep(2)}>Chọn lại tài liệu</button>}
                    {project.mode === "research" && <button className={secondary} disabled={busy} onClick={() => run("rewrite", {}, "rewrite")}>Viết lại phần cần sửa</button>}
                    <button className={primary} disabled={busy || !project.sentences.length} onClick={() => run("review", {}, "review")}>Rà soát</button>
                    <button className={secondary} disabled={!project.sentences.length} onClick={() => setTeleprompter(true)}>Đọc thử</button>
                    <button className={secondary} onClick={() => setStep(4)}>Tải về</button>
                    <button className={primary} disabled={busy || !canApprove} title={!canApprove ? 'Xử lý góp ý còn lại và hoàn tất các kiểm tra cần thiết' : 'Chốt phiên bản hiện tại'} onClick={async () => { const result = await run('decision', { target: 'project', decision: 'approve' }, 'save'); if (result) setStep(4); }}>Done · Chốt bản cuối</button>
                  </div>
                </div>
                <div className="space-y-3">
                  {project.sentences.map((sentence) => (
                    <article key={sentence.id} className={`${card} space-y-3`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="font-bold text-slate-950">Cảnh {sentence.scene} · {sentence.seconds || 0} giây</h2>
                        <div className="flex flex-wrap gap-2">
                          {sentence.needsVerification && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">Cần kiểm chứng</span>}
                          {sentence.needsRewrite && <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800">Cần viết lại</span>}
                        </div>
                      </div>
                      {editing === sentence.id ? (
                        <div className="space-y-2">
                          <textarea className={`${input} min-h-28`} value={editText} onChange={(event) => setEditText(event.target.value)} />
                          <div className="flex gap-2">
                            <button className={primary} disabled={busy || !editText.trim()} onClick={() => { run("edit-sentence", { sentenceId: sentence.id, text: editText }, "save"); setEditing(null); }}>Lưu câu</button>
                            <button className={secondary} onClick={() => setEditing(null)}>Hủy</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-lg leading-8 text-slate-800">{sentence.text}</p>
                      )}
                      {sentence.visual && <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600"><span className="font-semibold text-slate-800">Gợi ý hình:</span> {sentence.visual}</p>}
                      {!!sentence.sourceIds?.length && <div className="space-y-1 text-sm">
                        <p className="font-semibold text-slate-800">Nguồn của cảnh này:</p>
                        {sentence.sourceIds.map(id => {
                          const reference = project.sources.find(item => item.nguon_id === id);
                          return reference ? <a key={id} href={reference.url} target="_blank" rel="noopener noreferrer" className="block break-all text-indigo-700 underline">{reference.meta?.tieu_de || reference.url} · {reference.url}</a> : null;
                        })}
                      </div>}
                      {sentence.media && <div className="rounded-2xl border border-slate-200 p-3">
                        {sentence.media.kind === 'image' && <img src={sentence.media.url} alt={`Ảnh tham khảo cho cảnh ${sentence.scene}`} loading="lazy" referrerPolicy="no-referrer" className="mb-2 max-h-56 rounded-xl object-contain" />}
                        <a href={sentence.media.url} target="_blank" rel="noopener noreferrer" className="break-all text-sm font-semibold text-indigo-700 underline">Mở {sentence.media.kind === 'image' ? 'ảnh' : 'video'} tham khảo</a>
                      </div>}
                      <div className="flex flex-wrap gap-2">
                        <button className={secondary} onClick={() => { setEditing(sentence.id); setEditText(sentence.text); }}>Sửa câu</button>
                        {sentence.evidenceIds.map((id) => <button key={id} className={secondary} onClick={() => viewSource(id)}>Xem nguồn</button>)}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {project.findings.length > 0 && step !== 4 && (
              <section className="space-y-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-950">Góp ý cần duyệt</h1>
                  <p className="mt-1 text-sm text-slate-600">Có {pending} góp ý chưa xử lý.</p>
                </div>
                {project.findings.map(findingView)}
              </section>
            )}

            {step === 4 && (
              <section className={`${card} space-y-4`}>
                <h1 className="text-2xl font-black text-slate-950">Tải về</h1>
                <p className="text-slate-600">{project.approvedRevision === project.revision ? "Bản đã duyệt" : `Bản nháp — còn ${pending + affected + unverified} chỗ cần kiểm tra`}</p>
                <div className="flex flex-wrap gap-2">
                  <button className={primary} disabled={busy || project.approvedRevision !== project.revision} onClick={() => download("final.md", project.sentences.map(sentence => sentence.text.replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()).join('\n'), "text/markdown;charset=utf-8")}><Download className="size-4" /> Tải final.md</button>
                  <button className={secondary} onClick={() => download("kich-ban.md", exportMarkdown(project), "text/markdown;charset=utf-8")}><Download className="size-4" /> Tải bản có ngữ cảnh</button>
                  <button className={secondary} onClick={() => download("ho-so-nguon-audit.json", JSON.stringify({ sources: project.sources, claims: project.claims, audit: project.audit }, null, 2), "application/json")}><Download className="size-4" /> Tải hồ sơ nguồn</button>
                  <button className={button} disabled={busy || !canApprove} title={!canApprove ? "Cần hoàn tất rà soát và xử lý góp ý quan trọng" : ""} onClick={() => run("decision", { target: "project", decision: "approve" }, "save")}>Duyệt bản này</button>
                  <button className={secondary} onClick={() => setStep(3)}>Quay lại kịch bản</button>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {source && (
        <div role="dialog" tabIndex={-1} aria-modal="true" aria-label="Đoạn làm căn cứ" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) setSource(null); }}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="flex justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Tài liệu đã đọc</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">{source.meta?.tieu_de || "Nguồn tài liệu"}</h2>
              </div>
              <button aria-label="Đóng" className="flex size-10 items-center justify-center rounded-2xl bg-slate-100" onClick={() => setSource(null)}><X className="size-5" /></button>
            </div>
            <p className="mt-2 text-sm text-slate-600">{source.meta?.tac_gia || source.meta?.to_chuc || "Không rõ tác giả"} · {source.meta?.ngay_dang || "Không rõ ngày"}</p>
            <a className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 underline" href={source.url} target="_blank" rel="noopener noreferrer">Mở trang gốc <ExternalLink className="size-4" /></a>
            <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{source.ly_do}</p>
            <h3 className="mt-5 font-bold text-slate-950">Đoạn làm căn cứ</h3>
            {source.trich_dan?.length ? (
              [...source.trich_dan].sort((a, b) => a === focusQuote ? -1 : b === focusQuote ? 1 : 0).map((quote, index) => (
                <blockquote key={index} className={`my-2 rounded-2xl border-l-4 p-3 text-sm leading-6 ${quote === focusQuote ? "border-indigo-700 bg-indigo-100" : "border-indigo-400 bg-indigo-50"}`}>{quote}</blockquote>
              ))
            ) : <p className="mt-2 text-sm text-slate-500">Chưa có đoạn trích hợp lệ.</p>}
            {!!source.media?.length && <div className="mt-5 space-y-2">
              <h3 className="font-bold text-slate-950">Ảnh/video từ tài liệu</h3>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                {source.media.map((item, index) => <SourceMediaPreview key={item.url} media={item} index={index} />)}
              </div>
            </div>}
            <details className="mt-5 rounded-2xl border border-slate-200 p-4">
              <summary className="cursor-pointer font-semibold text-slate-800">Xem toàn bộ nội dung đã đọc và mã đối chiếu</summary>
              <p className="mt-3 break-all text-xs text-slate-500">SHA-256: {source.snapshot_hash || "Không có"}</p>
              {source.fetched_at && <p className="mt-2 text-xs text-slate-500">Đọc lúc {new Date(source.fetched_at).toLocaleString('vi-VN')} · {source.extraction_method === 'tavily-extract' ? 'Trích xuất dự phòng' : 'Đọc HTML'}</p>}
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{source.snapshot || "Không đọc được nội dung"}</pre>
            </details>
          </div>
        </div>
      )}

      {teleprompter && project && (
        <div role="dialog" tabIndex={-1} aria-modal="true" aria-label="Đọc thử" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-slate-900 p-8 text-white">
            <div className="flex justify-between gap-3">
              <h2 className="text-xl font-black">Đọc thử kịch bản</h2>
              <button aria-label="Đóng" onClick={() => { stopReading(); setTeleprompter(false); }}><X /></button>
            </div>
            <div className="mt-6 space-y-5 text-2xl leading-relaxed">{project.sentences.map((sentence) => <p key={sentence.id}>{sentence.text}</p>)}</div>
            <button className={`${primary} mt-6`} onClick={() => spoken ? stopReading() : readAloud()}>{spoken ? "Dừng đọc" : "Nghe giọng Việt"}</button>
            {speechError && <p role="alert" className="mt-3 text-sm text-amber-200">{speechError}</p>}
          </div>
        </div>
      )}
      <Toast message={toast} />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  useEffect(() => {
    getSession().then(setUser).catch(() => setUser(null)).finally(() => setCheckingSession(false));
  }, []);
  const signOut = async () => {
    await logoutAccount().catch(() => {});
    setUser(null);
  };
  if (checkingSession) return <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] text-sm font-semibold text-slate-600">Đang kiểm tra đăng nhập...</div>;
  if (!user) return <LoginScreen onLogin={async (email, password, role) => { setUser(await loginAccount(email, password, role)); }} />;
  return user.role === "teacher" ? <TeacherApp user={user} onLogout={signOut} /> : <StudentPortal user={user} onLogout={signOut} />;
}
