#!/usr/bin/env node
// run.js — chạy trọn bộ golden set qua chính prototype, rồi in bảng kết quả.
//
//   node eval/run.js                      → chạy với LLM_PROVIDER hiện tại
//   LLM_PROVIDER=stub node eval/run.js    → chạy offline, đáp án dựng sẵn (mặc định)
//   LLM_PROVIDER=gemini LLM_API_KEY=... node eval/run.js
//
// Runner gọi ĐÚNG những hàm mà UI gọi. Không có nhánh riêng cho eval.
// Đó là lý do bộ fixture phải là tham số của scrape(), không phải một chế độ demo.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CANDIDATE_CODEBASE = join(ROOT, "codebase", "src", "codebase");
const CODEBASE = existsSync(CANDIDATE_CODEBASE) ? CANDIDATE_CODEBASE : join(ROOT, "codebase");
const FIXTURES = join(CODEBASE, "fixtures", "pages");

// pathToFileURL là bắt buộc: trên Windows, import("C:\\Users\\...") ném
// ERR_UNSUPPORTED_ESM_URL_SCHEME. Phải đổi sang file:// thì mới nạp được module.
const mod = (p) => import(pathToFileURL(join(CODEBASE, "src", p)).href);
const { quyetDinhNguon, gomFact, soatVanNoi } = await mod("pipeline.js");
const { cauQuaDai, doXungHo, claimThieuCanCu, demAmTiet } = await mod("rules.js");
const { scrape } = await mod("scrape.js");
// Lấy provider TỪ CHÍNH llm.js, không tự đọc process.env.
// Nếu run.js tự đọc thì header in ra có thể khác thứ llm.js thật sự dùng —
// đã xảy ra một lần: header báo "gemini" trong khi lời gọi đi vào stub.
const { provider: layProvider } = await mod("llm.js");

const CHU_DE = "Khi nào nên cho trợ lý tra cứu tài liệu thay vì nhồi hết vào câu hỏi";

/* ───────── từng loại kiểm ───────── */

const KIEM = {
  async "nguon"(c) {
    const r = await quyetDinhNguon(c.dau_vao.url, { chu_de: CHU_DE, fixtures: FIXTURES });
    const m = c.mong_doi, loi = [];
    if (m.trang_thai && r.trang_thai !== m.trang_thai) loi.push(`trang_thai=${r.trang_thai}, cần ${m.trang_thai}`);
    if (m.do_tin_cay && r.do_tin_cay !== m.do_tin_cay) loi.push(`do_tin_cay=${r.do_tin_cay}, cần ${m.do_tin_cay}`);
    if (m.co_cach_ly !== undefined && (r.cach_ly.length > 0) !== m.co_cach_ly) loi.push(`cach_ly=${r.cach_ly.length}`);
    if (m.ai_da_goi !== undefined && r.ai_da_goi !== m.ai_da_goi) loi.push(`ai_da_goi=${r.ai_da_goi}, cần ${m.ai_da_goi}`);
    for (const k of [1, 2, 3, 4, 5]) {
      const key = `tieu_chi_${k}`;
      if (m[key] !== undefined && r.diem_tieu_chi[k - 1] !== m[key])
        loi.push(`TC${k}=${r.diem_tieu_chi[k - 1]}, cần ${m[key]}`);
    }
    return { dat: loi.length === 0, loi, thuc_te: { trang_thai: r.trang_thai, diem: r.diem_tieu_chi, cach_ly: r.cach_ly.length, ai: r.ai_da_goi } };
  },

  async "trich-dan-khop"(c) {
    const r = await quyetDinhNguon(c.dau_vao.url, { chu_de: CHU_DE, fixtures: FIXTURES });
    const trang = await scrape(c.dau_vao.url, { fixtures: FIXTURES });
    const chuan = (s) => String(s).replace(/\s+/g, " ").trim();
    const kho = chuan(trang.text);
    const hong = (r.trich_dan || []).filter(t => !kho.includes(chuan(t)));
    return {
      dat: r.trich_dan.length > 0 && hong.length === 0,
      loi: hong.length ? [`${hong.length}/${r.trich_dan.length} đoạn trích KHÔNG khớp nguyên văn trang`]
           : (r.trich_dan.length ? [] : ["không có đoạn trích nào"]),
      thuc_te: { so_trich_dan: r.trich_dan.length, so_hong: hong.length },
    };
  },

  async "fact"(c) {
    const { facts } = gomFact(c.dau_vao.facts, c.dau_vao.nguon);
    const f = Object.values(facts)[0];
    const m = c.mong_doi, loi = [];
    if (m.trang_thai && f.trang_thai !== m.trang_thai) loi.push(`trang_thai=${f.trang_thai}, cần ${m.trang_thai}`);
    if (m.so_nguon !== undefined && f.so_nguon !== m.so_nguon) loi.push(`so_nguon=${f.so_nguon}`);
    if (m.co_mau_thuan !== undefined && !!f.mau_thuan !== m.co_mau_thuan) loi.push(`mau_thuan=${!!f.mau_thuan}`);
    return { dat: loi.length === 0, loi, thuc_te: { trang_thai: f.trang_thai, so_nguon: f.so_nguon, mau_thuan: !!f.mau_thuan } };
  },

  async "cau-dai"(c) {
    const n = demAmTiet(c.dau_vao.loi);
    const f = cauQuaDai(c.dau_vao.loi);
    const m = c.mong_doi, loi = [];
    if (m.am_tiet !== undefined && n !== m.am_tiet) loi.push(`đếm được ${n} âm tiết, cần ${m.am_tiet}`);
    if (m.co_finding !== undefined && !!f !== m.co_finding) loi.push(`co_finding=${!!f}, cần ${m.co_finding}`);
    return { dat: loi.length === 0, loi, thuc_te: { am_tiet: n, co_finding: !!f } };
  },

  async "xung-ho"(c) {
    const fs = doXungHo(c.dau_vao.cau);
    const m = c.mong_doi, loi = [];
    if (m.so_finding !== undefined && fs.length !== m.so_finding) loi.push(`${fs.length} finding, cần ${m.so_finding}`);
    if (m.cau_bi_bao !== undefined && !fs.some(f => f.cau === m.cau_bi_bao)) loi.push(`không báo câu ${m.cau_bi_bao}`);
    return { dat: loi.length === 0, loi, thuc_te: { so_finding: fs.length, cac_cau: fs.map(f => f.cau) } };
  },

  async "claim"(c) {
    const dung = new Set(c.dau_vao.nguon_dang_dung);
    const fs = claimThieuCanCu(c.dau_vao.cau, c.dau_vao.facts, dung);
    const m = c.mong_doi, loi = [];
    if (m.co_finding !== undefined && (fs.length > 0) !== m.co_finding) loi.push(`${fs.length} finding`);
    if (m.quote_chua && !fs.some(f => String(f.quote).includes(m.quote_chua)))
      loi.push(`không có finding nào chứa "${m.quote_chua}"`);
    return { dat: loi.length === 0, loi, thuc_te: { quotes: fs.map(f => f.quote) } };
  },

  async "soat-drop"(c) {
    const { findings, boFinding } = await soatVanNoi(c.dau_vao.cau, {}, new Set());
    const tuAi = findings.filter(f => f.nguon_bat === "ai").length;
    const m = c.mong_doi, loi = [];
    if (m.so_finding_bi_vut !== undefined && boFinding.length !== m.so_finding_bi_vut)
      loi.push(`vứt ${boFinding.length}, cần ${m.so_finding_bi_vut}`);
    if (m.so_finding_giu_tu_ai !== undefined && tuAi !== m.so_finding_giu_tu_ai)
      loi.push(`giữ ${tuAi} finding từ AI, cần ${m.so_finding_giu_tu_ai}`);
    return { dat: loi.length === 0, loi, thuc_te: { bi_vut: boFinding.length, giu_tu_ai: tuAi } };
  },
};

/* ───────── chạy ───────── */

const gs = JSON.parse(await readFile(join(HERE, "golden_set.json"), "utf8"));
const provider = layProvider();   // KHÔNG hardcode khoá ở đây. Khoá đặt trong codebase/.env
const ketQua = [];

console.log(`\nChạy ${gs.cases.length} case · provider = ${provider}\n`);

for (const c of gs.cases) {
  let r;
  try {
    r = await KIEM[c.loai_kiem](c);
  } catch (e) {
    r = { dat: false, loi: [`NGOẠI LỆ: ${e.message}`], thuc_te: null };
  }
  ketQua.push({ ...c, ...r });
  console.log(`${r.dat ? "✓" : "✗"} ${c.id} [${c.lop}] ${c.ten}${r.dat ? "" : "\n      → " + r.loi.join(" · ")}`);
}

const dat = ketQua.filter(r => r.dat).length;
const tyLe = Math.round((dat / ketQua.length) * 1000) / 10;
const bar = gs.quality_bar.nguong;
const lop3Hong = ketQua.filter(r => r.lop === "③" && !r.dat);

console.log(`\n${dat}/${ketQua.length} đạt = ${tyLe}%  ·  quality bar ${bar}%  ·  ${tyLe >= bar ? "ĐẠT" : "CHƯA ĐẠT"}`);
if (lop3Hong.length) console.log(`⚠ ${lop3Hong.length} case lớp ③ thất bại — vi phạm điều kiện cứng.`);

/* ───────── xuất bảng ───────── */

const theoLop = {};
for (const r of ketQua) {
  theoLop[r.lop] ??= { tong: 0, dat: 0 };
  theoLop[r.lop].tong++;
  if (r.dat) theoLop[r.lop].dat++;
}

const md = [
  `# Kết quả chạy golden set — lượt 1`,
  ``,
  `Nhóm 3A · đề C3 (ScriptScout) tích hợp C2 · pipeline v2`,
  ``,
  `| | |`,
  `|---|---|`,
  `| Ngày chạy | ${new Date().toISOString().slice(0, 16).replace("T", " ")} |`,
  `| Provider | \`${provider}\` |`,
  `| Số case | ${ketQua.length} |`,
  `| Đạt | **${dat}** |`,
  `| Không đạt | ${ketQua.length - dat} |`,
  `| Tỷ lệ | **${tyLe}%** |`,
  `| Quality bar | ${bar}% — ${tyLe >= bar ? "**ĐẠT**" : "**CHƯA ĐẠT**"} |`,
  `| Điều kiện cứng | ${lop3Hong.length === 0 ? "**ĐẠT** — không case lớp ③ nào thất bại" : `**VI PHẠM** — ${lop3Hong.length} case lớp ③ thất bại`} |`,
  ``,
  `## Theo lớp chỗ khó`,
  ``,
  `| Lớp | Đạt / Tổng | Tỷ lệ |`,
  `|---|---|---|`,
  ...Object.entries(theoLop).map(([l, v]) =>
    `| ${l} | ${v.dat} / ${v.tong} | ${Math.round(v.dat / v.tong * 100)}% |`),
  ``,
  `## Toàn bộ case`,
  ``,
  `| ID | Lớp | Tên | Kết quả | Thực tế |`,
  `|---|---|---|---|---|`,
  ...ketQua.map(r =>
    `| ${r.id} | ${r.lop} | ${r.ten} | ${r.dat ? "✓ đạt" : "✗ **không đạt**"} | ${r.dat ? "—" : r.loi.join("; ")} |`),
  ``,
  `## Case lấy từ dữ liệu thật`,
  ``,
  `${ketQua.filter(r => r.nguon_du_lieu).length}/${ketQua.length} case xây từ dữ liệu thật trong \`data/\`, trích bằng mã câu và mã đoạn theo đúng luật bảo mật data pack (không sao nguyên file vào repo).`,
  ``,
  `| ID | Nguồn dữ liệu |`,
  `|---|---|`,
  ...ketQua.filter(r => r.nguon_du_lieu).map(r => `| ${r.id} | \`${r.nguon_du_lieu}\` |`),
  ``,
  `## Case cần chạy lại bằng khoá thật`,
  ``,
  `${ketQua.filter(r => r.can_khoa_that).length} case phụ thuộc phán đoán của model, lượt này chạy bằng đáp án dựng sẵn:`,
  ``,
  ...ketQua.filter(r => r.can_khoa_that).map(r => `- **${r.id}** — ${r.ten}`),
  ``,
  ...(ketQua.filter(r => !r.dat).length ? [
    `## Phân tích nguyên nhân case không đạt`,
    ``,
    ...ketQua.filter(r => !r.dat).flatMap(r => [
      `### ${r.id} · ${r.ten}`,
      ``,
      `- **Lớp:** ${r.lop}`,
      `- **Sai ở đâu:** ${r.loi.join("; ")}`,
      `- **Thực tế nhận được:** \`${JSON.stringify(r.thuc_te)}\``,
      `- **Vì sao case này tồn tại:** ${r.vi_sao || "—"}`,
      ``,
    ]),
  ] : [`## Phân tích`, ``, `Lượt này không có case nào thất bại.`, ``]),
].join("\n");

await writeFile(join(HERE, "run_results.md"), md, "utf8");
await writeFile(join(HERE, "run_results.json"), JSON.stringify({
  ngay: new Date().toISOString(), provider, tong: ketQua.length, dat, ty_le: tyLe,
  quality_bar: bar, dat_bar: tyLe >= bar, lop_3_hong: lop3Hong.length,
  cases: ketQua.map(r => ({ id: r.id, lop: r.lop, dat: r.dat, loi: r.loi, thuc_te: r.thuc_te })),
}, null, 2), "utf8");

console.log(`\nĐã ghi eval/run_results.md và eval/run_results.json\n`);
// process.exitCode, KHÔNG process.exit() — trên Windows, exit giữa lúc file trace
// đang ghi gây "Assertion failed ... UV_HANDLE_CLOSING".
process.exitCode = lop3Hong.length ? 1 : 0;
