# Bàn giao dev — thay đổi ScriptScout so với `main` cũ

Mốc so sánh: `6532954` (main trước merge) → `e4c92c3` (main sau merge `demo_v0`).
Ngày cập nhật: 2026-09-17.
Phạm vi: `codebase/nhom-c1/codebase/`, `codebase/nhom-c1/eval/`, `eval/` và `spec.md` ở gốc repo.
Mục tiêu sản phẩm: tìm tài liệu, chọn nguồn có căn cứ, viết kịch bản bài giảng, rồi duyệt từng câu.

## 1. Những gì người dùng thấy

- UI cũ là một trang HTML lớn; UI mới là React + TypeScript + Vite + Tailwind.
- Landing page giới thiệu ScriptScout, bốn bước làm việc và hai cách bắt đầu.
- Cách 1: nhập bài học rồi tìm nguồn, chọn nguồn, viết kịch bản.
- Cách 2: dán kịch bản có sẵn để rà soát văn nói.
- Form bài học có nhãn, ví dụ nhập, gợi ý và trạng thái đủ/thiếu thông tin.
- Các trường bắt buộc: chủ đề, mục tiêu, người học, thời lượng 1–120 phút.
- Nút tìm tài liệu chỉ bật khi dữ liệu đầu vào hợp lệ.
- Giao diện responsive, bố cục riêng cho màn hình nhỏ và lớn.
- Header nêu rõ ba việc chính: research nguồn, viết kịch bản, duyệt bằng chứng.
- Có danh sách phiên để mở lại hoặc xóa phiên đã lưu.
- Có thông báo lỗi và toast sau thao tác.

### Khu vực research

- Thẻ “Đã đọc x/y tài liệu” mở/đóng được.
- Khi mở, người dùng thấy tiến độ tìm URL, đọc trang và số nguồn dùng được.
- Nhật ký hiển thị tối đa sáu sự kiện gần nhất trong khu vực research.
- Người dùng có thể bấm “Tìm thêm tự động” theo cùng chủ đề.
- Người dùng có thể nhập URL và bấm “Đọc URL này”.
- Danh sách hiển thị toàn bộ nguồn đã lưu trong phiên, kể cả nguồn bị loại.
- Mỗi nguồn hiện tiêu đề, URL, trạng thái, lý do và số đoạn trích hợp lệ.
- “Xem đoạn đã đọc” mở nội dung nguồn để kiểm tra bằng chứng.
- Checkbox cho phép chọn các nguồn có trạng thái dùng được và có đoạn trích.
- Nguồn lỗi, bị loại hoặc chưa có đoạn trích vẫn nhìn thấy nhưng không chọn để viết.
- Khung bên cạnh đếm số nguồn hợp lệ đã chọn và có nút “Viết kịch bản”.
- Nút viết duyệt nguồn trước, rồi dùng revision mới để gọi tạo kịch bản.

### Loading và duyệt kết quả

- Loading nêu tác vụ hiện tại: research, đọc URL, viết, rà soát hoặc viết lại.
- Tiến độ có ba chặng: tìm nguồn, đọc/chấm nguồn, tạo kết quả.
- UI nhận thông báo từ stream NDJSON và hiện năm sự kiện mới nhất.
- Khối loading dùng `role=status` và `aria-live=polite`.
- Dialog nguồn và chế độ đọc thử có thể đóng bằng phím Escape.
- Focus được giữ trong dialog khi mở và trả về phần tử cũ khi đóng.
- Câu kịch bản có thể xem căn cứ, sửa, duyệt góp ý và hoàn tác.
- Chế độ teleprompter dùng giọng đọc của trình duyệt nếu có.
- Có xuất Markdown và hồ sơ audit JSON.
- Markdown ghi rõ bản nháp hay bản đã duyệt theo revision hiện tại.

## 2. Những gì thay đổi trong kiến trúc

- `ui/index.html` chuyển thành điểm gắn ứng dụng React.
- `ui/src/App.tsx` chứa landing page, form, research, QA và export.
- `ui/src/api.ts` khai báo kiểu dữ liệu và gọi API phiên.
- `ui/src/components/Header.tsx` và `Toast.tsx` tách phần giao diện dùng chung.
- `ui/src/index.css` có nền, kiểu chữ, touch action và reduced motion.
- `ui/vite.config.ts` build SPA và proxy `/api` khi phát triển.
- `server.js` phục vụ API JSON, stream NDJSON và file UI đã build.
- `api/index.js` là điểm vào Node Function trên Vercel.
- `vercel.json` khai báo cách build và routing production.
- `src/projects.js` quản lý vòng đời phiên và các action nghiệp vụ.
- `src/research.js` tìm URL và đọc/chấm nguồn.
- `src/storage.js` lưu phiên local hoặc private Vercel Blob.
- `src/pipeline.js`, `prompts.js`, `rules.js`, `scrape.js`, `llm.js` được chỉnh cho luồng mới.
- `.env.example` mô tả cấu hình; `.env` thực không được commit.

## 3. Luồng dữ liệu và API

1. `POST /api/projects` tạo phiên `research` hoặc `qa`.
2. `GET /api/projects` lấy danh sách phiên.
3. `GET /api/projects/:id` tải đầy đủ phiên để tiếp tục làm việc.
4. `POST /api/projects/:id/action` thực hiện một thao tác trên phiên.
5. `DELETE /api/projects/:id` xóa phiên.
6. `GET /api/status` báo provider và việc có cấu hình search/LLM.

Các action dài gồm `research`, `add-source`, `generate`, `rewrite`, `review`.
Các action này trả `application/x-ndjson` với sự kiện started/progress/result/error.
Client đọc stream theo từng dòng và cập nhật tiến độ ngay khi có sự kiện.
Các action ngắn gồm duyệt nguồn, sửa câu và quyết định với finding.
Mỗi yêu cầu gửi `revision` và `requestId` để kiểm tra trạng thái phiên.
Server trả conflict khi revision cũ hoặc tác vụ khác đang chạy.
Một phiên có brief, sources, sentences, claims, findings, run và audit.
Thay đổi nguồn làm mất trạng thái duyệt cũ để tránh dùng bằng chứng lỗi thời.
Khi bỏ nguồn, câu phụ thuộc nguồn đó được đánh dấu để viết lại.

### Research nguồn

- Tavily tìm tối đa ba truy vấn: chủ đề, tài liệu nghiên cứu, research evidence.
- Mỗi truy vấn yêu cầu tối đa năm kết quả; kết quả hợp lệ được khử trùng URL.
- Một lượt research trả tối đa tám URL trước khi chấm nguồn.
- URL nội bộ/private bị từ chối trước khi truy cập.
- Tối đa bốn worker đọc/chấm nguồn đồng thời để giảm thời gian chờ.
- Mỗi lần đọc thành công lưu snapshot, hash SHA-256 và đoạn trích.
- Nguồn mới được thêm vào phiên nếu URL chưa có; nguồn cũ không bị lặp.
- Nếu thiếu LLM key, nguồn chỉ ở trạng thái chưa chấm và không đủ điều kiện viết.
- Research lại cùng chủ đề có thể không tạo nguồn mới vì kết quả trùng.

### Viết và kiểm tra

- Chỉ nguồn đã được duyệt và đủ điều kiện mới vào prompt tạo kịch bản.
- Câu được lưu cùng `claimIds`, `evidenceIds`, cảnh và thời lượng ước tính.
- Claim thiếu căn cứ được đánh dấu `needsVerification`.
- QA kết hợp luật xác định với nhận xét AI khi provider hoạt động.
- AI finding phải đi qua kiểm tra schema, vị trí câu và quote nguyên văn.
- Chỉ số/tên có đủ căn cứ mới nên được người duyệt tin dùng.
- Trạng thái “đã duyệt” chỉ xuất hiện khi revision hiện tại đã được chấp nhận.
- Các câu cần viết lại, cần kiểm chứng hoặc finding nặng chặn duyệt cuối.

## 4. Lưu trữ và triển khai

- Local: JSON ở `runtime/projects`, ghi qua file tạm rồi rename.
- Vercel: project JSON ở private Blob; ETag giúp phát hiện ghi đè đồng thời.
- Trạng thái runtime và key không nằm trong Git.
- Production hiện chạy tại `https://k4-abcd-pi.vercel.app`.
- Alias mong muốn `k4-abcd.vercel.app` chưa gán được vì Vercel báo đã dùng.
- Vercel đã cấu hình Blob và Deployment Protection.
- `/api/status` trên production đã báo `provider=openai`, search và LLM được cấu hình.
- Smoke production trước đó đã tạo/đọc/stream/xóa phiên QA rồi xác nhận list rỗng.
- Smoke này xác nhận đường lưu trữ và API, chưa xác nhận chất lượng research thật.
- Không đưa key, token hoặc nội dung `.env` vào tài liệu hay commit.

## 5. Eval và dữ liệu

- `eval/` ở gốc repo bổ sung fixture HTML, manifest, golden set và rubric.
- Fixture bao gồm nguồn tốt, mâu thuẫn, cũ, 404, paywall và prompt injection.
- `codebase/nhom-c1/eval/golden_set.json` giữ bộ 28 case của pipeline.
- 10/28 case được liên hệ với dữ liệu thật trong data pack của chương trình.
- `codebase/nhom-c1/codebase/fixtures/qa-cases.json` có 10 case QA tổng hợp.
- `eval-refactor.js` kiểm QA, vòng đời phiên, revision và URL nội bộ.
- `verify-btc-eval.js` kiểm cấu trúc golden set và báo cáo theo checklist BTC.
- Kết quả `stub` trước đó: 28/28 case fixture.
- Kết quả `openai` ngày 2026-09-17: 26/28, tức 92,9%.
- Quality bar hiện là 80%; lượt OpenAI đã vượt ngưỡng này.
- G13 lỗi: nguồn đủ tiêu chí bị gắn cảnh báo và hạ độ tin cậy.
- G23 lỗi: AI giữ thêm một finding so với kỳ vọng quote khớp nguyên văn.
- Bộ refactor QA: 10/10 case đạt.
- Verifier BTC: 14/14 điều kiện đạt.
- TypeScript typecheck, Vite build và `git diff --check` đạt trước merge.
- Kết quả fixture không thay cho kiểm thử trên chủ đề bài giảng thật.
- Chưa có số đo latency p50/p95, chi phí token hoặc đánh giá của năm người dùng.

## 6. Spec và tài liệu đã cập nhật

- `spec.md` ở gốc repo được viết lại theo mẫu SPEC §1–§9.
- SPEC có user/job, evidence mining, impact, thiết kế và non-goals.
- SPEC ghi kiểu lỗi, bốn đường trải nghiệm, golden set và phân công.
- `PLAN-REFACTOR-UI-RESEARCH-QA.md` ghi checklist tiến độ và việc còn lại.
- `README.md` mô tả cách chạy, API, cấu hình, kết quả và giới hạn.
- `EVAL-REFACTOR-REPORT.*` lưu kết quả bộ QA tổng hợp.
- `codebase/nhom-c1/eval/run_results.*` lưu lượt eval `openai` 26/28 hiện tại.

## 7. Cách chạy cho dev

```powershell
cd codebase/nhom-c1/codebase
npm install
npm --prefix ui install
npm run dev
npm run ui:dev
```

Backend mặc định ở `http://127.0.0.1:5173`.
Vite UI ở `http://127.0.0.1:3000`, proxy `/api` về backend.
Đặt cấu hình local trong `codebase/.env` theo `.env.example`.
Không commit `.env`, trace chứa nội dung người dùng hoặc dữ liệu runtime.

```powershell
npm run typecheck
npm run build
npm run eval:refactor
node ../eval/verify-btc-eval.js
npm run eval
```

`npm run eval` đọc provider từ `.env`; nếu có OpenAI key thì có thể gọi API thật.
Để chạy fixture offline, đặt `LLM_PROVIDER=stub` trong môi trường lệnh chạy.
File kết quả eval được ghi lại sau mỗi lượt chạy; kiểm diff trước khi commit.

## 8. Việc đội dev nên tiếp tục

1. Kiểm G13 bằng nguồn fixture và prompt chấm nguồn để giảm cảnh báo sai.
2. Kiểm G23: phân biệt finding hợp lệ thêm với quote không khớp nguyên văn.
3. Chạy nghiên cứu chủ đề thật và người viết/giảng viên duyệt từng citation.
4. Đo latency p50/p95, usage và tỉ lệ nguồn dùng được ở production.
5. Thử UX với ít nhất năm người dùng mục tiêu, đặc biệt ở bước chọn nguồn.
6. Kiểm tra giao diện trên điện thoại, bàn phím và trình đọc màn hình.
7. Nếu mở cho nhiều tài khoản, thêm phân quyền theo project trước khi bỏ bảo vệ toàn site.

Diff để tự kiểm: `git diff 6532954..e4c92c3 --stat` và `git diff 6532954..e4c92c3 -- <đường-dẫn>`.
