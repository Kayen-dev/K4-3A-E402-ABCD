# ScriptScout — Thuyết trình dưới góc nhìn BA và AI Engineer

Kịch bản trình bày: từ nhu cầu nghiệp vụ đến thiết kế và vận hành hệ thống AI.
Phần BA giải thích người dùng cần gì và sản phẩm giải quyết bằng quy trình nào.
Phần AI Engineer giải thích dữ liệu, công cụ, agent và cơ chế kiểm soát chất lượng.
Các phần RAG, chỉ số đánh giá và kiến trúc mở rộng là đề xuất, chưa phải toàn bộ tính năng đã triển khai.

## 01 BA — Business problem và pain points

Kính chào thầy cô và các bạn, nhóm chúng em xin giới thiệu ScriptScout.
Để chuẩn bị một bài giảng, giảng viên thường phải tìm tài liệu, đọc, chọn lọc và viết lời giảng.
Khi sử dụng AI, bản nháp có thể được tạo nhanh hơn, nhưng việc kiểm tra thông tin vẫn mất nhiều thời gian.
Giảng viên cần biết một câu được viết từ tài liệu nào và tài liệu đó có thật sự hỗ trợ câu này hay không.
Đồng thời, một nội dung đúng về kiến thức vẫn có thể khó hiểu đối với người học.
Từ pain points này, nhóm xác định hai business needs: kiểm soát căn cứ và cải thiện cách truyền đạt.
ScriptScout tổ chức hai nhu cầu này thành một quy trình có thể theo dõi và phê duyệt.

## 02 BA — Stakeholders, personas và responsibility matrix

Hai nhóm end users chính là giảng viên và học sinh hoặc sinh viên, tương ứng hai user personas của sản phẩm.
Giảng viên tạo bài học, chọn tài liệu, biên tập kịch bản và quyết định bản cuối.
Sinh viên gửi góp ý về những chỗ khó hiểu, thiếu giải thích hoặc chưa phù hợp với trải nghiệm học tập.
Giảng viên duyệt góp ý trước khi hệ thống đưa vào lần rà soát tiếp theo.
Trong responsibility matrix, giảng viên chịu trách nhiệm phê duyệt chuyên môn và sinh viên cung cấp learning feedback.
AI hỗ trợ tìm vấn đề và đề xuất phương án sửa, còn người dùng quyết định áp dụng.
Đây là cơ sở để chúng em thiết kế mô hình human in the loop cho toàn bộ quy trình.

## 03 BA — Value proposition, MVP scope và use cases

Value proposition của MVP là giảm công sức biên tập và tăng traceability từ lời đọc đến nguồn căn cứ.
Luồng thứ nhất dành cho giảng viên chưa có kịch bản và cần research từ đầu.
Luồng thứ hai dành cho giảng viên đã có lời đọc và muốn nhận góp ý theo từng câu.
Luồng sinh viên bổ sung phản hồi để bài giảng cải thiện qua những lần biên tập.
Đầu ra gồm lời đọc, thông tin nguồn và hồ sơ thao tác khi cần đối chiếu.
Tạo video hoàn chỉnh thuộc future scope, sau khi các core use cases về kịch bản được kiểm soát chất lượng.
Chúng em ưu tiên hoàn thiện chuỗi dữ liệu từ yêu cầu bài học đến câu đã được giảng viên duyệt.

## 04 BA — Requirement elicitation và business rules

Thông qua requirement elicitation, nhóm xác định lesson brief gồm chủ đề, learning outcomes, learner profile và thời lượng.
Chủ đề là phạm vi kiến thức chính mà bài giảng phải bám theo.
Mục tiêu mô tả người học cần hiểu hoặc thực hiện được điều gì sau bài học.
Đối tượng người học giúp xác định độ khó và cách giải thích phù hợp.
Ví dụ, cùng chủ đề trí tuệ nhân tạo, mục tiêu nhận diện ứng dụng sẽ khác mục tiêu giải thích thuật toán.
Business rule trọng tâm là topic giữ vai trò chính, còn learning outcomes bổ sung context cho các truy vấn mở rộng.
Quy tắc này giúp kết quả tìm kiếm phục vụ đúng bài học mà giảng viên đang chuẩn bị.

## 05 BA — End to end workflow của use case tạo kịch bản

Happy path bắt đầu khi giảng viên nhập lesson brief, hệ thống validate dữ liệu rồi thực hiện research.
Kết quả được trình bày thành danh sách nguồn kèm trạng thái và nội dung đã đọc được.
Giảng viên có thể xem đoạn căn cứ trước khi quyết định chọn nguồn.
Khi bấm Viết kịch bản, các nguồn được chọn trở thành dữ liệu đầu vào cho agent viết.
Kịch bản được chia thành câu hoặc cảnh để dễ biên tập và đối chiếu.
Giảng viên chạy rà soát, xử lý góp ý và hoàn tất các kiểm tra cần thiết trước khi duyệt.
Sau đó người dùng tải lời đọc cuối hoặc bản có ngữ cảnh và hồ sơ nguồn.

## 06 BA — Review workflow, alternate flow và approval gate

Use case Review Script có hai entry points: dán lời đọc hoặc import file Markdown.
Hệ thống tách lời đọc và ngữ cảnh, chạy kiểm tra rồi chuyển đến bước kịch bản.
Mỗi góp ý hiển thị vấn đề, lý do và nội dung thay thế khi agent cung cấp được.
Giảng viên có thể chỉnh đề xuất hoặc nhập bản sửa thủ công rồi chấp nhận.
Alternate flow cho phép người dùng giữ nguyên câu khi nhận xét chưa phù hợp hoặc sửa thủ công khi chưa có đề xuất.
Approval gate của phiên rà soát cho phép Done khi các góp ý đã được xử lý và phiên đáp ứng điều kiện chốt.
Chốt ở luồng này là xác nhận biên tập; mức độ kiểm chứng thông tin cần được hiểu theo bằng chứng thực tế.

## 07 BA — Feedback lifecycle và continuous improvement

Sinh viên nhập tiêu đề và nội dung góp ý, sau đó gửi để giảng viên xem xét.
Một ví dụ là: phần giải thích thuật ngữ xuất hiện quá muộn nên người học khó theo dõi.
Feedback lifecycle gồm pending, approved và rejected; business rule chỉ cho phép sử dụng feedback đã approved.
Nếu sinh viên sửa góp ý, trạng thái trở về chờ duyệt để giảng viên kiểm tra lại.
Feedback đã duyệt giúp agent review chú ý đến vấn đề người học từng gặp.
Về nghiệp vụ, feedback loop hỗ trợ continuous improvement bằng cách đưa learning experience trở lại quy trình biên tập.
Trong bản hiện tại, feedback dùng chung; gắn riêng theo bài học và lớp là yêu cầu mở rộng cần ưu tiên.

## 08 BA — Acceptance criteria, UAT và success metrics đề xuất

Acceptance criteria cho research là truy vấn bám chủ đề và sử dụng mục tiêu làm ngữ cảnh bổ sung.
Với writing, yêu cầu là dùng nội dung nguồn đã chọn và không gán bằng chứng ngoài dữ liệu được cấp.
Với review, góp ý phải chỉ ra câu liên quan và có thể được xử lý bằng thao tác rõ ràng.
Với chốt bản, chỉnh sửa sau phê duyệt phải làm mất hiệu lực phê duyệt phiên bản cũ.
Chúng em đề xuất đo thời gian từ nhập bài học đến bản cuối và tỷ lệ nguồn đọc được.
Chất lượng AI có thể đo bằng tỷ lệ claim có căn cứ và tỷ lệ đề xuất sửa được giảng viên chấp nhận.
Các success metrics và kịch bản UAT này là đề xuất; cần baseline và dữ liệu pilot để xác định target thực tế.

## 09 AI Engineer — Application architecture và model abstraction layer

Từ các yêu cầu nghiệp vụ, chúng em xây dựng frontend React với TypeScript và Vite.
Tailwind CSS hỗ trợ bố cục và trạng thái tương tác trong các bước làm việc.
Backend Node.js tiếp nhận request, quản lý phiên và điều phối pipeline xử lý.
Tavily hỗ trợ tìm kiếm web và trích xuất bổ sung khi cần.
HTTP fetch cùng Cheerio hỗ trợ tải và phân tích nội dung HTML công khai.
LLM adapter đóng vai trò model abstraction layer, tập trung provider configuration, inference endpoint và rate limiting.
Việc tách các lớp giúp chúng em thay đổi công cụ mà vẫn giữ quy trình nghiệp vụ nhất quán.

## 10 AI Engineer — Agent orchestration và task decomposition

Chúng em áp dụng task decomposition, chia agent thành các vai trò với input contract và output contract cụ thể.
Research thu thập nguồn; đánh giá nguồn xác định khả năng sử dụng và cảnh báo.
Writing tạo fact và lời đọc; verification đánh giá bằng chứng hỗ trợ fact.
Review kiểm tra diễn đạt và đối chiếu các góp ý đã được duyệt.
Agent orchestration dùng pipeline điều khiển bằng code và task specific prompts để chuyển dữ liệu theo thứ tự kiểm soát được.
Thiết kế này giúp xác định lỗi phát sinh ở tìm kiếm, đọc trang, tạo nội dung hay kiểm chứng.
Các vai trò có thể dùng chung foundation model với prompt và context khác nhau; pipeline hiện được điều phối bằng code.

## 11 AI Engineer — Input validation và content safety guardrails

Backend kiểm tra độ dài, trường bắt buộc và thời lượng trước khi tạo phiên hợp lệ.
Một lớp content policy xét chủ đề, mục tiêu và người học trước khi gọi tìm kiếm.
Safety guardrails kết hợp rule based filtering cho mẫu rõ ràng và LLM based contextual classification khi đã cấu hình.
Nội dung giáo dục nhạy cảm cần được đánh giá theo mục đích và cách trình bày.
Nếu bị từ chối, hệ thống giải thích rằng nội dung không phù hợp để tìm tài liệu.
Nếu bước phân loại gặp lỗi, hệ thống báo chưa thể kiểm tra và yêu cầu thử lại.
Chúng em phân biệt hai tình huống này để tránh gán nhãn sai cho người dùng khi dịch vụ gặp sự cố.

## 12 AI Engineer — Query expansion và web retrieval

Query expansion tạo topic query và objective conditioned queries, mỗi truy vấn mở rộng vẫn giữ chủ đề chính.
Tavily Search được gọi với chế độ tìm kiếm nâng cao để thu thập ứng viên.
Kết quả được phân phối giữa các truy vấn nhằm tăng độ bao phủ các mục tiêu.
URL deduplication và source budget giới hạn dữ liệu ứng viên, giúp kiểm soát latency và chi phí retrieval.
Giao diện hiển thị truy vấn đã tìm để giảng viên hiểu phạm vi research.
Ở bước này, dữ liệu đầu ra là URL ứng viên cùng thông tin tìm kiếm.
Muốn dùng làm căn cứ, mỗi URL còn phải đi qua bước đọc và đánh giá nội dung.

## 13 AI Engineer — Content extraction, normalization và provenance

Trước khi tải trang, backend kiểm tra URL công khai và hạn chế địa chỉ local hoặc mạng riêng.
HTTP fetch tải HTML; Cheerio chọn vùng article, main hoặc phần nội dung chính của Wikipedia.
Các vùng điều hướng và thành phần như menu, footer, script được loại khỏi văn bản đọc.
Text normalization xử lý entity HTML và tạo source snapshot để lưu content provenance tại thời điểm research.
Snapshot cùng hash hỗ trợ nhận diện bản nội dung dùng khi trích dẫn.
Nếu đọc trực tiếp thất bại, Tavily Extract có thể cung cấp phương án bổ sung.
Extraction budget giới hạn snapshot; context đưa vào model phụ thuộc dữ liệu đã đọc được và context window của model.

## 14 AI Engineer — Source assessment và media enrichment

Source assessment kết hợp metadata, quality signals, đoạn trích và extraction status để hỗ trợ lựa chọn nguồn.
Danh sách ưu tiên nguồn đã lấy được nội dung để giảng viên dễ chọn dữ liệu sử dụng được.
Một số nguồn thiếu tác giả có thể được chọn kèm cảnh báo theo chính sách của hệ thống.
Media enrichment thu thập URL ảnh hoặc video và gắn với source; bước này hiện chưa thực hiện visual understanding toàn diện.
Media giúp đề xuất minh họa cho cảnh, còn bằng chứng kiến thức cần dựa trên nội dung phù hợp.
Trang đăng nhập, chặn truy cập hoặc phụ thuộc JavaScript có thể không đọc được bằng luồng hiện tại.
Với video, việc lấy được link chưa đồng nghĩa đã lấy transcript hoặc hiểu nội dung bên trong video.

## 15 AI Engineer — Context engineering, grounding và evidence attribution

Agent writing nhận yêu cầu bài học và nội dung đã crawl của các nguồn được chọn.
Context engineering đóng gói source snapshot, excerpts, metadata và media thành context cho bước generation.
Prompt yêu cầu gom thông tin thành fact rồi tạo một kịch bản hoàn chỉnh từ các fact đó.
Mỗi fact khai báo đoạn nguyên văn và nguồn hỗ trợ; mỗi câu khai báo các fact liên quan.
Evidence validation dùng exact substring matching để loại các citation không tồn tại trong nội dung đã cấp.
Evidence attribution duy trì chuỗi sentence, claim, evidence và source để truy ngược căn cứ của lời đọc.
Đây là cơ chế grounding và truy vết; độ đúng của suy luận vẫn cần bước kiểm chứng tiếp theo.

## 16 AI Engineer — Claim verification, structured output và hybrid review

Claim verification đánh giá evidence support và contradiction để giảm unsupported claims trong kịch bản.
Hybrid review kết hợp deterministic checks bằng code với semantic assessment của LLM.
Code hỗ trợ phát hiện câu dài và một số trường hợp cần căn cứ; LLM đánh giá nghĩa, sắc thái và văn nói.
Structured output được yêu cầu dưới dạng JSON gồm sentence reference, error span, severity, rationale và replacement khi có.
Backend kiểm tra đoạn lỗi có tồn tại trong câu trước khi hiển thị hoặc áp dụng.
Khi giảng viên chấp nhận sửa, vị trí thay thế được kiểm tra trên nội dung hiện tại.
Nếu câu đã thay đổi hoặc đoạn cần sửa không rõ vị trí, hệ thống yêu cầu rà soát lại để tránh sửa nhầm.

## 17 AI Engineer — Approved feedback context injection hiện tại

Hiện tại, backend lấy các feedback có trạng thái approved khi bắt đầu review.
Feedback context injection đưa tiêu đề, nội dung và ID trực tiếp vào inference prompt cùng lời đọc.
Agent được yêu cầu chỉ áp dụng góp ý liên quan đến câu đang xét.
Finding có thể lưu feedback ID để biết đề xuất sửa bắt nguồn từ góp ý nào.
Trust boundary quy định feedback là reference data; prompt yêu cầu bỏ qua instruction injection và không dùng feedback làm factual evidence.
Bản hiện tại chưa có embedding và vector database cho feedback.
Đây là direct context augmentation; bản hiện tại chưa có semantic retrieval hoặc fine tuning từ feedback.

## 18 AI Engineer — Đề xuất Retrieval Augmented Generation cho feedback

Khi feedback tăng, gửi toàn bộ danh sách có thể làm context dài và chứa nhiều nội dung không liên quan.
Chúng em đề xuất RAG để truy xuất góp ý phù hợp theo câu và bài học trước khi gọi review.
Feedback đã duyệt được gắn metadata bài học, lớp, chủ đề và quyền truy cập.
Embedding model mã hóa feedback thành dense vectors; pgvector hoặc Qdrant là các lựa chọn vector index cần đánh giá.
Retrieval pipeline áp dụng metadata filtering trước hybrid retrieval, kết hợp lexical search với semantic similarity search.
Reranking đề xuất dùng relevance scoring để chọn top K; token budget giới hạn context đưa vào generation.
Đây là thiết kế mở rộng đề xuất, chưa phải kiến trúc RAG đang vận hành trong source hiện tại.

## 19 AI Engineer — Đề xuất retrieval evaluation và index lifecycle

Khi không có kết quả vượt relevance threshold, fallback path chạy review bằng base instructions và deterministic checks.
Index lifecycle cần hỗ trợ upsert và delete khi feedback được sửa, reject hoặc xóa để tránh stale retrieval.
Truy xuất nên trả ID và nội dung góp ý để giữ khả năng giải thích kết quả.
Offline evaluation đề xuất dùng Precision at K và Recall at K trên bộ query và feedback có relevance labels.
End to end evaluation cần đo suggestion acceptance rate, groundedness và tỷ lệ false positive do feedback không phù hợp.
Các ngưỡng retrieval cần được điều chỉnh bằng dữ liệu, tránh chọn tùy ý rồi coi là tối ưu.
RAG cung cấp thông tin lúc suy luận; model không tự được huấn luyện lại từ mỗi feedback được duyệt.

## 20 BA và AI Engineer — Governance, auditability và product roadmap

Revision hỗ trợ optimistic concurrency control; audit trail lưu nội dung trước và sau để tăng auditability.
Done ghi nhận bản được giảng viên chốt, còn chỉnh sửa tiếp sẽ làm mất hiệu lực bản đã duyệt.
File final.md chỉ chứa lời đọc; bản có ngữ cảnh và hồ sơ nguồn phục vụ kiểm tra riêng khi cần.
Automated tests bao phủ extraction, query expansion, evidence validation, Markdown parsing và approval state transitions.
Mock based tests xác nhận application logic; model quality cần offline evaluation và human evaluation trên bài giảng thực tế.
Product roadmap ưu tiên lesson scoped feedback, evaluation dataset và RAG theo nhu cầu scale; các hạng mục này cần acceptance criteria trước triển khai.
Chúng em mong ScriptScout giúp giảng viên biên tập có căn cứ và cải thiện bài giảng từ phản hồi người học.
Xin cảm ơn thầy cô và các bạn đã theo dõi.
