#!/usr/bin/env node
// soat-an-toan.js — soát trước khi push. Chạy: node soat-an-toan.js
//
// Viết bằng Node chứ không phải PowerShell, vì .ps1 không có BOM thì Windows
// PowerShell 5.1 đọc bằng bảng mã ANSI và vỡ ngay ở ký tự tiếng Việt đầu tiên.
// Node đọc file nguồn là UTF-8 mặc định trên mọi hệ.
//
// Bốn thứ được soát, theo đúng thứ tự nguy hiểm giảm dần:
//   1. .git có đúng nằm ở nhom-c3 không   ← nguy hiểm nhất: push nhầm repo BTC
//   2. file data pack lọt vào thư mục nộp bài
//   3. chuỗi trông giống khoá API trong file nguồn
//   4. .env bị git theo dõi

import { readdir, readFile, stat } from "node:fs/promises";
import { join, dirname, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = dirname(fileURLToPath(import.meta.url));
const loi = [];

const inRa = (ok, nhan, chiTiet = "") =>
  console.log(`  ${ok ? "✓" : "✗"} ${nhan}${chiTiet ? `\n      ${chiTiet}` : ""}`);

/* ── 1 · git root ─────────────────────────────────────────────────── */

function soatGitRoot() {
  let top;
  try {
    top = execSync("git rev-parse --show-toplevel", { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] })
      .toString().trim();
  } catch {
    inRa(true, "Chưa có repo git nào ở đây — chưa có gì để lộ.",
         "Khi nào nộp thì: git init ngay tại nhom-c3 (xem AN-TOAN-DU-LIEU.md).");
    return null;
  }
  const dungCho = basename(top) === basename(ROOT);
  if (dungCho) {
    inRa(true, `Repo git nằm đúng tại ${basename(top)}`);
  } else {
    inRa(false, `NGUY HIỂM: repo git nằm ở "${top}"`,
      "Đó là bản clone của ban tổ chức, có cả data/. Push repo này là lộ toàn bộ data pack.\n" +
      "      Cách xử lý: cd nhom-c3 && git init  → xem AN-TOAN-DU-LIEU.md");
    loi.push("git root sai chỗ");
  }
  return top;
}

/* ── 2 · file data pack lọt vào thư mục nộp bài ───────────────────── */

const THU_MUC_PACK = ["vlearn-pack", "studio-pack", "discord-pack", "data", "further-reading"];
const TEN_FILE_PACK = [
  /^transcript-\d+-clean\.md$/i, /^tutor_turns\.csv$/i, /^k4_messages\.csv$/i,
  /^k4_daily_reports\.md$/i, /^d\d-slide-hackathon\.pdf$/i, /^transcript-d1\.txt$/i,
  /^kich-ban-d1\./i, /^loi-doc-d1-/i, /^cau-timecode-d1\./i, /\.mp4$/i,
];
const BO_QUA = new Set(["node_modules", ".git", "traces"]);

async function quet(dir, ra = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (BO_QUA.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (THU_MUC_PACK.includes(e.name.toLowerCase())) ra.push({ p, vi: "thư mục của data pack" });
      await quet(p, ra);
    } else if (TEN_FILE_PACK.some(r => r.test(e.name))) {
      ra.push({ p, vi: "tên file trùng file trong data pack" });
    }
  }
  return ra;
}

async function soatDataPack() {
  const hit = await quet(ROOT);
  if (!hit.length) return inRa(true, "Không có file nào của data pack nằm trong thư mục nộp bài");
  inRa(false, `Có ${hit.length} thứ trông như data pack của BTC trong thư mục nộp bài`);
  hit.forEach(h => console.log(`      ${relative(ROOT, h.p)}  (${h.vi})`));
  console.log("      .gitignore đã chặn, nhưng đừng để ở đây: một lần git add -f là lọt.");
  loi.push("data pack nằm trong thư mục nộp bài");
}

/* ── 3 · khoá API trong file nguồn ────────────────────────────────── */

const MAU_KHOA = [
  { ten: "Google AI (Gemini)", re: /AIza[0-9A-Za-z_-]{30,}/ },
  { ten: "Anthropic",          re: /sk-ant-[0-9A-Za-z_-]{20,}/ },
  { ten: "OpenAI",             re: /sk-(?!or-)(?:proj-)?[0-9A-Za-z_-]{30,}/ },
  { ten: "OpenRouter",         re: /sk-or-v1-[0-9a-f]{30,}/ },
];
const DUOI = new Set([".js", ".mjs", ".json", ".md", ".html", ".ps1", ".txt", ".yml", ".yaml"]);

async function quetKhoa(dir, ra = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (BO_QUA.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) { await quetKhoa(p, ra); continue; }
    if (e.name === ".env") continue;                       // .env là chỗ ĐÚNG để chứa khoá
    // .env.example ĐƯỢC commit, nên phải soát — nó không có đuôi trong danh sách trên.
    const phaiSoat = e.name === ".env.example" || [...DUOI].some(d => e.name.endsWith(d));
    if (!phaiSoat) continue;
    if ((await stat(p)).size > 2_000_000) continue;
    const s = await readFile(p, "utf8").catch(() => "");
    for (const m of MAU_KHOA) {
      const hit = s.match(m.re);
      // .env.example được commit, nên ở đó có khoá là lỗi nặng chứ không phải ngoại lệ.
      if (hit) ra.push({ p, ten: m.ten, doan: hit[0].slice(0, 12) + "…" });
    }
  }
  return ra;
}

async function soatKhoa() {
  const hit = await quetKhoa(ROOT);
  if (!hit.length) return inRa(true, "Không có chuỗi nào trông giống khoá API trong file được commit");
  inRa(false, `Có ${hit.length} chỗ trông giống khoá API`);
  hit.forEach(h => console.log(`      ${relative(ROOT, h.p)}  → ${h.ten}: ${h.doan}`));
  console.log("      Xoá khoá khỏi file VÀ thu hồi khoá đó — git giữ lịch sử, xoá sau vẫn tra lại được.");
  loi.push("khoá API trong file nguồn");
}

/* ── 4 · .env có bị theo dõi không ────────────────────────────────── */

function soatEnv(top) {
  if (!top) return;
  let ra = "";
  try {
    // Chạy từ GỐC repo, không phải từ ROOT: đứng trong nhom-c3 thì git ls-files
    // chỉ liệt kê file trong nhom-c3, và data/ ở thư mục cha sẽ không hiện ra.
    ra = execSync("git ls-files", { cwd: top, stdio: ["ignore", "pipe", "ignore"] }).toString();
  } catch { return; }
  const xau = ra.split("\n").filter(f => /(^|\/)\.env$/.test(f.trim()));
  if (xau.length) {
    inRa(false, ".env ĐANG bị git theo dõi", `      ${xau.join("\n      ")}\n` +
      "      Gỡ ra: git rm --cached codebase/.env   rồi commit lại.");
    loi.push(".env bị theo dõi");
  } else {
    inRa(true, ".env không bị git theo dõi");
  }
  const packTrackedName = ra.split("\n").filter(f => /(^|\/)(data|vlearn-pack|studio-pack|discord-pack)\//.test(f));
  if (packTrackedName.length) {
    inRa(false, `${packTrackedName.length} file của data pack ĐANG bị git theo dõi`,
      "      .gitignore không gỡ được file đã theo dõi. Xem AN-TOAN-DU-LIEU.md.");
    loi.push("data pack đang bị theo dõi");
  }
}

/* ── chạy ─────────────────────────────────────────────────────────── */

console.log("\n  Soát an toàn trước khi push — nhom-c3\n");
const top = soatGitRoot();
await soatDataPack();
await soatKhoa();
soatEnv(top);

console.log();
if (loi.length) {
  console.log(`  ✗ ${loi.length} vấn đề: ${loi.join(" · ")}`);
  console.log("  CHƯA ĐƯỢC PUSH. Xử lý xong rồi chạy lại.\n");
  process.exitCode = 1;            // không dùng process.exit(): cắt ngang I/O đang ghi
} else {
  console.log("  ✓ Sạch. Push được.\n");
}
