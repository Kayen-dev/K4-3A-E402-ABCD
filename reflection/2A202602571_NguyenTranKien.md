# Reflection cá nhân — Nguyễn Trần Kiên

Mã học viên: 2A202602571.
Đề tài: ScriptScout — hỗ trợ giảng viên nghiên cứu tài liệu, viết và rà soát kịch bản bài giảng.

## Vai trò cá nhân

Tôi đảm nhiệm vai trò AI-BA, kết nối yêu cầu nghiệp vụ với thiết kế pipeline AI. Tôi tập trung xác định người dùng cần gì, tiêu chí nào giúp đánh giá nguồn và cách chuyển nội dung research thành kịch bản có thể truy vết căn cứ. Tôi phối hợp với PM về phạm vi sản phẩm và với Dev-QA về các tình huống cần kiểm thử.

## Phần việc trực tiếp phụ trách

- Phân tích bài toán và tham gia đặc tả trong `spec.md`: đầu vào bài học, luồng chọn nguồn, viết kịch bản, rà soát và phê duyệt.
- Thiết kế luồng AI/agent theo nhiệm vụ, gồm đánh giá nguồn, viết lời đọc, kiểm chứng claim và rà soát cách diễn đạt; phối hợp làm rõ kiến trúc trong `codebase/src/pipeline-v2.md`.
- Đặc tả tiêu chí đánh giá nguồn: tác giả hoặc tổ chức chịu trách nhiệm, độ mới, tài liệu tham chiếu, mức liên quan và dấu hiệu lệnh chèn vào nội dung.
- Thiết kế yêu cầu prompt và hợp đồng đầu ra: fact gắn với đoạn trích và nguồn, câu gắn với fact, góp ý chỉ rõ đoạn lỗi và lý do.
- Phối hợp rà soát logic nguồn và context trong `codebase/src/codebase/src/`, để bước viết sử dụng nội dung tài liệu được chọn thay vì chỉ nhận tiêu đề hoặc URL.
- Chuyển phản hồi người dùng thành business rules: chủ đề giữ vai trò chính, mục tiêu học bổ sung context; feedback phải được giảng viên duyệt trước khi dùng trong review.

Phần triển khai giao diện, vận hành Production và toàn bộ bộ kiểm thử là công việc phối hợp của nhóm; tôi tập trung vào yêu cầu, tiêu chí và thiết kế hành vi AI.

## Cách ứng dụng AI trong quá trình xây dựng

Tôi dùng AI để hỗ trợ phân rã use cases, soạn bản nháp prompt, đề xuất taxonomy lỗi và tìm các tình huống biên. Tôi cung cấp đầu vào cụ thể như lesson brief, nội dung nguồn và kết quả mong đợi để kiểm tra đề xuất của AI có phù hợp nghiệp vụ hay không.

Tôi không lấy câu trả lời của AI làm tiêu chuẩn đúng mặc định. Những quyết định về nguồn được dùng, ý nghĩa của trạng thái kiểm chứng và quyền phê duyệt cần được nhóm chốt thành business rules. Khi AI đề xuất quá nhiều agent, nhóm phải thu hẹp phạm vi và phân biệt nhiệm vụ cần LLM với phép kiểm có thể thực hiện bằng code.

Trong sản phẩm, tôi chú trọng grounding và evidence attribution: lời đọc cần nối được tới fact, đoạn trích và nguồn. Tôi cũng phân biệt rõ feedback augmentation hiện tại với RAG: feedback approved được đưa trực tiếp vào review context, chưa có embedding, vector retrieval hoặc fine-tuning.

## Bài học từ một trường hợp thất bại của nhóm

Trong báo cáo `codebase/src/eval/run_results.md`, case G13 kỳ vọng một trang đạt đủ tiêu chí được đánh dấu dùng, nhưng kết quả lại là dùng kèm cảnh báo với độ tin cậy trung bình. Điểm tiêu chí về tài liệu tham chiếu bị đánh giá không đạt. Trường hợp này cho thấy định nghĩa nghiệp vụ và cách hệ thống diễn giải bằng chứng chưa chắc đã thống nhất.

Tôi nhận ra rằng một nhãn như “uy tín” hoặc “có tài liệu tham chiếu” chưa đủ rõ để trở thành acceptance criteria. Cần xác định bằng chứng nào được tính, nội dung nào thực sự đã được scraper đọc và trường hợp thiếu metadata phải được xử lý thế nào. Việc phân tích cũng phải đối chiếu fixture, prompt và cách tính trạng thái, thay vì chỉ chỉnh prompt để khớp một đáp án.

Báo cáo còn ghi G13 thuộc nhóm cần chạy lại bằng khóa thật vì có dùng đáp án dựng sẵn. Vì vậy, tôi không coi kết quả này là kết luận chung về chất lượng model. Bài học của tôi là phải đặc tả tiêu chí bằng ví dụ kiểm chứng được, phân biệt kiểm thử logic với đánh giá model và giải thích cảnh báo bằng ngôn ngữ người dùng hiểu.
