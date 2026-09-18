# Đánh giá pipeline C3 + C2

> Nhóm 3A · Thành · Kiên · Kiệt — đánh giá bản pipeline 6 giai đoạn (đã lược C5), bối cảnh hackathon 48h.

**Kết luận.** Pipeline đúng về thứ tự và đúng về chỗ đặt con người. Nhược điểm nằm ở mô hình dữ liệu (giai đoạn 5) và ở phạm vi (11 bộ phận trong 48h). Hai chỗ thiếu hẳn lại nằm trong phần chấm bắt buộc: xử lý lệnh ẩn, và móc nối cho eval.

## Chín nhược điểm, xếp theo mức thiệt hại

**1 · Giai đoạn 5 là phần khó nhất, đang viết bằng hai câu.** Nếu citation lưu bằng offset ký tự thì mọi lần sửa làm trượt toàn bộ offset phía sau — kể cả span của các finding C2 khác trong cùng câu. Và người dùng tự gõ lại một câu thì hệ thống không biết câu đó còn dẫn về fact nào.
*Chốt trong giờ đầu:* kịch bản là **mảng object câu** (không phải một chuỗi dài) · citation ở **cấp câu** (không phải cấp span) · finding C2 là **dữ liệu tạm, không lưu** — câu đổi thì quét lại câu đó.

**2 · Hai lớp highlight sẽ đè lên nhau.** Một câu có cả fact và lỗi văn nói thì hai lớp chồng trên cùng những chữ đó; `<mark>` lồng nhau không sạch.
*Thoát:* citation là một chip ở cuối câu; highlight trong dòng chỉ dành cho finding C2.

**3 · LLM trả span sai gần như chắc chắn.** Nó đếm chỉ số ký tự rất tệ, finding sẽ hiện lệch chỗ trước mặt giám khảo.
*Thoát:* bắt trả về **chuỗi con nguyên văn**, tự `indexOf`, chuỗi nào không tìm thấy thì loại thẳng finding. Mất recall, đổi lấy precision — mà precision là 25% rubric C2, còn recall thấp thì công cụ vẫn dùng được.

**4 · Fact-checker bị gán cho AI, trong khi nó là code.** Giai đoạn 2 đã map sẵn câu nào dựa trên fact nào. Nên phép kiểm là: trích con số và danh từ riêng trong câu, xem có trong đoạn trích của fact đã map không. Regex, không tốn token, không bao giờ sai.

**5 · Prompt injection không có trong pipeline — mà nó nằm trong demo bắt buộc.** Đề ghi rõ giám khảo sẽ chạy một trang có lệnh ẩn. Thiếu cùng nhóm: 404/paywall phải ghi là "không đọc được" chứ không bỏ qua im lặng, và nguồn quá hạn cần một phép so ngày. Cả ba là code, đều rẻ, ăn điểm "chịu được tình huống xấu" (10%).

**6 · Không có chỗ nào cho eval — R4 là 15 điểm.** Nếu bước scrape không nhận fixture cục bộ thì không chạy được golden set 20 lượt, nên không chứng minh được hệ thống tốt lên qua từng vòng.
*Thoát:* thêm `scrape(url, {fixtures})`. Một tham số đó cho cả golden set chạy lại được, bộ trang bẫy để nộp, và tiêu chí "chạy lại cho kết quả tương đương" (10%). Kèm log mọi lời gọi AI ra `traces/` — CP3 đòi trace trong repo.

**7 · Chuyển thẳng C3 sang C2 là sai.** Giám khảo không bao giờ thấy output thô của C3 — mà đó là cái bán được. Và khi giám khảo đưa chủ đề tại chỗ, một lượt tìm kiếm tệ kéo theo cả draft và QA tệ, không có điểm nào để nhảy vào cứu. Để C2 là một nút bấm.

**8 · TTS preview là cái bẫy.** Giọng Việt đủ tốt để phán xét breath-group không dựng nổi trong 48h, và máy demo thì nhóm không kiểm soát. Nếu nó đọc như robot thì giám khảo gán cái dở đó cho output của nhóm. Thứ thật sự cần là phép đếm ký tự — ship con số và một thanh breath-bar, bỏ audio.

**9 · 11 agent trong 48h.** Đề chỉ đòi ≥1 lời gọi AI thật, và rubric ghi rõ một bản Sketch làm kỹ hơn một bản Working làm vội.

## Gom lại: 4 lời gọi AI

| # | Lời gọi | Vào | Ra |
|---|---|---|---|
| 1 | Phân rã chủ đề | 4 thông tin | 3–5 truy vấn |
| 2 | Chấm nguồn | text 1 trang + 5 tiêu chí | điểm từng tiêu chí + lý do |
| 3 | Viết câu | fact đã duyệt | N câu + fact nào cho câu nào |
| 4 | Soát văn nói | N câu | finding (chuỗi con, không phải offset) |

**Còn lại là code:** scrape · đếm nguồn độc lập · dò mâu thuẫn · dò lệnh ẩn · so ngày · đếm ký tự · dò xưng hô lệch · fact-check con số · tính câu nào phải viết lại.

**Taxonomy cắt 8 còn 4:** translationese · câu quá dài · xưng hô không nhất quán · claim thiếu căn cứ (ba trong bốn là rule-based). Bốn loại còn lại khai non-goal — rubric cho điểm non-goals, không trừ.

## Bốn chỗ làm đúng

Hai điểm human-in-the-loop, đặt đúng chỗ (trước khi viết, trước khi xuất bản) — chính là tiêu chí 15%. · "Viết lại chỉ câu phụ thuộc rồi quét lại đúng câu đó" là ý sắc nhất. · Hồ sơ tài liệu là artifact riêng trước khi draft, đúng thứ tự đề yêu cầu. · Audit trail là output hạng nhất, hầu hết nhóm quên.

## Nên thêm lại, rẻ

Bỏ C5 hợp lý, nhưng "chỉ viết lại câu phụ thuộc" cần gắn số. Chỉ cần hiện **"2/5 câu viết lại · 3 câu giữ nguyên từng chữ"** — phép trừ, biến một tính chất thành bằng chứng.

## Việc cần làm

| Khi nào | Việc | Điểm |
|---|---|---|
| Ngay, trước khi code tiếp | Chốt mô hình dữ liệu (mục 1) | tránh mất một ngày |
| Ngay | Bỏ TTS · cắt taxonomy còn 4 · khai non-goal | R2 |
| Trước CP3 · 16:00 17/9 | `scrape(url, {fixtures})` + 5 trang bẫy + `traces/` | R4 · CP3 |
| Trước CP3 | 4 lời gọi AI thật, log đầy đủ | CP3 |
| Trước CP3 | Golden set ≥20 case, ≥2 case mỗi lớp, bảng % lượt 1 | R4 |
| Trước CP4 · 21:00 17/9 | Quyết lát cắt có gộp C2 hay không, ghi §9 Changelog | R2 |
| Trước CP4 | Chốt quality bar bằng %, giữ nguyên sau đó | R4 |

**Cần quyết sớm nhất:** `spec.md` §4 đang khai lát cắt thuần C3. Chốt app gồm cả bước soát thì câu lát cắt phải viết lại — đổi câu đã nộp ở CP1 nên bắt buộc ghi §9. Cách còn lại là giữ lát cắt và khai C2 là phần làm vượt. Tôi nghiêng về cách đầu, vì R2 chấm "lát cắt khớp bản build".
