import React, { useEffect, useState } from "react";
import {
  BookOpen,
  FileCheck,
  Download,
  ExternalLink,
  Play,
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
  "rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600";
const secondary =
  "rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600";
const input =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const card = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const statusLabel = (s: Source) =>
  s.trang_thai === "dung" || s.trang_thai === "dung-canh-bao"
    ? "Có thể dùng"
    : s.trang_thai === "khong-doc-duoc"
      ? "Không đọc được"
      : s.trang_thai === "loai"
        ? "Không nên dùng"
        : "Chưa đánh giá được";
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
};

function download(name: string, content: string, mime: string) {
  const u = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 500);
}
function exportMarkdown(p: Project) {
  const approved = p.approvedRevision === p.revision;
  const pending =
    p.sentences.filter((s) => s.needsRewrite || s.needsVerification).length +
    p.findings.filter((f) => f.severity === "cao" && !f.decision).length;
  return [
    `# ${p.brief.topic || "Kịch bản"}`,
    "",
    approved ? "Bản đã duyệt" : `Bản nháp — còn ${pending} chỗ cần kiểm tra`,
    "",
    ...p.sentences.flatMap((s) => [
      `## Cảnh ${s.scene} · ${s.seconds || 0} giây (ước tính)`,
      "",
      `Lời đọc: ${s.text}`,
      "",
      `Gợi ý hình: ${s.visual || "Chưa có"}`,
      "",
      `Nguồn: ${s.evidenceIds.map(id => p.sources.flatMap(source => (source.evidence || []).filter(e => e.id === id).map(e => `${source.meta?.tieu_de || source.url} (${source.url}) — “${e.quote}”`))).flat().join('; ') || "Chưa kiểm chứng"}`,
      "",
    ]),
    "## Hồ sơ nguồn",
    "",
    ...p.sources
      .filter((s) => s.approved)
      .flatMap((s) => [
        `- ${s.meta?.tieu_de || s.url} — ${s.url}`,
        `  - Tác giả/tổ chức: ${s.meta?.tac_gia || s.meta?.to_chuc || "Không xác định"}`,
        `  - Đoạn làm căn cứ: ${s.trich_dan.join(" | ") || "Chưa có"}`,
      ]),
    "",
    "## Trạng thái kiểm tra",
    "",
    `Rà soát: ${p.reviewStatus}`,
    `Phiên bản: ${p.revision}`,
  ].join("\n");
}

export default function App() {
  const [project, setProject] = useState<Project | null>(null),
    [projects, setProjects] = useState<Summary[]>([]);
  const [mode, setMode] = useState<"research" | "qa">("research"),
    [step, setStep] = useState(1);
  const [brief, setBrief] = useState({
      topic: "",
      goal: "",
      audience: "",
      duration: "5",
    }),
    [script, setScript] = useState("");
  const [url, setUrl] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [source, setSource] = useState<Source | null>(null);
  const [focusQuote, setFocusQuote] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null),
    [editText, setEditText] = useState("");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [toast, setToast] = useState<string | null>(null);
  const [teleprompter, setTeleprompter] = useState(false),
    [spoken, setSpoken] = useState(false);
  const briefReady = !!brief.topic.trim() && !!brief.goal.trim() && !!brief.audience.trim() && Number(brief.duration) >= 1 && Number(brief.duration) <= 120;

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() => {});
  }, []);
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
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
      const elements = Array.from(dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, [tabindex="0"]'));
      if (!elements.length) { event.preventDefault(); return; }
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", trap);
    return () => { document.removeEventListener("keydown", trap); document.body.style.overflow = oldOverflow; before?.focus(); };
  }, [source, teleprompter]);
  useEffect(() => {
    if (project) {
      setSelected(
        project.sources.filter((s) => s.approved).map((s) => s.nguon_id),
      );
      setStep(
        project.mode === "qa"
          ? 2
          : project.sentences.length
            ? 3
            : project.sources.length
              ? 2
              : 1,
      );
    }
  }, [project?.id]);
  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };
  const refreshList = () =>
    listProjects()
      .then(setProjects)
      .catch(() => {});
  async function run(action: string, extra: object = {}) {
    if (!project || busy) return;
    setBusy(true);
    setError("");
    setMessage("Đang xử lý…");
    try {
      const p = await projectAction(project, action, extra, setMessage);
      setProject(p);
      setSelected(p.sources.filter((s) => s.approved).map((s) => s.nguon_id));
      refreshList();
      notify("Đã lưu kết quả.");
    } catch (e) {
      setError((e as Error).message);
      const latest = await getProject(project.id).catch(() => null);
      if (latest) setProject(latest);
    } finally {
      setBusy(false);
      setMessage("");
    }
  }
  async function start() {
    setBusy(true);
    setError("");
    try {
      const p = await createProject(
        mode === "research"
          ? { mode, brief: { ...brief, duration: Number(brief.duration) } }
          : { mode, script },
      );
      setProject(p);
      setStep(2);
      refreshList();
      if (mode === "research") {
        await projectAction(p, "research", {}, setMessage)
          .then((q) => {
            setProject(q);
            notify("Đã tìm và đọc tài liệu. Chọn nguồn để viết.");
          })
          .catch((e) => setError((e as Error).message));
      } else {
        await projectAction(p, "review", {}, setMessage)
          .then((q) => setProject(q))
          .catch((e) => setError((e as Error).message));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setMessage("");
    }
  }
  async function open(id: string) {
    try {
      setError("");
      setProject(await getProject(id));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function remove(id: string) {
    if (!window.confirm("Xóa phiên này và toàn bộ dữ liệu đã lưu?")) return;
    try {
      await deleteProject(id);
      if (project?.id === id) setProject(null);
      refreshList();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function viewSource(id: string) {
    const match = project?.sources.flatMap(s => (s.evidence || []).filter(e => e.id === id).map(e => ({ source: s, quote: e.quote }))).at(0);
    const s = match?.source || project?.sources.find((x) => x.nguon_id === id);
    if (s) { setFocusQuote(match?.quote || null); setSource(s); }
  }
  const affected = project?.sentences.filter((s) => s.needsRewrite).length || 0;
  const unverified = project?.sentences.filter((s) => s.needsVerification).length || 0;
  const pending = project?.findings.filter((f) => !f.decision).length || 0;
  const canApprove =
    project?.reviewStatus === "complete" &&
    !affected &&
    !unverified &&
    !project.findings.some((f) =>
      (f.category === "thieu-can-cu" && f.decision !== "accepted") ||
      (f.severity === "cao" && !f.decision),
    );
  function readAloud() {
    if (!project?.sentences.length) return;
    const voices = window.speechSynthesis?.getVoices() || [];
    const vi = voices.find((v) => v.lang.toLowerCase().startsWith("vi"));
    if (!vi) {
      setError(
        "Thiết bị chưa có giọng tiếng Việt. Bạn vẫn có thể đọc thử trên màn hình.",
      );
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      project.sentences.map((s) => s.text).join(" "),
    );
    u.voice = vi;
    u.lang = "vi-VN";
    u.onend = () => setSpoken(false);
    window.speechSynthesis.speak(u);
    setSpoken(true);
  }
  function findingView(f: Finding) {
    const s = project?.sentences.find((x) => x.id === f.sentenceId);
    return (
      <article key={f.id} className={`${card} space-y-3`}>
        <div className="flex flex-wrap items-center gap-2">
          <strong>{categoryLabel[f.category] || "Góp ý"}</strong>
          <span className="rounded bg-amber-100 px-2 py-1 text-xs">
            Mức độ cần sửa: {f.severity}
          </span>
          <span className="text-xs text-slate-500">Câu {s?.scene}</span>
        </div>
        <p>
          <span className="font-semibold">Đoạn nào:</span> {f.quote || s?.text}
        </p>
        <p>
          <span className="font-semibold">Vì sao:</span> {f.reason}
        </p>
        <p>
          <span className="font-semibold">Sửa thành gì:</span>{" "}
          {f.suggestion || "Cần tự kiểm tra"}
        </p>
        {f.replacement && (
          <p className="rounded-lg bg-indigo-50 p-3 text-sm">
            Nguyên văn trước: {f.quote}
            <br />
            Sau khi sửa: {f.replacement}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {f.decision ? (
            <>
              <span className="text-sm">
                {f.decision === "accepted" ? "Đã chấp nhận" : "Đã giữ nguyên"}
              </span>
              <button
                className={secondary}
                disabled={busy}
                onClick={() =>
                  run("decision", { findingId: f.id, decision: "undo" })
                }
              >
                Hoàn tác
              </button>
            </>
          ) : (
            <>
              <button
                className={button}
                disabled={busy || !f.replacement}
                title={!f.replacement ? "Góp ý này cần kiểm tra thủ công" : ""}
                onClick={() =>
                  run("decision", { findingId: f.id, decision: "accept" })
                }
              >
                Chấp nhận sửa
              </button>
              <button
                className={secondary}
                disabled={busy}
                onClick={() =>
                  run("decision", { findingId: f.id, decision: "reject" })
                }
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
    <div className="min-h-screen bg-slate-50 text-slate-800">
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
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800"
          >
            {error}{" "}
            <button className="ml-3 underline" onClick={() => setError("")}>
              Đóng
            </button>
          </div>
        )}
        {busy && (
          <div
            role="status"
            className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-800"
          >
            {message || "Đang xử lý…"}
          </div>
        )}
        {!project && (
          <>
            <section className="text-center">
              <h1 className="font-heading text-3xl font-extrabold">
                Soạn và rà soát kịch bản bài giảng
              </h1>
              <p className="mt-2 text-slate-600">
                Chọn công việc bạn muốn làm. Mỗi bước sẽ cho biết việc cần làm
                tiếp theo.
              </p>
            </section>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                className={`${card} text-left ${mode === "research" ? "border-indigo-500 ring-2 ring-indigo-100" : ""}`}
                onClick={() => setMode("research")}
              >
                <BookOpen className="mb-3 text-indigo-600" />
                <strong>Tìm nguồn và viết kịch bản</strong>
                <p className="text-sm text-slate-600">
                  Nhập bài học, chọn tài liệu rồi xem bản nháp.
                </p>
              </button>
              <button
                className={`${card} text-left ${mode === "qa" ? "border-indigo-500 ring-2 ring-indigo-100" : ""}`}
                onClick={() => setMode("qa")}
              >
                <FileCheck className="mb-3 text-indigo-600" />
                <strong>Rà soát kịch bản có sẵn</strong>
                <p className="text-sm text-slate-600">
                  Dán lời đọc, xem góp ý và chọn từng sửa đổi.
                </p>
              </button>
            </div>
            <section className={`${card} space-y-4`}>
              <h2 className="text-xl font-bold">
                {mode === "research" ? "Nhập bài học" : "Dán kịch bản"}
              </h2>
              {mode === "research" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    Chủ đề
                    <input
                      className={input}
                      value={brief.topic}
                      required
                      maxLength={300}
                      onChange={(e) =>
                        setBrief({ ...brief, topic: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Mục tiêu
                    <textarea
                      className={input}
                      value={brief.goal}
                      required
                      maxLength={2000}
                      onChange={(e) =>
                        setBrief({ ...brief, goal: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Người học
                    <input
                      className={input}
                      value={brief.audience}
                      required
                      maxLength={300}
                      onChange={(e) =>
                        setBrief({ ...brief, audience: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Thời lượng (phút)
                    <input
                      className={input}
                      type="number"
                      min="1"
                      max="120"
                      required
                      value={brief.duration}
                      onChange={(e) =>
                        setBrief({ ...brief, duration: e.target.value })
                      }
                    />
                  </label>
                </div>
              ) : (
                <label className="block">
                  Lời đọc, mỗi dòng một câu hoặc cảnh
                  <textarea
                    className={`${input} min-h-56`}
                    value={script}
                    maxLength={30000}
                    onChange={(e) => setScript(e.target.value)}
                  />
                </label>
              )}
              <button
                className={button}
                disabled={
                  busy ||
                  (mode === "research" ? !briefReady : !script.trim())
                }
                title={mode === "research" && !briefReady ? "Điền đủ chủ đề, mục tiêu, người học và thời lượng từ 1 đến 120 phút" : ""}
                onClick={start}
              >
                {mode === "research" ? "Tìm tài liệu" : "Xem góp ý"}
              </button>
              {mode === "research" && !briefReady && <p className="text-sm text-slate-500">Điền đủ chủ đề, mục tiêu, người học và thời lượng từ 1 đến 120 phút để tìm tài liệu.</p>}
            </section>
            <section className={card}>
              <h2 className="font-bold">Mở lại phiên làm việc</h2>
              {projects.length ? (
                <ul className="mt-3 divide-y">
                  {projects.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <button
                        className="text-left text-indigo-700 hover:underline"
                        onClick={() => open(p.id)}
                      >
                        {p.title}
                      </button>
                      <button
                        className="text-sm text-rose-700"
                        onClick={() => remove(p.id)}
                      >
                        Xóa
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  Chưa có phiên nào.
                </p>
              )}
            </section>
          </>
        )}
        {project && (
          <>
            <nav aria-label="Các bước" className="flex flex-wrap gap-2 text-sm">
              {(project.mode === "research"
                ? [
                    "Nhập bài học",
                    "Chọn tài liệu",
                    "Xem kịch bản",
                    "Duyệt và tải về",
                  ]
                : ["Dán kịch bản", "Xem góp ý", "Chọn sửa", "Tải về"]
              ).map((label, i) => (
                <button
                  key={label}
                  className={`rounded-full px-3 py-2 ${step === i + 1 ? "bg-indigo-600 text-white" : "bg-white text-slate-600"}`}
                  onClick={() => setStep(i + 1)}
                >
                  {i + 1}. {label}
                </button>
              ))}
            </nav>
            {project.mode === "research" && step === 1 && (
              <section className={card}>
                <h1 className="text-2xl font-bold">
                  Bài học: {project.brief.topic}
                </h1>
                <p className="mt-2">
                  Mục tiêu: {project.brief.goal || "Chưa nhập"} · Người học:{" "}
                  {project.brief.audience || "Chưa nhập"} ·{" "}
                  {project.brief.duration} phút
                </p>
                <button className={`${button} mt-4`} onClick={() => setStep(2)}>
                  Chọn tài liệu
                </button>
              </section>
            )}
            {project.mode === "research" && step === 2 && (
              <section className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold">Chọn tài liệu</h1>
                  <p className="text-sm text-slate-600">
                    Đọc lý do, mở đoạn làm căn cứ rồi chọn tài liệu trước khi
                    viết.
                  </p>
                </div>
                <div className={`${card} flex flex-wrap gap-2`}>
                  <button
                    className={secondary}
                    disabled={busy}
                    onClick={() => run("research")}
                  >
                    Tìm lại
                  </button>
                  <input
                    className={`${input} flex-1`}
                    type="url"
                    placeholder="https://..."
                    aria-label="URL tài liệu"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <button
                    className={secondary}
                    disabled={busy || !url}
                    onClick={() => {
                      run("add-source", { url });
                      setUrl("");
                    }}
                  >
                    Thêm URL
                  </button>
                </div>
                {project.sources.length ? (
                  project.sources.map((s) => (
                    <article className={card} key={s.nguon_id}>
                      <div className="flex flex-wrap justify-between gap-2">
                        <h2 className="font-bold">
                          {s.meta?.tieu_de || s.url}
                        </h2>
                        <span className="text-sm">
                          {statusLabel(s)} ·{" "}
                          {selected.includes(s.nguon_id)
                            ? "Bạn đã chọn"
                            : "Chưa chọn"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {s.meta?.tac_gia ||
                          s.meta?.to_chuc ||
                          "Không rõ tác giả"}{" "}
                        · {s.meta?.ngay_dang || "Không rõ ngày"}
                      </p>
                      <p className="mt-2 text-sm">
                        {s.ly_do || "Chưa có lý do đánh giá"}
                      </p>
                      {s.trich_dan?.[0] && (
                        <button
                          className="mt-2 text-left text-sm text-indigo-700 underline"
                          onClick={() => viewSource(s.nguon_id)}
                        >
                          Đoạn làm căn cứ: “{s.trich_dan[0].slice(0, 180)}”
                        </button>
                      )}
                      <div className="mt-3 flex gap-3">
                        <button
                          className={secondary}
                          onClick={() => viewSource(s.nguon_id)}
                        >
                          Xem nguồn
                        </button>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selected.includes(s.nguon_id)}
                            disabled={
                              !["dung", "dung-canh-bao"].includes(
                                s.trang_thai,
                              ) || !s.trich_dan?.length
                            }
                            title={
                              !s.trich_dan?.length
                                ? "Chưa có đoạn làm căn cứ khớp trang gốc"
                                : ""
                            }
                            onChange={(e) =>
                              setSelected(
                                e.target.checked
                                  ? [...selected, s.nguon_id]
                                  : selected.filter((x) => x !== s.nguon_id),
                              )
                            }
                          />
                          Chọn tài liệu
                        </label>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className={card}>
                    Chưa có tài liệu. Thử tìm lại hoặc thêm URL công khai.
                  </div>
                )}
                <div className={card}>
                  <p className="mb-3 text-sm">
                    Đã chọn {selected.length} tài liệu.{" "}
                    {affected
                      ? `${affected} câu bị ảnh hưởng nếu thay đổi nguồn.`
                      : ""}
                  </p>
                  <button
                    className={button}
                    disabled={busy || !selected.length}
                    title={
                      !selected.length
                        ? "Chọn ít nhất một tài liệu trước khi viết"
                        : ""
                    }
                    onClick={() =>
                      run("approve-sources", { sourceIds: selected })
                    }
                  >
                    Lưu tài liệu đã chọn
                  </button>
                  <button
                    className={`${secondary} ml-2`}
                    disabled={busy || project.sourceApprovalRevision === null}
                    onClick={() => setStep(3)}
                  >
                    Xem kịch bản
                  </button>
                </div>
              </section>
            )}
            {((project.mode === "research" && step === 3) ||
              (project.mode === "qa" && step === 2)) && (
              <section className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold">
                    {project.mode === "qa" ? "Xem góp ý" : "Xem kịch bản"}
                  </h1>
                  <p className="text-sm text-slate-600">
                    {project.mode === "qa"
                      ? "Góp ý về văn nói được tách khỏi kiểm chứng thông tin."
                      : "Đọc từng cảnh, mở nguồn ngay tại câu và sửa khi cần."}
                  </p>
                </div>
                {project.mode === "research" && !project.sentences.length && (
                  <button
                    className={button}
                    disabled={busy || project.sourceApprovalRevision === null}
                    title={
                      project.sourceApprovalRevision === null
                        ? "Chọn ít nhất một tài liệu trước khi viết"
                        : ""
                    }
                    onClick={() => run("generate")}
                  >
                    Viết kịch bản
                  </button>
                )}
                {project.sentences.map((s) => (
                  <article className={card} key={s.id}>
                    <h2 className="font-bold">
                      Cảnh {s.scene} · {s.seconds || 0} giây (ước tính)
                    </h2>
                    {editing === s.id ? (
                      <div className="mt-3 space-y-2">
                        <textarea
                          className={input}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                        />
                        <button
                          className={button}
                          disabled={busy || !editText.trim()}
                          onClick={async () => {
                            await run("edit-sentence", {
                              sentenceId: s.id,
                              text: editText,
                            });
                            setEditing(null);
                          }}
                        >
                          Lưu câu
                        </button>
                        <button
                          className={`${secondary} ml-2`}
                          onClick={() => setEditing(null)}
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="mt-3">{s.text}</p>
                        {s.needsRewrite && (
                          <p className="mt-2 text-amber-800">
                            Cần cập nhật: nguồn của câu đã thay đổi.
                          </p>
                        )}
                        {s.needsVerification && (
                          <p className="mt-2 text-amber-800">
                            Chưa đủ căn cứ: kiểm tra nguồn hoặc viết lại câu trước khi duyệt.
                          </p>
                        )}
                        <p className="mt-2 text-sm text-slate-500">
                          Gợi ý hình: {s.visual || "Chưa có"}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {s.evidenceIds.map((id) => (
                            <button
                              className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700"
                              key={id}
                              onClick={() => viewSource(id)}
                            >
                              {project.sources.find(source => (source.evidence || []).some(e => e.id === id))?.meta?.tieu_de?.slice(0, 28) || "Nguồn tài liệu"} ↗
                            </button>
                          ))}
                          <button
                            className={secondary}
                            onClick={() => {
                              setEditing(s.id);
                              setEditText(s.text);
                            }}
                          >
                            Sửa tay
                          </button>
                          {project.mode === "qa" && (
                            <button
                              className={secondary}
                              disabled={busy}
                              onClick={() => run("research", { sentenceId: s.id })}
                            >
                              Tìm nguồn kiểm chứng
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </article>
                ))}
                {project.mode === "qa" && project.sources.length > 0 && (
                  <section className={card}>
                    <h2 className="font-bold">Nguồn tài liệu đã tìm</h2>
                    <p className="mt-1 text-sm text-slate-600">Mở đoạn gốc để tự đối chiếu. Các câu vẫn ghi “Chưa kiểm tra nguồn thông tin” cho đến khi được kiểm chứng riêng.</p>
                    <ul className="mt-3 space-y-2">
                      {project.sources.map(s => <li key={s.nguon_id}><button className="text-left text-sm text-indigo-700 underline" onClick={() => viewSource(s.nguon_id)}>{s.meta?.tieu_de || s.url} · {statusLabel(s)}</button></li>)}
                    </ul>
                  </section>
                )}
                <div className={`${card} flex flex-wrap gap-2`}>
                  {affected > 0 && (
                    <button
                      className={button}
                      disabled={busy}
                      onClick={() => run("rewrite")}
                    >
                      Cập nhật {affected} câu
                    </button>
                  )}
                  <button
                    className={button}
                    disabled={busy || !project.sentences.length}
                    onClick={() => run("review")}
                  >
                    Rà soát lời đọc
                  </button>
                  <button
                    className={secondary}
                    disabled={!project.sentences.length}
                    onClick={() => setTeleprompter(true)}
                  >
                    <Play className="mr-1 inline size-4" />
                    Đọc thử
                  </button>
                  <button
                    className={secondary}
                    onClick={() => setStep(project.mode === "qa" ? 3 : 4)}
                  >
                    Xem góp ý và tải về
                  </button>
                </div>
              </section>
            )}
            {project.reviewStatus === "partial" &&
              pending > 0 &&
              ((project.mode === "research" && step === 4) ||
                (project.mode === "qa" && step === 3)) && (
                <p
                  role="status"
                  className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
                >
                  Có {pending} chỗ cần xem lại trong phần đã kiểm tra.
                </p>
              )}
            {((project.mode === "research" && step === 4) ||
              (project.mode === "qa" && step === 3)) && (
              <section className="space-y-4">
                <div>
                  <h1 className="text-2xl font-bold">
                    {project.mode === "qa" ? "Chọn sửa" : "Duyệt và tải về"}
                  </h1>
                  <p className="text-sm text-slate-600">
                    {project.reviewStatus === "complete"
                      ? pending
                        ? `Có ${pending} chỗ cần xem lại.`
                        : "Chưa thấy vấn đề cần sửa."
                      : project.reviewStatus === "partial"
                        ? "Đã kiểm tra một phần. Phần rà soát cách diễn đạt chưa chạy; liên hệ người quản trị."
                        : "Chưa rà soát xong. Chạy rà soát trước khi kết luận."}{" "}
                    {project.mode === "qa" && "Chưa kiểm tra nguồn thông tin."}
                  </p>
                </div>
                {project.findings.map(findingView)}
                <div className={`${card} flex flex-wrap gap-2`}>
                  <button
                    className={secondary}
                    onClick={() => setStep(project.mode === "qa" ? 2 : 3)}
                  >
                    Quay lại kịch bản
                  </button>
                  <button
                    className={button}
                    disabled={busy || !canApprove}
                    title={
                      !canApprove
                        ? "Cần hoàn tất rà soát và xử lý góp ý quan trọng"
                        : ""
                    }
                    onClick={() =>
                      run("decision", {
                        target: "project",
                        decision: "approve",
                      })
                    }
                  >
                    Duyệt bản này
                  </button>
                  <button
                    className={secondary}
                    onClick={() => setStep(project.mode === "qa" ? 4 : 4)}
                  >
                    Tải về
                  </button>
                </div>
              </section>
            )}
            {project.mode === "qa" && step === 4 && (
              <section className={`${card} space-y-4`}>
                <h1 className="text-2xl font-bold">Tải về</h1>
                <p>
                  {project.approvedRevision === project.revision
                    ? "Bản đã duyệt"
                    : `Bản nháp — còn ${pending + affected + unverified} chỗ cần kiểm tra`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={button}
                    onClick={() =>
                      download(
                        "kich-ban.md",
                        exportMarkdown(project),
                        "text/markdown;charset=utf-8",
                      )
                    }
                  >
                    <Download className="mr-1 inline size-4" />
                    Tải kịch bản
                  </button>
                  <button
                    className={secondary}
                    onClick={() =>
                      download(
                        "ho-so-nguon-audit.json",
                        JSON.stringify(
                          {
                            sources: project.sources,
                            claims: project.claims,
                            audit: project.audit,
                          },
                          null,
                          2,
                        ),
                        "application/json",
                      )
                    }
                  >
                    Tải hồ sơ nguồn và lịch sử
                  </button>
                </div>
              </section>
            )}
            {project.mode === "research" && step === 4 && (
              <section className={card}>
                <p className="mb-3">
                  {project.approvedRevision === project.revision
                    ? "Bản đã duyệt"
                    : `Bản nháp — còn ${pending + affected + unverified} chỗ cần kiểm tra`}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={button}
                    onClick={() =>
                      download(
                        "kich-ban.md",
                        exportMarkdown(project),
                        "text/markdown;charset=utf-8",
                      )
                    }
                  >
                    <Download className="mr-1 inline size-4" />
                    Tải kịch bản
                  </button>
                  <button
                    className={secondary}
                    onClick={() =>
                      download(
                        "ho-so-nguon-audit.json",
                        JSON.stringify(
                          {
                            sources: project.sources,
                            claims: project.claims,
                            audit: project.audit,
                          },
                          null,
                          2,
                        ),
                        "application/json",
                      )
                    }
                  >
                    Tải hồ sơ nguồn và lịch sử
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </main>
      {source && (
        <div
          role="dialog"
          tabIndex={-1}
          aria-modal="true"
          aria-label="Đoạn làm căn cứ"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSource(null);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex justify-between gap-3">
              <h2 className="text-xl font-bold">
                {source.meta?.tieu_de || "Nguồn tài liệu"}
              </h2>
              <button aria-label="Đóng" onClick={() => setSource(null)}>
                <X />
              </button>
            </div>
            <p className="mt-2 text-sm">
              {source.meta?.tac_gia ||
                source.meta?.to_chuc ||
                "Không rõ tác giả"}{" "}
              · {source.meta?.ngay_dang || "Không rõ ngày"}
            </p>
            <a
              className="mt-2 inline-flex items-center gap-1 text-indigo-700 underline"
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mở trang gốc <ExternalLink className="size-4" />
            </a>
            <p className="mt-3 text-sm">{source.ly_do}</p>
            <h3 className="mt-4 font-bold">Đoạn làm căn cứ</h3>
            {source.trich_dan?.length ? (
              [...source.trich_dan].sort((a, b) => a === focusQuote ? -1 : b === focusQuote ? 1 : 0).map((q, i) => (
                <blockquote
                  key={i}
                  className={`my-2 border-l-4 p-3 ${q === focusQuote ? 'border-indigo-700 bg-indigo-100' : 'border-indigo-400 bg-indigo-50'}`}
                >
                  {q}
                </blockquote>
              ))
            ) : (
              <p>Chưa có đoạn trích hợp lệ.</p>
            )}
            <details className="mt-4">
              <summary className="cursor-pointer">
                Xem bản văn đã đọc và mã đối chiếu
              </summary>
              <p className="break-all text-xs">
                SHA-256: {source.snapshot_hash || "Không có"}
              </p>
              <pre className="mt-2 whitespace-pre-wrap text-sm">
                {source.snapshot || "Không đọc được nội dung"}
              </pre>
            </details>
          </div>
        </div>
      )}
      {teleprompter && project && (
        <div
          role="dialog"
          tabIndex={-1}
          aria-modal="true"
          aria-label="Đọc thử"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-slate-900 p-8 text-white">
            <div className="flex justify-between">
              <h2 className="text-xl font-bold">Đọc thử kịch bản</h2>
              <button
                aria-label="Đóng"
                onClick={() => {
                  setTeleprompter(false);
                  window.speechSynthesis?.cancel();
                }}
              >
                <X />
              </button>
            </div>
            <div className="mt-6 space-y-5 text-2xl leading-relaxed">
              {project.sentences.map((s) => (
                <p key={s.id}>{s.text}</p>
              ))}
            </div>
            <button
              className={`${button} mt-6`}
              onClick={() =>
                spoken
                  ? (window.speechSynthesis.cancel(), setSpoken(false))
                  : readAloud()
              }
            >
              {spoken ? "Dừng đọc" : "Nghe giọng Việt"}
            </button>
          </div>
        </div>
      )}
      <Toast message={toast} />
    </div>
  );
}
