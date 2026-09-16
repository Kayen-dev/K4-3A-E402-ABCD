# Đề bài — Agent viết kịch bản video có dẫn nguồn

## Người dùng

Người viết kịch bản; giảng viên duyệt nguồn.

## Bối cảnh

Muốn làm một video bài giảng thì trước hết phải có kịch bản, tức toàn bộ lời sẽ đọc trong video. Hiện nay người biên soạn phải tự đọc tài liệu, tự tra cứu trên mạng rồi tự viết. Việc này mất nhiều ngày, và khi đưa cho người khác duyệt thì không ai kiểm được câu nào lấy từ đâu, vì danh sách nguồn chỉ được liệt kê ở cuối tài liệu.

Thiếu tư liệu thì người viết dễ đưa vào những con số hoặc ví dụ không có thật. Riêng chủ đề AI còn thay đổi từng tháng, nên một thông tin đúng lúc viết có thể đã cũ khi video lên sóng.

Các công cụ "nghiên cứu sâu" hiện có viết được báo cáo dài, nhưng báo cáo để đọc bằng mắt khác hẳn kịch bản để đọc thành lời, chia theo từng cảnh và chỉ ra được từng câu dựa trên nguồn nào.

## Tóm tắt

Đưa vào một chủ đề, nhận về kịch bản video mà mỗi câu đều truy được về nguồn.

## Bài toán gốc

Hãy xây dựng một agent chỉ cần nhận bốn thông tin: chủ đề, mục tiêu bài học, người học là ai và video dài bao lâu — không đưa sẵn tài liệu nào. Agent tự đi tìm tài liệu trên mạng, tự đánh giá tài liệu nào đáng tin, rồi viết kịch bản.

Kết quả trả về gồm hai phần:

- **Hồ sơ tài liệu:** mỗi nguồn ghi rõ lấy ở đâu, ai viết, đăng ngày nào, đáng tin ở mức nào và vì sao, kèm đoạn trích được dùng làm bằng chứng; chỗ nào các nguồn nói khác nhau thì phải nêu ra.
- **Kịch bản:** viết đúng mẫu ban tổ chức đưa, trong đó mỗi câu có chứa thông tin, con số hay ví dụ thực tế đều bấm được để xem đoạn tài liệu gốc.

Người duyệt xem hồ sơ tài liệu trước, bỏ nguồn nào thấy không ổn hoặc thêm nguồn của mình, rồi agent mới viết. Khi một nguồn bị bỏ, chỉ những câu dựa vào nguồn đó được viết lại, phần còn lại giữ nguyên.

Chỗ khó nhất của đề này là phân biệt "tìm được tài liệu" với "tài liệu đáng tin". Hệ thống phải nói rõ vì sao tin một nguồn, dựa trên những tiêu chí công bố trước. Số liệu quan trọng cần ít nhất hai nguồn độc lập xác nhận, nếu không thì phải đánh dấu là chưa kiểm chứng.

Kịch bản phải là văn nói, đọc lên nghe tự nhiên, mỗi ý một cảnh, chứ không phải bản tóm tắt báo cáo. Ngoài các yêu cầu đó, đội thi tự chọn công cụ tìm kiếm, model AI và cách dựng agent.

## Phạm vi

Đội thi chỉ cần làm ra kịch bản, không phải dựng thành video. Đội nào giải xong bài toán chính mà còn thời gian thì có thể dựng luôn một video từ chính kịch bản mình vừa tạo — đây là phần nâng cao, hoàn toàn không bắt buộc và không ảnh hưởng tới điểm của các tiêu chí chính.

## Lát cắt gợi ý cho hackathon

Một người viết · cần 5 câu mở đầu cho chủ đề X · AI tìm 3 nguồn, chấm tin cậy, viết 5 câu mỗi câu gắn nguồn · người viết loại một nguồn → chỉ câu phụ thuộc viết lại.

## Canvas nháp

Canvas nháp nộp tại CP1, dùng để chốt rõ nhóm đang giải bài toán nào trước khi build:

| Ô canvas | Nội dung cần điền |
|---|---|
| Người dùng cụ thể | Ai là người dùng chính của prototype trong đề này? Ví dụ: người viết kịch bản bài giảng, giảng viên duyệt nguồn. |
| Pain cụ thể | Người đó đang làm việc gì, vướng ở đâu, hậu quả là gì nếu không giải quyết? |
| Bằng chứng | Nhóm chứng minh pain bằng khảo sát, mining dữ liệu, ví dụ thật, hoặc quan sát có thể kiểm lại như thế nào? |
| Lát cắt prototype | Một câu theo format: một người dùng · một công việc · một quyết định AI · một kết quả. |

## 5 tiêu chí nghiệm thu bài toán

Áp cho mọi hướng — kể cả tối ưu tính năng có sẵn.

| # | Tiêu chí | Đạt khi |
|---|---|---|
| 1 | Pain cụ thể | Ai — đang làm gì — vướng đâu — hậu quả gì. "Mọi người thấy bất tiện" = không đạt |
| 2 | Bằng chứng | **(A)** khảo sát ≥20 người ngoài nhóm, ≥50% xác nhận, log toàn bộ câu hỏi + từng câu trả lời; và/hoặc **(B)** mining data: số đếm được + ≥5 ví dụ nguyên văn + phương pháp đếm kiểm lại được |
| 3 | Problem statement + impact | Không chữ AI; bảng impact ≥3 ứng viên (bao nhiêu người × tần suất × tốn gì mỗi lần) + lý do chọn + ứng viên đã loại |
| 4 | Lát cắt prototype được | Một câu theo đúng format trên, demo được trong 5 phút, build được trong thời gian sự kiện |
| 5 | User sẵn sàng thử *(khuyến khích — tính bonus)* | ≥2 người thật ngoài nhóm (tên cụ thể) đồng ý thử prototype trước demo |

*Canvas nháp nộp tại CP1; evidence và spec hoàn thiện dần, chốt tại hạn chốt spec (21:00 17/9, tại CP4).*

## Data & fixture

Không cần data pack — agent tự tìm web. `data/studio-pack/c3-scriptscout/` có mẫu kịch bản chung, một kịch bản thật 40 câu làm đích, hồ sơ nguồn mẫu và bảy câu đã nối vào nguồn, cùng 8 chủ đề để luyện.

Đội tự dựng vài trang web cài bẫy để thử các chỗ khó.

## Deliverable đầy đủ

### Sản phẩm tối thiểu

- Agent chạy được trọn vẹn: nhập chủ đề, nhận về hồ sơ tài liệu và kịch bản.
- Hồ sơ tài liệu: mỗi nguồn ghi rõ lấy ở đâu, ai viết, đăng ngày nào, đáng tin tới đâu và vì sao.
- Kịch bản đúng mẫu, mỗi câu có thông tin đều dẫn được về nguồn.
- Màn hình duyệt nguồn: xem, bỏ, thêm nguồn và cho viết lại phần liên quan.
- Tự soát trích dẫn: đoạn trích phải khớp nội dung trang đã tải về, không phải do AI bịa.
- Xuất được kịch bản và hồ sơ tài liệu ra file.
- Đội tự chuẩn bị bộ trang web để thử các chỗ khó nêu dưới đây, và nộp kèm bài.
- Tài liệu hướng dẫn: cách chạy, chi phí mỗi lần chạy, và những gì hệ thống chưa làm được.

### Những chỗ sẽ khó

- Trang web cài sẵn lệnh ẩn để lừa AI làm theo.
- Hai nguồn đều uy tín nhưng đưa số liệu khác nhau.
- Nguồn đã cũ hoặc đã có bản mới thay thế.
- Chủ đề gần như không có tài liệu tiếng Việt.
- Đường dẫn hỏng, hoặc trang bắt đăng nhập mới đọc được.

### Không gian mở

- Tìm kiếm bằng dịch vụ có sẵn, bằng tính năng tra web của model, bằng công cụ tự thu thập trang, hoặc kết hợp.
- Một agent làm hết, hoặc chia nhiều agent: đi tìm, thẩm định, viết, soát trích dẫn.
- Chấm độ tin cậy bằng bộ tiêu chí cứng, bằng AI, hoặc cả hai.
- Làm với nguồn tiếng Việt, tiếng Anh hoặc nhiều thứ tiếng.
- Giao diện: web, ứng dụng máy tính, hoặc chạy bằng dòng lệnh — đội tự chọn.

## Demo bắt buộc của bản đầy đủ

Ban giám khảo đưa một chủ đề tại chỗ, kèm mục tiêu bài học và thời lượng. Đội nhập vào và cho xem quá trình hệ thống tìm rồi sàng lọc tài liệu.

Mở hồ sơ tài liệu, bỏ một nguồn, chứng minh chỉ những câu liên quan được viết lại. Ban giám khảo chỉ bất kỳ một câu trong kịch bản, hệ thống phải mở đúng đoạn tài liệu chứng minh cho câu đó.

Cuối cùng, đội cho chạy hai tình huống đã chuẩn bị sẵn — một trang có lệnh ẩn và hai nguồn nói ngược nhau — để thấy hệ thống phản ứng thế nào.

## Rubric riêng của đề

| Tiêu chí | Tỷ trọng |
|---|---:|
| Câu truy được về nguồn và trích dẫn chính xác | 25% |
| Chọn nguồn đáng tin, còn mới | 20% |
| Kịch bản đọc lên nghe tự nhiên | 20% |
| Người duyệt kiểm soát được, chỉ viết lại phần cần sửa | 15% |
| Chịu được tình huống xấu | 10% |
| Dễ dùng, chạy lại cho kết quả tương đương | 10% |

## Bonus

- Chỉ ra chỗ các nguồn mâu thuẫn và trình bày để người duyệt chọn.
- Theo dõi nguồn đã dùng, báo khi nguồn đó có bản cập nhật.
- Tìm được ví dụ thực tế ở Việt Nam, có dẫn nguồn.
- Gợi ý cách hiện tên nguồn ngay trên màn hình video.
- So sánh mù: giấu nhãn, để người đọc chấm kịch bản của máy và của người cùng một chủ đề.
- NÂNG CAO (không bắt buộc): dựng luôn một video hoàn chỉnh từ chính kịch bản agent vừa viết.

## An toàn & đạo đức

- Không bịa nguồn, không bịa trích dẫn.
- Chữ trên trang web là dữ liệu để đọc, không phải lệnh để làm theo.
- Tôn trọng bản quyền và điều khoản của trang được lấy nội dung.
- Nói rõ chỗ nào chưa chắc chắn, chỗ nào còn nhiều quan điểm khác nhau.
- Kịch bản do AI viết phải có giảng viên duyệt trước khi dựng thành video.
