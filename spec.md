# AI SPEC — ScriptScout nguồn theo câu · Nhóm ABC · Zone E402

Hướng: [ ] A — VLearn  [ ] B — Trợ lý Học viên  [x] C — Lesson Studio / ScriptScout
Loại: [ ] Tối ưu tính năng có sẵn  [x] Tính năng mới

## §1. User & Job

- Job executor + workflow:
  - Người viết kịch bản bài giảng AI cho VLearn nhập chủ đề, mục tiêu bài học, đối tượng học viên và thời lượng video.
  - Hệ thống tìm nguồn, đánh giá độ tin cậy, tạo hồ sơ nguồn, viết 5 câu mở đầu dạng văn nói và gắn citation theo từng câu có claim.
  - Giảng viên hoặc người phụ trách nội dung duyệt nguồn, kiểm tra claim quan trọng, loại nguồn không tin cậy nếu cần.
  - Khi một nguồn bị loại, hệ thống chỉ viết lại các câu phụ thuộc nguồn đó và giữ nguyên các câu còn lại.

- Core JTBD (không tên sản phẩm/AI trong câu):
  - Khi chuẩn bị một video bài giảng, người viết cần tạo bản nháp lời đọc có căn cứ rõ ràng để người duyệt biết từng câu dựa trên nguồn nào và chỉnh sửa nhanh trước khi dựng video.

- Problem statement (KHÔNG chữ AI):
  - Người viết kịch bản bài giảng cần một cách tạo bản nháp có hồ sơ nguồn rõ ràng để giảm thời gian nghiên cứu và giúp người duyệt kiểm từng câu nhanh hơn, thay vì chỉ nhận một văn bản dài với danh sách nguồn ở cuối.

- Evidence (chuẩn A và/hoặc B — log đầy đủ trong repo):
  - Kế hoạch khảo sát: khảo sát tối thiểu 20 người ngoài nhóm về thời gian tìm nguồn, mức khó khi kiểm chứng kịch bản và nhu cầu gắn nguồn theo câu; đạt khi >=50% xác nhận pain.
  - Kế hoạch mining fixture: dùng `data/studio-pack/c3-scriptscout/` để đối chiếu kịch bản mẫu, hồ sơ nguồn mẫu và các câu đã nối nguồn.
  - Số liệu mining / kết quả khảo sát hiện tại: chưa chốt số thật; cần cập nhật sau khi có log trong `validation/` hoặc `eval/`.
  - >=5 quote/ví dụ nguyên văn + nguồn cần thu:
    1. Ví dụ người viết mất thời gian tìm và lọc nguồn cho một chủ đề bài giảng.
    2. Ví dụ người duyệt không biết một câu trong kịch bản lấy từ nguồn nào.
    3. Ví dụ nguồn cũ hoặc nguồn mâu thuẫn làm claim trong kịch bản có rủi ro sai.
    4. Ví dụ câu có số liệu/ví dụ thực tế nhưng thiếu đoạn nguồn gốc.
    5. Ví dụ sau khi bỏ một nguồn, chỉ một phần kịch bản cần viết lại.

## §2. Impact & quyết định chọn

- Bảng impact >=3 ứng viên:

| Ứng viên | Bao nhiêu người | Tần suất | Tốn gì mỗi lần | Khả thi | Ghi chú |
|---|---:|---|---|---|---|
| Gắn nguồn theo từng câu trong kịch bản | Người viết kịch bản + giảng viên duyệt nội dung | Mỗi lần làm video bài giảng | Thời gian tìm nguồn, kiểm claim, sửa câu sai nguồn | Cao | Phù hợp trực tiếp với ScriptScout và demo được trong 5 phút |
| Tự viết toàn bộ kịch bản dài từ chủ đề | Người viết kịch bản | Mỗi lần bắt đầu bài mới | Thời gian viết nháp và chỉnh giọng văn | Trung bình | Dễ demo nhưng rủi ro tạo văn bản dài khó kiểm chứng |
| Tóm tắt nguồn thành tài liệu nghiên cứu | Người viết và người duyệt | Khi bắt đầu nghiên cứu chủ đề | Thời gian đọc tài liệu nền | Trung bình | Có ích nhưng chưa giải quyết rõ việc câu nào dựa trên nguồn nào |
| Kiểm tra lại nguồn sau khi kịch bản đã hoàn tất | Giảng viên hoặc người phụ trách nội dung | Trước khi dựng video | Thời gian dò từng claim | Trung bình | Giảm rủi ro nhưng đến muộn trong workflow |

- Ứng viên ĐÃ LOẠI + vì sao:
  - Tự viết toàn bộ kịch bản dài: loại khỏi lát cắt đầu vì dễ tạo văn bản dài nhưng khó chứng minh chất lượng nguồn trong thời gian demo.
  - Tóm tắt nguồn thành tài liệu nghiên cứu: loại vì chưa chạm đúng pain "câu nào lấy từ đâu".
  - Kiểm tra lại nguồn sau khi kịch bản hoàn tất: loại vì xử lý muộn, khi sửa có thể ảnh hưởng toàn bộ kịch bản.

- Ứng viên CHỌN + vì sao (bằng số):
  - Chọn "gắn nguồn theo từng câu trong kịch bản".
  - Số cần chứng minh: khảo sát >=20 người ngoài nhóm, >=50% xác nhận pain; mining fixture có số đếm, >=5 ví dụ nguyên văn và phương pháp kiểm lại.
  - Lý do chọn: tác động đồng thời lên 3 nhóm kết quả cần có trong brief: giảm thời gian nghiên cứu cho người viết, giảm thời gian duyệt nguồn cho giảng viên, giảm rủi ro học viên nhận thông tin sai.

## §3. Giải pháp tương tự đã nghiên cứu

- Chatbot viết kịch bản tổng quát:
  - Flow: người dùng nhập chủ đề, nhận bản nháp văn bản.
  - Đáng học: tạo nháp nhanh, chỉnh giọng văn linh hoạt.
  - Đáng né: thường không cho thấy câu nào dựa trên đoạn nguồn nào.
  - Mình khác gì: bắt buộc có hồ sơ nguồn, citation theo câu và hành vi viết lại khi bỏ nguồn.

- Công cụ tìm kiếm / hỏi đáp có dẫn nguồn:
  - Flow: người dùng hỏi, hệ thống trả lời kèm danh sách nguồn.
  - Đáng học: ưu tiên nguồn mới, hiển thị link, giúp kiểm chứng nhanh.
  - Đáng né: câu trả lời thường không được thiết kế như lời đọc video.
  - Mình khác gì: đầu ra là kịch bản văn nói ngắn, có kiểm soát theo từng câu.

## §4. Thiết kế

- Lát cắt MỘT CÂU:
  - Một người viết kịch bản cần 5 câu mở đầu cho video về một chủ đề AI; hệ thống tìm 3 nguồn, chấm độ tin cậy, viết 5 câu có gắn đoạn nguồn tương ứng; người viết loại một nguồn và chỉ các câu phụ thuộc nguồn đó được viết lại.

- Non-goals:
  - Không viết toàn bộ kịch bản dài nhiều phút trong prototype đầu.
  - Không dựng video, tạo slide hoặc thu âm.
  - Không xử lý nguồn paywall hoặc nguồn không đọc được.
  - Không tự động xuất bản nội dung không qua người duyệt.

- Mức prototype nhắm tới:
  - [ ] Sketch  [ ] Mock  [x] Working
  - Phần thật: nhập đề bài, tìm/nhận 3 nguồn, chấm độ tin cậy, tạo 5 câu, gắn citation, loại nguồn và viết lại câu phụ thuộc.
  - Phần có thể mock: dữ liệu nguồn mẫu và fixture xấu đã chuẩn bị nếu API/search không ổn định trong demo.

- Automation:
  - [x] augment  [x] conditional  [ ] automate
  - Lý do theo cost-of-error: hệ thống hỗ trợ tìm nguồn, gợi ý kịch bản và cảnh báo độ tin cậy, nhưng người viết/giảng viên vẫn quyết định dùng nguồn nào vì sai nguồn có thể làm học viên học sai.

- §4b. Nguyên tắc đã áp dụng:

| Nguyên tắc | Áp cụ thể vào đâu trong prototype |
|---|---|
| Hiển thị căn cứ cho quyết định | Mỗi nguồn có URL, tổ chức/tác giả, ngày, điểm tin cậy, lý do và đoạn trích |
| Cho người dùng kiểm soát | Người viết có thể loại nguồn không tin cậy |
| Giữ thay đổi cục bộ | Khi loại nguồn, chỉ câu phụ thuộc nguồn đó được viết lại |
| Nói rõ khi không chắc | Câu thiếu nguồn hoặc nguồn yếu được đánh dấu "chưa kiểm chứng" |
| Phòng chống lệnh ẩn trong nguồn | Nội dung trang web chỉ được xem là dữ liệu, không phải lệnh để hệ thống làm theo |

## §5. Kiểu lỗi — 4 lớp chỗ khó + kịch bản

| Lớp khó | Kịch bản lỗi | Rủi ro | Cách xử lý trong prototype |
|---|---|---|---|
| Nguồn sự thật | Bịa URL hoặc bịa trích dẫn | Người duyệt không kiểm lại được | Chỉ dùng nguồn có URL và đoạn trích lưu lại |
| Nguồn sự thật | Suy quá xa so với đoạn nguồn | Claim sai dù có citation | Mỗi claim phải trỏ về đoạn nguồn cụ thể |
| Nguồn sự thật | Hai nguồn mâu thuẫn | Kịch bản đưa thông tin một chiều | Hiển thị cảnh báo và yêu cầu người dùng chọn |
| Mơ hồ / thiếu thông tin | Chủ đề quá rộng | Nguồn tìm được loãng | Hỏi lại hoặc ghi giả định rõ ràng |
| Mơ hồ / thiếu thông tin | Mục tiêu bài học chưa rõ | Văn nói không đúng trọng tâm | Yêu cầu bổ sung mục tiêu hoặc dùng giả định |
| Ngoài phạm vi | Nguồn paywall/không đọc được | Không xác minh đầy đủ | Báo không thể xác minh, không dùng làm căn cứ chính |
| Ngoài phạm vi | Người dùng yêu cầu sao chép dài nguyên văn | Rủi ro bản quyền | Chỉ trích đoạn ngắn để kiểm chứng, không sao chép dài |
| Đặc thù domain | Chủ đề thay đổi nhanh, nguồn cũ | Học viên nhận thông tin lỗi thời | Ưu tiên nguồn mới, hiển thị ngày nguồn |
| Đặc thù domain | Trang có prompt injection | Hệ thống làm theo lệnh trong nguồn | Tách nội dung nguồn khỏi instruction hệ thống |

## §6. Bốn đường đi của trải nghiệm

- Happy path: người dùng nhập đủ chủ đề, mục tiêu, đối tượng, thời lượng; hệ thống tìm 3 nguồn tốt, tạo hồ sơ nguồn, viết 5 câu có citation và rewrite đúng câu khi bỏ nguồn.
- Low-confidence: nguồn liên quan nhưng cũ/yếu; hệ thống vẫn cho xem nhưng hạ điểm tin cậy và đánh dấu câu cần người duyệt kiểm.
- Failure/không căn cứ: không tìm được nguồn đủ tin; hệ thống không viết claim chắc chắn, trả về câu hỏi làm rõ hoặc đánh dấu "chưa kiểm chứng".
- Correction: người dùng sửa chủ đề, loại nguồn hoặc chỉnh câu; hệ thống cập nhật citation và chỉ viết lại phần bị ảnh hưởng.
- Khi bị đòi ngoài phạm vi: nếu yêu cầu dùng nguồn paywall, nguồn không đọc được hoặc sao chép dài nguyên văn, hệ thống từ chối phần không hợp lệ và giải thích giới hạn.
- Case đặc thù domain: với số liệu/chủ đề AI thay đổi nhanh, ưu tiên nguồn mới và cần ít nhất hai nguồn độc lập cho số liệu quan trọng, nếu không thì đánh dấu chưa kiểm chứng.

## §7. Kiểm thử

- Chiều chất lượng + định nghĩa kiểm chứng được:
  - Đúng nguồn: mỗi câu có claim trỏ được về đoạn nguồn cụ thể.
  - Không bịa: URL, tên tổ chức/tác giả, ngày và đoạn trích phải tồn tại trong hồ sơ nguồn.
  - Viết lại cục bộ: khi bỏ nguồn, chỉ câu phụ thuộc nguồn đó thay đổi.
  - Dễ duyệt: người duyệt nhìn một câu biết nguồn nào đang chống đỡ câu đó.

- Golden set:
  - Tối thiểu 20 case trong `eval/`, gồm happy path, nguồn cũ, nguồn mâu thuẫn, thiếu thông tin, nguồn không đọc được, prompt injection và bỏ nguồn.

- Quality bar:
  - Đạt khi >=80% case trong golden set có citation đúng nguồn, 0 case bịa nguồn, và 100% câu không đủ căn cứ được đánh dấu "chưa kiểm chứng" thay vì viết như sự thật.

- Kết quả các lượt chạy:
  - Chưa có số thật; cập nhật bảng kết quả trước CP6.

## §8. Phân công & kế hoạch

- Phân công có tên:

| Thành viên | Vai trò | Phần việc |
|---|---|---|
| Hồ Đình Tuấn Kiệt | PM | Quản lý tiến độ, chốt lát cắt sản phẩm, điều phối demo và tổng hợp deliverable |
| Nguyễn Tuấn Thành | Dev-QA | Xây dựng prototype, kiểm thử luồng hoạt động, chuẩn bị golden set và đo chất lượng |
| Nguyễn Trần Kiên | AI-BA | Phân tích bài toán, thiết kế luồng AI/agent, xử lý nguồn và đặc tả tiêu chí đánh giá |

- Willing users:
  - Cần tối thiểu 2 người ngoài nhóm: một người đóng vai người viết kịch bản và một người đóng vai người duyệt nguồn.
  - Tên cụ thể chốt sau khảo sát và lưu trong `validation/`.

- Multi-prototype:
  - Chưa làm. Nếu có thời gian, so sánh 2 phương án: giao diện source-first và giao diện script-first; chọn phương án giúp người duyệt kiểm claim nhanh hơn.

## §9. Changelog

| Thời điểm | Đổi gì | Vì sao |
|---|---|---|
| 16/09/2026 | Điền spec từ challenge brief và Canvas dự án | Chốt hướng ScriptScout: kịch bản video có dẫn nguồn theo câu |
