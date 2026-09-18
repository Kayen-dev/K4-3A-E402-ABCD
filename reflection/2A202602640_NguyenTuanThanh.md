# Reflection cá nhân — Nguyễn Tuấn Thành

Mã học viên: 2A202602640.
Đề tài: ScriptScout — hỗ trợ giảng viên nghiên cứu tài liệu, viết và rà soát kịch bản bài giảng.

## Vai trò cá nhân

Tôi đảm nhiệm vai trò Dev-QA, tham gia xây dựng prototype và kiểm tra sản phẩm có hoạt động đúng với yêu cầu đã thống nhất hay không. Tôi tập trung chuẩn bị dữ liệu kiểm thử, golden set, ghi nhận kết quả và phân tích lỗi để nhóm cải thiện qua từng vòng phát triển.

## Phần việc trực tiếp phụ trách

- Tham gia xây dựng prototype có thể chạy được và kiểm tra luồng từ nhập bài học, đọc nguồn đến tạo kịch bản và rà soát.
- Chuẩn bị golden set và kết quả đánh giá trong `codebase/src/eval/`, gồm các tình huống bình thường, hiếm và các điều kiện an toàn bắt buộc.
- Phối hợp chuẩn bị fixture nguồn để kiểm tra đoạn trích, link lỗi, trang cần đăng nhập, nguồn thiếu tác giả, nguồn lạc đề và prompt injection.
- Kiểm tra tính nhất quán giữa kết quả kỳ vọng, trạng thái nguồn, fact và câu được tạo; ghi nhận case không đạt trong `codebase/src/eval/run_results.md`.
- Phối hợp kiểm thử hồi quy tại `codebase/src/codebase/tests/`, chú ý tới evidence validation, parsing Markdown và các trạng thái phê duyệt.
- Đối chiếu phản hồi người thử trong `validation/user_testing_log.md` với hành vi thực tế, để bổ sung tình huống kiểm tra ngoài happy path.

Thiết kế nghiệp vụ và prompt là phần phối hợp với thành viên AI-BA; giao diện, điều phối demo và triển khai là phần phối hợp với PM. Tôi tập trung vào khả năng chạy được, tái hiện lỗi và bằng chứng kiểm thử.

## Cách ứng dụng AI trong quá trình xây dựng

Tôi dùng trợ lý AI để đọc code, gợi ý test cases, tạo dữ liệu biên và hỗ trợ phân tích kết quả không đạt. AI giúp mở rộng các tình huống dễ bị bỏ sót, ví dụ đoạn trích không tồn tại, con số ngoài nguồn hoặc nhiều góp ý cùng tác động một câu.

Tôi phải tự đối chiếu test với yêu cầu để tránh trường hợp AI viết test chỉ lặp lại implementation. Một test hữu ích cần có kỳ vọng độc lập: đoạn trích bịa phải bị loại, nguồn không đọc được phải có trạng thái rõ và thao tác sửa không được làm mất nội dung ngoài đoạn được chọn.

Tôi phân biệt tests dùng stub hoặc mock với lời gọi model thật. Mock giúp kiểm tra logic ổn định và tái hiện lỗi; chất lượng diễn đạt, mức liên quan và khả năng suy luận cần thêm human evaluation cùng dữ liệu thực tế. Tôi không dùng tỷ lệ pass của một bộ kiểm thử nhỏ để tuyên bố độ chính xác chung của sản phẩm.

## Bài học từ một trường hợp thất bại của nhóm

Case G23 trong `codebase/src/eval/run_results.md` cố tình đưa vào một finding có quote không tồn tại trong câu. Kỳ vọng là loại một finding và giữ một finding hợp lệ, nhưng kết quả ghi nhận không loại finding nào và giữ cả hai. Nếu chỉ nhìn JSON đúng cấu trúc, hệ thống có thể hiển thị một góp ý không gắn được với nội dung thật.

Từ lỗi này, tôi nhận ra schema validation chưa đủ. Cần semantic invariants được kiểm tra bằng code, chẳng hạn quote phải là chuỗi con nguyên văn của câu trước khi finding được hiển thị hoặc áp dụng. Khi câu đã đổi, vị trí sửa cũng phải được kiểm tra lại; không thể tin offset do model cung cấp hoặc dùng toàn bộ câu cũ để ghi đè.

Bài học của tôi là phải kiểm thử cả dữ liệu sai do AI tạo ra, thay vì chỉ kiểm thử kết quả hợp lệ. Sau một bản sửa, cần chạy lại case gây lỗi và kiểm tra tình huống gần kề để tránh regression. Kết quả chỉ có ý nghĩa khi báo cáo rõ môi trường, dữ liệu và phần nào dùng mock; một lần chạy thành công chưa chứng minh hệ thống luôn an toàn hoặc chính xác.
