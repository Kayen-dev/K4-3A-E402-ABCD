#!/usr/bin/env node
// server.js — máy chủ nhỏ, không phụ thuộc package nào.
//   node codebase/server.js          → http://localhost:5173
//   PORT=8080 node codebase/server.js
//
// Chỉ có ba việc: phục vụ file UI, chạy pipeline, trả JSON.
// Toàn bộ logic nằm trong src/ — server không có luật nghiệp vụ nào.

import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chayToanBo } from "./src/pipeline.js";
import { danhSachFixture } from "./src/scrape.js";
import { provider } from "./src/llm.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, "fixtures", "pages");
const TRACES = join(HERE, "traces");
const PORT = Number(process.env.PORT || 5173);

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
               ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8" };

function json(res, code, obj) {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

async function docBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

const server = createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host}`);

    if (u.pathname === "/api/trang-thai") {
      return json(res, 200, { provider: provider(), co_khoa: !!process.env.LLM_API_KEY });
    }

    if (u.pathname === "/api/fixtures") {
      return json(res, 200, { fixtures: await danhSachFixture(FIXTURES) });
    }

    // Trace lời gọi AI. CP3 đòi trace trong repo; đọc được từ giao diện thì lúc
    // demo và lúc bị hỏi "chỗ này AI quyết hay code quyết" là mở ra chỉ luôn.
    if (u.pathname === "/api/traces") {
      const n = Math.min(Number(u.searchParams.get("n") || 20), 100);
      let ten = [];
      try {
        ten = (await readdir(TRACES)).filter(f => f.endsWith(".json")).sort().slice(-n).reverse();
      } catch { return json(res, 200, { traces: [], ghi_chu: "chưa có thư mục traces/" }); }
      const traces = [];
      for (const f of ten) {
        try {
          const d = JSON.parse(await readFile(join(TRACES, f), "utf8"));
          traces.push({
            file: f,
            buoc: d.buoc, provider: d.provider, model: d.model,
            temperature: d.temperature, max_tokens: d.max_tokens,
            msMat: d.msMat, so_lan_thu_lai: d.so_lan_thu_lai ?? 0,
            so_lan_nhac_json: d.so_lan_nhac_json ?? 0,
            error: d.error, parseError: d.parseError,
            // Cắt bớt: một prompt của AI 2 có thể 12 000 ký tự, kéo hết vào
            // trình duyệt thì mỗi lần mở bảng trace là vài trăm KB.
            system: (d.system || "").slice(0, 4000),
            user: (d.user || "").slice(0, 8000),
            raw: (d.raw == null ? null : String(d.raw).slice(0, 8000)),
            system_day_du: (d.system || "").length,
            user_day_du: (d.user || "").length,
            raw_day_du: d.raw == null ? 0 : String(d.raw).length,
          });
        } catch { /* file đang được ghi dở — bỏ qua, đừng làm chết cả endpoint */ }
      }
      return json(res, 200, { traces });
    }

    if (u.pathname === "/api/chay" && req.method === "POST") {
      const body = await docBody(req);
      const logs = [];
      const urls = body.urls || [];
      // Giao diện từng hiện "0/0 nguồn" mà không nói vì sao — hoá ra danh sách URL
      // gửi lên rỗng. Bắt ngay tại đây và nói thẳng, đừng để nó im lặng chạy tiếp.
      if (!urls.length) {
        return json(res, 200, {
          nguonList: [], facts: {}, cau: [], findings: [], boFinding: [], logs,
          provider: provider(),
          loi: "Danh sách URL rỗng — /api/fixtures không trả về trang nào. Kiểm tra codebase/fixtures/pages/index.json.",
        });
      }
      // NDJSON: mỗi dòng một JSON, đẩy đi NGAY khi có.
      // Một lượt chạy mất vài phút (model free ~18s mỗi lời gọi). Gom hết rồi mới
      // trả một cục thì người dùng ngồi nhìn màn hình trắng và tưởng là treo —
      // đúng thứ đã xảy ra. Không dùng SSE cho khỏi thêm định dạng.
      res.writeHead(200, {
        "content-type": "application/x-ndjson; charset=utf-8",
        "cache-control": "no-cache",
        "x-accel-buffering": "no",
      });
      const day = (o) => res.write(JSON.stringify(o) + "\n");
      day({ type: "bat-dau", provider: provider(), so_url: urls.length });

      try {
        const kq = await chayToanBo({
          yeuCau: body.yeuCau,
          urls,
          // Chế độ trang bẫy dùng ĐÚNG tham số fixtures mà eval dùng — không có nhánh demo riêng.
          fixtures: body.dungFixture ? FIXTURES : undefined,
          so_cau: body.so_cau || 5,
          onLog: (l) => { logs.push(l); day({ type: "log", ...l }); },
        });
        day({ type: "ket_qua", ...kq, logs, provider: provider() });
        return res.end();
      } catch (e) {
        console.error(e);
        day({ type: "ket_qua", nguonList: [], facts: {}, cau: [], findings: [], boFinding: [],
              logs, provider: provider(), loi: e.message });
        return res.end();
      }
    }

    // ── file tĩnh
    let p = u.pathname === "/" ? "/index.html" : u.pathname;
    if (p.includes("..")) return json(res, 400, { loi: "đường dẫn không hợp lệ" });
    const file = join(HERE, "ui", p);
    const data = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" });
    res.end(data);
  } catch (e) {
    if (e.code === "ENOENT") return json(res, 404, { loi: "không có file này" });
    console.error(e);
    json(res, 500, { loi: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n  ScriptScout — http://localhost:${PORT}`);
  console.log(`  provider = ${provider()}${process.env.LLM_API_KEY ? " (có khoá)" : " (chưa có khoá — chạy bằng đáp án dựng sẵn)"}\n`);
});
