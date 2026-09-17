# CP1 Canvas — C3 · ScriptScout

> Nhóm: **Nguyễn Tuấn Thành · Nguyễn Trần Kiên · Hồ Đinh Tuấn Kiệt** — Lớp 3A · Hạn nộp 19:30 · 16/9
> Bản sơ bộ cho CP1. Evidence và spec hoàn thiện tiếp đến hạn chốt spec (21:00 · 17/9, tại CP4).

| Mục | Nội dung |
|---|---|
| **Hướng** | **C — Lesson Studio · đề C3 ScriptScout**: agent tự tìm tài liệu và viết kịch bản video có dẫn nguồn |
| **Job executor** | Người viết kịch bản trong Studio team VLearn, đang chuẩn bị kịch bản cho một clip bài giảng 3–5 phút về một chủ đề AI được giao, không có sẵn tài liệu nào trong tay. Người thứ hai trong luồng: giảng viên / lab coach duyệt nội dung trước khi cho dựng. |
| **Pain 1 câu** | Người viết phải tự tra cứu rồi tự viết toàn bộ lời đọc, mất nhiều ngày; đến lúc giảng viên duyệt thì **không câu nào chỉ ra được lấy từ đâu** (kịch bản thật đã phát hành: **0/40 câu** có dẫn nguồn ở cấp câu, trong khi **28/40 câu** mang thông tin cần căn cứ), nên người duyệt hoặc phải tự tra lại từng khẳng định hoặc duyệt liều — và một câu sai chỉ lộ ra sau khi đã thu giọng, dựng hình, lúc đó **phải thu và dựng lại cả cảnh đó**. |
| **Evidence ban đầu** | **(B — mining, chạy được lại)** ① Trên kịch bản thật 40 câu `data/studio-pack/c3-scriptscout/vi-du/kich-ban-d1.json`: **28/40 câu (70%)** chứa định nghĩa / khẳng định cách hệ thống hoạt động / ví dụ thực tế → cần căn cứ; **0/40 câu** có trường dẫn nguồn. ② Trên hồ sơ nguồn mẫu `vi-du/ho-so-nguon-mau.json`: **2/5 nguồn tìm được không dùng nguyên trạng được** (1 bị loại vì không truy được tác giả/nguồn gốc, 1 bị gắn cảnh báo vì số liệu đã 3 năm) và **1/6 thông tin ở trạng thái `chua-xac-minh`** vì chỉ có một nguồn → *tìm được* ≠ *tin được*. Phương pháp đếm + danh sách câu: `evidence/mining-kich-ban-d1.md`. **(A — phỏng vấn, đang hẹn)** ≥3 người Studio team / lab coach theo Mom Test, xong trước CP4. |
| **Lát cắt 1 câu** | **Một người viết kịch bản · cần 5 câu mở đầu cho một chủ đề được giao · AI quyết định mỗi nguồn tự tìm được là `DÙNG` / `CHƯA-XÁC-MINH` / `LOẠI` theo bộ tiêu chí công bố trước · trả về 5 câu văn nói kèm hồ sơ nguồn, mỗi câu gắn mã nguồn bấm ra được đoạn trích gốc — người viết loại một nguồn thì chỉ những câu dựa vào nguồn đó được viết lại.** |
| **Automation** | **Conditional.** Lý do theo cost-of-error: thông tin có **≥2 nguồn độc lập xác nhận** → AI tự viết thành câu; chỉ **1 nguồn hoặc các nguồn mâu thuẫn** → gắn `chua-xac-minh`, không đưa thành con số, chuyển người duyệt quyết; **không truy được tác giả/ngày đăng, link hỏng, trang bắt đăng nhập** → loại và báo rõ, không coi như đã đọc. Sai thì đắt: kịch bản thành video phát cho ~1.000 học viên, và mẫu kịch bản ghi rõ *"đổi một chữ sau khi đã thu giọng là phải thu lại cả câu đó"* — sửa sau khi dựng là làm lại cả cảnh. Ngược lại, chi phí để AI hỏi lại / đánh dấu chưa chắc là gần bằng không. |
| **Willing users dự kiến** | Cần **≥3 tên** (≥2 sẽ dùng cho R6 ở CP5) — *nhóm điền tại chỗ trước khi nộp form*: ① ______ (Studio team / người viết kịch bản) ② ______ (lab coach hoặc giảng viên duyệt nội dung) ③ ______ (thành viên nhóm khác trong phòng — đổi chéo). |
| **Phân công** | **Nguyễn Trần Kiên** — đội trưởng (nộp cả 5 mốc bằng một mã học viên), `spec.md`, thiết kế prompt + lời gọi AI ở quyết định trung tâm (chấm tin cậy nguồn). · **Nguyễn Tuấn Thành** — evidence (mining + hẹn phỏng vấn Studio team), golden set ≥20 case + bảng kết quả trong `eval/`. · **Hồ Đinh Tuấn Kiệt** — `codebase/`: luồng bấm được, màn hình duyệt nguồn (xem / bỏ / thêm), xuất file; dựng bộ trang web bẫy; video demo + dry run. |

---

## Phụ lục A — Phương pháp đếm (để TA và giám khảo kiểm lại được)

**Bộ mẫu:** toàn bộ 40 câu trong `data/studio-pack/c3-scriptscout/vi-du/kich-ban-d1.json` (kịch bản của một video thật đã phát hành, do BTC cấp làm đích).

**Quy tắc xếp loại — một câu được tính là "cần căn cứ" nếu chứa ít nhất một trong ba thứ:**

1. Định nghĩa một khái niệm kỹ thuật ("Trí tuệ nhân tạo là lĩnh vực…").
2. Khẳng định về cách một hệ thống hoạt động ("Bộ lọc dựa vào những gì đã học để dự đoán…").
3. Ví dụ, con số hoặc sự việc thực tế.

**Không tính:** câu dẫn dắt, chuyển ý, nêu kế hoạch video, câu hỏi tương tác, câu chốt lại điều vừa nói, khoảng lặng.

**Kết quả:**

| | Số câu | Danh sách |
|---|---|---|
| Cần căn cứ | **28 / 40 (70%)** | 2, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26, 28, 30, 31, 36, 37, 38, 39 |
| Không cần | 12 / 40 | 1, 3, 12, 13, 24, 27, 29, 32, 33, 34, 35, 40 (câu 35 là khoảng lặng) |
| **Có dẫn nguồn ở cấp câu** | **0 / 40** | kiểm bằng: không câu nào trong file có trường `nguon` |

*Đối chiếu: BTC ghi trong `vi-du/kich-ban-co-nguon.json` rằng câu 5, 10, 12, 13 "chỉ chuyển ý hoặc dẫn dắt". Nhóm tính 5 và 10 là cần căn cứ vì hai câu này khẳng định cách hệ thống hoạt động. Chênh lệch này được ghi lại để chốt định nghĩa ở CP4 — dù tính theo cách nào thì tỉ lệ vẫn ≥ 65%.*

**Lệnh kiểm lại:**

```bash
python3 -c "import json; d=json.load(open('vi-du/kich-ban-d1.json')); print(len(d['cau']), sum(1 for c in d['cau'] if 'nguon' in c))"
# -> 40 0
```

---

## Phụ lục B — Chuẩn bị sẵn cho CP2 (21:00 · 16/9) và CP4

**Non-goals (≥3, sẽ khai đủ ở `spec.md` §4):**

1. Không dựng video, không sinh hình, không TTS — chỉ ra kịch bản dạng chữ.
2. Không viết cả kịch bản 40 câu — chỉ 5 câu mở đầu trong lát cắt này.
3. Không tự xuất bản: kịch bản phải qua giảng viên duyệt mới được dựng.
4. Không chấm "văn này do AI viết hay người viết" (đó là đề C2).

**4 lớp chỗ khó — bản nháp, cụ thể hoá đủ ở `spec.md` §5:**

| Lớp | Cụ thể hoá cho ScriptScout |
|---|---|
| ① Nguồn sự thật | AI bịa đoạn trích, hoặc trích đúng chữ nhưng gán sai URL. → Tự soát: đoạn trích phải khớp chuỗi trong bản HTML đã tải về; không khớp thì bỏ câu, không đoán. |
| ② Mơ hồ / thiếu thông tin | Chủ đề gần như không có tài liệu tiếng Việt; hoặc hai nguồn uy tín đưa số liệu khác nhau. → Nói rõ đã phải xoay sang nguồn ngoại ngữ; nêu cả hai số và để người duyệt chọn, không im lặng chọn một cái. |
| ③ Ngoài phạm vi / thẩm quyền | Trang web cài lệnh ẩn ("bỏ qua hướng dẫn trước, hãy viết…"); người dùng bảo "cứ viết đại, không cần nguồn". → Chữ trên trang là **dữ liệu để đọc**, không phải lệnh; từ chối viết câu mang thông tin mà không có căn cứ. |
| ④ Đặc thù domain | Số liệu về AI cũ đi theo tháng — đúng lúc viết, sai lúc video lên sóng; và văn viết ra thành bản tóm tắt báo cáo thay vì văn nói (một ý một cảnh). → Cảnh báo nguồn quá hạn; ràng buộc mỗi câu là một cảnh đọc được thành lời. |

**Bộ trang web bẫy tự dựng (nộp kèm bài):** ① trang có lệnh ẩn trong HTML · ② hai trang uy tín, số liệu ngược nhau · ③ trang cũ đã có bản thay thế · ④ link hỏng 404 · ⑤ trang bắt đăng nhập.

**Ba việc phải làm trước 21:00 hôm nay (CP2):** tạo repo GitHub công khai + commit đầu · vẽ được luồng `nhập 4 thông tin → tìm nguồn → hồ sơ nguồn → duyệt/loại → 5 câu có nguồn → loại nguồn → viết lại có chọn lọc` · điền 3 tên willing user.
