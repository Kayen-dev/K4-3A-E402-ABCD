# Báo cáo — đã làm được gì

Nhóm 3A · Nguyễn Tuấn Thành · Nguyễn Trần Kiên · Hồ Đinh Tuấn Kiệt
Đề **C3 ScriptScout** tích hợp **C2 QA văn nói** · dựng theo `pipeline-v2.md` · mốc CP3.

## Một đoạn

Prototype chạy trọn vẹn từ 4 thông tin đầu vào đến kịch bản có dẫn nguồn và báo cáo soát văn nói.
Quyết định trung tâm là **chấm nguồn theo 5 tiêu chí công bố trước**, có lời gọi AI thật và ghi trace
đầy đủ. Golden set 28 case chạy được bằng một lệnh, lượt 1 đạt **85,7%** — trên quality bar 80%,
nhưng **vi phạm điều kiện cứng** vì một case lớp ③ thất bại.

## Đã dựng

**Lõi** — Node thuần, không cài package nào.

| File | Việc |
|---|---|
| `src/llm.js` | Adapter Gemini / Anthropic / OpenAI, đổi bằng biến môi trường. Mọi lời gọi ghi ra `traces/` |
| `src/scrape.js` | Tải trang · bóc text · **giữ comment HTML để dò lệnh ẩn** · chế độ `fixtures` |
| `src/rules.js` | 10 luật kiểm bằng code, không có lời gọi AI nào trong file |
| `src/prompts.js` | 4 prompt, mỗi ràng buộc kèm lý do |
| `src/pipeline.js` | `quyetDinhNguon()` — mắt xích quyết định trung tâm |
| `server.js` + `ui/` | Máy chủ nhỏ và giao diện biên tập |

**Bộ thử** — 10 trang bẫy tự dựng: lệnh ẩn tiếng Việt, lệnh ẩn giấu trong comment HTML, lệnh ẩn diễn
đạt khác, nguồn quá hạn, hai nguồn số liệu ngược nhau, trang không tác giả, trang lạc đề, 404, 403,
tài liệu nội bộ.

**Eval** — `eval/golden_set.json` 28 case, `eval/run.js` chạy một lệnh, `eval/run_results.md` tự sinh.

## Ba quyết định thiết kế đáng nói

**1 · Code quyết 3/5 tiêu chí, AI quyết 2.**

| Tiêu chí | Ai quyết |
|---|---|
| 1 · người chịu trách nhiệm | code |
| 2 · còn trong hạn | code |
| 3 · có dẫn nguồn riêng | AI |
| 4 · khớp chủ đề | AI |
| 5 · không có chỉ thị ẩn | **code** |

Tiêu chí 5 tuyệt đối không giao cho AI: lệnh tấn công nằm trong **cùng context window** với lệnh bảo
model chống lại nó. Code quét trước, và kết luận của code không bị model ghi đè. Trang dính lệnh ẩn
thì **không gọi AI luôn** — vừa đỡ tiền, vừa bớt một đường cho injection.

**2 · Finding của AI phải là chuỗi nguyên văn, không phải vị trí.**
LLM đếm chỉ số ký tự rất tệ. Hệ thống bắt nó trả chuỗi con, rồi `indexOf` tự định vị; không tìm thấy
thì **vứt finding**. Đáp án dựng sẵn cố tình có một finding sai để chứng minh cơ chế này chạy.

**3 · Khâu soát tra vào hồ sơ nguồn.**
Câu 4 viết "chi phí tăng gấp 12 lần". Con số đó **có thật** trong nguồn n04, nên phép đối chiếu chuỗi
không bắt được. Nhưng `t03` đang ở trạng thái *chưa xác minh* vì n04 nói 12 lần còn n05 nói 4–6 lần.
Hệ thống mở hồ sơ, đọc trạng thái, rồi mới gắn cờ. **Một agent QA đứng riêng không làm được việc này
vì nó không có hồ sơ nguồn để tra** — đây là lý do kỹ thuật để gộp C2 vào C3, không phải lý do trình bày.

## Kết quả đo — lượt 1

| | |
|---|---|
| Số case | 28 |
| Đạt | 24 |
| Tỷ lệ | **85,7%** |
| Quality bar | 80% — đạt |
| Điều kiện cứng | **vi phạm** — 1 case lớp ③ thất bại |

| Lớp | Đạt / Tổng |
|---|---|
| ① Nguồn sự thật | 3/4 |
| ② Mơ hồ, thiếu thông tin | 3/4 |
| ③ Ngoài phạm vi | 3/4 |
| ④ Đặc thù nghiệp vụ | 3/4 |
| thường | 9/9 |
| hiếm | 3/3 |

**8/28 case xây từ dữ liệu thật** trong `data/`, trích bằng mã câu và mã đoạn — không sao nguyên file
vào repo, theo đúng luật bảo mật data pack.

### Bốn case thất bại — đều là lỗ hổng thật

| ID | Lỗi | Nguyên nhân |
|---|---|---|
| G25 | Tên riêng bịa ở **đầu câu** lọt qua | Bộ dò bỏ token đầu câu để tránh báo oan chữ viết hoa đầu câu. Cái giá là mất recall ở đúng vị trí đó |
| G26 | Lệnh ẩn diễn đạt khác mẫu lọt qua | Dò theo mẫu cố định luôn có biên. "Please disregard everything you were told" không khớp mẫu nào |
| G27 | Hai nguồn ngược nhau nhưng cùng nhắc "2026" → không bị coi là mâu thuẫn | Luật so hai **tập** con số; hai tập giao nhau ở năm nên kết luận là khớp. Lỗi thiết kế của luật |
| G28 | Xưng hô lệch đứng **cuối câu** lọt qua | Bộ dò khớp `" quý vị "` và `" quý vị,"` nhưng không khớp `" quý vị."` |

G26 là nặng nhất vì nó thuộc lớp ③. Ba cái còn lại sửa được trong dưới một giờ; G26 thì không sửa dứt
điểm được bằng cách thêm mẫu — phải chấp nhận là bộ dò mẫu có biên và ghi vào phần hạn chế.

## Hai lỗi phát hiện khi chạy thật, đã sửa

**Bộ đếm số bắt oan "hai phương án", "ba dấu hiệu".** Ban đầu bộ trích con số tính cả số viết bằng
chữ, nên hai cụm đó bị gắn cờ là claim thiếu căn cứ — trong khi đó chỉ là cách người viết đếm ý của
chính mình. Đã vạch lại ranh giới: một con số là *claim* khi nó là số đo lấy từ nguồn, và prompt của
AI 3 đã buộc mọi số liệu viết bằng chữ số, nên kiểm chữ số là đủ phủ.

**Fact gắn nhầm bằng chứng.** AI 3 khai nguồn nào chống lưng fact nào, nhưng code lại gắn *toàn bộ*
đoạn trích của nguồn đó vào fact, làm số nguồn bị thổi lên và sinh mâu thuẫn giả. Đã sửa: AI 3 phải
khai từng đoạn trích cụ thể, và **code đối chiếu lại đoạn đó có thật sự nằm trong nguồn không** —
đoạn nào không khớp thì loại. Lượt chạy hiện tại loại 1 bằng chứng bịa.

## Một lỗ trong pipeline v2 đã vá

`pipeline-v2.md` liệt kê 4 lời gọi AI nhưng **không nói fact được gom từ đâu** — không lời gọi nào
làm việc đó. Đã gộp việc gom fact vào AI 3 (đọc đoạn trích của các nguồn đã duyệt rồi gom ý), giữ
nguyên con số 4 lời gọi. Provenance vẫn do code kiểm, không tin AI chép lại.

## Còn thiếu

1. Chưa nối dịch vụ tìm kiếm thật — AI 1 sinh truy vấn nhưng URL vẫn lấy từ bộ fixture.
2. Vòng viết lại có chọn lọc: lõi đã có, nút "loại nguồn" trên UI chưa nối.
3. Chạy lại golden set bằng **khoá thật** — 3 case đánh dấu `can_khoa_that` hiện chạy bằng đáp án dựng sẵn.
4. Sửa G25, G27, G28 rồi chạy lượt 2 để có bảng so hai vòng.
5. Chốt lát cắt trong `spec.md` §4: có gộp bước soát vào câu lát cắt hay khai C2 là phần làm vượt.
   Đổi thì phải ghi §9 Changelog. **Hạn 21:00 · 17/9.**

## Chạy thử

```bash
node codebase/server.js     # http://localhost:5173 — chế độ trang bẫy bật sẵn
node eval/run.js            # 28 case, ghi eval/run_results.md
```

## Vá sau khi chạy thật với khoá Gemini

**Lỗi 429 làm đứt lượt chạy.** Một lượt gọi model tới 13 lần, free tier Gemini cho 5 lần mỗi phút
→ luôn đứt ở bước viết câu. Đã thêm ba thứ: hàng đợi giãn cách lời gọi (`LLM_MIN_GAP_MS`), tự thử
lại khi 429 theo **đúng số giây API bảo chờ**, và **provider `openrouter`** cho nhóm khoá hạn mức
thoáng hơn. OpenRouter nói đúng schema `/chat/completions` của OpenAI nên dùng chung hàm gọi —
thêm nhà cung cấp không phải viết thêm nhánh parse.

**Giao diện hiện `0/0 nguồn · 0 câu` mà không nói vì sao.** Nguyên nhân: server trả `{loi}` kèm mã
200, `fetch` không ném, giao diện vẽ một object rỗng. Đã sửa ba lớp: server không bao giờ trả lỗi
rỗng (kèm cả nhật ký), giao diện kiểm từng bước và in lỗi thật kèm cách xử lý, và pipeline trả về
**phần đã làm xong** thay vì ném lỗi — bảng chấm nguồn là thứ đắt tiền nhất trong một lượt chạy.

**Nguồn hỏng vì lỗi API không còn bị gộp vào "loại".** Trước đây gọi API thất bại thì nguồn bị ghi
`trang_thai = "loai"`, tức là báo cáo nói sai sự thật — người đọc tưởng nguồn kém chất lượng. Nay
có trạng thái riêng `loi-goi-ai`.

## Chặn lộ data pack của ban tổ chức

`nhom-c3/` nằm **bên trong** bản clone repo của BTC; `.git` ở thư mục cha, cùng chỗ với `data/`
(6 transcript, `tutor_turns.csv` 22 MB, 2 PDF slide, `d1.mp4` 13 MB) và `.gitignore` gốc của BTC
không chặn `data/`. Thêm remote công khai vào repo đó rồi push là đẩy cả data pack lên mạng, và
`.gitignore` trong `nhom-c3` không cứu được vì file đã được theo dõi từ trước.

Đã làm: `.gitignore` ba lớp (thư mục pack ở mọi độ sâu · tên file pack · định dạng media/nặng),
`AN-TOAN-DU-LIEU.md` ghi cách xử lý và cách khắc phục nếu lỡ push, và `soat-an-toan.js` — soát
git root có đúng tại `nhom-c3`, data pack có lọt vào thư mục nộp bài, có chuỗi nào trông giống
khoá API (kể cả trong `.env.example`), `.env` có bị theo dõi. Trả mã thoát 1 nếu có vấn đề.
