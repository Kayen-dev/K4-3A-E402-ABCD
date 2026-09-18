# Reflection cá nhân — Hồ Đình Tuấn Kiệt

Mã học viên: 2A202602785.
Đề tài: ScriptScout — hỗ trợ giảng viên nghiên cứu tài liệu, viết và rà soát kịch bản bài giảng.

## Vai trò cá nhân

Tôi đảm nhiệm vai trò PM và trực tiếp tham gia phần UI/UX, kết nối API và triển khai sản phẩm. Ở góc độ PM, tôi phối hợp với nhóm để chốt phạm vi, theo dõi tiến độ, tổng hợp deliverable và chuẩn bị demo. Ở góc độ triển khai, tôi tập trung vào hành trình người dùng từ nhập bài học đến duyệt nguồn, viết kịch bản, rà soát và xuất bản cuối.

## Phần việc trực tiếp phụ trách

- Hoàn thiện giao diện React cho giảng viên, gồm nhập chủ đề và mục tiêu học, chọn tài liệu, xem nội dung đã đọc, duyệt góp ý và xuất kịch bản.
- Tham gia xây dựng luồng đăng nhập giảng viên và sinh viên, cùng quy trình gửi feedback và giảng viên chấp nhận hoặc từ chối feedback.
- Kết nối UI với API để tài liệu được chọn trở thành context cho bước viết; hiển thị reference và đoạn làm căn cứ để người dùng kiểm tra.
- Tiếp nhận phản hồi người thử trong `validation/user_testing_log.md`, chuyển phản hồi thành yêu cầu sửa cụ thể và ưu tiên theo mức ảnh hưởng tới demo.
- Cải thiện UX khi tác vụ chạy lâu: khóa thao tác lặp, hiển thị log các giai đoạn, thời gian chờ và mở Bước 3 khi có kịch bản.
- Kiểm tra build, phối hợp kiểm thử hồi quy, quản lý thay đổi trên `main` và triển khai app lên Vercel.
- Sắp xếp lại repository để phân biệt dự án chính trong `codebase/src/` với bản demo cũ trong `codebase/codebase-demo/`.

Tôi không nhận toàn bộ thiết kế AI và bộ đánh giá là phần việc cá nhân. Logic prompt, đánh giá nguồn và golden set là phần phối hợp với thành viên AI-BA và Dev-QA của nhóm.

## Cách ứng dụng AI trong quá trình xây dựng

Tôi sử dụng trợ lý AI lập trình để đọc source, phân tích lỗi, đề xuất thay đổi UI/API, tạo bản sửa và hỗ trợ viết test hồi quy. Tôi cung cấp ngữ cảnh bằng ảnh màn hình, response API và phản hồi người dùng để tránh sửa theo giả định chung chung.

AI giúp rút ngắn thời gian tìm vị trí cần sửa và viết bản nháp tài liệu kỹ thuật. Tuy nhiên, tôi vẫn phải kiểm tra yêu cầu, đối chiếu runtime log, xem diff và chạy build/test trước khi triển khai. Tôi phân biệt việc AI hỗ trợ phát triển với việc LLM là thành phần của sản phẩm: trong sản phẩm, LLM nhận nội dung research được chọn để viết và rà soát; code chịu trách nhiệm kiểm tra dẫn chứng khớp nội dung nguồn và quản lý trạng thái phiên.

Một giới hạn thực tế là lời giải thích của AI có thể hợp lý nhưng chưa đúng nguyên nhân. Ví dụ, không thể kết luận lỗi Vercel chỉ từ HTTP 200: endpoint stream có thể trả HTTP 200 rồi gửi sự kiện lỗi. Cần kiểm tra cả `run.status`, danh sách câu đã lưu và runtime log.

## Bài học từ một trường hợp thất bại của nhóm

Trong phiên research chủ đề Deep learning, người dùng chọn một tài liệu có khoảng 12.000 ký tự và yêu cầu viết kịch bản 25 câu. UI báo `[ai3-viet-cau] This operation was aborted` và không mở Bước 3. Response vẫn có thông tin tài liệu nhưng `run.status` là `error`, còn `sentences` rỗng. Đây là tác vụ viết thất bại, không phải lỗi chỉ chuyển tab.

Nhóm đã có timeout và log tiến trình, nhưng timeout chung 30 giây chưa phù hợp với lời gọi phải xuất cả lời đọc, fact và bằng chứng. Giới hạn tác vụ trước đó cũng quá ngắn. Nếu chỉ ép UI chuyển sang Bước 3, người dùng vẫn không có kịch bản để xem.

Nhóm sửa bằng cách chọn các đoạn nguyên văn liên quan tới chủ đề và mục tiêu, giới hạn nội dung đưa vào model, bố trí timeout riêng cho bước viết và đồng bộ thời gian chạy với cấu hình Vercel. Nội dung gốc vẫn được giữ để kiểm tra dẫn chứng. Sau thay đổi, lượt chạy lại chính phiên này trên Production đã tạo và lưu 25 câu trong khoảng 40 giây. Kết quả này xác nhận luồng chạy đã phục hồi trong trường hợp đó, chưa chứng minh mọi chủ đề đều có độ chính xác đạt yêu cầu.

Bài học tôi rút ra là phải thiết kế acceptance criteria cho cả kết quả và trải nghiệm chờ: tác vụ chỉ thành công khi kịch bản đã được lưu, UI mở đúng bước và người dùng có thể đối chiếu nguồn. Khi dùng AI, quản lý context, timeout, trạng thái lỗi và quan sát runtime quan trọng như thiết kế prompt. Một bản sửa cần được kiểm chứng trên môi trường thật, thay vì chỉ dựa vào thông báo build thành công.
