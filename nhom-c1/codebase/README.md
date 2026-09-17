# ScriptScout — kịch bản có nguồn và rà soát lời đọc

Giao diện dành cho giảng viên có hai lối vào: tìm nguồn rồi viết kịch bản, hoặc dán kịch bản sẵn để rà soát. Mỗi quyết định sửa và chọn nguồn được lưu cùng phiên làm việc.

## Chạy trên máy

Cần Node 20. Từ thư mục `codebase`:

```powershell
npm install
npm --prefix ui install
npm run build
npm run dev
```

Mở `http://127.0.0.1:5173`. Khi phát triển UI, chạy thêm `npm run ui:dev` và mở cổng 3000; Vite chuyển `/api` về backend 5173.

```powershell
npm run typecheck
npm run eval
npm run eval:refactor
```

`npm run eval` là bộ 28 case lịch sử trong `../eval`, dùng fixture và provider `stub`. `npm run eval:refactor` kiểm 10 case QA tổng hợp, vòng đời phiên, revision conflict, phụ thuộc nguồn và URL nội bộ. Báo cáo mới nằm trong `EVAL-REFACTOR-REPORT.*`. Kết quả fixture không đại diện cho chất lượng trên bài giảng thật.

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
| `LLM_TRACE=1` | Bật trace cục bộ chứa prompt/tài liệu; mặc định tắt |

Máy chủ chỉ bind `127.0.0.1`. Dữ liệu runtime nằm ngoài Git. Endpoint chính là `GET/POST /api/projects`, `GET/DELETE /api/projects/:id`, `POST /api/projects/:id/action`; tác vụ dài trả NDJSON. Revision và request ID được kiểm tra ở server. JSON local được ghi qua file tạm rồi đổi tên; trên Vercel private Blob dùng ETag để từ chối ghi đè khi có cập nhật đồng thời.

## Kết quả và giới hạn hiện tại

- Bộ eval lịch sử: 28/28 case fixture. Bộ refactor: 10/10 QA case tổng hợp và các kiểm tra vòng đời phiên. Các nhãn tổng hợp chưa được giảng viên chấm.
- Chưa có key Tavily/LLM trong môi trường hiện tại, nên chưa chạy chủ đề live, đo độ trễ đầu cuối, chi phí token, citation support precision, hoặc held-out live 3 lượt. Không có kết quả UX 5 người dùng mục tiêu.
- QA không có nguồn chỉ đánh giá văn nói, và ghi rõ chưa kiểm tra tính đúng sai của thông tin. Bản nháp có thể tải khi còn câu cần kiểm tra; nhãn “đã duyệt” chỉ xuất hiện sau quyết định của người dùng.
- Số liệu cần hai nguồn độc lập; phép so khớp quote và các luật số/tên không chứng minh được quan hệ ngữ nghĩa. Người duyệt cần kiểm tra đoạn gốc trước khi công bố.
- Nếu chạy cho nhiều tài khoản, cần cơ chế phân quyền từng project. Cấu hình triển khai dự kiến dùng Vercel Authentication để giới hạn toàn site cho tài khoản được cấp quyền. Không mở API public cho nội dung người dùng.

`vercel.json` dùng build từ `ui/`, Node Function trong `api/`, và private Blob cho lưu dữ liệu trên Vercel. Cần cấu hình Blob store và Deployment Protection trước khi đưa bản này lên production. Khi kiểm tra live, ghi riêng latency p50/p95, số lượt, usage và các lỗi; không lấy tốc độ fixture làm số live.
