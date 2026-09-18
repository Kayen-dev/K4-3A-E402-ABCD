// env.js — nạp file .env mà không cần cài package nào.
//
// Vì sao tự viết thay vì dùng dotenv: repo cam kết không phụ thuộc package.
// Node 20.6+ có sẵn `--env-file`, nhưng nhiều máy trong lớp chạy Node 18,
// nên nạp bằng tay là cách chắc chắn nhất.
//
// Thứ tự ưu tiên: biến môi trường đã đặt sẵn > file .env
// Đặt $env:LLM_API_KEY trong PowerShell sẽ THẮNG giá trị trong .env.

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export function napEnv() {
  const duong = join(ROOT, ".env");
  if (!existsSync(duong)) return { file: null, so_bien: 0 };

  let so = 0;
  for (const dong of readFileSync(duong, "utf8").split(/\r?\n/)) {
    const s = dong.trim();
    if (!s || s.startsWith("#")) continue;
    const i = s.indexOf("=");
    if (i < 0) continue;
    const ten = s.slice(0, i).trim();
    let gt = s.slice(i + 1).trim();
    // bỏ dấu nháy nếu người dùng gõ LLM_API_KEY="abc"
    if ((gt.startsWith('"') && gt.endsWith('"')) || (gt.startsWith("'") && gt.endsWith("'"))) {
      gt = gt.slice(1, -1);
    }
    // bỏ chú thích viết sau giá trị:  LLM_PROVIDER=gemini   # ghi chú
    gt = gt.replace(/\s+#.*$/, "").trim();
    if (!ten || gt === "") continue;
    if (process.env[ten] === undefined) { process.env[ten] = gt; so++; }
  }
  return { file: duong, so_bien: so };
}

napEnv();
