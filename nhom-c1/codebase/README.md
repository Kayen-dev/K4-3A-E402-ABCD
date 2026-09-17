# ScriptScout — kịch bản có nguồn và rà soát lời đọc

Trang đăng nhập có hai vai trò. Giảng viên tìm nguồn, viết và rà soát kịch bản; học sinh gửi góp ý để giảng viên duyệt. Mỗi quyết định sửa và chọn nguồn được lưu cùng phiên làm việc.

## Chạy trên máy

Cần Node 20. Từ thư mục `codebase`:

```powershell
npm install
npm --prefix ui install
npm run build
npm run dev
```

Mở `http://127.0.0.1:5173`. Khi phát triển UI, chạy thêm `npm run ui:dev` và mở cổng 3000; Vite chuyển `/api` về backend 5173.

Tài khoản demo đã điền sẵn trong form: giảng viên `giangvien@gmail.com` / `GiangVien@2026`, học sinh `hocsinh@gmail.com` / `HocSinh@2026`. Đây là tài khoản demo; cấu hình mật khẩu riêng bằng biến môi trường trước khi triển khai.

```powershell
npm run typecheck
npm run eval
npm run eval:refactor
node ../eval/verify-btc-eval.js
```

`npm run eval` là bộ 28 case fixture trong `../eval`, dùng provider từ `.env` hiện tại. `npm run eval:refactor` kiểm 10 case QA tổng hợp, vòng đời phiên, revision conflict, phụ thuộc nguồn và URL nội bộ. `node ../eval/verify-btc-eval.js` kiểm cấu trúc golden set và run result theo checklist CP3/R4. Báo cáo nằm trong `EVAL-REFACTOR-REPORT.*` và `../eval/run_results.*`. Kết quả fixture không đại diện cho chất lượng trên bài giảng thật.

## Cấu hình

Sao `./.env.example` thành `./.env` cho chạy cục bộ. Không đưa key vào frontend hoặc Git.

| Biến | Dùng cho |
|---|---|
| `LLM_PROVIDER=openai` | Chọn OpenAI; `stub` chỉ dùng cho eval cũ |
| `LLM_API_KEY` | Khóa LLM, cần cho chấm nguồn, viết, QA đầy đủ |
| `LLM_MODEL=gpt-4.1-mini` | Model baseline để đo, có thể đổi sau khi eval |
| `TAVILY_API_KEY` | Tìm URL thật; thiếu key vẫn tạo phiên QA và thêm URL thủ công |
| `BLOB_READ_WRITE_TOKEN` | Chỉ trên Vercel, kết nối private Blob store cho project JSON |
| `PROJECTS_DIR` | Thư mục JSON cục bộ, mặc định `runtime/projects` |
| `FEEDBACK_DIR` | Thư mục JSON góp ý cục bộ, mặc định `runtime/feedback` |
| `TEACHER_EMAIL`, `TEACHER_PASSWORD` | Tài khoản giảng viên; mặc định theo demo trên form |
| `STUDENT_EMAIL`, `STUDENT_PASSWORD` | Tài khoản học sinh; mặc định theo demo trên form |
| `AUTH_SESSION_SECRET` | Khóa ký cookie đăng nhập; bắt buộc trên Vercel |
| `LLM_TRACE=1` | Bật trace cục bộ chứa prompt/tài liệu; mặc định tắt |

Máy chủ chỉ bind `127.0.0.1`. Dữ liệu runtime nằm ngoài Git. Phiên đăng nhập dùng cookie HttpOnly. Chỉ giảng viên được truy cập API project; học sinh chỉ xem và CRUD góp ý của mình. Giảng viên duyệt hoặc từ chối qua `/api/feedback/:id/decision`. Góp ý đã duyệt được đưa vào prompt rà soát kịch bản có sẵn ở lượt chạy kế tiếp, với vai trò tiêu chí tham khảo, không phải bằng chứng xác minh sự thật. JSON local được ghi qua file tạm rồi đổi tên; trên Vercel private Blob dùng ETag để từ chối ghi đè khi có cập nhật đồng thời.

## Kết quả và giới hạn hiện tại

- Bộ eval fixture: lần chạy `stub` trước đây đạt 28/28; lần chạy `openai` ngày 2026-09-17 đạt 26/28 (92,9%, vượt quality bar 80%). G13 chấm một nguồn đủ tiêu chí thành cảnh báo; G23 giữ thêm một finding từ AI. Verifier BTC: 14/14 điều kiện. Bộ refactor: 10/10 QA case tổng hợp và các kiểm tra vòng đời phiên. Smoke HTTP local đã tạo/đọc/stream review/xóa phiên và list trả về 0. Các nhãn tổng hợp chưa được giảng viên chấm.
- Môi trường production đã cấu hình key tìm kiếm và LLM, nhưng chưa đo chất lượng chủ đề thật, độ trễ đầu cuối, chi phí token, citation support precision hoặc held-out live 3 lượt. Chưa có kết quả UX từ 5 người dùng mục tiêu.
- QA không có nguồn chỉ đánh giá văn nói, và ghi rõ chưa kiểm tra tính đúng sai của thông tin. Bản nháp có thể tải khi còn câu cần kiểm tra; nhãn “đã duyệt” chỉ xuất hiện sau quyết định của người dùng.
- Số liệu cần hai nguồn độc lập; phép so khớp quote và các luật số/tên không chứng minh được quan hệ ngữ nghĩa. Người duyệt cần kiểm tra đoạn gốc trước khi công bố.
- Bản demo có một tài khoản cho mỗi vai trò. Nếu chạy cho nhiều giảng viên hoặc lớp học, cần kho tài khoản riêng và phân quyền project theo từng giảng viên. Đổi mật khẩu demo và đặt `AUTH_SESSION_SECRET` trước khi mở site.

`vercel.json` dùng build từ `ui/`, Node Function trong `api/`, và private Blob cho lưu dữ liệu trên Vercel. Production đã cấu hình Blob store và Deployment Protection; `/api/status` đã xác nhận key tìm kiếm và LLM hiện diện, còn smoke API đã xác nhận tạo/đọc/stream/xóa phiên. Khi kiểm tra chủ đề thật, ghi riêng latency p50/p95, số lượt, usage và các lỗi; không lấy tốc độ fixture làm số live.
