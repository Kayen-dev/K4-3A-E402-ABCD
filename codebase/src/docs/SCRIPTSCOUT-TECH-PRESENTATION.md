# ScriptScout — Thuyết trình sản phẩm và kiến trúc AI

## Phần 1. Bài thuyết trình khoảng 4 phút

Người trình bày kết hợp góc nhìn Business Analyst và AI Engineer.
Các mốc thời gian là gợi ý; nên đọc thử với đồng hồ để điều chỉnh tốc độ.
Phần hỏi đáp phía sau không tính vào thời lượng thuyết trình.

### 0:00–0:40 — Bài toán và giá trị sản phẩm

Kính chào thầy cô và các bạn, nhóm chúng em xin giới thiệu ScriptScout, ứng dụng hỗ trợ xây dựng và rà soát kịch bản bài giảng.

Từ góc nhìn BA, pain point chính là giảng viên phải tốn công tìm tài liệu, kiểm tra thông tin và chuyển kiến thức thành lời giảng dễ hiểu. Khi dùng AI, bản nháp có thể nhanh hơn nhưng người dùng vẫn khó biết từng câu dựa vào đâu.

Vì vậy, value proposition của ScriptScout là hỗ trợ biên tập có căn cứ và có khả năng truy vết. Giảng viên kiểm soát bản cuối, còn phản hồi của sinh viên giúp phát hiện những phần khó hiểu trong trải nghiệm học tập.

### 0:40–1:20 — Use cases và luồng người dùng

MVP có hai use cases chính: tạo kịch bản từ bài học và rà soát kịch bản có sẵn.

Ở luồng tạo mới, giảng viên nhập chủ đề, mục tiêu học xong, người học và thời lượng. Chủ đề xác định phạm vi chính; mục tiêu bổ sung context cho research. Hệ thống tìm và đọc tài liệu, sau đó giảng viên chọn nguồn để viết kịch bản.

Ở luồng rà soát, giảng viên dán nội dung hoặc import Markdown, xem góp ý theo từng câu và quyết định chấp nhận hay giữ nguyên. Khi chấp nhận, hệ thống thay đoạn được đánh dấu và kiểm tra vị trí để tránh ghi đè các chỉnh sửa khác.

Sinh viên gửi feedback; giảng viên approve hoặc reject. Chỉ feedback được approve mới được đưa vào lần review tiếp theo.

### 1:20–2:20 — Web research và agent orchestration

Về kỹ thuật, frontend dùng React và TypeScript; backend Node.js điều phối pipeline bằng code.

Chúng em áp dụng task decomposition: chia các bước đánh giá nguồn, writing, verification và review thành những nhiệm vụ có prompt và dữ liệu đầu vào riêng. Đây là orchestration có thứ tự kiểm soát được.

Web research dùng query expansion từ chủ đề và mục tiêu, gọi Tavily Search rồi loại URL trùng. Backend dùng HTTP fetch và Cheerio để trích nội dung bài viết, bỏ menu và thành phần phụ. Tavily Extract là phương án bổ sung khi đọc trực tiếp thất bại.

Nội dung được lưu thành snapshot kèm metadata và hash để truy vết. Hệ thống cũng thu URL ảnh hoặc video nếu có; điều này chưa đồng nghĩa đã hiểu nội dung video.

Trước khi writing, context engineering chọn các đoạn liên quan trong tài liệu đã chọn theo ngân sách đầu vào. Agent tạo fact và lời đọc, đồng thời liên kết câu với fact, đoạn trích và URL nguồn. Đây là cơ chế grounding: cung cấp căn cứ cụ thể cho generation.

### 2:20–3:15 — Kiểm chứng, review và feedback

Backend kiểm tra đoạn trích có tồn tại trong context đã cấp bằng exact substring matching. Bước này loại trích dẫn bịa, nhưng chưa chứng minh câu viết đúng về nghĩa.

Vì vậy, claim verification tiếp tục đánh giá mức hỗ trợ hoặc mâu thuẫn giữa claim và evidence. Khi thiếu bằng chứng, hệ thống giữ trạng thái cần kiểm chứng.

Review sử dụng hybrid approach: deterministic checks phát hiện những mẫu như câu dài; LLM đánh giá ngữ nghĩa và cách diễn đạt. Structured output dạng JSON được kiểm tra trước khi hiển thị góp ý.

Feedback được duyệt hiện được đưa trực tiếp vào review context để agent chú ý đến vấn đề người học từng gặp. Đây chưa phải semantic retrieval bằng vector database và cũng không phải fine-tuning.

Approval gate giữ giảng viên trong vòng quyết định. Với kịch bản nhập vào để rà soát, Done xác nhận biên tập; không tự chứng nhận mọi thông tin là đúng.

### 3:15–4:00 — Bài học thực tế và hướng phát triển

Qua user testing, nhóm ghi nhận research lệch chủ đề, kịch bản chưa bám nguồn và thời gian generation dài. Nhóm cải thiện truy vấn, kiểm tra evidence, giới hạn context và bổ sung progress log.

Với tài liệu dài, hệ thống chọn các cửa sổ văn bản liên quan thay vì gửi toàn bộ; đồng thời giới hạn timeout theo từng tác vụ. Đánh đổi là có thể bỏ sót thông tin ngoài context, nên vẫn cần kiểm tra độ bao phủ.

Roadmap ưu tiên feedback theo bài học, bộ evaluation có nhãn và RAG khi lượng feedback tăng. Chúng em sẽ đánh giá groundedness, độ phù hợp của research, tỷ lệ chấp nhận góp ý và latency.

ScriptScout hướng tới một quy trình biên tập có căn cứ, có phản hồi và có người phê duyệt. Xin cảm ơn thầy cô và các bạn.

## Phần 2. Câu hỏi phản biện khó và câu trả lời gợi ý

Các câu trả lời dưới đây bám triển khai hiện tại. Những nội dung roadmap được ghi rõ là đề xuất.

### 1. Người dùng có thể dùng ChatGPT để viết bài giảng. Vì sao cần sản phẩm này?

**Trả lời:** Giá trị của ScriptScout nằm ở workflow: chọn nguồn, lưu nội dung đã đọc, liên kết câu với căn cứ, xử lý góp ý và phê duyệt phiên bản. Một chatbot vẫn có thể thực hiện nhiều bước tương tự, nhưng người dùng phải tự tổ chức và theo dõi chúng. Nhóm cần chứng minh lợi ích bằng UAT và thời gian hoàn thành nhiệm vụ, chưa thể khẳng định sản phẩm luôn tốt hơn chatbot.

### 2. Gắn link nguồn có thực sự giải quyết hallucination không?

**Trả lời:** Chỉ gắn link chưa đủ. Hệ thống yêu cầu đoạn trích tồn tại trong context đã cấp và kiểm tra claim có được evidence hỗ trợ về nghĩa hay không. Tuy nhiên, nguồn có thể sai và LLM verifier cũng có thể sai. Đây là cơ chế giảm rủi ro và tăng traceability, chưa phải bảo đảm chính xác tuyệt đối.

### 3. Hai nguồn nói giống nhau có nghĩa là thông tin đã được xác minh?

**Trả lời:** Không chắc, vì hai trang có thể sao chép cùng một nguồn. Logic hiện tại đếm các source ID khác nhau; chưa xác định được tính độc lập về tác giả hay nguồn xuất bản. Đây là hạn chế cần cải thiện bằng kiểm tra provenance và trùng nội dung. Nhóm không nên coi “hai source ID” là chứng minh hai nguồn độc lập.

### 4. Đây có thật sự là hệ thống multi-agent không?

**Trả lời:** Hệ thống chia nhiệm vụ thành các vai trò AI với prompt và contract riêng; backend điều phối theo pipeline cố định. Các vai trò có thể dùng chung một model. Agent chưa tự lập kế hoạch hoặc tự chọn tool ngoài luồng code đã định. Cách mô tả chính xác là task-specific agent pipeline với deterministic orchestration.

### 5. Nhóm có dùng RAG để xử lý feedback không?

**Trả lời:** Hiện chưa có embedding, vector index hay semantic retrieval cho feedback. Backend lấy feedback approved và đưa trực tiếp vào context của review. RAG là đề xuất khi dữ liệu tăng: lọc theo bài học và quyền truy cập, retrieval, reranking rồi chọn top K trong token budget. Việc bổ sung này cần evaluation để chứng minh hiệu quả.

### 6. Feedback approved có làm model học được kiến thức mới không?

**Trả lời:** Feedback ảnh hưởng đến lần inference qua context, không cập nhật model weights. Nó giúp agent nhận diện vấn đề về cách giải thích hoặc diễn đạt; không được coi là bằng chứng xác thực kiến thức. Feedback hiện còn dùng chung, chưa phân phạm vi theo bài học, nên có nguy cơ nhiễu. Lesson-scoped feedback là một ưu tiên tiếp theo.

### 7. Nếu sinh viên gửi feedback sai hoặc chèn lệnh điều khiển AI thì sao?

**Trả lời:** Feedback phải qua giảng viên duyệt; prompt xem nó là dữ liệu tham khảo và yêu cầu bỏ qua instruction injection. Backend kiểm tra đầu ra, ID feedback và đoạn lỗi có thật trong câu. Những lớp này giảm rủi ro nhưng không loại bỏ mọi prompt injection. Cần bổ sung adversarial testing và giới hạn phạm vi feedback trước khi triển khai rộng.

### 8. Tại sao có tài liệu “Không nên dùng” nhưng vẫn cho chọn?

**Trả lời:** Badge là khuyến nghị về chất lượng, không phải mọi trường hợp đều là lệnh cấm. Người dùng có thể cần phân tích một tài liệu thiếu metadata hoặc chưa đạt tiêu chí. Hệ thống cho chọn khi đã đọc được nội dung và đáp ứng điều kiện an toàn; nguồn bị cách ly do injection vẫn bị loại. Chọn nguồn không tự nâng độ tin cậy của claim.

### 9. Crawl được Facebook hay lấy link video có nghĩa là đọc được hết nội dung?

**Trả lời:** Không. Luồng hiện tại chủ yếu đọc HTML công khai; trang cần đăng nhập hoặc render JavaScript có thể thất bại. URL video chưa cung cấp transcript hay nội dung hình ảnh cho model. Muốn xử lý video cần thêm transcript extraction hoặc speech recognition, rồi kiểm tra chất lượng trước khi dùng làm evidence.

### 10. Cắt tài liệu dài để tránh timeout có làm mất context quan trọng không?

**Trả lời:** Có thể. Hệ thống chọn cửa sổ văn bản theo chủ đề, mục tiêu và đoạn trích, giữ thứ tự bài viết trong giới hạn ngân sách. Cách này tiết kiệm context nhưng có thể bỏ mất điều kiện hoặc ngoại lệ ở phần khác. Cần đánh giá coverage và bổ sung đọc các đoạn lân cận khi evidence chưa đủ; chưa có bảo đảm recall hoàn toàn.

### 11. Vì sao viết kịch bản lâu? Progress log có giải quyết được không?

**Trả lời:** Latency gồm thời gian chờ provider, lượng context, lượng output và các bước kiểm chứng; retry có thể tăng tổng thời gian. Progress log cải thiện observability và UX, không tự làm inference nhanh hơn. Nhóm đã giới hạn context và timeout, nhưng cần đo latency từng stage, p50/p95 và token usage để xác định bottleneck thay vì chỉ tăng timeout.

### 12. Nhiều góp ý trên một câu có ghi đè nhau không?

**Trả lời:** Khi áp dụng, backend xác định span trong nội dung hiện tại và chỉ thay đoạn đó. Các vị trí còn lại được cập nhật theo độ dài thay đổi; đoạn giao nhau hoặc không xác định được sẽ cần rà soát lại. Revision giúp phát hiện cập nhật dựa trên phiên bản cũ. Cơ chế này tránh khôi phục cả câu và làm mất những sửa đổi đã chấp nhận.

### 13. Bấm Done có nghĩa là kịch bản đã đúng toàn bộ kiến thức?

**Trả lời:** Với luồng import để review, Done là phê duyệt biên tập, không phải chứng nhận factual accuracy. Luồng research có thêm điều kiện về kiểm chứng và xử lý vấn đề trước khi chốt. Khi nội dung thay đổi, phê duyệt phiên bản cũ mất hiệu lực. Nhóm cần diễn đạt rõ sự khác nhau này trong acceptance criteria.

### 14. Nhóm chứng minh chất lượng AI bằng cách nào?

**Trả lời:** Automated tests kiểm tra logic, schema và state transitions; tests dùng mock chưa chứng minh chất lượng model trên thực tế. Cần một evaluation dataset có nhãn: chủ đề, nguồn phù hợp, claim được hỗ trợ và góp ý đúng. Đo groundedness, research relevance, false positives, suggestion acceptance rate và latency. User testing hiện cung cấp các failure cases để xây dựng bộ đánh giá, chưa đủ suy ra độ chính xác chung.

### 15. Kiến trúc hiện tại có đáp ứng nhiều người dùng đồng thời không?

**Trả lời:** Revision và kiểm tra xung đột dữ liệu hỗ trợ bảo vệ cập nhật. Tuy nhiên, khóa xử lý trong bộ nhớ chỉ có hiệu lực trên từng instance; hệ thống chưa có distributed job queue hoặc workflow có thể tiếp tục sau sự cố. Khi mở rộng, cần durable job state, distributed locking, retry có kiểm soát và phân quyền dữ liệu theo lớp hoặc dự án.

## Ghi nhớ khi trả lời

- Trình bày theo cấu trúc: cơ chế hiện có → giới hạn → cách kiểm chứng hoặc hướng cải thiện.
- Phân biệt evidence tồn tại với evidence hỗ trợ claim; phê duyệt biên tập với xác minh kiến thức.
- Không gọi direct context augmentation là vector RAG hoặc fine-tuning.
- Không đưa tỷ lệ chính xác, mức tiết kiệm thời gian hoặc khả năng scale khi chưa có dữ liệu đo.
