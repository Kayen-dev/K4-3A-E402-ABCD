// verify-btc-eval.js
// Kiểm tra CẤU TRÚC của golden set và kết quả chạy theo checklist CP3/R4 của BTC.
// Script này không chạy model, không sửa golden_set.json hay run_results.*.

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(await readFile(join(HERE, "golden_set.json"), "utf8"));
const results = JSON.parse(await readFile(join(HERE, "run_results.json"), "utf8"));
const cases = golden.cases || [];
const rows = results.cases || [];

const count = (predicate) => cases.filter(predicate).length;
const resultById = new Map(rows.map((row) => [row.id, row]));
const report = [];

function check(label, ok, detail) {
  report.push({ label, ok, detail });
}

// R4: >=20 case; >=2 case cho từng lớp chỗ khó; 8–10 thường; 2–4 hiếm.
check("Ít nhất 20 case", cases.length >= 20, `${cases.length} case`);
for (const layer of ["①", "②", "③", "④"]) {
  const n = count((test) => test.lop === layer);
  check(`Lớp ${layer} có ít nhất 2 case`, n >= 2, `${n} case`);
}

const normal = count((test) => test.lop === "thường");
const rare = count((test) => test.lop === "hiếm");
check("Case thường: 8–10", normal >= 8 && normal <= 10, `${normal} case`);
check("Case hiếm: 2–4", rare >= 2 && rare <= 4, `${rare} case`);

// R4 yêu cầu >=10 case lấy/phát triển từ dữ liệu thật. Chỉ đếm case có mã nguồn.
const realData = count((test) => Boolean(test.nguon_du_lieu));
check("Ít nhất 10 case từ dữ liệu thật", realData >= 10, `${realData} case có nguon_du_lieu`);

// Kết quả chạy phải phủ trọn golden set và quality bar phải có số rõ ràng.
const missingResults = cases.filter((test) => !resultById.has(test.id)).map((test) => test.id);
const extraResults = rows.filter((row) => !cases.some((test) => test.id === row.id)).map((row) => row.id);
check("Kết quả phủ toàn bộ golden set", missingResults.length === 0,
  missingResults.length ? `Thiếu: ${missingResults.join(", ")}` : `${rows.length}/${cases.length} case`);
check("Không có kết quả ngoài golden set", extraResults.length === 0,
  extraResults.length ? `Dư: ${extraResults.join(", ")}` : "Không có");
check("Tổng case trong kết quả khớp golden set", results.tong === cases.length,
  `Kết quả: ${results.tong ?? "thiếu"}; golden set: ${cases.length}`);
const computedRate = rows.length ? Math.round((rows.filter((row) => row.dat === true).length / rows.length) * 1000) / 10 : null;
check("Kết quả có tỷ lệ phần trăm", Number.isFinite(results.ty_le) && results.ty_le >= 0 && results.ty_le <= 100,
  `${results.ty_le ?? "thiếu"}%`);
check("Tỷ lệ kết quả khớp số case đạt", computedRate !== null && results.ty_le === computedRate,
  `Ghi: ${results.ty_le ?? "thiếu"}%; tính từ case: ${computedRate ?? "không tính được"}%`);
check("Quality bar là tỷ lệ phần trăm", Number.isFinite(golden.quality_bar?.nguong) &&
  golden.quality_bar.nguong > 0 && golden.quality_bar.nguong <= 100,
  `${golden.quality_bar?.nguong ?? "thiếu"}%`);

console.log("\nChecklist BTC — Eval CP3/R4\n");
for (const item of report) {
  console.log(`${item.ok ? "✓" : "✗"} ${item.label}: ${item.detail}`);
}

const failed = report.filter((item) => !item.ok);
console.log(`\n${report.length - failed.length}/${report.length} điều kiện đạt.`);
if (failed.length) {
  console.log("Chưa sẵn sàng chốt eval. Xử lý các dòng ✗ rồi chạy lại script.");
  process.exitCode = 1;
} else {
  console.log("Cấu trúc eval đáp ứng checklist CP3/R4.");
}
