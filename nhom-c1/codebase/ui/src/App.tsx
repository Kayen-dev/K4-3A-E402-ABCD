import React, { useEffect, useMemo, useState } from "react";
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
import { Toast } from "./components/Toast";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  projectAction,
  type Finding,
  type Project,
  type Source,
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
  "xung-ho": "XÆ°ng hÃ´ chÆ°a thá»‘ng nháº¥t",
  "cau-dai": "CÃ¢u quÃ¡ dÃ i",
  "lap-filler": "Láº·p tá»« hoáº·c tá»« Ä‘á»‡m",
  translationese: "CÃ¡ch diá»…n Ä‘áº¡t gÆ°á»£ng",
  "sai-nghia": "CÃ³ thá»ƒ sai nghÄ©a",
  "sai-sac-thai": "Sáº¯c thÃ¡i chÆ°a phÃ¹ há»£p",
  register: "Giá»ng vÄƒn chÆ°a phÃ¹ há»£p",
  "thieu-can-cu": "ChÆ°a Ä‘á»§ cÄƒn cá»©",
  "pronunciation-only": "Chá»‰ áº£nh hÆ°á»Ÿng cÃ¡ch Ä‘á»c",
};

function canUseSource(source: Source) {
  return (
    ["dung", "dung-canh-bao"].includes(source.trang_thai) &&
    !!source.trich_dan?.length
  );
}

function statusLabel(source: Source) {
  if (source.trang_thai === "dung" || source.trang_thai === "dung-canh-bao") {
    return "CÃ³ thá»ƒ dÃ¹ng";
  }
  if (source.trang_thai === "khong-doc-duoc") return "KhÃ´ng Ä‘á»c Ä‘Æ°á»£c";
  if (source.trang_thai === "loai") return "KhÃ´ng nÃªn dÃ¹ng";
  return "ChÆ°a Ä‘Ã¡nh giÃ¡ Ä‘Æ°á»£c";
}

function statusTone(source: Source) {
  if (source.trang_thai === "dung" || source.trang_thai === "dung-canh-bao") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
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
  const approved = project.approvedRevision === project.revision;
  const pending =
    project.sentences.filter((s) => s.needsRewrite || s.needsVerification)
      .length +
    project.findings.filter((f) => f.severity === "cao" && !f.decision).length;
  return [
    `# ${project.brief.topic || "Ká»‹ch báº£n"}`,
    "",
    approved
      ? "Báº£n Ä‘Ã£ duyá»‡t"
      : `Báº£n nhÃ¡p â€” cÃ²n ${pending} chá»— cáº§n kiá»ƒm tra`,
    "",
    ...project.sentences.flatMap((sentence) => [
      `## Cáº£nh ${sentence.scene} Â· ${sentence.seconds || 0} giÃ¢y (Æ°á»›c tÃ­nh)`,
      "",
      `Lá»i Ä‘á»c: ${sentence.text}`,
      "",
      `Gá»£i Ã½ hÃ¬nh: ${sentence.visual || "ChÆ°a cÃ³"}`,
      "",
      `Nguá»“n: ${
        sentence.evidenceIds
          .map((id) =>
            project.sources
              .flatMap((source) =>
                (source.evidence || [])
                  .filter((evidence) => evidence.id === id)
                  .map(
                    (evidence) =>
                      `${source.meta?.tieu_de || source.url} (${source.url}) â€” â€œ${evidence.quote}â€`,
                  ),
              )
              .join("; "),
          )
          .filter(Boolean)
          .join("; ") || "ChÆ°a kiá»ƒm chá»©ng"
      }`,
      "",
    ]),
    "## Há»“ sÆ¡ nguá»“n",
    "",
    ...project.sources
      .filter((source) => source.approved)
      .flatMap((source) => [
        `- ${source.meta?.tieu_de || source.url} â€” ${source.url}`,
        `  - TÃ¡c giáº£/tá»• chá»©c: ${source.meta?.tac_gia || source.meta?.to_chuc || "KhÃ´ng xÃ¡c Ä‘á»‹nh"}`,
        `  - Äoáº¡n lÃ m cÄƒn cá»©: ${source.trich_dan.join(" | ") || "ChÆ°a cÃ³"}`,
      ]),
    "",
    "## Tráº¡ng thÃ¡i kiá»ƒm tra",
    "",
    `RÃ  soÃ¡t: ${project.reviewStatus}`,
    `PhiÃªn báº£n: ${project.revision}`,
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
      ? "Äang viáº¿t ká»‹ch báº£n tá»« tÃ i liá»‡u Ä‘Ã£ chá»n"
      : kind === "review"
        ? "Äang rÃ  soÃ¡t ká»‹ch báº£n"
        : kind === "rewrite"
          ? "Äang viáº¿t láº¡i pháº§n bá»‹ áº£nh hÆ°á»Ÿng"
          : kind === "research" || kind === "add-source"
            ? "Äang research vÃ  Ä‘á»c tÃ i liá»‡u"
            : "Äang lÆ°u thay Ä‘á»•i";
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
                "Há»‡ thá»‘ng Ä‘ang xá»­ lÃ½. Báº¡n cÃ³ thá»ƒ theo dÃµi tá»«ng bÆ°á»›c bÃªn dÆ°á»›i."}
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
          label="TÃ¬m nguá»“n"
        />
        <ProgressPill
          active={kind === "research" || kind === "add-source"}
          done={kind === "generate" || kind === "review" || kind === "rewrite"}
          label="Äá»c & cháº¥m nguá»“n"
        />
        <ProgressPill
          active={kind === "generate" || kind === "review" || kind === "rewrite"}
          label="Táº¡o káº¿t quáº£"
        />
      </div>
      {log.length > 0 && (
        <div className="border-t border-slate-100 px-5 pb-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Tiáº¿n trÃ¬nh vá»«a nháº­n
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
            Viáº¿t ká»‹ch báº£n bÃ i giáº£ng cÃ³ nguá»“n, dá»… duyá»‡t, Ã­t áº£o tÆ°á»Ÿng.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Nháº­p bÃ i há»c, Ä‘á»ƒ há»‡ thá»‘ng research tÃ i liá»‡u, chá»n nguá»“n Ä‘Ã¡ng tin,
            rá»“i táº¡o ká»‹ch báº£n cÃ³ dáº«n chá»©ng theo tá»«ng cÃ¢u. Giáº£ng viÃªn cÃ³ thá»ƒ xem
            láº¡i nguá»“n, sá»­a cÃ¢u vÃ  táº£i há»“ sÆ¡ kiá»ƒm chá»©ng.
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
              Báº¯t Ä‘áº§u soáº¡n bÃ i <ArrowRight className="size-4" />
            </button>
            <button className={secondary} onClick={() => setMode("qa")}>
              RÃ  soÃ¡t ká»‹ch báº£n cÃ³ sáºµn
            </button>
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-4 shadow-xl shadow-slate-900/10 backdrop-blur">
          <div className="rounded-[1.4rem] border border-slate-200 bg-slate-950 p-4 text-white">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-sm font-semibold">Luá»“ng lÃ m viá»‡c</span>
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                Live research
              </span>
            </div>
            {[
              ["01", "Nháº­p bÃ i há»c", "Chá»§ Ä‘á», má»¥c tiÃªu, ngÆ°á»i há»c, thá»i lÆ°á»£ng"],
              ["02", "Research tÃ i liá»‡u", "Theo dÃµi Ä‘Ã£ Ä‘á»c Ä‘áº¿n Ä‘Ã¢u, thÃªm URL náº¿u cáº§n"],
              ["03", "Chá»n nguá»“n", "Tick tÃ i liá»‡u dÃ¹ng Ä‘á»ƒ viáº¿t ká»‹ch báº£n"],
              ["04", "Duyá»‡t káº¿t quáº£", "RÃ  soÃ¡t, sá»­a cÃ¢u, táº£i markdown"],
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
          <strong>TÃ¬m nguá»“n vÃ  viáº¿t</strong>
          <p className="mt-1 text-sm text-slate-600">
            PhÃ¹ há»£p khi chÆ°a cÃ³ ká»‹ch báº£n.
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
          <strong>RÃ  soÃ¡t báº£n cÃ³ sáºµn</strong>
          <p className="mt-1 text-sm text-slate-600">
            DÃ¡n lá»i Ä‘á»c Ä‘á»ƒ kiá»ƒm tra vÄƒn nÃ³i.
          </p>
        </button>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <ClipboardCheck className="mb-3 size-5 text-slate-700" />
          <strong>Xuáº¥t há»“ sÆ¡ nguá»“n</strong>
          <p className="mt-1 text-sm text-slate-600">
            Táº£i markdown vÃ  audit JSON sau khi duyá»‡t.
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
  return (
    <section
      id="start"
      className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            BÆ°á»›c 1
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">
            {mode === "research"
              ? "Nháº­p bÃ i há»c"
              : "DÃ¡n ká»‹ch báº£n cáº§n rÃ  soÃ¡t"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {mode === "research"
              ? "CÃ ng rÃµ má»¥c tiÃªu vÃ  ngÆ°á»i há»c, tÃ i liá»‡u tÃ¬m Ä‘Æ°á»£c cÃ ng sÃ¡t vá»›i bÃ i giáº£ng."
              : "Má»—i dÃ²ng nÃªn lÃ  má»™t cÃ¢u hoáº·c má»™t cáº£nh Ä‘á»ƒ gÃ³p Ã½ dá»… Ä‘á»c hÆ¡n."}
          </p>
        </div>
        {mode === "research" && (
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span className="font-bold text-slate-900">
              {briefReady ? "ÄÃ£ Ä‘á»§ thÃ´ng tin" : "CÃ²n thiáº¿u thÃ´ng tin"}
            </span>
            <br />
            Cáº§n chá»§ Ä‘á», má»¥c tiÃªu, ngÆ°á»i há»c vÃ  1â€“120 phÃºt.
          </div>
        )}
      </div>
      {mode === "research" ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <label className="lg:col-span-2">
            <span className="mb-2 block text-sm font-bold text-slate-800">
              Chá»§ Ä‘á» bÃ i há»c
            </span>
            <input
              className={input}
              value={brief.topic}
              required
              maxLength={300}
              placeholder="VÃ­ dá»¥: Ká»¹ nÄƒng pháº£n há»“i trong lá»›p há»c trá»±c tuyáº¿n"
              onChange={(event) =>
                setBrief({ ...brief, topic: event.target.value })
              }
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-bold text-slate-800">
              Má»¥c tiÃªu há»c xong
            </span>
            <textarea
              className={`${input} min-h-32`}
              value={brief.goal}
              required
              maxLength={2000}
              placeholder="Sau bÃ i há»c, ngÆ°á»i há»c cÃ³ thá»ƒ..."
              onChange={(event) =>
                setBrief({ ...brief, goal: event.target.value })
              }
            />
          </label>
          <div className="grid gap-4">
            <label>
              <span className="mb-2 block text-sm font-bold text-slate-800">
                NgÆ°á»i há»c
              </span>
              <input
                className={input}
                value={brief.audience}
                required
                maxLength={300}
                placeholder="VÃ­ dá»¥: Sinh viÃªn nÄƒm 2, giÃ¡o viÃªn má»›i..."
                onChange={(event) =>
                  setBrief({ ...brief, audience: event.target.value })
                }
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-bold text-slate-800">
                Thá»i lÆ°á»£ng
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
                  phÃºt
                </span>
              </div>
            </label>
          </div>
        </div>
      ) : (
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-800">
            Lá»i Ä‘á»c / ká»‹ch báº£n
          </span>
          <textarea
            className={`${input} min-h-72`}
            value={script}
            maxLength={30000}
            placeholder="DÃ¡n ká»‹ch báº£n táº¡i Ä‘Ã¢y..."
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
              ? "Äiá»n Ä‘á»§ chá»§ Ä‘á», má»¥c tiÃªu, ngÆ°á»i há»c vÃ  thá»i lÆ°á»£ng tá»« 1 Ä‘áº¿n 120 phÃºt"
              : ""
          }
          onClick={onSubmit}
        >
          {mode === "research" ? (
            <Search className="size-4" />
          ) : (
            <FileCheck className="size-4" />
          )}
          {mode === "research" ? "TÃ¬m tÃ i liá»‡u" : "Xem gÃ³p Ã½"}
        </button>
        <p className="text-sm text-slate-500">
          {mode === "research"
            ? "Sau khi tÃ¬m xong, báº¡n sáº½ chá»n tÃ i liá»‡u dÃ¹ng Ä‘á»ƒ viáº¿t ká»‹ch báº£n."
            : "Káº¿t quáº£ sáº½ hiá»ƒn thá»‹ theo tá»«ng cÃ¢u Ä‘á»ƒ báº¡n duyá»‡t nhanh."}
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
  return (
    <section className={card}>
      <h2 className="font-bold text-slate-950">Má»Ÿ láº¡i phiÃªn lÃ m viá»‡c</h2>
      <p className="mt-1 text-sm text-slate-500">
        Tiáº¿p tá»¥c tá»« phiÃªn Ä‘Ã£ lÆ°u trÃªn mÃ¡y chá»§.
      </p>
      {projects.length ? (
        <ul className="mt-4 divide-y divide-slate-100">
          {projects.map((project) => (
            <li
              key={project.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <button className="min-w-0 text-left" onClick={() => open(project.id)}>
                <span className="block truncate font-semibold text-slate-800">
                  {project.title}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(project.updatedAt).toLocaleString("vi-VN")} Â· v
                  {project.revision}
                </span>
              </button>
              <button
                className="text-sm font-semibold text-rose-600 hover:underline"
                onClick={() => remove(project.id)}
              >
                XÃ³a
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          ChÆ°a cÃ³ phiÃªn nÃ o. Táº¡o bÃ i há»c má»›i Ä‘á»ƒ báº¯t Ä‘áº§u.
        </div>
      )}
    </section>
  );
}

function ResearchPanel({
  project,
  selected,
  setSelected,
  busy,
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
  const usable = project.sources.filter(canUseSource).length;
  const readCount = project.sources.filter(
    (source) =>
      source.snapshot ||
      source.trich_dan?.length ||
      source.trang_thai !== "chua-cham",
  ).length;
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
    const approvedProject = await run("approve-sources", { sourceIds: selected }, "save");
    if (approvedProject) await run("generate", {}, "generate", approvedProject);
  }

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] border border-indigo-100 bg-white shadow-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-4 p-5 text-left"
          onClick={() => setResearchOpen(!researchOpen)}
          aria-expanded={researchOpen}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              BÆ°á»›c 2 Â· Research
            </p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">
              ÄÃ£ Ä‘á»c {readCount}/{Math.max(project.sources.length, readCount, 1)} tÃ i
              liá»‡u
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Chá»n tÃ i liá»‡u dÃ¹ng Ä‘á»ƒ viáº¿t ká»‹ch báº£n. CÃ³ thá»ƒ má»Ÿ panel Ä‘á»ƒ xem há»‡
              thá»‘ng Ä‘ang Ä‘á»c Ä‘áº¿n Ä‘Ã¢u hoáº·c thÃªm tÃ i liá»‡u má»›i.
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
                label="TÃ¬m danh sÃ¡ch URL"
              />
              <ProgressPill
                done={readCount > 0}
                active={busy}
                label={`Äá»c ${readCount}/${Math.max(project.sources.length, 1)}`}
              />
              <ProgressPill
                done={usable > 0}
                active={busy && usable === 0}
                label={`${usable} nguá»“n dÃ¹ng Ä‘Æ°á»£c`}
              />
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-800">Nháº­t kÃ½ research</p>
              <ol className="mt-3 space-y-2 text-sm text-slate-600">
                {(progressLog.length
                  ? progressLog
                  : [
                      message ||
                        "ChÆ°a cÃ³ tiáº¿n trÃ¬nh má»›i. Báº¥m tÃ¬m thÃªm hoáº·c thÃªm URL Ä‘á»ƒ research tiáº¿p.",
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
            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
              <label>
                <span className="mb-2 block text-sm font-bold text-slate-800">
                  ThÃªm URL tÃ i liá»‡u
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
                <Plus className="size-4" /> Äá»c URL nÃ y
              </button>
              <button
                className={`${secondary} self-end`}
                disabled={busy}
                onClick={() => run("research", {}, "research")}
              >
                <RefreshCw className="size-4" /> TÃ¬m thÃªm tá»± Ä‘á»™ng
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-3">
          {project.sources.length ? (
            project.sources.map((source, index) => {
              const isUsable = canUseSource(source);
              const isSelected = selected.includes(source.nguon_id) && isUsable;
              return (
                <article
                  key={source.nguon_id}
                  className={`rounded-[1.5rem] border bg-white p-4 shadow-sm transition ${
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
                          TÃ i liá»‡u {index + 1}
                        </span>
                        <strong className="block text-slate-950">
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
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {source.ly_do || "ChÆ°a cÃ³ ghi chÃº Ä‘Ã¡nh giÃ¡ nguá»“n."}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      className={secondary}
                      onClick={() => viewSource(source.nguon_id)}
                    >
                      <FileText className="size-4" /> Xem Ä‘oáº¡n Ä‘Ã£ Ä‘á»c
                    </button>
                    {source.trich_dan?.length ? (
                      <span className="text-xs font-semibold text-slate-500">
                        {source.trich_dan.length} Ä‘oáº¡n trÃ­ch cÃ³ thá»ƒ dÃ¹ng
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700">
                        ChÆ°a cÃ³ Ä‘oáº¡n trÃ­ch há»£p lá»‡
                      </span>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              ChÆ°a cÃ³ tÃ i liá»‡u. Báº¥m â€œTÃ¬m tÃ i liá»‡uâ€ hoáº·c thÃªm URL Ä‘á»ƒ báº¯t Ä‘áº§u
              research.
            </div>
          )}
        </div>
        <aside className="h-fit rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            Nguá»“n Ä‘Æ°á»£c chá»n
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {checkedUsable}/{usable}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Chá»‰ nguá»“n cÃ³ Ä‘oáº¡n trÃ­ch há»£p lá»‡ má»›i Ä‘Æ°á»£c dÃ¹ng Ä‘á»ƒ viáº¿t ká»‹ch báº£n nháº±m
            giáº£m hallucination.
          </p>
          <button
            className={`${primary} mt-5 w-full`}
            disabled={busy || checkedUsable === 0}
            onClick={writeScript}
          >
            <Sparkles className="size-4" /> Viáº¿t ká»‹ch báº£n
          </button>
          {checkedUsable === 0 && (
            <p className="mt-3 text-xs text-amber-700">
              Chá»n Ã­t nháº¥t má»™t tÃ i liá»‡u cÃ³ thá»ƒ dÃ¹ng.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}

export default function App() {
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Summary[]>([]);
  const [mode, setMode] = useState<"research" | "qa">("research");
  const [step, setStep] = useState(1);
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
    project?.reviewStatus === "complete" &&
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
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSource(null);
        setTeleprompter(false);
        window.speechSynthesis?.cancel();
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
    setStep(project.mode === "qa" ? 2 : project.sentences.length ? 3 : project.sources.length ? 2 : 1);
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
    onProgress(action === "generate" ? "Äang chuáº©n bá»‹ nguá»“n Ä‘Ã£ chá»n..." : "Äang xá»­ lÃ½...");
    try {
      const nextProject = await projectAction(baseProject, action, extra, onProgress);
      setProject(nextProject);
      setSelected(nextProject.sources.filter((s) => s.approved).map((s) => s.nguon_id));
      if (action === "generate" || action === "rewrite") setStep(3);
      refreshList();
      notify(action === "generate" ? "ÄÃ£ táº¡o ká»‹ch báº£n nhÃ¡p." : "ÄÃ£ lÆ°u káº¿t quáº£.");
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
        ? "Äang táº¡o phiÃªn vÃ  chuáº©n bá»‹ truy váº¥n research..."
        : "Äang táº¡o phiÃªn rÃ  soÃ¡t...",
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
        notify("ÄÃ£ tÃ¬m vÃ  Ä‘á»c tÃ i liá»‡u. Chá»n nguá»“n Ä‘á»ƒ viáº¿t.");
      } else {
        notify("ÄÃ£ rÃ  soÃ¡t ká»‹ch báº£n.");
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
    if (!window.confirm("XÃ³a phiÃªn nÃ y vÃ  toÃ n bá»™ dá»¯ liá»‡u Ä‘Ã£ lÆ°u?")) return;
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

  function readAloud() {
    if (!project?.sentences.length) return;
    const voices = window.speechSynthesis?.getVoices() || [];
    const vi = voices.find((voice) => voice.lang.toLowerCase().startsWith("vi"));
    if (!vi) {
      setError("Thiáº¿t bá»‹ chÆ°a cÃ³ giá»ng tiáº¿ng Viá»‡t. Báº¡n váº«n cÃ³ thá»ƒ Ä‘á»c thá»­ trÃªn mÃ n hÃ¬nh.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      project.sentences.map((sentence) => sentence.text).join(" "),
    );
    utterance.voice = vi;
    utterance.lang = "vi-VN";
    utterance.onend = () => setSpoken(false);
    window.speechSynthesis.speak(utterance);
    setSpoken(true);
  }

  function findingView(finding: Finding) {
    const sentence = project?.sentences.find((item) => item.id === finding.sentenceId);
    return (
      <article key={finding.id} className={`${card} space-y-3`}>
        <div className="flex flex-wrap items-center gap-2">
          <strong>{categoryLabel[finding.category] || "GÃ³p Ã½"}</strong>
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
            Má»©c Ä‘á»™: {finding.severity}
          </span>
          <span className="text-xs text-slate-500">CÃ¢u {sentence?.scene}</span>
        </div>
        <p><span className="font-semibold">Äoáº¡n nÃ o:</span> {finding.quote || sentence?.text}</p>
        <p><span className="font-semibold">VÃ¬ sao:</span> {finding.reason}</p>
        <p><span className="font-semibold">Sá»­a thÃ nh gÃ¬:</span> {finding.suggestion || "Cáº§n tá»± kiá»ƒm tra"}</p>
        {finding.replacement && (
          <p className="rounded-2xl bg-indigo-50 p-3 text-sm leading-6 text-indigo-950">
            TrÆ°á»›c: {finding.quote}<br />Sau: {finding.replacement}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {finding.decision ? (
            <>
              <span className="py-2 text-sm font-semibold text-slate-600">
                {finding.decision === "accepted" ? "ÄÃ£ cháº¥p nháº­n" : "ÄÃ£ giá»¯ nguyÃªn"}
              </span>
              <button
                className={secondary}
                disabled={busy}
                onClick={() => run("decision", { findingId: finding.id, decision: "undo" }, "save")}
              >
                HoÃ n tÃ¡c
              </button>
            </>
          ) : (
            <>
              <button
                className={primary}
                disabled={busy || !finding.replacement}
                title={!finding.replacement ? "GÃ³p Ã½ nÃ y cáº§n kiá»ƒm tra thá»§ cÃ´ng" : ""}
                onClick={() => run("decision", { findingId: finding.id, decision: "accept" }, "save")}
              >
                Cháº¥p nháº­n sá»­a
              </button>
              <button
                className={secondary}
                disabled={busy}
                onClick={() => run("decision", { findingId: finding.id, decision: "reject" }, "save")}
              >
                Giá»¯ nguyÃªn
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
            <button className="font-semibold underline" onClick={() => setError("")}>ÄÃ³ng</button>
          </div>
        )}
        <LoadingPanel busy={busy} kind={busyKind} message={message} log={progressLog} />

        {!project && (
          <>
            <LandingPage mode={mode} setMode={setMode} />
            <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
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
              {["Nháº­p bÃ i há»c", `Research (${project.sources.length})`, "Ká»‹ch báº£n", "Táº£i vá»"].map((label, index) => (
                <button
                  key={label}
                  className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold ${
                    step === index + 1
                      ? "border-indigo-300 bg-indigo-50 text-indigo-800 ring-4 ring-indigo-100"
                      : index + 1 < step
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-500"
                  }`}
                  disabled={index === 0 || (index === 2 && !project.sentences.length)}
                  onClick={() => setStep(index + 1)}
                >
                  <span className="mb-1 block text-xs uppercase tracking-[0.14em] opacity-70">BÆ°á»›c {index + 1}</span>
                  {label}
                </button>
              ))}
            </section>

            <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">PhiÃªn Ä‘ang lÃ m</p>
                  <h1 className="mt-1 text-2xl font-black text-slate-950">{project.brief.topic || "Ká»‹ch báº£n rÃ  soÃ¡t"}</h1>
                  <p className="mt-1 text-sm text-slate-600">{project.mode === "research" ? `${project.brief.audience} Â· ${project.brief.duration} phÃºt` : "RÃ  soÃ¡t ká»‹ch báº£n cÃ³ sáºµn"}</p>
                </div>
                {qualityStats && (
                  <div className="grid grid-cols-3 gap-2 text-center sm:min-w-96">
                    <div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-black text-slate-950">{qualityStats.approved}</p><p className="text-xs text-slate-500">nguá»“n chá»n</p></div>
                    <div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-black text-slate-950">{qualityStats.evidence}</p><p className="text-xs text-slate-500">trÃ­ch dáº«n</p></div>
                    <div className="rounded-2xl bg-slate-50 p-3"><p className="text-lg font-black text-slate-950">{qualityStats.sentences}</p><p className="text-xs text-slate-500">cÃ¢u/cáº£nh</p></div>
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

            {((project.mode === "research" && step === 3) || (project.mode === "qa" && step === 2)) && (
              <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">{project.mode === "research" ? "BÆ°á»›c 3" : "Káº¿t quáº£ rÃ  soÃ¡t"}</p>
                    <h1 className="mt-1 text-2xl font-black text-slate-950">Ká»‹ch báº£n nhÃ¡p</h1>
                    <p className="mt-1 text-sm text-slate-600">Äá»c tá»«ng cáº£nh, má»Ÿ nguá»“n Ä‘á»ƒ kiá»ƒm tra cÄƒn cá»©, rá»“i cháº¡y rÃ  soÃ¡t trÆ°á»›c khi duyá»‡t.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.mode === "research" && <button className={secondary} onClick={() => setStep(2)}>Chá»n láº¡i tÃ i liá»‡u</button>}
                    {project.mode === "research" && <button className={secondary} disabled={busy} onClick={() => run("rewrite", {}, "rewrite")}>Viáº¿t láº¡i pháº§n cáº§n sá»­a</button>}
                    <button className={primary} disabled={busy || !project.sentences.length} onClick={() => run("review", {}, "review")}>RÃ  soÃ¡t</button>
                    <button className={secondary} disabled={!project.sentences.length} onClick={() => setTeleprompter(true)}>Äá»c thá»­</button>
                    <button className={secondary} onClick={() => setStep(4)}>Táº£i vá»</button>
                  </div>
                </div>
                <div className="space-y-3">
                  {project.sentences.map((sentence) => (
                    <article key={sentence.id} className={`${card} space-y-3`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="font-bold text-slate-950">Cáº£nh {sentence.scene} Â· {sentence.seconds || 0} giÃ¢y</h2>
                        <div className="flex flex-wrap gap-2">
                          {sentence.needsVerification && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">Cáº§n kiá»ƒm chá»©ng</span>}
                          {sentence.needsRewrite && <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800">Cáº§n viáº¿t láº¡i</span>}
                        </div>
                      </div>
                      {editing === sentence.id ? (
                        <div className="space-y-2">
                          <textarea className={`${input} min-h-28`} value={editText} onChange={(event) => setEditText(event.target.value)} />
                          <div className="flex gap-2">
                            <button className={primary} disabled={busy || !editText.trim()} onClick={() => { run("edit-sentence", { sentenceId: sentence.id, text: editText }, "save"); setEditing(null); }}>LÆ°u cÃ¢u</button>
                            <button className={secondary} onClick={() => setEditing(null)}>Há»§y</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-lg leading-8 text-slate-800">{sentence.text}</p>
                      )}
                      {sentence.visual && <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600"><span className="font-semibold text-slate-800">Gá»£i Ã½ hÃ¬nh:</span> {sentence.visual}</p>}
                      <div className="flex flex-wrap gap-2">
                        <button className={secondary} onClick={() => { setEditing(sentence.id); setEditText(sentence.text); }}>Sá»­a cÃ¢u</button>
                        {sentence.evidenceIds.map((id) => <button key={id} className={secondary} onClick={() => viewSource(id)}>Xem nguá»“n</button>)}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {project.findings.length > 0 && step !== 4 && (
              <section className="space-y-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-950">GÃ³p Ã½ cáº§n duyá»‡t</h1>
                  <p className="mt-1 text-sm text-slate-600">CÃ³ {pending} gÃ³p Ã½ chÆ°a xá»­ lÃ½.</p>
                </div>
                {project.findings.map(findingView)}
              </section>
            )}

            {step === 4 && (
              <section className={`${card} space-y-4`}>
                <h1 className="text-2xl font-black text-slate-950">Táº£i vá»</h1>
                <p className="text-slate-600">{project.approvedRevision === project.revision ? "Báº£n Ä‘Ã£ duyá»‡t" : `Báº£n nhÃ¡p â€” cÃ²n ${pending + affected + unverified} chá»— cáº§n kiá»ƒm tra`}</p>
                <div className="flex flex-wrap gap-2">
                  <button className={primary} onClick={() => download("kich-ban.md", exportMarkdown(project), "text/markdown;charset=utf-8")}><Download className="size-4" /> Táº£i ká»‹ch báº£n</button>
                  <button className={secondary} onClick={() => download("ho-so-nguon-audit.json", JSON.stringify({ sources: project.sources, claims: project.claims, audit: project.audit }, null, 2), "application/json")}><Download className="size-4" /> Táº£i há»“ sÆ¡ nguá»“n</button>
                  <button className={button} disabled={busy || !canApprove} title={!canApprove ? "Cáº§n hoÃ n táº¥t rÃ  soÃ¡t vÃ  xá»­ lÃ½ gÃ³p Ã½ quan trá»ng" : ""} onClick={() => run("decision", { target: "project", decision: "approve" }, "save")}>Duyá»‡t báº£n nÃ y</button>
                  <button className={secondary} onClick={() => setStep(project.mode === "qa" ? 2 : 3)}>Quay láº¡i ká»‹ch báº£n</button>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {source && (
        <div role="dialog" tabIndex={-1} aria-modal="true" aria-label="Äoáº¡n lÃ m cÄƒn cá»©" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3" onMouseDown={(event) => { if (event.target === event.currentTarget) setSource(null); }}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="flex justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">TÃ i liá»‡u Ä‘Ã£ Ä‘á»c</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">{source.meta?.tieu_de || "Nguá»“n tÃ i liá»‡u"}</h2>
              </div>
              <button aria-label="ÄÃ³ng" className="flex size-10 items-center justify-center rounded-2xl bg-slate-100" onClick={() => setSource(null)}><X className="size-5" /></button>
            </div>
            <p className="mt-2 text-sm text-slate-600">{source.meta?.tac_gia || source.meta?.to_chuc || "KhÃ´ng rÃµ tÃ¡c giáº£"} Â· {source.meta?.ngay_dang || "KhÃ´ng rÃµ ngÃ y"}</p>
            <a className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 underline" href={source.url} target="_blank" rel="noopener noreferrer">Má»Ÿ trang gá»‘c <ExternalLink className="size-4" /></a>
            <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{source.ly_do}</p>
            <h3 className="mt-5 font-bold text-slate-950">Äoáº¡n lÃ m cÄƒn cá»©</h3>
            {source.trich_dan?.length ? (
              [...source.trich_dan].sort((a, b) => a === focusQuote ? -1 : b === focusQuote ? 1 : 0).map((quote, index) => (
                <blockquote key={index} className={`my-2 rounded-2xl border-l-4 p-3 text-sm leading-6 ${quote === focusQuote ? "border-indigo-700 bg-indigo-100" : "border-indigo-400 bg-indigo-50"}`}>{quote}</blockquote>
              ))
            ) : <p className="mt-2 text-sm text-slate-500">ChÆ°a cÃ³ Ä‘oáº¡n trÃ­ch há»£p lá»‡.</p>}
            <details className="mt-5 rounded-2xl border border-slate-200 p-4">
              <summary className="cursor-pointer font-semibold text-slate-800">Xem toÃ n bá»™ ná»™i dung Ä‘Ã£ Ä‘á»c vÃ  mÃ£ Ä‘á»‘i chiáº¿u</summary>
              <p className="mt-3 break-all text-xs text-slate-500">SHA-256: {source.snapshot_hash || "KhÃ´ng cÃ³"}</p>
              <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">{source.snapshot || "KhÃ´ng Ä‘á»c Ä‘Æ°á»£c ná»™i dung"}</pre>
            </details>
          </div>
        </div>
      )}

      {teleprompter && project && (
        <div role="dialog" tabIndex={-1} aria-modal="true" aria-label="Äá»c thá»­" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-slate-900 p-8 text-white">
            <div className="flex justify-between gap-3">
              <h2 className="text-xl font-black">Äá»c thá»­ ká»‹ch báº£n</h2>
              <button aria-label="ÄÃ³ng" onClick={() => { setTeleprompter(false); window.speechSynthesis?.cancel(); }}><X /></button>
            </div>
            <div className="mt-6 space-y-5 text-2xl leading-relaxed">{project.sentences.map((sentence) => <p key={sentence.id}>{sentence.text}</p>)}</div>
            <button className={`${primary} mt-6`} onClick={() => spoken ? (window.speechSynthesis.cancel(), setSpoken(false)) : readAloud()}>{spoken ? "Dá»«ng Ä‘á»c" : "Nghe giá»ng Viá»‡t"}</button>
          </div>
        </div>
      )}
      <Toast message={toast} />
    </div>
  );
}
