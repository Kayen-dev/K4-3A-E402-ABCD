// llm.js — một lớp adapter cho nhiều nhà cung cấp model.
//
// MỌI cấu hình liên quan tới gọi API đều nằm trong codebase/.env.
// Trong file này không có một giá trị nào phải sửa tay: tên model, endpoint,
// temperature, max_tokens, timeout — tất cả đọc từ env, và các giá trị dưới đây
// chỉ là phương án cuối để hệ thống vẫn chạy được khi chưa có .env.
//
// KHÔNG đưa vào .env: ngưỡng 18 tháng và ngưỡng 25 âm tiết (nằm ở rules.js).
// Đó là quality bar đã chốt trong spec.md — để env đổi được thì ai cũng sửa
// được chuẩn chấm, và bảng kết quả hai lượt không còn so sánh được với nhau.
//
// Mọi lời gọi đều ghi trace ra traces/. CP3 đòi trace trong repo.

// Nạp .env TRƯỚC mọi thứ khác — phải là import đầu tiên.
import "./env.js";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath, KHÔNG dùng new URL(...).pathname.
// Trên Windows, .pathname trả về "/C:/Users/..." — có dấu gạch chéo thừa ở đầu,
// và join() sau đó sinh ra đường dẫn hỏng. Lỗi này chỉ xuất hiện trên Windows.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TRACE_DIR = join(ROOT, "traces");

/* ═══════════ Bảng cấu hình — đọc hết từ .env ═══════════
   Một chỗ duy nhất. Muốn biết hệ thống đang gọi API thế nào thì đọc bảng này,
   muốn đổi thì sửa codebase/.env, không sửa code. */

const so = (v, mac_dinh) => (v === undefined || v === "" || isNaN(Number(v)) ? mac_dinh : Number(v));

export function cauHinh() {
  const e = process.env;
  const provider = e.LLM_PROVIDER || "stub";
  const modelTheoNha = {
    gemini:     e.GEMINI_MODEL     || "gemini-3.6-flash",
    anthropic:  e.ANTHROPIC_MODEL  || "claude-sonnet-4-20250514",
    openai:     e.OPENAI_MODEL     || "gpt-4.1-mini",
    openrouter: e.OPENROUTER_MODEL || "openrouter/free",
    stub:       "(đáp án dựng sẵn)",
  };
  return {
    provider,
    key: e.LLM_API_KEY || "",
    // LLM_MODEL ghi đè model của nhà cung cấp đang dùng
    model: e.LLM_MODEL || modelTheoNha[provider] || "",
    temperature: so(e.LLM_TEMPERATURE, 0.2),
    max_tokens:  so(e.LLM_MAX_TOKENS, 4096),
    timeout_ms:  so(e.LLM_TIMEOUT_MS, 30000),
    // Hạn mức: khoảng cách tối thiểu giữa hai lời gọi, và số lần thử lại khi bị 429.
    min_gap_ms:  so(e.LLM_MIN_GAP_MS, 0),
    max_retry:   so(e.LLM_MAX_RETRY, 1),
    retry_cap_ms: so(e.LLM_RETRY_CAP_MS, 65000),
    endpoint: {
      gemini:     e.GEMINI_BASE_URL     || "https://generativelanguage.googleapis.com/v1beta",
      anthropic:  e.ANTHROPIC_BASE_URL  || "https://api.anthropic.com/v1",
      openai:     e.OPENAI_BASE_URL     || e.LLM_BASE_URL || "https://api.openai.com/v1",
      openrouter: e.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    },
    anthropic_version: e.ANTHROPIC_VERSION || "2023-06-01",
    // OpenRouter dùng hai header này để hiện tên ứng dụng trên bảng xếp hạng.
    // Không bắt buộc, nhưng để trống thì request bị xếp vào nhóm ẩn danh.
    or_referer: e.OPENROUTER_REFERER || "https://github.com/",
    or_title:   e.OPENROUTER_TITLE   || "ScriptScout (AI20k nhom 3A)",
  };
}

/* ═══════════ Hạn mức: một lời gọi một lúc, cách nhau min_gap_ms ═══════════
   Free tier của Gemini chỉ cho 5 request/phút, mà một lượt chạy gọi tới 13 lần.
   Không có hàng đợi thì lần chạy nào cũng dính 429 giữa chừng. */

let hangDoi = Promise.resolve();
let lanGoiCuoi = 0;
let activeCalls = 0;
const waitingCalls = [];
async function acquireCall() {
  if (activeCalls >= 4) await new Promise(resolve => waitingCalls.push(resolve));
  activeCalls++;
  return () => { activeCalls--; waitingCalls.shift()?.(); };
}

const nghi = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Xếp hàng: đảm bảo hai lời gọi liên tiếp cách nhau ít nhất `gap` ms.
 * gap = 0 thì KHÔNG xếp hàng — trả null để lời gọi đi song song.
 * Giữ hàng đợi khi gap=0 là tự bắn vào chân mình: model free mất ~18s mỗi lời
 * gọi, nối tiếp 13 lời gọi là 4 phút, chạy song song là ~1 phút.
 */
function xepHang(gap) {
  if (!gap) return null;
  const truoc = hangDoi;
  let moKhoa;
  hangDoi = new Promise(r => { moKhoa = r; });
  return truoc.then(async () => {
    const cho = gap - (Date.now() - lanGoiCuoi);
    if (cho > 0) await nghi(cho);
    lanGoiCuoi = Date.now();
    return moKhoa;
  });
}

/** Bóc số giây API bảo chờ. Gemini: "Please retry in 38.6s". OpenRouter: header Retry-After. */
function choBaoLau(text, headers) {
  const h = Number(headers?.get?.("retry-after"));
  if (h > 0) return h * 1000;
  const m = String(text).match(/retry in ([\d.]+)s/i);
  if (m) return Math.ceil(Number(m[1]) * 1000) + 500;
  return null;
}

class LoiHanMuc extends Error {
  constructor(msg, cho_ms) { super(msg); this.cho_ms = cho_ms; this.hanMuc = true; }
}

/**
 * Lỗi sẽ hỏng Y HỆT ở mọi lời gọi sau: sai khoá, sai tên model, request không
 * hợp lệ. Khác hẳn 429 (chờ là hết). Phân biệt hai loại để pipeline dừng ngay
 * thay vì gọi tiếp 8 lần cho cùng một lỗi — đã mất 40 giây vì đúng chuyện này.
 */
class LoiVinhVien extends Error {
  constructor(msg) { super(msg); this.vinhVien = true; }
}

/**
 * Bóc thông báo lỗi trong cùng. OpenRouter bọc lỗi của nhà cung cấp phía sau
 * thành ba tầng JSON lồng nhau; in nguyên cục ra nhật ký thì mỗi dòng 700 ký tự
 * và không ai đọc được dòng nào.
 */
function loiGonGang(text) {
  try {
    const j = JSON.parse(text);
    const raw = j?.error?.metadata?.raw;
    if (raw) {
      try { return JSON.parse(raw)?.error?.message || String(raw).slice(0, 200); }
      catch { return String(raw).slice(0, 200); }
    }
    return j?.error?.message || String(text).slice(0, 200);
  } catch { return String(text).slice(0, 200); }
}

/**
 * OpenAI (và mọi API tương thích) TỪ CHỐI request nếu dùng
 * response_format=json_object mà trong messages không có chữ "json":
 *   "'messages' must contain the word 'json' in some form"
 * Đây là ràng buộc của API, không phải của prompt, nên phải bảo đảm ở đây —
 * để prompt tự lo thì sửa prompt một chỗ là vỡ cả pipeline, và đã vỡ thật:
 * chỉ AI 1 có chữ JSON, nên AI 2/3/4 bị 400 trên toàn bộ 8 nguồn.
 */
function baoDamCoChuJson(system) {
  if (/json/i.test(system)) return system;
  return system + "\n\nPhản hồi phải là một JSON object hợp lệ, không kèm gì khác.";
}

/** fetch có timeout — timeout cũng đọc từ env, không hardcode. */
async function goi(url, opts, timeout_ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout_ms);
  try { return await fetch(url, { ...opts, signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

let traceCount = 0;

/** Ghi lại một lời gọi ra file. Không bao giờ ghi API key. */
async function trace(name, payload) {
  if (process.env.LLM_TRACE !== '1') return;
  try {
    await mkdir(TRACE_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const file = join(TRACE_DIR, `${stamp}_${String(++traceCount).padStart(3, "0")}_${name}.json`);
    await writeFile(file, JSON.stringify(payload, null, 2), "utf8");
  } catch (e) {
    // Trace hỏng thì không được làm chết pipeline.
    console.error("[trace] không ghi được:", e.message);
  }
}

/** Bóc khối JSON ra khỏi text model trả về. Model hay bọc trong ```json ... ``` */
function parseJson(text) {
  let s = String(text).trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  const first = s.search(/[[{]/);
  if (first > 0) s = s.slice(first);
  const lastBrace = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
  if (lastBrace >= 0) s = s.slice(0, lastBrace + 1);
  return JSON.parse(s);
}

/* ─────────────── các nhà cung cấp ─────────────── */

async function callGemini({ system, user, c }) {
  const m = c.model;
  const url = `${c.endpoint.gemini}/models/${m}:generateContent?key=${c.key}`;
  const res = await goi(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature: c.temperature,
        maxOutputTokens: c.max_tokens,
        responseMimeType: "application/json",
      },
    }),
  }, c.timeout_ms);
  if (!res.ok) {
    const t = (await res.text()).slice(0, 500);
    // Google ngừng model cũ khá thường xuyên và nói luôn tên model thay thế
    // trong thông báo lỗi. Bóc ra để người dùng khỏi phải đọc JSON thô.
    const goiY = t.match(/use\s+models\/([\w.-]+)/)?.[1];
    if (res.status === 404 && goiY) {
      throw new LoiVinhVien(`Gemini 404: model "${m}" đã bị ngừng. Đặt LLM_MODEL=${goiY} trong codebase/.env`);
    }
    if (res.status === 429 || res.status === 503) {
      throw new LoiHanMuc(`Gemini ${res.status}: hết hạn mức free tier (5 request/phút). ` +
        `Đặt LLM_MIN_GAP_MS=13000 trong codebase/.env, hoặc đổi sang LLM_PROVIDER=openrouter.`,
        choBaoLau(t, res.headers));
    }
    if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404)
      throw new LoiVinhVien(`Gemini ${res.status}: ${loiGonGang(t)}`);
    throw new Error(`Gemini ${res.status}: ${loiGonGang(t)}`);
  }
  const j = await res.json();
  return j.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callAnthropic({ system, user, c }) {
  const res = await goi(`${c.endpoint.anthropic}/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": c.key,
      "anthropic-version": c.anthropic_version,
    },
    body: JSON.stringify({
      model: c.model,
      max_tokens: c.max_tokens,
      temperature: c.temperature,
      system,
      messages: [{ role: "user", content: user }],
    }),
  }, c.timeout_ms);
  if (!res.ok) {
    const t = (await res.text()).slice(0, 300);
    if (res.status === 429 || res.status === 529) throw new LoiHanMuc(`Anthropic ${res.status}: ${loiGonGang(t)}`, choBaoLau(t, res.headers));
    if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404)
      throw new LoiVinhVien(`Anthropic ${res.status}: ${loiGonGang(t)}`);
    throw new Error(`Anthropic ${res.status}: ${loiGonGang(t)}`);
  }
  const j = await res.json();
  return j.content?.[0]?.text ?? "";
}

/**
 * OpenAI và OpenRouter dùng CHUNG một hàm: OpenRouter nói đúng schema
 * /chat/completions của OpenAI, chỉ khác endpoint và hai header nhận diện app.
 * Nhờ vậy thêm OpenRouter không phải viết thêm một nhánh parse riêng.
 */
async function callOpenAI({ system, user, c, qua_openrouter = false }) {
  const base = qua_openrouter ? c.endpoint.openrouter : c.endpoint.openai;
  const ten  = qua_openrouter ? "OpenRouter" : "OpenAI";
  const headers = { "content-type": "application/json", authorization: `Bearer ${c.key}` };
  if (qua_openrouter) {
    headers["HTTP-Referer"] = c.or_referer;   // hiện tên app trên bảng xếp hạng OpenRouter
    headers["X-Title"] = c.or_title;
  }
  const res = await goi(`${base}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: c.model,
      temperature: c.temperature,
      max_tokens: c.max_tokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: baoDamCoChuJson(system) },
        { role: "user", content: user },
      ],
    }),
  }, c.timeout_ms);
  if (!res.ok) {
    const t = (await res.text()).slice(0, 1200);
    const vi = loiGonGang(t);
    if (res.status === 429 || res.status === 503) {
      throw new LoiHanMuc(`${ten} ${res.status}: hết hạn mức.` +
        (qua_openrouter ? ` Model free của OpenRouter giới hạn theo ngày — đổi OPENROUTER_MODEL hoặc nạp credit.` : ""),
        choBaoLau(t, res.headers));
    }
    if (res.status === 401 || res.status === 403) {
      throw new LoiVinhVien(`${ten} ${res.status}: khoá bị từ chối — ${vi}`);
    }
    if (res.status === 404) {
      throw new LoiVinhVien(`${ten} 404: không có model "${c.model}". ` +
        `Xem https://openrouter.ai/models rồi sửa OPENROUTER_MODEL trong codebase/.env`);
    }
    if (res.status === 400) {
      // 400 KHÔNG đồng nghĩa với "model không dùng được" — bản trước kết luận
      // như vậy và chỉ sai chỗ: model vẫn tốt, chính request của mình sai.
      throw new LoiVinhVien(`${ten} 400: request không hợp lệ — ${vi}`);
    }
    throw new Error(`${ten} ${res.status}: ${vi}`);
  }
  const j = await res.json();
  // OpenRouter trả lỗi trong thân 200 khi provider phía sau hỏng.
  if (j.error) throw new Error(`${ten}: ${j.error.message || JSON.stringify(j.error)}`);
  return j.choices?.[0]?.message?.content ?? "";
}

/**
 * stub — đọc đáp án dựng sẵn trong fixtures/llm/<name>.json
 * Dùng cho eval: chạy lại 20 lượt cho cùng một kết quả, không tốn tiền, không cần mạng.
 * Đây CHÍNH LÀ code path mà chế độ trang bẫy trong UI dùng.
 */
async function callStub({ name, stubKey }) {
  const file = join(ROOT, "fixtures", "llm", `${name}.json`);
  const all = JSON.parse(await readFile(file, "utf8"));
  if (stubKey && all[stubKey] !== undefined) return JSON.stringify(all[stubKey]);
  if (all.__default !== undefined) return JSON.stringify(all.__default);
  throw new Error(`stub: không có đáp án cho ${name} / ${stubKey}`);
}

/* ─────────────── cửa vào duy nhất ─────────────── */

/**
 * Gọi model một lần và trả về object JSON đã parse.
 * @param {string} name     tên bước, dùng để đặt tên file trace và tìm stub
 * @param {string} system   system prompt
 * @param {string} user     user prompt
 * @param {string} stubKey  khoá tra trong fixtures khi chạy provider=stub
 */
export async function askJson({ name, system, user, stubKey, onLog }) {
  const c = cauHinh();
  const { provider } = c;
  const t0 = Date.now();

  // Nhắc lại yêu cầu JSON khi model trả văn xuôi. `openrouter/free` định tuyến
  // sang model bất kỳ đang rảnh, và không phải model nào cũng tôn trọng
  // response_format=json_object — đã gặp AI 3 trả về "Hôm nay chúng ta…".
  const NHAC_JSON =
    "\n\n[NHẮC LẠI — BẮT BUỘC] Phản hồi phải là MỘT đối tượng JSON hợp lệ và " +
    "KHÔNG có gì khác: không lời dẫn, không giải thích, không khối ```. " +
    "Ký tự đầu tiên phải là {.";

  /** Một lần đi mạng, chưa tính thử lại. */
  const motLan = async (nhacJson) => {
    const u = nhacJson ? user + NHAC_JSON : user;
    if (provider === "stub") return callStub({ name, stubKey });
    if (!c.key) throw new Error(`Thiếu LLM_API_KEY cho provider=${provider}. Điền vào codebase/.env`);
    if (provider === "gemini") return callGemini({ system, user: u, c });
    if (provider === "anthropic") return callAnthropic({ system, user: u, c });
    if (provider === "openai") return callOpenAI({ system, user: u, c });
    if (provider === "openrouter") return callOpenAI({ system, user: u, c, qua_openrouter: true });
    throw new Error(`Không biết provider: ${provider}. Đặt LLM_PROVIDER trong codebase/.env` +
      ` (gemini | anthropic | openai | openrouter | stub)`);
  };

  let raw, error = null, soLanThu = 0, nhacJson = false, soLanNhacJson = 0, loiVinhVien = false;
  for (let lan = 0; ; lan++) {
    // Xếp hàng + giãn cách. Chế độ stub không đi mạng nên không cần chờ.
    const moKhoa = provider === "stub" ? null : await xepHang(c.min_gap_ms);
    const releaseCall = provider === "stub" ? null : await acquireCall();
    if (lan === 0) onLog?.("f", `${name} · gọi ${c.model}…`);
    try {
      raw = await motLan(nhacJson);
      error = null;
    } catch (e) {
      error = e.message;
      loiVinhVien = !!e.vinhVien;
      // 429 là hết hạn mức, KHÔNG phải lỗi logic — chờ đúng số giây API bảo rồi thử lại.
      if (e.hanMuc && lan < c.max_retry) {
        const cho = Math.min(e.cho_ms ?? (2 ** lan) * 2000 + 1000, c.retry_cap_ms);
        soLanThu = lan + 1;
        onLog?.("w", `${name}: hết hạn mức, chờ ${Math.round(cho / 1000)}s rồi thử lại (lần ${lan + 1}/${c.max_retry})`);
        moKhoa?.();
        await nghi(cho);
        continue;
      }
    } finally {
      moKhoa?.();
      releaseCall?.();
    }

    // Model trả văn xuôi thay vì JSON: gọi lại MỘT lần với lời nhắc gắt hơn.
    // Chỉ một lần — hai lần vẫn hỏng thì lỗi ở model, thêm lượt nữa chỉ tốn thời gian.
    if (!error && provider !== "stub" && !nhacJson) {
      try { parseJson(raw); }
      catch {
        nhacJson = true; soLanNhacJson = 1;
        onLog?.("w", `${name}: model trả về không phải JSON, gọi lại kèm lời nhắc gắt hơn`);
        continue;
      }
    }
    break;
  }

  let parsed = null, parseError = null;
  if (!error) {
    try { parsed = parseJson(raw); } catch (e) { parseError = e.message; }
  }

  await trace(name, {
    buoc: name, provider, model: c.model,
    temperature: c.temperature, max_tokens: c.max_tokens,
    so_lan_thu_lai: soLanThu,
    so_lan_nhac_json: soLanNhacJson,
    msMat: Date.now() - t0,
    system, user,
    raw: raw ?? null,
    parsed, error, parseError,
  });

  if (error) {
    const e = new Error(`[${name}] ${error}`);
    // Chuyển cờ ra ngoài: pipeline cần biết "gọi nữa cũng thế" để dừng sớm.
    if (loiVinhVien) e.vinhVien = true;
    throw e;
  }
  if (parseError) {
    // Kèm đầu phản hồi thật: "not valid JSON" một mình không cho biết model đã nói gì.
    throw new Error(`[${name}] model "${c.model}" trả về không phải JSON sau 2 lần yêu cầu. ` +
      `Model này không tôn trọng response_format — đổi OPENROUTER_MODEL sang model có hỗ trợ JSON mode ` +
      `(ví dụ openai/gpt-4o-mini). Phản hồi bắt đầu bằng: "${String(raw ?? "").slice(0, 120)}…"`);
  }
  return parsed;
}

export function provider() {
  return cauHinh().provider;
}
