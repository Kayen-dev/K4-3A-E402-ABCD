#!/usr/bin/env node
// kiem-tra-khoa.js — trả lời đúng một câu hỏi: KHOÁ ĐÃ VÀO CHƯA?
//
//   node codebase/kiem-tra-khoa.js
//
// In ra provider đang dùng, khoá lấy từ đâu, rồi GỌI THẬT một lần để xác minh.

import "./src/env.js";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { askJson, cauHinh } from "./src/llm.js";
import { cauHinhTai } from "./src/scrape.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const che = (k) => !k ? "(trống)" : k.length < 12 ? "(quá ngắn — có vẻ sai)" : `${k.slice(0,6)}…${k.slice(-4)} · ${k.length} ký tự`;

const c = cauHinh();
const t = cauHinhTai();
const provider = c.provider;
const key = c.key;

console.log("\n─── Cấu hình gọi model ───");
console.log(`  provider      : ${provider}`);
console.log(`  khoá          : ${che(key)}`);
console.log(`  model         : ${c.model}`);
console.log(`  temperature   : ${c.temperature}`);
console.log(`  max_tokens    : ${c.max_tokens}`);
console.log(`  timeout        : ${c.timeout_ms} ms`);
console.log(`  endpoint      : ${c.endpoint[provider] || "(không dùng)"}`);
console.log(`  giãn cách     : ${c.min_gap_ms} ms giữa hai lời gọi${c.min_gap_ms ? "" : "  ← 0 = không giãn; free tier Gemini nên đặt 13000"}`);
console.log(`  thử lại 429   : tối đa ${c.max_retry} lần, chờ tối đa ${c.retry_cap_ms} ms mỗi lần`);

console.log("\n─── Cấu hình tải trang ───");
console.log(`  timeout       : ${t.timeout_ms} ms`);
console.log(`  cắt ở         : ${t.max_chars} ký tự`);
console.log(`  user-agent    : ${t.user_agent}`);

const coEnv = existsSync(join(HERE, ".env"));
const coExample = existsSync(join(HERE, ".env.example"));
console.log(`\n─── File cấu hình ───`);
console.log(`  codebase/.env         : ${coEnv ? "CÓ — đã được nạp" : "KHÔNG CÓ"}`);
console.log(`  codebase/.env.example : ${coExample ? "có (file mẫu, KHÔNG được nạp)" : "không có"}`);

if (!coEnv && coExample && !key) {
  console.log(`\n  ⚠ Khoá để trong .env.example thì hệ thống KHÔNG đọc.`);
  console.log(`    File .example chỉ là bản mẫu để commit lên repo.`);
  console.log(`    Đổi tên thành .env:  Copy-Item codebase\\.env.example codebase\\.env`);
}

if (provider === "stub") {
  console.log(`\n→ Đang chạy bằng ĐÁP ÁN DỰNG SẴN, không gọi model.`);
  console.log(`  Muốn gọi thật: đặt LLM_PROVIDER và LLM_API_KEY.\n`);
}
else if (!key) {
  console.log(`\n✗ provider=${provider} nhưng KHÔNG CÓ KHOÁ. Mọi lời gọi sẽ hỏng.\n`);
  process.exitCode = 1;
}
else {

  console.log(`\n─── Gọi thật một lần để xác minh ───`);
  const t0 = Date.now();
try {
  const r = await askJson({
    name: "kiem-tra-khoa",
    system: 'Trả về đúng JSON này, không thêm gì: {"ok": true, "loi_chao": "xin chào"}',
    user: "Kiểm tra kết nối.",
    stubKey: "default",
  });
  console.log(`✓ GỌI ĐƯỢC · ${Date.now() - t0} ms`);
  console.log(`  Model trả về: ${JSON.stringify(r)}`);
  console.log(`\n  Khoá đã vào đúng. Trace ghi ở codebase/traces/.\n`);
} catch (e) {
  console.log(`✗ GỌI HỎNG sau ${Date.now() - t0} ms`);
  console.log(`  ${e.message}\n`);
  if (/401|403|API key not valid|API_KEY_INVALID/i.test(e.message))
    console.log(`  → Khoá sai hoặc chưa bật API cho dự án.\n`);
  else if (/429|quota|RESOURCE_EXHAUSTED/i.test(e.message)) {
    console.log(`  → Hết hạn mức của nhà cung cấp. Ba cách, theo thứ tự nên thử:`);
    console.log(`     1. đặt LLM_MIN_GAP_MS=13000 trong codebase/.env (một lượt mất ~3 phút nhưng chạy xong)`);
    console.log(`     2. đổi LLM_PROVIDER=openrouter + OPENROUTER_MODEL (hạn mức thoáng hơn)`);
    console.log(`     3. đổi LLM_PROVIDER=stub — demo vẫn đủ, đúng code path mà eval dùng\n`);
  }
  else if (/fetch failed|ENOTFOUND|ETIMEDOUT/i.test(e.message))
    console.log(`  → Không ra được mạng. Kiểm tra wifi hoặc proxy.\n`);
    else if (/404/.test(e.message) && /LLM_MODEL=/.test(e.message))
      console.log(`  → Chỉ cần đổi tên model như câu trên, khoá vẫn tốt.\n`);
    // KHÔNG process.exit() ở đây: file trace có thể còn đang ghi, và trên Windows
    // exit giữa lúc handle đang đóng gây "Assertion failed ... UV_HANDLE_CLOSING".
    process.exitCode = 1;
  }
}
