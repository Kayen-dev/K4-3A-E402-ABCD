# Thành viên nhóm

Lớp 3A · Hackathon AI × Giáo dục K4 · đề **C3 ScriptScout** tích hợp **C2 QA văn nói**

| Họ tên | Mã học viên | Vai trò |
|---|---|---|
| Nguyễn Trần Kiên | 2A202602571 | Đội trưởng · nộp 5 mốc checkpoint · `spec.md` · `prompts.js` · `pipeline.js` |
| Nguyễn Tuấn Thành | 2A202602640 | Evidence & mining · `eval/golden_set.json` · `eval/run.js` · phân tích case thất bại |
| Hồ Đinh Tuấn Kiệt | 2A202602785 | `codebase/` · `server.js` · `ui/` · bộ trang bẫy · video demo |

**Đội trưởng nộp cả 5 mốc CP1–CP5 bằng một mã học viên duy nhất** (2A202602571) để hệ thống
hợp nhất 25 điểm nộp bài của nhóm.

## Ai giải thích được phần nào

Luật vibe-coding ở CP6: giám khảo hỏi bất kỳ ai về phần có tên người đó trong bảng dưới.
Không giải thích được bản chất kỹ thuật hoặc quyết định thiết kế → 0 điểm phần cá nhân đó.

| File / phần | Người phụ trách | Phải giải thích được |
|---|---|---|
| `src/rules.js` | *(điền tên)* | Vì sao đếm âm tiết chứ không đếm ký tự · vì sao bộ dò tên riêng bỏ token đầu câu · vì sao mặc định không tính số viết bằng chữ |
| `src/pipeline.js` · `src/prompts.js` | *(điền tên)* | Vì sao code quyết 3/5 tiêu chí · vì sao tiêu chí 5 tuyệt đối không giao cho AI · vì sao trang có lệnh ẩn thì không gọi AI |
| `src/llm.js` · `server.js` · `ui/` | *(điền tên)* | Adapter đa nhà cung cấp · cơ chế ghi trace · vì sao finding của AI phải là chuỗi nguyên văn chứ không phải offset |
| `eval/` | *(điền tên)* | Vì sao bộ fixture là tham số của `scrape()` · vì sao 4 case cố tình để thất bại · quality bar và điều kiện cứng |
