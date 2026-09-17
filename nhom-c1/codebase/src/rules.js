// rules.js — TOÀN BỘ phần kiểm tra bằng code, không có lời gọi AI nào trong file này.
//
// Vì sao đẩy nhiều việc sang code thay vì để AI làm:
//   1. Chạy tức thời, không tốn token, không phụ thuộc mạng.
//   2. Kết quả giống hệt nhau mỗi lần chạy → golden set mới so được vòng trước với vòng sau.
//   3. Luật vibe-coding ở CP6: phải giải thích được. Regex giải thích được, "model thấy thế" thì không.

/* ═══════════ 1 · Đếm âm tiết, không đếm ký tự ═══════════
   Tiếng Việt mỗi âm tiết là một nhịp đọc, nên số âm tiết mới là thước đo hơi thở.
   "Bạn có một tập tài liệu" = 6 âm tiết, dù dài bao nhiêu ký tự cũng vậy. */

export function demAmTiet(s) {
  return String(s).trim().split(/\s+/).filter(t => /\p{L}|\d/u.test(t)).length;
}

export const NGUONG_AM_TIET = 25; // chốt trong spec.md §7, không đổi sau hạn chốt spec

export function cauQuaDai(loi, nguong = NGUONG_AM_TIET) {
  const n = demAmTiet(loi);
  if (n <= nguong) return null;
  return {
    loai: "cau-dai",
    sev: "cao",
    quote: null,               // lỗi cấp câu, không có span
    capCau: true,
    amTiet: n,
    vi: `Câu dài ${n} âm tiết, vượt ngưỡng ${nguong}. Không đọc hết trong một hơi, và một câu một cảnh thì cảnh này phải hiện quá nhiều thứ cùng lúc.`,
    goiY: "cắt thành hai câu, hoặc tách các ý phụ sang câu sau",
  };
}

/* ═══════════ 2 · Xưng hô không nhất quán ═══════════
   Bắt trường hợp kịch bản mở đầu bằng "bạn" rồi giữa chừng đổi sang "quý vị". */

const NHOM_XUNG_HO = {
  ban: ["bạn", "các bạn"],
  quyvi: ["quý vị", "quí vị"],
  anhchi: ["anh chị", "các anh chị"],
  moinguoi: ["mọi người"],
};

export function doXungHo(cauList) {
  const thay = new Map(); // nhóm -> [số câu]
  for (const c of cauList) {
    const low = " " + String(c.loi).toLowerCase() + " ";
    for (const [nhom, tu] of Object.entries(NHOM_XUNG_HO)) {
      for (const t of tu) {
        if (low.includes(" " + t + " ") || low.includes(" " + t + ",")) {
          if (!thay.has(nhom)) thay.set(nhom, []);
          if (!thay.get(nhom).includes(c.n)) thay.get(nhom).push(c.n);
        }
      }
    }
  }
  if (thay.size < 2) return []; // chỉ một cách xưng hô → không có gì để báo

  // Nhóm xuất hiện ở nhiều câu nhất là chuẩn; các nhóm còn lại bị gắn cờ.
  const sorted = [...thay.entries()].sort((a, b) => b[1].length - a[1].length);
  const [chuanNhom] = sorted[0];
  const chuanTu = NHOM_XUNG_HO[chuanNhom][0];

  const out = [];
  for (const [nhom, cacCau] of sorted.slice(1)) {
    for (const n of cacCau) {
      const cau = cauList.find(c => c.n === n);
      const tuLech = NHOM_XUNG_HO[nhom].find(t =>
        String(cau.loi).toLowerCase().includes(t));
      out.push({
        loai: "xung-ho", sev: "cao", cau: n,
        quote: timNguyenVan(cau.loi, tuLech),
        vi: `Kịch bản chủ yếu dùng “${chuanTu}” (câu ${thay.get(chuanNhom).join(", ")}). Đổi sang “${tuLech}” ở đây làm lệch giọng.`,
        goiY: chuanTu,
        thay: chuanTu,
      });
    }
  }
  return out;
}

/** Tìm lại đúng dạng viết hoa/thường nguyên văn của một từ trong câu. */
function timNguyenVan(loi, tuThuong) {
  if (!tuThuong) return null;
  const i = String(loi).toLowerCase().indexOf(tuThuong);
  return i < 0 ? null : String(loi).slice(i, i + tuThuong.length);
}

/* ═══════════ 3 · Trích con số và tên riêng ═══════════
   Đây là phần dễ sai nhất với tiếng Việt, nên viết kỹ.

   Tiếng Việt KHÔNG viết hoa danh từ chung, nhưng CÓ viết hoa chữ đầu câu.
   Nếu quét chữ-cái-hoa một cách thô thì từ đầu của MỌI câu đều bị gắn cờ là tên riêng.
   Cách xử lý: tách câu theo dấu chấm/hỏi/than, rồi BỎ token đầu của mỗi câu. */

const SO_BANG_CHU = {
  "một": 1, "hai": 2, "ba": 3, "bốn": 4, "năm": 5, "sáu": 6, "bảy": 7,
  "tám": 8, "chín": 9, "mười": 10, "mười một": 11, "mười hai": 12,
  "hai mươi": 20, "một trăm": 100,
};

/**
 * Trích con số.
 * @param {boolean} kemSoBangChu  có tính cả số viết bằng chữ không
 *
 * MẶC ĐỊNH LÀ KHÔNG, và đây là một quyết định có chủ đích.
 * Lượt chạy đầu cho thấy nếu tính cả số bằng chữ thì "hai phương án" và
 * "ba dấu hiệu" bị gắn cờ là claim thiếu căn cứ — trong khi đó chỉ là cách
 * người viết đếm các ý của chính mình, không phải số liệu lấy từ nguồn.
 * Báo động giả kiểu đó làm biên tập viên bỏ công cụ ngay lần thứ hai.
 *
 * Ranh giới được vạch như sau: một con số là CLAIM khi nó là số đo lấy từ
 * nguồn. Prompt của AI 3 đã buộc mọi số liệu phải viết bằng chữ số, nên
 * kiểm tra chữ số là đủ phủ. Số viết bằng chữ chỉ dùng cho bộ dò mâu thuẫn,
 * nơi báo dư rẻ hơn báo thiếu.
 */
export function trichConSo(text, kemSoBangChu = false) {
  const out = new Set();
  // dạng chữ số: 12 · 4,5 · 128K · 87%
  for (const m of String(text).matchAll(/\d[\d.,]*\s*[%KMkm]?/g)) {
    out.add(m[0].trim().replace(/[.,]$/, ""));
  }
  if (kemSoBangChu) {
    const low = " " + String(text).toLowerCase() + " ";
    for (const [chu, so] of Object.entries(SO_BANG_CHU)) {
      if (low.includes(" " + chu + " ")) out.add(String(so));
    }
  }
  return [...out];
}

export function trichTenRieng(text) {
  const out = new Set();
  const cacCau = String(text).split(/(?<=[.!?:])\s+/);
  for (const cau of cacCau) {
    const tok = cau.trim().split(/\s+/);
    for (let i = 1; i < tok.length; i++) {          // i bắt đầu từ 1: BỎ token đầu câu
      const t = tok[i].replace(/^[“"(]+|[”",.;:)?!]+$/g, "");
      if (t.length < 2) continue;
      const c = t[0];
      if (c === c.toUpperCase() && c !== c.toLowerCase()) out.add(t);
    }
  }
  return [...out];
}

/* ═══════════ 4 · Claim thiếu căn cứ ═══════════
   Đây là chỗ C2 tra vào hồ sơ nguồn của C3 — một agent QA đứng riêng không làm được.
   Không hỏi AI "câu này có căn cứ không". Thay vào đó:
     lấy mọi con số và tên riêng trong câu → xem có trong đoạn trích của fact đã map không. */

export function claimThieuCanCu(cau, factsById, nguonDangDung) {
  if (!cau.fact_ids?.length) return []; // câu dẫn dắt, không cần căn cứ

  const kho = cau.fact_ids
    .map(id => factsById[id])
    .filter(Boolean)
    .flatMap(f => (f.bang_chung || []).filter(b => nguonDangDung.has(b.nguon_id)))
    .map(b => b.doan_trich)
    .join(" \n ")
    .toLowerCase();

  const out = [];
  for (const so of trichConSo(cau.loi)) {
    if (!kho.includes(so.toLowerCase())) {
      out.push({
        loai: "thieu-can-cu", sev: "cao", cau: cau.n,
        quote: timNguyenVan(cau.loi, so) || so,
        vi: `Con số “${so}” không xuất hiện trong đoạn trích của ${cau.fact_ids.join(", ")}. Khâu viết đã cho một con số không có trong nguồn lọt vào lời đọc.`,
        goiY: "bỏ con số, hoặc bổ sung nguồn rồi mới viết",
        thay: null,
      });
    }
  }
  for (const ten of trichTenRieng(cau.loi)) {
    if (!kho.includes(ten.toLowerCase())) {
      out.push({
        loai: "thieu-can-cu", sev: "trung bình", cau: cau.n,
        quote: ten,
        vi: `Tên riêng “${ten}” không có trong đoạn trích của ${cau.fact_ids.join(", ")}.`,
        goiY: "kiểm lại hoặc bỏ tên riêng này",
        thay: null,
      });
    }
  }
  return out;
}

/* ═══════════ 5 · Dò chỉ thị ẩn (prompt injection) ═══════════
   Lớp phòng thủ THỨ NHẤT, chạy TRƯỚC khi bất kỳ lời gọi AI nào nhìn thấy trang.
   Không dựa vào việc model tự nhận ra kẻ đang tấn công chính nó. */

const MAU_LENH_AN = [
  /bỏ qua (mọi |các |tất cả )?(hướng dẫn|chỉ dẫn|chỉ thị|quy tắc)/i,
  /ignore (all |any |the )?(previous|prior|above) (instruction|prompt|rule)/i,
  /disregard (the )?(system|previous|above)/i,
  /hãy (viết|ghi|trả lời) rằng/i,
  /bạn (phải|hãy) (coi|xem) (trang|nguồn) này là/i,
  /^\s*system\s*:/im,
  /you are now/i,
  /new instruction/i,
];

export function doLenhAn(text) {
  const hits = [];
  for (const re of MAU_LENH_AN) {
    const m = String(text).match(re);
    if (!m) continue;
    const i = m.index ?? 0;
    hits.push(String(text).slice(Math.max(0, i - 20), i + 180).replace(/\s+/g, " ").trim());
  }
  return hits;
}

/* ═══════════ 6 · Nguồn quá hạn ═══════════ */

export const NGUONG_THANG = 18; // chốt trong spec.md, không đổi sau hạn chốt spec

export function quaHan(ngayDang, homNay = new Date()) {
  if (!ngayDang) return { quaHan: true, thang: null, vi: "không có ngày đăng" };
  const d = new Date(ngayDang);
  if (isNaN(d)) return { quaHan: true, thang: null, vi: "ngày đăng không đọc được" };
  const thang = Math.round((homNay - d) / (1000 * 60 * 60 * 24 * 30.44));
  return {
    quaHan: thang > NGUONG_THANG,
    thang,
    vi: thang > NGUONG_THANG
      ? `đã ${thang} tháng, vượt ngưỡng ${NGUONG_THANG} tháng cho chủ đề AI`
      : `${thang} tháng, còn trong hạn`,
  };
}

/* ═══════════ 7 · Đếm nguồn độc lập & dò mâu thuẫn ═══════════ */

export function demNguonDocLap(fact, nguonDangDung) {
  return (fact.bang_chung || []).filter(b => nguonDangDung.has(b.nguon_id)).length;
}

/**
 * Hai nguồn cùng chống lưng một fact nhưng đưa hai bộ con số rời nhau → mâu thuẫn.
 * Hệ thống KHÔNG tự chọn bên nào; nó nêu cả hai và chuyển người duyệt.
 */
export function doMauThuan(fact, nguonDangDung) {
  const bc = (fact.bang_chung || []).filter(b => nguonDangDung.has(b.nguon_id));
  if (bc.length < 2) return null;

  const theoNguon = bc.map(b => ({ nguon_id: b.nguon_id, so: trichConSo(b.doan_trich, true) }))
                      .filter(x => x.so.length > 0);
  if (theoNguon.length < 2) return null;

  for (let i = 0; i < theoNguon.length; i++) {
    for (let j = i + 1; j < theoNguon.length; j++) {
      const a = new Set(theoNguon[i].so), b = new Set(theoNguon[j].so);
      const chung = [...a].some(x => b.has(x));
      if (!chung) {
        return {
          ben: [
            { nguon_id: theoNguon[i].nguon_id, so: theoNguon[i].so },
            { nguon_id: theoNguon[j].nguon_id, so: theoNguon[j].so },
          ],
          vi: `${theoNguon[i].nguon_id} đưa ${theoNguon[i].so.join(", ")}; ${theoNguon[j].nguon_id} đưa ${theoNguon[j].so.join(", ")}. Hai bộ số rời nhau.`,
        };
      }
    }
  }
  return null;
}

/* ═══════════ 8 · Định vị finding bằng indexOf ═══════════
   KHÔNG bao giờ tin offset do LLM trả về — nó đếm chỉ số ký tự rất tệ.
   Bắt nó trả chuỗi nguyên văn, rồi code tự tìm. Không tìm thấy → VỨT finding.
   Mất recall, đổi lấy precision. Precision là 25% rubric riêng của đề C2. */

export function dinhViSpan(loi, quote) {
  if (quote == null) return { ok: true, i: -1 };   // finding cấp câu, không cần span
  const i = String(loi).indexOf(quote);
  return { ok: i >= 0, i };
}

export function locFindingHopLe(cau, findings) {
  const giu = [], bo = [];
  for (const f of findings) {
    const { ok } = dinhViSpan(cau.loi, f.quote);
    (ok ? giu : bo).push(f);
  }
  return { giu, bo };
}

/* ═══════════ 9 · Tính phạm vi làm lại ═══════════
   Mô hình chi phí chung của cuộc thi: đổi lời câu N thì máy đọc phải thu lại
   cả N−1, N và N+1, vì mỗi câu được đọc kèm câu trước và câu sau làm ngữ cảnh. */

export function phamViLamLai(cauDoiLoi, tongSoCau) {
  const thu = new Set(), canh = new Set();
  for (const n of cauDoiLoi) {
    canh.add(n);
    for (const k of [n - 1, n, n + 1]) if (k >= 1 && k <= tongSoCau) thu.add(k);
  }
  return { thuLaiGiong: [...thu].sort((a, b) => a - b), dungLaiCanh: [...canh].sort((a, b) => a - b) };
}

/* ═══════════ 10 · Số liệu lấy từ fact CHƯA XÁC MINH ═══════════
   Đây là chỗ khâu soát (đề C2) tra vào hồ sơ nguồn (đề C3).
   Khác với mục 4: ở đây con số CÓ trong nguồn, nên phép đối chiếu chuỗi không bắt được.
   Cái sai nằm ở chỗ khác — fact đó đang mâu thuẫn giữa hai nguồn, chưa ai phân xử,
   vậy mà khâu viết vẫn cho một con số cụ thể vào lời đọc.
   Một agent QA đứng riêng không làm được việc này vì nó không có hồ sơ nguồn. */

export function soLieuTuFactChuaXacMinh(cau, factsById) {
  if (!cau.fact_ids?.length) return [];
  const so = trichConSo(cau.loi);
  if (!so.length) return [];
  const out = [];
  for (const id of cau.fact_ids) {
    const f = factsById[id];
    if (!f || f.trang_thai !== "chua-xac-minh") continue;
    for (const s of so) {
      out.push({
        loai: "thieu-can-cu", sev: "cao", cau: cau.n, quote: s,
        vi: `Con số “${s}” lấy từ ${id}, mà ${id} đang ở trạng thái CHƯA XÁC MINH: ${f.mau_thuan?.vi || "hai nguồn nói khác nhau"}. Hệ thống không được đưa con số nào vào lời đọc khi mâu thuẫn chưa được người duyệt phân xử.`,
        goiY: "bỏ con số, nói mức chênh chung chung, hoặc chờ nguồn thứ ba phân xử",
        thay: null, noi_ho_so: id,
      });
    }
  }
  return out;
}
