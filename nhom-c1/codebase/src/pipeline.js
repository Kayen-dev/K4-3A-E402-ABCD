// pipeline.js — orchestration theo pipeline v2.
//
// MẮT XÍCH QUYẾT ĐỊNH TRUNG TÂM của sản phẩm là hàm `quyetDinhNguon()`:
//   một trang web đi vào → DÙNG / DÙNG-CẢNH-BÁO / LOẠI / KHÔNG-ĐỌC-ĐƯỢC đi ra, kèm lý do.
// Đây là chỗ có lời gọi AI thật, và cũng là chỗ golden set nhắm vào.
//
// Nguyên tắc chia việc giữa code và AI — hỏi gì ở CP6 thì trả lời bằng bảng này:
//
//   tiêu chí 1 (người chịu trách nhiệm)  → CODE quyết, AI chỉ mô tả
//   tiêu chí 2 (còn trong hạn)            → CODE quyết  (so ngày, không cần AI)
//   tiêu chí 3 (có dẫn nguồn riêng)       → AI quyết
//   tiêu chí 4 (khớp chủ đề)              → AI quyết
//   tiêu chí 5 (không có chỉ thị ẩn)      → CODE quyết  ← quan trọng nhất
//
// Vì sao tiêu chí 5 tuyệt đối không giao cho AI: lệnh tấn công nằm trong CÙNG
// context window với lệnh bảo model chống lại nó. Giao cho model tự gác chính
// nó là lớp phòng thủ yếu nhất có thể. Code quét trước, và kết luận của code
// KHÔNG bị model ghi đè.

import { scrape } from "./scrape.js";
import { createHash } from "node:crypto";
import { canUseSource } from "./source-policy.js";
import { askJson } from "./llm.js";
import { p1_truyVan, p2_chamNguon, p3_vietCau, p4_soatVanNoi, p5_kiemChung } from "./prompts.js";
import {
  quaHan, doLenhAn, demNguonDocLap, doMauThuan,
  cauQuaDai, doXungHo, doLapFiller, doKhoDoc, claimThieuCanCu, soLieuTuFactChuaXacMinh, locFindingHopLe, phamViLamLai,
} from "./rules.js";

/* ═══════════════════════════════════════════════════════════════════
   QUYẾT ĐỊNH TRUNG TÂM
   ═══════════════════════════════════════════════════════════════════ */

export async function quyetDinhNguon(url, { chu_de, muc_tieu = '', fixtures, nguon_id, onLog, signal } = {}) {
  const kq = {
    nguon_id: nguon_id || null,   // gán ở bước A sau khi biết fixtures
    url,
    trang_thai: null,        // dung | dung-canh-bao | loai | khong-doc-duoc
    diem_tieu_chi: [0, 0, 0, 0, 0],
    do_tin_cay: null,
    ly_do: null,
    canh_bao: [],
    cach_ly: [],             // text chỉ thị ẩn — KHÔNG BAO GIỜ vào prompt của AI 3
    trich_dan: [],
    meta: {},
    media: [],
    ai_da_goi: false,
  };

  // ── Bước A · tải trang (code)
  const trang = await scrape(url, { fixtures, signal });
  kq.nguon_id = kq.nguon_id || trang.nguon_id || url.replace(/^https?:\/\//, "").slice(0, 40);
  kq.meta = trang.meta || {};
  kq.media = trang.media || [];
  kq.extraction_method = trang.extraction_method;
  kq.fetched_at = trang.fetched_at;
  kq.status = trang.status;

  if (!trang.ok) {
    kq.trang_thai = "khong-doc-duoc";
    kq.ly_do = trang.ly_do;
    // Không coi như đã đọc. Đây là một kết quả có thật, không phải lỗi để nuốt.
    return kq;
  }
  kq.snapshot = trang.text;
  kq.snapshot_hash = createHash("sha256").update(trang.text).digest("hex");

  // ── Bước B · LỚP PHÒNG THỦ 1 — dò chỉ thị ẩn, TRƯỚC khi model thấy gì
  const lenhAn = trang.lenh_an?.length ? trang.lenh_an : doLenhAn(trang.text);
  if (lenhAn.length) {
    kq.cach_ly = lenhAn;
    kq.diem_tieu_chi[4] = 0;                    // tiêu chí 5 trượt, code chốt
    kq.trang_thai = "loai";
    kq.do_tin_cay = "thap";
    kq.ly_do = `Trang chứa ${lenhAn.length} chỉ thị ẩn nhắm vào hệ thống AI. ` +
      `Đã ghi lại làm bằng chứng, KHÔNG thi hành. Trượt tiêu chí 5.`;
    // Không gọi AI: trang này đã bị loại, gọi thêm chỉ tốn tiền và tạo thêm một
    // đường cho injection đi vào. Text độc ở lại trong cach_ly, chỉ UI đọc.
    return kq;
  }

  // ── Bước C · tiêu chí 1 và 2 do code quyết
  const coNguoiChiuTrachNhiem = !!(trang.meta.tac_gia || trang.meta.to_chuc);
  kq.diem_tieu_chi[0] = coNguoiChiuTrachNhiem ? 1 : 0;

  const han = quaHan(trang.meta.ngay_dang);
  kq.diem_tieu_chi[1] = han.quaHan ? 0 : 1;
  if (han.quaHan) kq.canh_bao.push(`Nguồn quá hạn: ${han.vi}. Chỉ dùng cho phần ví dụ, không dùng cho con số.`);

  // ── Bước D · LỜI GỌI AI THẬT — tiêu chí 3, 4 và phần trích dẫn
  const prompt = p2_chamNguon({
    chu_de,
    muc_tieu,
    url,
    meta: trang.meta,
    text: trang.text,
    ket_qua_code: { co_nguoi_chiu_trach_nhiem: coNguoiChiuTrachNhiem, han },
  });
  let ai;
  try {
    ai = await askJson({ ...prompt, stubKey: url, onLog });
    kq.ai_da_goi = true;
  } catch (e) {
    // KHÔNG dùng "loai": nguồn này chưa bị chấm trượt tiêu chí nào, chỉ là lời gọi
    // API hỏng (hết hạn mức, mất mạng, sai khoá). Gộp vào "loai" thì báo cáo nói sai
    // sự thật — người đọc sẽ tưởng nguồn kém chất lượng.
    kq.trang_thai = "loi-goi-ai";
    kq.ly_do = "Không đánh giá được nguồn. Thử lại hoặc liên hệ người quản trị.";
    kq.loi_vinh_vien = !!e.vinhVien;   // sai khoá / sai model / request sai → gọi nữa cũng thế
    return kq;
  }

  kq.diem_tieu_chi[2] = ai.diem?.[2] ?? 0;
  kq.diem_tieu_chi[3] = ai.diem?.[3] ?? 0;
  kq.trich_dan = Array.isArray(ai.trich_dan) ? ai.trich_dan.filter(q => typeof q === "string" && q.length > 0 && q.length <= 1000 && trang.text.includes(q)) : [];
  kq.rationale = ai.rationale ?? null;

  // ── Bước E · CODE GHI ĐÈ. Model không được phép lật ba tiêu chí của code.
  if (ai.diem?.[0] === 1 && !coNguoiChiuTrachNhiem) {
    kq.canh_bao.push("Model chấm đạt tiêu chí 1 nhưng trang không có tác giả/tổ chức — giữ theo kết luận của code.");
  }
  if (ai.is_injection === true && !lenhAn.length) {
    // Model thấy thứ regex chưa bắt được → tin model theo hướng AN TOÀN HƠN.
    kq.diem_tieu_chi[4] = 0;
    kq.canh_bao.push("Model báo có chỉ thị ẩn mà bộ dò của code chưa bắt được — cần bổ sung mẫu dò.");
  } else {
    kq.diem_tieu_chi[4] = 1;
  }

  // ── Bước F · chốt trạng thái theo luật công bố trước
  const [t1, t2, t3, t4, t5] = kq.diem_tieu_chi;
  if (t1 !== 1 || t4 !== 1 || t5 !== 1) {
    kq.trang_thai = "loai";
    kq.ly_do = t1 !== 1
      ? "Không truy được người chịu trách nhiệm (trượt tiêu chí 1)."
      : t5 !== 1 ? "Trang chứa chỉ thị ẩn (trượt tiêu chí 5)."
      : "Nội dung chưa phù hợp với bài học.";
    kq.do_tin_cay = "thap";
  } else if (t2 === 0 || t3 !== 1) {
    kq.trang_thai = "dung-canh-bao";
    kq.ly_do = t3 !== 1 ? `${han.vi}; nguồn không dẫn tài liệu riêng, cần kiểm tra kỹ trước khi dùng.` : han.vi;
    kq.do_tin_cay = "trung binh";
  } else {
    kq.trang_thai = "dung";
    kq.ly_do = ai.rationale ?? "Đạt cả 5 tiêu chí.";
    kq.do_tin_cay = ai.do_tin_cay === "thap" ? "thap" : (ai.do_tin_cay || "cao");
  }
  return kq;
}

/* ═══════════════════════════════════════════════════════════════════
   GOM FACT & DÒ MÂU THUẪN  (code)
   ═══════════════════════════════════════════════════════════════════ */

export function gomFact(facts, nguonList) {
  const dangDung = new Set(nguonList.filter(n => canUseSource(n) && (n.trang_thai !== 'loai' || n.approved)).map(n => n.nguon_id));
  const out = {};
  for (const f of facts) {
    const soNguon = demNguonDocLap(f, dangDung);
    const mauThuan = doMauThuan(f, dangDung);
    out[f.id] = {
      ...f,
      so_nguon: soNguon,
      mau_thuan: mauThuan,
      trang_thai: soNguon === 0 ? "khong-con-nguon"
                : mauThuan ? "chua-xac-minh"
                : soNguon >= 2 ? "da-xac-minh" : "chua-du-nguon",
    };
  }
  return { facts: out, dangDung };
}

export async function kiemChungClaims(factsById) {
  const facts = Object.values(factsById);
  const candidates = facts.filter(f => f.trang_thai === 'da-xac-minh');
  const out = Object.fromEntries(facts.map(f => [f.id, { ...f, supportStatus: f.mau_thuan ? 'conflicting' : 'insufficient', supportReason: f.trang_thai }]));
  if (!candidates.length) return out;
  try {
    const prompt = p5_kiemChung({ claims: candidates.map(f => ({ id: f.id, statement: f.noi_dung, evidence: f.bang_chung.map(b => ({ sourceId: b.nguon_id, quote: b.doan_trich })) })) });
    const ai = await askJson(prompt);
    if (!Array.isArray(ai.verdicts)) return out;
    for (const verdict of ai.verdicts) {
      if (!out[verdict.id] || !['supported', 'conflicting', 'insufficient'].includes(verdict.status) || typeof verdict.reason !== 'string') continue;
      out[verdict.id].supportStatus = verdict.status;
      out[verdict.id].supportReason = verdict.reason.slice(0, 500);
    }
  } catch { /* Keep insufficient; never upgrade after verifier failure. */ }
  return out;
}

/* ═══════════════════════════════════════════════════════════════════
   SOÁT VĂN NÓI  (code + AI 4)
   ═══════════════════════════════════════════════════════════════════ */

export async function soatVanNoi(cauList, factsById, dangDung, { boQuaAI = false, approvedFeedback = [], scriptContext = '', onLog } = {}) {
  const findings = [];

  // ── phần CODE: câu dài · xưng hô · claim thiếu căn cứ
  for (const c of cauList) {
    const dai = cauQuaDai(c.loi);
    if (dai) findings.push({ ...dai, cau: c.n, nguon_bat: "code" });
    for (const f of [...doLapFiller(c.loi), ...doKhoDoc(c.loi)]) findings.push({ ...f, cau: c.n, nguon_bat: "code" });
    for (const f of claimThieuCanCu(c, factsById, dangDung)) {
      findings.push({ ...f, nguon_bat: "code" });
    }
    for (const id of c.fact_ids || []) {
      const fact = factsById[id];
      if (fact && fact.supportStatus && fact.supportStatus !== 'supported') findings.push({
        loai: 'thieu-can-cu', sev: 'cao', cau: c.n, quote: null,
        vi: `Thông tin trong câu chưa được đoạn tài liệu xác nhận đầy đủ (${fact.supportReason || fact.supportStatus}).`,
        goiY: 'Tìm nguồn bổ sung hoặc viết lại câu theo phần đã có căn cứ.', thay: null, nguon_bat: 'code',
      });
    }
    for (const f of soLieuTuFactChuaXacMinh(c, factsById)) {
      findings.push({ ...f, nguon_bat: "code" });
    }
  }
  for (const f of doXungHo(cauList)) findings.push({ ...f, nguon_bat: "code" });

  // ── phần AI: translationese · sai sắc thái
  let boFinding = [];
  let aiFailed = false;
  if (!boQuaAI) {
    try {
      const prompt = p4_soatVanNoi({ cauList, approvedFeedback, scriptContext });
      const ai = await askJson({ ...prompt, stubKey: "default", onLog });
      for (const f of ai.findings || []) {
        if (!f || !["sai-nghia", "translationese", "sai-sac-thai", "register", "gop-y-da-duyet"].includes(f.loai) ||
            !["cao", "trung bình", "thấp"].includes(f.sev) || typeof f.quote !== "string" ||
            f.quote.length < 2 || f.quote.length > 400 || typeof f.vi !== "string" || f.vi.length > 1000 ||
            (f.thay !== null && (typeof f.thay !== "string" || f.thay.length > 400)) ||
            (f.loai === "gop-y-da-duyet" && !approvedFeedback.some(item => item.id === f.feedback_id))) {
          boFinding.push({ vi_sao_bo: "đầu ra không đúng schema" }); continue;
        }
        let soCau = Number.isInteger(f.n) ? f.n : (Number.isInteger(f.cau) ? f.cau : null);
        if (soCau == null) {
          const khop = cauList.filter(c => String(c.loi).includes(f.quote));
          if (khop.length === 1) soCau = khop[0].n;
        }
        const cau = cauList.find(c => c.n === soCau);
        if (!cau) { boFinding.push({ ...f, vi_sao_bo: "số câu không tồn tại" }); continue; }
        // indexOf: không tìm thấy chuỗi nguyên văn → VỨT. Ưu tiên precision.
        const { giu, bo } = locFindingHopLe(cau, [{ ...f, n: soCau, cau: soCau }]);
        giu.forEach(x => findings.push({ ...x, feedback_id: f.feedback_id || null,
          feedback_title: approvedFeedback.find(item => item.id === f.feedback_id)?.title || null, nguon_bat: "ai" }));
        bo.forEach(x => boFinding.push({ ...x, vi_sao_bo: "quote không khớp nguyên văn câu" }));
      }
    } catch (e) {
      aiFailed = true;
      boFinding.push({ vi_sao_bo: `AI 4 lỗi: ${e.message}` });
    }
  }

  return { findings, boFinding, aiFailed };
}

/* ═══════════════════════════════════════════════════════════════════
   VIẾT CÂU  (AI 3)  — chỉ nhận fact ĐÃ DUYỆT, không bao giờ nhận cach_ly
   ═══════════════════════════════════════════════════════════════════ */

export async function vietCau({ chu_de, muc_tieu, nguoi_hoc, so_cau, nguonList, onLog }) {
  // Chỉ nguồn được phép dùng. Nguồn thiếu tác giả chỉ vào context khi đã được
  // người dùng duyệt; nội dung có chỉ thị ẩn luôn ở ngoài prompt.
  const dungDuoc = nguonList
    .filter(n => canUseSource(n) && (n.trang_thai !== 'loai' || n.approved))
    .map(n => ({
      nguon_id: n.nguon_id,
      url: n.url,
      tieu_de: n.meta?.tieu_de || n.url,
      ngay_dang: n.meta?.ngay_dang || null,
      do_tin_cay: n.do_tin_cay,
      canh_bao: n.canh_bao,
      doan_trich: n.trich_dan,
      noi_dung_bai_viet: n.snapshot || '',
      media: n.media || [],
    }));

  const prompt = p3_vietCau({ chu_de, muc_tieu, nguoi_hoc, so_cau, facts: dungDuoc });
  const ai = await askJson({ ...prompt, stubKey: "default", onLog });

  // Evidence must be an exact substring of the article supplied to the model.
  const trichTheoNguon = Object.fromEntries(dungDuoc.map(n => [n.nguon_id, n]));
  let soBangChungBiLoai = 0;
  const facts = (ai.facts || []).map(f => {
    const bc = (f.bang_chung || []).filter(b => {
      const kho = trichTheoNguon[b.nguon_id];
      if (!kho) return false;
      const quote = b.doan_trich;
      const khop = typeof quote === 'string' && quote.trim().length >= 20 && quote.length <= 1000
        && ((kho.doan_trich || []).includes(quote) || kho.noi_dung_bai_viet?.includes(quote));
      if (!khop) soBangChungBiLoai++;
      return khop;
    });
    return { id: f.id, noi_dung: f.noi_dung, loai: f.loai || "định nghĩa", bang_chung: bc };
  });

  const cau = (ai.cau || []).map((c, i) => ({
    n: c.n ?? i + 1,
    kieu: c.kieu || "giảng",
    loi: c.loi || "",
    chu_man_hinh: c.chu_man_hinh || "",
    y_do_hinh: c.y_do_hinh || "",
    fact_ids: Array.isArray(c.fact_ids) ? c.fact_ids : [],
    media_url: typeof c.media_url === 'string' ? c.media_url : null,
    lich_su: [],
  }));

  return { facts, cau, soBangChungBiLoai };
}

/* ═══════════════════════════════════════════════════════════════════
   CHẠY TRỌN VẸN — đúng hàm này là thứ UI gọi và eval gọi
   ═══════════════════════════════════════════════════════════════════ */

export async function chayToanBo({ yeuCau, urls, fixtures, so_cau = 5, onLog = () => {} }) {
  const log = (k, m) => onLog({ k, m, t: new Date().toISOString().slice(11, 19) });

  log("q", `Chủ đề: ${yeuCau.chu_de}`);
  const truyVan = await sinhTruyVan(yeuCau, log).catch(() => []);
  truyVan.forEach(q => log("q", `truy vấn: ${q}`));

  // Chấm nguồn SONG SONG. Mỗi lời gọi tới model free mất ~18 giây; 10 nguồn nối
  // tiếp là 3 phút, chạy 4 luồng là dưới 1 phút. Các nguồn độc lập nhau hoàn toàn
  // nên không có lý do gì phải nối tiếp.
  //   LLM_MIN_GAP_MS > 0 → llm.js tự xếp hàng lại, song song ở đây thành vô hại.
  const LUONG = Math.max(1, Number(process.env.LLM_CONCURRENCY || 4));
  const nguonList = new Array(urls.length);          // giữ đúng thứ tự urls
  let iTiep = 0, xong = 0, dungSom = null;

  async function motLuong() {
    while (true) {
      // DỪNG SỚM. Sai khoá hoặc sai tên model thì 11 nguồn còn lại hỏng y hệt.
      // Bản trước gọi hết 8 lần cho cùng một lỗi 400: mất 40 giây và 8 dòng
      // nhật ký giống nhau, mà thông tin thu được vẫn đúng bằng lần đầu.
      if (dungSom) return;
      const i = iTiep++;
      if (i >= urls.length) return;
      const r = await quyetDinhNguon(urls[i], { chu_de: yeuCau.chu_de, fixtures, onLog: log });
      nguonList[i] = r;
      const k = r.trang_thai === "dung" ? "ok" : r.trang_thai === "dung-canh-bao" ? "w" : "x";
      log(k, `[${++xong}/${urls.length}] ${r.nguon_id} → ${r.trang_thai}` +
             `${r.cach_ly.length ? ` · ${r.cach_ly.length} chỉ thị ẩn đã cách ly` : ""} · ${r.ly_do || ""}`);
      if (r.loi_vinh_vien && !dungSom) {
        // Chỉ báo MỘT lần: 4 luồng đang chạy sẽ cùng gặp lỗi này, in 4 lần
        // giống nhau thì lại thành đúng cái đống nhật ký mà ta đang dọn.
        dungSom = r.ly_do;
        log("x", `DỪNG SỚM: lỗi cấu hình, không gọi thêm ${urls.length - xong} nguồn còn lại vì sẽ hỏng y hệt.`);
      }
    }
  }
  log("f", `chấm ${urls.length} nguồn · ${Math.min(LUONG, urls.length)} luồng song song`);
  await Promise.all(Array.from({ length: Math.min(LUONG, urls.length) }, motLuong));

  // Nguồn chưa kịp chấm vì đã dừng sớm — khai rõ là CHƯA CHẤM, không phải bị loại.
  for (let i = 0; i < urls.length; i++) {
    if (!nguonList[i]) nguonList[i] = {
      nguon_id: `?${i + 1}`, url: urls[i], trang_thai: "chua-cham",
      diem_tieu_chi: [0, 0, 0, 0, 0], canh_bao: [], cach_ly: [], trich_dan: [], meta: {},
      ai_da_goi: false, ly_do: "Chưa chấm — lượt chạy dừng sớm vì lỗi cấu hình.",
    };
  }
  if (dungSom) {
    return {
      nguonList, facts: {}, cau: [], findings: [], boFinding: [], truyVan,
      loi: `Dừng sớm vì lỗi cấu hình, không phải vì nguồn kém. ${dungSom}`,
    };
  }

  // Nguồn hỏng vì gọi API không được thì KHÔNG phải nguồn bị loại theo tiêu chí.
  // Gộp hai thứ đó làm một là báo cáo sai: nhìn bảng sẽ tưởng nguồn kém chất lượng.
  const loiGoi = nguonList.filter(n => n.trang_thai === "loi-goi-ai");
  if (loiGoi.length) {
    log("x", `${loiGoi.length} nguồn KHÔNG chấm được vì lỗi gọi API — đây là lỗi hạ tầng, không phải nguồn kém. ` +
             `Lý do đầu tiên: ${loiGoi[0].ly_do}`);
  }

  const dung = nguonList.filter(n => n.trang_thai?.startsWith("dung"));
  log("f", `${dung.length}/${nguonList.length} nguồn dùng được`);
  if (!dung.length) {
    return {
      nguonList, facts: {}, cau: [], findings: [], boFinding: [], truyVan,
      loi: loiGoi.length
        // ly_do đã mở đầu bằng "Không chấm được vì lỗi gọi API" — đừng lặp lại.
        ? `${loiGoi.length}/${nguonList.length} nguồn không chấm được. ${loiGoi[0].ly_do}`
        : "Không nguồn nào qua được 5 tiêu chí.",
    };
  }

  log("q", `viết ${so_cau} câu từ nguồn đã duyệt`);
  let factsThô, cau, soBangChungBiLoai;
  try {
    ({ facts: factsThô, cau, soBangChungBiLoai } = await vietCau({ ...yeuCau, so_cau, nguonList, onLog: log }));
  } catch (e) {
    // Trả về phần đã làm được kèm lý do, thay vì ném lỗi ra cho server thành 500.
    // Bảng nguồn đã chấm xong vẫn xem được — đó là thứ đắt tiền nhất trong lượt chạy.
    log("x", `Bước viết câu hỏng: ${e.message}`);
    return { nguonList, facts: {}, cau: [], findings: [], boFinding: [], truyVan, loi: e.message };
  }
  if (soBangChungBiLoai) log("w", `loại ${soBangChungBiLoai} bằng chứng vì đoạn trích không khớp nguyên văn nguồn`);

  const { facts, dangDung } = gomFact(factsThô, nguonList);
  Object.values(facts).forEach(f =>
    log(f.trang_thai === "da-xac-minh" ? "ok" : "w",
        `${f.id} · ${f.so_nguon} nguồn · ${f.trang_thai}${f.mau_thuan ? " · MÂU THUẪN" : ""}`));

  log("q", "soát văn nói");
  let findings = [], boFinding = [], loi = null;
  try {
    ({ findings, boFinding } = await soatVanNoi(cau, facts, dangDung, { onLog: log }));
    log("ok", `${findings.length} finding (${findings.filter(f => f.nguon_bat === "code").length} từ code, ${findings.filter(f => f.nguon_bat === "ai").length} từ AI)${boFinding.length ? ` · vứt ${boFinding.length} finding quote không khớp` : ""}`);
  } catch (e) {
    // Kịch bản đã viết xong rồi — giữ lại, chỉ khai là phần soát chưa chạy được.
    loi = `Soát văn nói hỏng: ${e.message}. Kịch bản vẫn có, nhưng CHƯA được soát.`;
    log("x", loi);
  }

  return { nguonList, facts, cau, findings, boFinding, truyVan, loi };
}

export async function sinhTruyVan(yeuCau, onLog) {
  const prompt = p1_truyVan(yeuCau);
  const ai = await askJson({ ...prompt, stubKey: "default", onLog });
  return ai.queries || [];
}

export { phamViLamLai };
