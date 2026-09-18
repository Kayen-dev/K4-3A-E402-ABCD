# Nhật ký người dùng thử ScriptScout

Toàn bộ quá trình thử nghiệm được ghi nhận vào tệp `validation/user_testing_log.md` theo bảng mẫu gồm: Người thử, Nhiệm vụ giao, Điểm tắc nghẽn, Trích dẫn nguyên văn và Quyết định xử lý của nhóm.

## Phản hồi được ghi nhận

| Người thử | Nhiệm vụ giao | Điểm tắc nghẽn | Trích dẫn nguyên văn | Quyết định xử lý của nhóm |
|---|---|---|---|---|
| Nguyễn Trường Bảo — người dùng thử, người đánh giá | Chọn tài liệu reference, tạo kịch bản và đối chiếu lời đọc với nội dung tài liệu đã chọn. | Kịch bản chưa khai thác thực sự thông tin từ reference; nội dung xuất ra còn chưa chính xác. | “sản phẩm khi tạo kịch bản chưa thực sự tạo thông tin từ các refrence nên kịch bản xuất ra vẫn chưa chính xác” | Nhóm đã tiếp nhận và cải thiện: đưa nội dung đã crawl của nguồn được chọn vào context viết; bỏ giới hạn cắt nội dung mỗi nguồn còn 6.000 ký tự ở bước viết; yêu cầu kịch bản hoàn chỉnh từ tài liệu được chọn; kiểm tra đoạn căn cứ khớp nguyên văn với snapshot để loại bằng chứng bịa. Cần người thử đánh giá lại bản cải thiện trước khi kết luận vấn đề đã được giải quyết. |
| Nguyễn Duy Phong — mã số 2A202602834 | Research chủ đề dinh dưỡng cho lá cây và kiểm tra kết quả có đúng đối tượng thực vật. | Kết quả bị lệch sang dinh dưỡng con người dù chủ đề là lá cây. | “tìm chủ đề dinh dưỡng cho lá cây nhưng mà lại hiển thị toàn dinh dưỡng cho con người” | Nhóm tiếp nhận; bổ sung ngữ cảnh lĩnh vực thực vật vào truy vấn, lọc kết quả rõ ràng thuộc dinh dưỡng con người ở bước search và sau khi đọc trang; yêu cầu đánh giá nguồn xét đúng đối tượng, không chỉ trùng từ khóa. Đã thêm kiểm thử hồi quy; cần người thử kiểm tra lại kết quả tìm kiếm thực tế. |
| Nguyễn Trí Dũng — mã số 2A202602784 | Xem đánh giá nguồn và giải thích vì sao tài liệu bị gắn nhãn không nên dùng. | Cụm “người chịu trách nhiệm” và “trượt tiêu chí 1” khó hiểu; không biết tiêu chí cụ thể và lý do nên hạn chế sử dụng nguồn. | “và cũng như chịu trách nhiệm là gì”<br>“Dũng thì k biết tiêu chí nào”<br>“không giải thích vì sao không nên dùng”<br>“Dũng user thì tự nhiên kêu không nên dùng mà nó không đưa ra lời giải thích”<br>“thì cảm giác k thuyết phục cho lắm” | Nhóm tiếp nhận; giải thích người chịu trách nhiệm là tác giả hoặc đơn vị xuất bản để kiểm tra nguồn, không phải trách nhiệm pháp lý; hiển thị mô tả 5 tiêu chí và nhận xét cụ thể. Nếu chỉ thiếu tác giả mà vẫn được chọn, UI giải thích rằng người dùng có thể chọn sau khi tự kiểm tra và thiếu tác giả không đồng nghĩa nội dung sai. |
| Võ Thành Đức — mã số 2A202602167 | Tạo kịch bản từ các tài liệu đã chọn và theo dõi tiến trình hệ thống xử lý. | Bước viết kịch bản mất nhiều thời gian; người dùng không biết còn phải đợi bao lâu hoặc hệ thống đang xử lý đến đâu. | “lúc gen viết kịch bản rất lâu và ko biết khi nào” | Nhóm ghi nhận như một vấn đề trải nghiệm cần theo dõi trong các lần thử tiếp theo. Phản hồi này chỉ được đưa vào validation để phản ánh cảm nhận của người dùng; chưa thực hiện sửa code trong phạm vi cập nhật này. |
| Nguyễn Đình Viễn — mã số 2A202602148 | Kiểm thử chức năng nghe giọng đọc kịch bản tiếng Việt. | Chức năng đọc kịch bản bằng giọng nói vẫn lỗi, chưa đáp ứng được kỳ vọng khi test. | “test nói giọng đọc kịch bản vẫn lỗi chưa được” | Nhóm ghi nhận cần kiểm tra lại luồng text-to-speech tiếng Việt, gồm chọn voice, trạng thái phát âm thanh và fallback khi trình duyệt không hỗ trợ. Cần tái kiểm thử sau khi xác định môi trường trình duyệt và thiết bị người dùng. |

Trích dẫn được ghi theo nội dung phản hồi do người yêu cầu cung cấp, giữ nguyên cách viết; chưa có bản ghi độc lập hoặc ngày thử nghiệm được cung cấp.
Nhật ký hiện ghi nhận năm người thử; không suy diễn thành một đợt tái kiểm thử đã hoàn tất nếu chưa có xác nhận chạy lại sau khi sửa.

## Tổng hợp quyết định

Chủ đề nổi bật trong phản hồi hiện có: bám nội dung reference, research đúng đối tượng, giải thích đánh giá nguồn dễ hiểu, minh bạch tiến trình viết kịch bản và kiểm tra lại giọng đọc tiếng Việt.
Ưu tiên trước demo: kiểm tra research dinh dưỡng lá cây, khả năng giải thích 5 tiêu chí, đối chiếu kịch bản với nguồn được chọn và tái kiểm thử chức năng nghe giọng Việt.
Giữ quyền chọn nguồn và duyệt bản cuối của giảng viên vì vẫn cần đánh giá chuyên môn của người dùng.
Để dành sau: đo chất lượng trên nhiều chủ đề, thu thập thêm người thử và hoàn thiện truy xuất context khi số tài liệu tăng.
