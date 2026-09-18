import { useEffect, useState, type FormEvent } from "react";
import { BookOpen, Check, ClipboardList, LogOut, MessageSquare, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createFeedback, decideFeedback, deleteFeedback, listFeedback, updateFeedback,
  type Feedback, type User,
} from "../api";

const demo = {
  teacher: { email: "giangvien@gmail.com", password: "GiangVien@2026" },
  student: { email: "hocsinh@gmail.com", password: "HocSinh@2026" },
};
const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
const statusText = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Đã từ chối" };
const statusClass = { pending: "bg-amber-50 text-amber-800", approved: "bg-emerald-50 text-emerald-800", rejected: "bg-rose-50 text-rose-800" };

export function LoginScreen({ onLogin }: { onLogin: (email: string, password: string, role: User["role"]) => Promise<void> }) {
  const [role, setRole] = useState<User["role"]>("teacher");
  const [email, setEmail] = useState(demo.teacher.email);
  const [password, setPassword] = useState(demo.teacher.password);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const choose = (next: User["role"]) => {
    setRole(next); setEmail(demo[next].email); setPassword(demo[next].password); setError("");
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try { await onLogin(email, password, role); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,#dbeafe,transparent_35%),#f6f8fb] px-4 py-12 text-slate-900">
      <div className="mx-auto grid min-h-[80vh] max-w-6xl overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-2xl shadow-indigo-900/10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between bg-slate-950 p-8 text-white sm:p-12">
          <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-500"><BookOpen className="size-6" /></span><span className="font-heading text-2xl font-extrabold">ScriptScout</span></div>
          <div className="py-14"><p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">Không gian bài giảng</p><h1 className="max-w-xl font-heading text-4xl font-black leading-tight sm:text-5xl">Một kịch bản tốt hơn bắt đầu từ góp ý được lắng nghe.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">Giảng viên rà soát nội dung. Học sinh gửi góp ý và theo dõi quyết định duyệt.</p></div>
          <p className="text-sm text-slate-400">Nghiên cứu nguồn · Viết kịch bản · Góp ý có kiểm duyệt</p>
        </section>
        <section className="flex flex-col justify-center p-7 sm:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-600">Đăng nhập</p>
          <h2 className="mt-2 font-heading text-3xl font-black">Chọn vai trò của bạn</h2>
          <div className="mt-8 grid grid-cols-2 rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Vai trò đăng nhập">
            {(["teacher", "student"] as const).map((item) => <button key={item} role="tab" aria-selected={role === item} className={`rounded-xl px-3 py-3 text-sm font-bold transition ${role === item ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`} onClick={() => choose(item)}>{item === "teacher" ? "Giảng viên" : "Học sinh / sinh viên"}</button>)}
          </div>
          <form onSubmit={submit} className="mt-7 space-y-5">
            <label className="block"><span className="mb-2 block text-sm font-bold">Gmail</span><input className={inputClass} type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label className="block"><span className="mb-2 block text-sm font-bold">Mật khẩu</span><input className={inputClass} type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <p className="rounded-xl bg-indigo-50 p-3 text-xs leading-5 text-indigo-800">Tài khoản demo đã được điền sẵn cho vai trò đang chọn. Có thể sửa trước khi đăng nhập.</p>
            {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-slate-950 px-5 py-3.5 font-bold text-white transition hover:bg-indigo-800 disabled:opacity-60">{busy ? "Đang đăng nhập..." : `Vào trang ${role === "teacher" ? "giảng viên" : "học sinh"}`}</button>
          </form>
        </section>
      </div>
    </main>
  );
}

export function StudentPortal({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [items, setItems] = useState<Feedback[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const refresh = () => listFeedback().then(setItems).catch((err) => setError((err as Error).message));
  useEffect(() => { refresh(); }, []);
  const reset = () => { setEditing(null); setTitle(""); setContent(""); };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (editing) await updateFeedback(editing, { title, content });
      else await createFeedback({ title, content });
      reset(); setNotice("Đã gửi góp ý. Giảng viên sẽ xem và duyệt."); await refresh();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    if (!window.confirm("Xóa góp ý này?")) return;
    setBusy(true); setError("");
    try { await deleteFeedback(id); if (editing === id) reset(); await refresh(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white"><MessageSquare className="size-5" /></span><div><strong className="font-heading text-xl">ScriptScout</strong><p className="text-xs text-slate-500">Góc góp ý của học sinh</p></div></div><div className="flex items-center gap-3"><span className="hidden text-sm text-slate-500 sm:inline">{user.email}</span><button onClick={onLogout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"><LogOut className="size-4" />Đăng xuất</button></div></div></header>
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="h-fit rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2 text-indigo-700"><Plus className="size-5" /><span className="text-xs font-bold uppercase tracking-[0.16em]">{editing ? "Sửa góp ý" : "Góp ý mới"}</span></div><h1 className="mt-3 font-heading text-2xl font-black">Chia sẻ điều cần cải thiện</h1><p className="mt-2 text-sm leading-6 text-slate-600">Nêu rõ câu hoặc phần kịch bản bạn muốn giảng viên xem lại. Góp ý được duyệt sẽ hỗ trợ lượt rà soát tiếp theo.</p>
          <form onSubmit={submit} className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-sm font-bold">Tiêu đề</span><input className={inputClass} maxLength={120} required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Câu giải thích ở phần mở đầu" /></label><label className="block"><span className="mb-2 block text-sm font-bold">Nội dung góp ý</span><textarea className={`${inputClass} min-h-44 resize-y`} maxLength={2000} required value={content} onChange={(event) => setContent(event.target.value)} placeholder="Đoạn nào cần sửa? Vì sao? Bạn đề xuất cách diễn đạt nào?" /></label><div className="flex gap-2"><button disabled={busy} className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-indigo-800 disabled:opacity-60">{editing ? "Lưu và gửi duyệt lại" : "Gửi góp ý"}</button>{editing && <button type="button" onClick={reset} className="rounded-xl border border-slate-200 px-4 py-3 font-semibold">Hủy sửa</button>}</div></form>
          {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}{notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
        </section>
        <section><div className="mb-4 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Lịch sử của bạn</p><h2 className="mt-1 font-heading text-2xl font-black">Góp ý đã gửi</h2></div><span className="text-sm text-slate-500">{items.length} góp ý</span></div><div className="space-y-3">{items.length ? items.map((item) => <article key={item.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><h3 className="font-bold">{item.title}</h3><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusClass[item.status]}`}>{statusText[item.status]}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.content}</p><p className="mt-3 text-xs text-slate-400">Cập nhật {new Date(item.updatedAt).toLocaleString("vi-VN")}</p><div className="mt-4 flex gap-2"><button disabled={busy} onClick={() => { setEditing(item.id); setTitle(item.title); setContent(item.content); setNotice(""); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"><Pencil className="size-4" />Sửa</button><button disabled={busy} onClick={() => remove(item.id)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"><Trash2 className="size-4" />Xóa</button></div></article>) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Bạn chưa gửi góp ý nào.</div>}</div></section>
      </main>
    </div>
  );
}

export function TeacherFeedbackPanel() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const refresh = () => listFeedback().then(setItems).catch((err) => setError((err as Error).message));
  useEffect(() => { refresh(); }, []);
  const decide = async (id: string, decision: "approved" | "rejected") => {
    setBusyId(id); setError("");
    try { await decideFeedback(id, decision); await refresh(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusyId(null); }
  };
  const pending = items.filter((item) => item.status === "pending");
  const reviewed = items.filter((item) => item.status !== "pending");
  return <section className="rounded-[1.75rem] border border-indigo-100 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="teacher-feedback-title"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-indigo-700"><ClipboardList className="size-5" /><p className="text-xs font-bold uppercase tracking-[0.16em]">Góp ý từ học sinh</p></div><h2 id="teacher-feedback-title" className="mt-2 font-heading text-xl font-black">Duyệt trước khi rà soát kịch bản</h2><p className="mt-1 text-sm text-slate-600">Góp ý được duyệt sẽ được gửi vào agent khi bạn chọn “Rà soát kịch bản có sẵn”.</p></div><button onClick={refresh} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Làm mới</button></div>{error && <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}<div className="mt-5 grid gap-3 md:grid-cols-2">{pending.length ? pending.map((item) => <article key={item.id} className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4"><div className="flex justify-between gap-2"><h3 className="font-bold">{item.title}</h3><span className="text-xs font-bold text-amber-700">Chờ duyệt</span></div><p className="mt-1 text-xs text-slate-500">{item.authorEmail}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.content}</p><div className="mt-4 flex gap-2"><button disabled={busyId === item.id} onClick={() => decide(item.id, "approved")} className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><Check className="size-4" />Duyệt</button><button disabled={busyId === item.id} onClick={() => decide(item.id, "rejected")} className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-sm font-bold text-rose-700 disabled:opacity-50"><X className="size-4" />Từ chối</button></div></article>) : <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Chưa có góp ý mới cần duyệt.</div>}</div>{reviewed.length > 0 && <details className="mt-5 border-t border-slate-200 pt-4"><summary className="cursor-pointer text-sm font-bold text-slate-700">Đã xử lý ({reviewed.length}) · {reviewed.filter((item) => item.status === "approved").length} góp ý đang dùng khi rà soát</summary><div className="mt-3 space-y-2">{reviewed.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-sm"><span><strong>{item.title}</strong> · {item.content}</span><span className={`rounded-full px-2 py-1 text-xs font-bold ${statusClass[item.status]}`}>{statusText[item.status]}</span></div>)}</div></details>}</section>;
}
