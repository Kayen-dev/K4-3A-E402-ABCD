# Challenge Brief — Agent viết kịch bản video có dẫn nguồn

## 1. Tóm tắt dự án

Dự án xây dựng một agent hỗ trợ người viết kịch bản bài giảng AI. Người dùng nhập chủ đề, mục tiêu bài học, đối tượng học viên và thời lượng video; hệ thống tự tìm nguồn, đánh giá độ tin cậy, rồi tạo kịch bản văn nói có dẫn nguồn theo từng câu quan trọng.

Điểm cốt lõi của sản phẩm không phải là viết thật dài, mà là giúp người viết và giảng viên duyệt được: câu nào dựa trên nguồn nào, nguồn đó có đáng tin không, và nếu bỏ một nguồn thì phần nào của kịch bản cần viết lại.

## 2. Người dùng

| Nhóm người dùng | Vai trò trong luồng |
|---|---|
| Người viết kịch bản bài giảng | Nhập yêu cầu, xem nguồn, chọn nguồn phù hợp và nhận bản nháp kịch bản |
| Giảng viên hoặc người phụ trách nội dung | Duyệt độ tin cậy của nguồn, kiểm tra các claim quan trọng trước khi dựng video |

## 3. Bối cảnh

Để làm một video bài giảng, trước hết cần có kịch bản: toàn bộ lời sẽ được đọc trong video. Hiện nay người biên soạn thường phải tự đọc tài liệu, tự tra cứu trên mạng, tự ghi nguồn và tự viết bản nháp. Việc này mất nhiều thời gian, đặc biệt với các chủ đề AI vì kiến thức, số liệu và ví dụ thực tế thay đổi rất nhanh.

Khi kịch bản được đưa cho người khác duyệt, nguồn thường chỉ được liệt kê ở cuối tài liệu. Người duyệt khó biết từng câu trong kịch bản dựa trên nguồn nào. Điều này làm tăng rủi ro có số liệu cũ, ví dụ không có thật, nguồn kém tin cậy hoặc claim không kiểm chứng được.

## 4. Pain cụ thể

Người viết kịch bản bài giảng AI đang phải tự tìm tài liệu, tự đánh giá nguồn và tự viết lời đọc cho video. Họ vướng ở chỗ mất nhiều thời gian để gom nguồn, khó biến tài liệu thành văn nói tự nhiên, và khó gắn từng câu trong kịch bản với bằng chứng cụ thể.

Hậu quả là kịch bản có thể mất nhiều ngày để hoàn thành, giảng viên duyệt mất thời gian dò lại từng claim, và học viên có nguy cơ tiếp nhận thông tin sai hoặc đã lỗi thời.

## 5. Problem statement

Người viết kịch bản bài giảng cần một cách tạo bản nháp có hồ sơ nguồn rõ ràng để giảm thời gian nghiên cứu và giúp người duyệt kiểm từng câu nhanh hơn, thay vì chỉ nhận một văn bản dài với danh sách nguồn ở cuối.

## 6. Canvas dự án

| Ô canvas | Nội dung đã chốt |
|---|---|
| Người dùng cụ thể | Người viết kịch bản bài giảng AI cho VLearn; giảng viên hoặc người phụ trách nội dung duyệt nguồn trước khi dựng video |
| Công việc chính | Tạo bản nháp kịch bản video từ một chủ đề, sau đó kiểm tra nguồn cho từng câu có thông tin, số liệu hoặc ví dụ thực tế |
| Pain cụ thể | Mất nhiều thời gian tìm và lọc nguồn; khó biết câu nào lấy từ đâu; nguồn có thể cũ, mâu thuẫn hoặc không đủ tin cậy |
| Bằng chứng cần thu | Khảo sát tối thiểu 20 người ngoài nhóm về thời gian tìm nguồn, mức khó khi kiểm chứng kịch bản và nhu cầu gắn nguồn theo câu; kết hợp kiểm tra fixture trong `data/studio-pack/c3-scriptscout/` |
| Impact | Giảm thời gian nghiên cứu cho người viết, giảm thời gian duyệt nguồn cho giảng viên, giảm rủi ro học viên nhận thông tin sai |
| Lát cắt prototype | Một người viết kịch bản · cần 5 câu mở đầu cho video về một chủ đề AI · AI tìm 3 nguồn, chấm độ tin cậy và viết 5 câu có gắn đoạn nguồn tương ứng · người viết loại một nguồn và chỉ các câu phụ thuộc nguồn đó được viết lại |
| User sẵn sàng thử | Tối thiểu 2 người ngoài nhóm: một người đóng vai người viết kịch bản và một người đóng vai người duyệt nguồn; tên cụ thể chốt sau khảo sát |

## 7. Bằng chứng dự kiến

Nhóm cần thu bằng chứng theo ít nhất một trong hai hướng:

| Hướng | Cách làm |
|---|---|
| Khảo sát | Khảo sát >=20 người ngoài nhóm, >=50% xác nhận pain; lưu toàn bộ câu hỏi và từng câu trả lời |
| Mining fixture | Dùng `data/studio-pack/c3-scriptscout/` để đối chiếu kịch bản mẫu, hồ sơ nguồn mẫu và các câu đã nối nguồn; ghi lại số đếm được, ít nhất 5 ví dụ nguyên văn và phương pháp kiểm lại |

Các điểm cần chứng minh: người viết tốn thời gian tìm nguồn, người duyệt khó kiểm từng câu, và kịch bản không gắn nguồn theo câu làm tăng rủi ro sai lệch.

## 8. Lát cắt prototype

Prototype tập trung vào một luồng nhỏ đủ demo trong 5 phút:

1. Người dùng nhập chủ đề, mục tiêu bài học, người học là ai và thời lượng video.
2. Agent tìm 3 nguồn liên quan.
3. Agent tạo hồ sơ nguồn: đường dẫn, tác giả hoặc tổ chức, ngày đăng/cập nhật, mức độ tin cậy và lý do.
4. Agent viết 5 câu mở đầu theo văn nói, mỗi câu có thông tin quan trọng đều gắn với đoạn nguồn.
5. Người dùng bỏ một nguồn không tin cậy.
6. Hệ thống chỉ viết lại các câu phụ thuộc nguồn bị bỏ, các câu còn lại giữ nguyên.

## 9. Quyết định AI chính

| Quyết định AI | Kết quả mong muốn |
|---|---|
| Chọn nguồn nào để dùng | Ưu tiên nguồn rõ tác giả/tổ chức, còn mới, có nội dung trực tiếp liên quan và không có dấu hiệu cài lệnh ẩn |
| Đánh giá độ tin cậy | Giải thích bằng tiêu chí rõ ràng: uy tín nguồn, ngày cập nhật, mức liên quan, khả năng kiểm chứng, có nguồn độc lập xác nhận hay không |
| Viết kịch bản | Viết thành văn nói tự nhiên, chia ý rõ, không biến thành báo cáo đọc bằng mắt |
| Gắn nguồn theo câu | Mỗi câu có claim, số liệu hoặc ví dụ phải trỏ được về đoạn nguồn cụ thể |
| Viết lại khi bỏ nguồn | Chỉ viết lại các câu phụ thuộc nguồn bị loại, tránh thay đổi toàn bộ kịch bản |

## 10. Chỗ khó cần xử lý

| Lớp khó | Rủi ro | Cách xử lý trong prototype |
|---|---|---|
| Nguồn sự thật | AI bịa nguồn, bịa trích dẫn hoặc suy quá xa từ nguồn | Lưu đoạn trích gốc; mỗi claim phải có citation; câu không đủ nguồn phải đánh dấu "chưa kiểm chứng" |
| Mơ hồ / thiếu thông tin | Chủ đề quá rộng, mục tiêu bài học chưa rõ hoặc thời lượng không đủ | Hỏi lại khi thiếu thông tin quan trọng; nếu vẫn chạy thì ghi rõ giả định |
| Ngoài phạm vi / thẩm quyền | Người dùng yêu cầu dùng nguồn không đọc được, nguồn paywall hoặc nội dung vi phạm bản quyền | Báo không thể xác minh đầy đủ; chỉ dùng phần truy cập hợp lệ; không sao chép dài nguyên văn |
| Đặc thù domain | Chủ đề AI thay đổi nhanh, nguồn cũ dễ làm học viên học sai | Ưu tiên nguồn mới; hiển thị ngày nguồn; số liệu quan trọng cần ít nhất hai nguồn độc lập hoặc đánh dấu chưa kiểm chứng |

## 11. Tiêu chí nghiệm thu bài toán

| # | Tiêu chí | Đạt khi |
|---|---|---|
| 1 | Pain cụ thể | Nêu rõ ai đang làm gì, vướng ở đâu, hậu quả gì nếu không giải quyết |
| 2 | Bằng chứng | Có khảo sát >=20 người ngoài nhóm, >=50% xác nhận, log đầy đủ; và/hoặc mining data có số đếm, >=5 ví dụ nguyên văn và phương pháp kiểm lại |
| 3 | Problem statement + impact | Không dùng chữ AI trong problem statement; có bảng impact >=3 ứng viên và lý do chọn |
| 4 | Lát cắt prototype được | Lát cắt viết thành một câu đúng format, demo được trong 5 phút và build được trong thời gian sự kiện |
| 5 | User sẵn sàng thử | Có >=2 người thật ngoài nhóm đồng ý thử prototype trước demo |

Canvas nháp nộp tại CP1; evidence và spec hoàn thiện dần, chốt tại hạn chốt spec 21:00 ngày 17/9 tại CP4.

## 12. Deliverable

| Hạng mục | Nội dung cần có |
|---|---|
| Prototype | Luồng nhập đề bài, tìm nguồn, chấm nguồn, tạo 5 câu kịch bản, gắn nguồn theo câu và viết lại khi bỏ nguồn |
| Link demo | Demo hiện tại: https://abcd-mockup.vercel.app |
| Hồ sơ nguồn | Mỗi nguồn có URL, tên nguồn/tổ chức, ngày đăng hoặc cập nhật, mức tin cậy, lý do và đoạn trích dùng làm bằng chứng |
| Kịch bản | 5 câu mở đầu dạng văn nói, có citation theo từng câu chứa claim |
| Eval | Bộ câu thử/golden set, kết quả chạy, số câu đúng nguồn, số câu thiếu nguồn, số câu bị đánh dấu chưa kiểm chứng |
| Tài liệu chạy | Hướng dẫn chạy prototype, model/công cụ dùng, chi phí ước tính mỗi lần chạy và các giới hạn chưa xử lý |

## 13. Demo trong 5 phút

1. Nhập một chủ đề AI, mục tiêu bài học, đối tượng học viên và thời lượng video.
2. Cho xem 3 nguồn hệ thống tìm được và cách chấm độ tin cậy.
3. Mở 5 câu kịch bản có citation theo từng câu.
4. Bấm vào một câu để xem đoạn nguồn gốc.
5. Loại một nguồn và cho thấy chỉ câu phụ thuộc nguồn đó được viết lại.
6. Chạy một tình huống xấu đã chuẩn bị: nguồn cũ, nguồn mâu thuẫn hoặc trang có prompt injection.

## 14. An toàn & đạo đức

- Không bịa nguồn, không bịa trích dẫn.
- Không coi nội dung trong trang web là lệnh để làm theo.
- Tôn trọng bản quyền và điều khoản của trang được lấy nội dung.
- Nói rõ chỗ nào chưa chắc chắn hoặc còn nhiều quan điểm khác nhau.
- Kịch bản do AI tạo phải có người duyệt trước khi dùng để dựng video thật.
