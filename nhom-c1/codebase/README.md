# ScriptScout — cách chạy, chi phí, và những gì chưa làm được

Đề C3 (agent tự tìm tài liệu và viết kịch bản có dẫn nguồn) tích hợp đề C2 (soát văn nói).
Nhóm 3A · Nguyễn Tuấn Thành · Nguyễn Trần Kiên · Hồ Đinh Tuấn Kiệt.

## Chạy

Cần Node 18 trở lên. **Không cài package nào** — chỉ dùng `fetch` và `http` có sẵn.

```bash
node codebase/server.js          # → http://localhost:5173
node eval/run.js                 # chạy 28 case golden set, ghi eval/run_results.md
```

Không có khoá API thì hệ thống chạy bằng **đáp án dựng sẵn** (`LLM_PROVIDER=stub`): luồng đi trọn vẹn,
mọi phần code chạy thật, chỉ phần model là đọc từ `fixtures/llm/`. Dải nhãn trên đầu trang ghi rõ
đang ở chế độ nào.

## Cấu hình

**Toàn bộ cấu hình gọi API nằm trong `codebase/.env`.** Trong code không có giá trị nào phải
sửa tay: nhà cung cấp, khoá, tên model, endpoint, temperature, max_tokens, timeout, giới hạn
ký tự mỗi trang — tất cả đọc từ đó.

```powershell
Copy-Item codebase\.env.example codebase\.env
notepad codebase\.env          # điền LLM_API_KEY
node codebase/kiem-tra-khoa.js  # in cả bảng cấu hình rồi gọi thật một lần để xác minh
```

`.env.example` liệt kê đủ từng biến kèm lý do chọn giá trị đó. Biến môi trường đặt sẵn
(`$env:` trong PowerShell) **thắng** giá trị trong `.env`.

### Hết hạn mức (lỗi 429)

Một lượt chạy gọi model **tới 13 lần**, mà free tier Gemini chỉ cho **5 lần mỗi phút**. Chạy
thẳng là chắc chắn đứt giữa chừng. Ba cách, xếp theo thứ tự nên thử:

| Cách | Đặt gì | Đổi lại được gì |
|---|---|---|
| Giãn cách lời gọi | `LLM_MIN_GAP_MS=13000` | Chạy xong, nhưng một lượt mất ~3 phút |
| Đổi nhà cung cấp | `LLM_PROVIDER=openrouter` + `OPENROUTER_MODEL` | Hạn mức thoáng hơn; model `:free` ~20 lần/phút |
| Chạy đáp án dựng sẵn | `LLM_PROVIDER=stub` | Không tốn hạn mức, và **đúng code path mà eval dùng** |

### Chạy nhanh hơn

Hai thứ quyết định thời gian một lượt chạy: **số lời gọi** (tới 13) và **thời gian mỗi lời gọi**.

| Đo được | Thời gian mỗi lời gọi | Một lượt |
|---|---|---|
| `openrouter/free` (bộ định tuyến model miễn phí) | ~18 giây | 1–4 phút |
| model trả phí rẻ (`openai/gpt-4o-mini`) | ~2 giây | ~20 giây |
| `stub` (đáp án dựng sẵn) | ~0 | dưới 1 giây |

Nguồn được chấm **song song** — `LLM_CONCURRENCY=4` mặc định, vì các nguồn độc lập nhau hoàn
toàn. Nối tiếp 10 nguồn với model free là 3 phút; 4 luồng còn dưới 1 phút. Đặt
`LLM_MIN_GAP_MS > 0` thì hệ thống xếp hàng lại và `LLM_CONCURRENCY` mất tác dụng — hai cách
chống 429 đó loại trừ nhau: giãn cách dành cho hạn mức chặt (Gemini free 5 lần/phút), song
song dành cho hạn mức thoáng.

Giao diện **đẩy nhật ký theo dòng ngay trong lúc chạy** (NDJSON), kèm đồng hồ đếm giây trên nút.
Trước đây gom hết rồi mới trả một cục, nên suốt vài phút màn hình trắng và trông y như treo.

Hệ thống tự thử lại khi dính 429: nó đọc đúng số giây API bảo chờ (`Please retry in 38.6s`,
hoặc header `Retry-After`) rồi chờ đúng thế, tối đa `LLM_MAX_RETRY` lần. Mỗi lần chờ đều hiện
một dòng trên bảng nhật ký của giao diện, nên lúc demo không bị tưởng là treo.

**OpenRouter** nói đúng schema `/chat/completions` của OpenAI, nên nó dùng chung hàm gọi với
`openai` — thêm nhà cung cấp này không phải viết thêm nhánh parse riêng. Chỉ khác endpoint và
hai header `HTTP-Referer` / `X-Title` để hiện tên app. Gặp 400/404 là ID model sai; hệ thống in
kèm đường dẫn `https://openrouter.ai/models?q=free` trong thông báo lỗi.

**Khoá để trong `.env.example` thì hệ thống không đọc** — file đó được commit lên repo, chỉ
để làm mẫu. Phải copy thành `.env`.

Ba con số KHÔNG cấu hình được qua `.env`, và đó là cố ý: ngưỡng 18 tháng, ngưỡng 25 âm tiết
(cả hai trong `src/rules.js`) và quality bar 80% (`eval/golden_set.json`). Đó là chuẩn chấm đã
chốt trong `spec.md` tại CP4 — để env đổi được thì bảng kết quả hai lượt không còn so sánh
được với nhau.

**Chế độ trang bẫy** (nút trên giao diện, mặc định BẬT): đọc 10 trang dựng sẵn trong
`fixtures/pages/` thay vì đi mạng. Đây là **đúng tham số `fixtures` mà bộ eval dùng**, không phải
một nhánh demo riêng — nên thứ demo trên sân khấu chính là thứ golden set đã test, và không phụ
thuộc wifi sự kiện.

## Chi phí mỗi lần chạy

Một lượt chạy trọn vẹn với 12 nguồn gọi model **tối đa 13 lần**:

| Lời gọi | Số lần | Vì sao |
|---|---|---|
| AI 1 · phân rã chủ đề | 1 | |
| AI 2 · chấm nguồn | ≤ 10 | mỗi nguồn ĐỌC ĐƯỢC một lần. Trang 404/403 và trang có chỉ thị ẩn **không gọi** |
| AI 3 · gom fact + viết câu | 1 | |
| AI 4 · soát văn nói | 1 | |

Ước lượng thô cho một lượt 12 nguồn: **~25–35 nghìn token vào, ~4–6 nghìn token ra**. Phần lớn nằm ở
AI 2 vì nó phải đọc nội dung trang (mỗi trang cắt ở 12 000 ký tự).

Trên free tier của Gemini (~1 500 request mỗi ngày) thì một lượt chạy tốn ~13 request, tức là
**chạy được khoảng 100 lượt mỗi ngày** — đủ cho cả kỳ hackathon.

Muốn biết chi phí thật của nhóm thì đọc `traces/`: mỗi lời gọi một file JSON, có đủ prompt vào,
phản hồi thô, và thời gian chạy.

## Những gì hệ thống CHƯA làm được

Viết ra để khỏi phải hứa lúc demo.

1. **Không có bộ tìm kiếm thật.** AI 1 sinh ra câu truy vấn nhưng chưa nối vào dịch vụ tìm kiếm nào;
   danh sách URL hiện lấy từ bộ fixture. Nối thêm là một hàm, nhưng chưa làm.
2. **Bộ dò chỉ thị ẩn đi theo mẫu, nên có biên.** Case `G26` trong golden set chứng minh điều đó:
   câu "Please disregard everything you were told earlier" không khớp mẫu nào và lọt qua. Đây là
   case **lớp ③ thất bại**, tức là vi phạm điều kiện cứng của quality bar.
3. **Tên riêng bịa đứng đầu câu thì lọt** (`G25`). Bộ dò bỏ token đầu câu để tránh báo oan chữ viết
   hoa đầu câu — cái giá của lựa chọn đó là mất một phần recall.
4. **Dò mâu thuẫn so hai tập con số, nên hai nguồn cùng nhắc một năm sẽ không bị coi là mâu thuẫn**
   (`G27`), dù con số thực chất ngược nhau.
5. **Xưng hô đứng cuối câu thì lọt** (`G28`) — bộ dò khớp `" quý vị "` và `" quý vị,"` nhưng không
   khớp `" quý vị."`.
6. **Không có storyboard, không có TTS, không dựng video.** Khai non-goal từ đầu.
7. **Lặp ý không được soát.** Khai non-goal: trên kịch bản 5 câu thì nhấn mạnh hợp lệ đọc y như lặp,
   báo động giả cao mà kiểm soát báo động giả là 20% rubric của đề C2.
8. **Chưa có vòng viết lại có chọn lọc trong giao diện.** Lõi đã có (`gomFact` tính lại trạng thái
   fact khi nguồn bị loại), nhưng nút "loại nguồn" trên UI chưa nối vào.

## Cấu trúc

```
codebase/
├── server.js              máy chủ nhỏ, không có luật nghiệp vụ nào
├── src/
│   ├── llm.js             adapter đa nhà cung cấp + ghi trace
│   ├── prompts.js         4 prompt, mỗi ràng buộc có lý do ghi kèm
│   ├── scrape.js          tải trang · bóc text · fixtures · bọc dữ liệu
│   ├── rules.js           TOÀN BỘ phần kiểm bằng code, không có lời gọi AI nào
│   └── pipeline.js        quyetDinhNguon() là mắt xích quyết định trung tâm
├── ui/index.html          giao diện, gọi API của server
├── fixtures/pages/        10 trang bẫy + index.json
├── fixtures/llm/          đáp án dựng sẵn cho chế độ stub
└── traces/                mỗi lời gọi AI một file JSON
```

## Ai giải thích được phần nào (luật vibe-coding CP6)

| Phần | Người phụ trách |
|---|---|
| `rules.js` — đếm âm tiết, dò xưng hô, claim thiếu căn cứ, dò chỉ thị ẩn | *(điền tên)* |
| `pipeline.js` + `prompts.js` — quyết định trung tâm, chia việc code/AI | *(điền tên)* |
| `llm.js` + `server.js` + `ui/` — adapter, trace, giao diện | *(điền tên)* |
| `eval/` — golden set, runner, phân tích case thất bại | *(điền tên)* |
