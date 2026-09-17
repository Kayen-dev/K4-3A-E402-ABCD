# Plan thực thi tối giản: UI, research và QA kịch bản

Trạng thái: chỉ lập kế hoạch, chưa execute refactor. Bản này thay toàn bộ plan dài trước đó.
Ưu tiên: UI dễ dùng và đầy đủ → phản hồi nhanh → chính xác có bằng chứng → eval và chống injection.

## 1. Phạm vi và nguyên tắc

- UI nguồn: `D:\K4-3A-E402-ABC\codebase` (React/TypeScript, Vite, Tailwind).
- Đích: `D:\K4-3A-E402-ABC\nhom-c1\codebase`; mọi đường dẫn dưới đây tương đối với đích.
- Copy frontend vào `ui/`, giữ backend `src/`, `server.js`, eval và fixtures C1. Giữ nguyên UI nguồn.
- Tái sử dụng component/style/font nguồn; chỉ sửa nội dung và nối API thật. Không thiết kế lại theme.
- Giữ Node ESM, adapter LLM và NDJSON hiện có. Không thêm agent framework, database, microservice, dashboard hoặc thư viện state mới.
- Dùng React state + API helper; backend lưu mỗi project vào một file JSON, ghi atomic và khóa cập nhật theo project.
- Không copy `.env`, `node_modules`, `dist`, script `clean` nguồn (có thể xóa backend `server.js`). Giữ script `eval`; thêm dev/build/typecheck cần thiết.
- Không publish, tự rewrite toàn văn hoặc suy đoán tác giả AI. Chỉ sửa khi người dùng chấp nhận.
- “Tối giản” nghĩa là ít thành phần và tái sử dụng code, không bỏ hành vi bắt buộc. Mọi gate dưới đây phải được kiểm tra; thiếu key/data thật thì ghi phần chưa nghiệm thu, không đánh dấu hoàn tất toàn bộ.

## 2. UI bắt buộc

Hai điểm vào: **Tìm nguồn và viết kịch bản** / **Rà soát kịch bản có sẵn**.

### Ưu tiên đặc biệt: người dùng hiểu ngay và biết bước tiếp theo

- Người dùng chính là người viết và giảng viên, không phải developer. Mỗi màn có tiêu đề theo công việc, một câu hướng dẫn, một hành động chính nổi bật; hành động phụ ít nổi bật hơn. Không cần onboarding dài để bắt đầu.
- Research dùng bước dễ hiểu: **Nhập bài học → Chọn tài liệu → Xem kịch bản → Duyệt và tải về**. QA: **Dán kịch bản → Xem góp ý → Chọn sửa → Tải về**. Đang tìm/viết là trạng thái trong bước, không tăng thêm màn không cần thiết.
- Nhãn người dùng: “Nguồn tài liệu”, “Đoạn làm căn cứ”, “Góp ý”, “Mức độ cần sửa”, “Chưa đủ căn cứ”, “Chỉ ảnh hưởng cách đọc”. Không dùng claim, evidence, finding, eligibility, revision, provider hoặc agent trong luồng chính.
- Tóm tắt ngắn trước chi tiết: “Có 3 chỗ cần xem lại”, “Đã chọn 2 tài liệu”, “2 câu cần cập nhật”. Không lấy bảng chỉ số/điểm số làm nội dung chính. Lý do, tiêu chí, audit và trace mở khi cần.
- Trạng thái nguồn phân biệt rõ: “Có thể dùng” là kết quả đánh giá, “Bạn đã chọn” là quyết định người dùng. Trạng thái câu: “Có căn cứ”, “Cần kiểm tra thêm”, “Các tài liệu chưa thống nhất”; có giải thích ngay bên cạnh, không chỉ badge màu.
- Với mỗi góp ý chỉ cần đọc: **Đoạn nào → Vì sao → Sửa thành gì**; nút “Chấp nhận sửa” / “Giữ nguyên”, có “Hoàn tác”. Có nguyên văn trước/sau và không ép chấp nhận tất cả.
- Chọn citation mở đúng đoạn gốc ngay, không bắt đi qua bảng nguồn/fact trung gian. Chọn góp ý đưa tới đúng câu, giữ vị trí khi đóng panel. Desktop một panel chi tiết tại một thời điểm; mobile dùng sheet/dialog dễ đóng.
- Loading nói việc thật: “Đang đọc tài liệu… Đã đọc 2/4”; partial nói phần đã có. Lỗi nói cách xử lý: “Không đọc được trang này. Chọn tài liệu khác hoặc thử lại.” Khi thiếu cấu hình, hướng dẫn liên hệ người quản trị, không yêu cầu biên tập viên sửa `.env`.
- Nút bị khóa có lý do: “Chọn ít nhất một tài liệu trước khi viết”. Khi bỏ nguồn, hiện câu ảnh hưởng và nút “Cập nhật 2 câu”; các câu không liên quan giữ nguyên. Không chuyển bước bất ngờ hoặc mất nội dung nhập.
- QA văn sạch nói “Chưa thấy vấn đề cần sửa”; nếu chưa kiểm chứng factual thì ghi riêng “Chưa kiểm tra nguồn thông tin”. Không để người dùng hiểu rằng văn trôi chảy đồng nghĩa nội dung đúng.
- Khi tải về, nói rõ “Bản nháp — còn 2 câu cần kiểm tra” hoặc “Bản đã duyệt”. Tài liệu mẫu có nhãn xuyên suốt; không lẫn với nghiên cứu thật.
- Gate UX: người thử lần đầu xác định được việc cần làm tiếp theo trên mỗi màn mà không đọc tài liệu kỹ thuật; hoàn thành hai luồng với tối thiểu thao tác, hiểu được vì sao có góp ý và cái gì đã được sửa. Nếu còn phải giải thích miệng cách dùng, sửa nhãn/bố cục trước khi thêm tính năng.

| Màn hình | Tái sử dụng / hành vi |
|---|---|
| Nhập bài học | `Step1Input`: chủ đề, mục tiêu, người học, thời lượng phút; validate theo trường |
| Tìm và duyệt nguồn | `Step2Sources`: stream tiến trình, metadata, tiêu chí/lý do, quote; thêm URL, giữ/loại; người dùng duyệt trước khi viết |
| Kịch bản | `Step3Script`: cảnh, lời đọc, thời lượng; sửa tay, chip nguồn từng câu, rewrite câu phụ thuộc, so sánh trước/sau |
| Bằng chứng | `EvidenceModal`: đúng quote/snapshot của câu; URL, tác giả, ngày, uncertainty và mâu thuẫn |
| QA | Thêm workspace/panel: dán kịch bản, exact span, giải thích, sửa tối thiểu; lọc nhóm/mức độ/trạng thái; accept/reject/undo |
| Đọc thử | Giữ `TeleprompterModal`; SpeechSynthesis nếu có giọng Việt, báo rõ khi không có |
| Duyệt và xuất | Script Markdown theo mẫu, hồ sơ nguồn và audit JSON; phân biệt bản nháp / đã duyệt |
| Phiên làm việc | Mở lại/xóa phiên đơn giản, reload giữ quyết định; không cần trang quản lý riêng phức tạp |

Mọi màn có empty/loading/partial/error/retry/cancel, thao tác keyboard, focus rõ và mobile một cột. Nhãn tiếng Việt; trace/model để panel phụ. Thông báo nói kết quả thật và bước tiếp theo; không toast thành công chỉ vì đổi bước.

Chọn câu đồng bộ highlight/góp ý/evidence; citation chip không chồng highlight lỗi. Sửa tay có trạng thái đang lưu/đã lưu/lỗi lưu. Giữ bản gốc, cảnh báo trước khi bỏ thay đổi chưa lưu. Severity có chữ/icon; lỗi form gắn với input, modal quản lý focus và Escape. Không báo văn sạch nếu QA chưa chạy xong hoặc thất bại.

Các lỗi UI nguồn phải sửa: import `src/data/defaultData` hiện thiếu; logic cố định nguồn C/câu 3; state approval giả. Thay bằng state trống, fixture có nhãn và dữ liệu API. Giữ Header/Stepper/Toast, mở rộng props tối thiểu.

## 3. Source, dữ liệu và API tối thiểu

Tận dụng file hiện có, chỉ thêm module khi cần tách trách nhiệm:

- `ui/src/`: component nguồn + `QAWorkspace`, `api.ts`; không chia thêm cây module lớn.
- `src/research.js`: search API và gom nguồn; `scrape.js` giữ fetch/snapshot.
- `src/projects.js`: lưu project/revision/audit; `pipeline.js` tách research/generate/review/rewrite.
- `llm.js`, `prompts.js`, `rules.js`: schema, prompt giới hạn và kiểm tra đầu ra.
- `server.js`: API và static build. Vite root `ui/`, output `ui/dist/`; dev cổng 3000 proxy `/api` tới backend 5173. Backend phục vụ build, fallback SPA không áp dụng cho `/api`.

Project chứa: brief, revision, sources, claims, sentences, findings, audit, trạng thái run.
Source chứa: ID, URL, metadata, snapshot/hash, quote, tiêu chí/lý do, eligibility và approval riêng.
Evidence chứa: ID, source ID, snapshot hash, quote nguyên văn và vị trí trên snapshot; một nguồn có nhiều evidence.
Claim chứa: ID, mệnh đề/giá trị/đơn vị/thời kỳ/phạm vi, evidence IDs, nhóm nguồn độc lập, trạng thái supported/conflicting/insufficient. Câu chuyển tiếp không chứa claim được đánh dấu riêng.
Sentence chứa: ID ổn định, scene, text/revision, claim/evidence IDs.
Finding chứa: ID, sentence/revision, quote/start/end UTF-16, category/severity, semantic hoặc pronunciation, lý do, uncertainty, gợi ý và decision.
Audit chứa: thời gian, actor, action, target/revision, trước/sau.

API: `GET/POST /api/projects`, `GET/DELETE /api/projects/:id`, `POST /api/projects/:id/action`.
Action enum: research, add-source, approve-sources, generate, review, decision, edit-sentence, rewrite, cancel. Validate payload và revision theo action; không dùng dispatcher thực thi hàm tùy ý. Mutation do server quyết định, không tin approval/evidence/dependency client gửi lên. Export có thể tạo từ project snapshot server trả về, không cần dịch vụ riêng.

`approve-sources` nhận quyết định giữ/loại theo source ID, server ghi audit và approval revision. Thêm/đổi/loại nguồn làm mất hiệu lực approval của tập nguồn cũ; generate/rewrite kiểm tra lại. `decision` nhận accept/reject/undo theo finding ID; không nhận text thay thế tùy ý. Project ID do server tạo, validate trước dùng làm filename; chặn path traversal, giới hạn body/text/URL và method phù hợp. Dùng request ID chống double-click áp dụng sửa hoặc tạo run hai lần; revision conflict trả 409, lỗi input 400, missing config có mã rõ.

Dùng NDJSON cho tác vụ dài; event có run ID/sequence. Lưu tiến trình đã hoàn thành, hủy qua AbortController; xử lý dòng JSON dở và lỗi từng bước. Không thay `process.env` để bật stub theo request. Giữ wrapper/exports cũ phục vụ eval.

Mỗi project chỉ có một run ghi dữ liệu tại một thời điểm; không giữ khóa file suốt lời gọi mạng. Kết quả về muộn sau cancel/edit không được ghi đè revision mới. Reload lấy state từ GET; nếu stream mất, poll GET có giới hạn khi run còn chạy. Restart server chuyển run dang dở sang interrupted, cho retry bước chưa xong. Xóa project hủy run và xóa snapshot/audit/cache riêng; dữ liệu runtime không commit repo.

## 4. Agent, research và giảm hallucination

- GPT: `LLM_PROVIDER=openai`, `LLM_MODEL=OPENAI_MODEL=gpt-4.1-mini`, temperature 0.2; giữ secret server. Model là baseline cần đo, temperature thấp không bảo đảm đúng.
- Search: một adapter API JSON, dự kiến Tavily; kiểm tra docs/cấu hình lúc execute. Thiếu key thì báo rõ, QA và URL thủ công vẫn dùng được; không âm thầm fallback fixture.
- Luồng: tối đa 3–5 truy vấn Việt/Anh → 8 URL ứng viên → fetch/chấm → chờ người duyệt → viết → validate evidence → QA khi người dùng chọn.
- Tiêu chí nguồn: tác giả/thẩm quyền, bằng chứng, mới, liên quan, độc lập. Không biết metadata thì ghi không xác định; đọc thất bại không được coi là evidence.
- Freshness theo chủ đề/ngày cập nhật; kiến thức nền cũ không tự bị coi sai. Nêu nguồn bị thay thế và lý do; giữ ngưỡng baseline đã chốt cho eval lịch sử. Chuẩn hóa URL và nhận diện đăng lại; 404/login/paywall/trang không bóc được text trả trạng thái riêng. Tôn trọng điều khoản/bản quyền, chỉ lưu/trích nội dung cần thiết theo scope project.
- Số liệu quan trọng cần hai nguồn độc lập; trang đăng lại không tính độc lập. So claim theo chỉ số/đơn vị/thời kỳ/phạm vi; mâu thuẫn hoặc thiếu nguồn thì chưa xác minh.
- Mỗi prompt một nhiệm vụ: queries, assess-source, write, review hoặc verify. Input dữ liệu tách khỏi system/developer; output strict JSON Schema + server validation. Có ví dụ văn sạch, thiếu evidence và injection. Không yêu cầu output chain-of-thought.
- Writer chỉ dùng evidence được duyệt; không bịa URL, quote, số, tên hay ví dụ. Server kiểm tra ID, quote khớp snapshot và span khớp revision; exact quote chưa đủ chứng minh nghĩa.
- Verify claim theo batch một lượt; số/tên/đơn vị kiểm bằng code, hỗ trợ ngữ nghĩa kiểm bằng verifier khi cần. Không gọi riêng từng câu; verifier cũng cần eval người chấm.
- Claim không đạt: sửa tối đa một lần trong deadline hoặc ghi chưa đủ căn cứ. Không hiển thị nhãn verified cho nội dung chưa hỗ trợ.
- QA đủ tám nhóm: sai nghĩa/sắc thái, translationese, câu dài, lặp/filler, register, claim thiếu căn cứ, số/acronym/URL/tên/code-switch khó đọc, pronunciation-only.
- QA không có nguồn chỉ kết luận văn nói; factual accuracy ghi chưa kiểm tra nguồn. Findings có thể rỗng. Confidence tự báo không là xác suất đúng; không hiển thị % chưa calibration.
- Có nút “Tìm nguồn kiểm chứng” cho claim/câu trong QA; chỉ chạy khi người dùng chọn, dùng chung research và duyệt nguồn, không bắt QA văn nói chờ web. Phản hồi thiếu/mâu thuẫn evidence kèm hành động tiếp theo; không dùng tri thức nhớ sẵn để gắn verified.
- Exact span lặp phải xác định occurrence/ngữ cảnh; span chồng hoặc revision cũ không áp dụng mù. Sửa câu làm finding/citation cũ cần kiểm lại.
- Loại nguồn: tính dependency source→claim→sentence; chỉ rewrite câu bị ảnh hưởng, các câu còn lại giữ từng chữ. Hết evidence thì yêu cầu nguồn thay thế.
- Bản đã duyệt chặn claim/lỗi blocking; bản nháp được xuất với cảnh báo. Click duyệt không thay thế kiểm chứng.
- Writer bám mục tiêu/người học/thời lượng, văn nói tự nhiên, mỗi ý một cảnh. Ước tính thời lượng từ lời đọc với tốc độ cấu hình được và ghi là ước tính; không cố định mọi video thành năm câu. Mẫu tạm tối thiểu gồm cảnh, thời lượng, lời đọc, gợi ý hình và nguồn; dùng template ban tổ chức khi có.
- Export snapshot hiện hành gồm script, hồ sơ nguồn/quote/tiêu chí, trạng thái claim và audit trước/sau. Nhãn “đã duyệt” chỉ khi có hành động duyệt cuối từ người dùng, không tự gắn sau QA; dùng `decision` target project cho bước này, revision đổi thì phải duyệt lại. Pronunciation-only lưu hướng dẫn đọc riêng, không tự sửa nghĩa lời viết.

## 5. Chống injection và bảo vệ dữ liệu

- Web, metadata, snippets và kịch bản dán là dữ liệu không tin cậy; không được thay prompt, tool hoặc quyền duyệt. Regex chỉ là lớp bổ sung.
- Code điều phối search/fetch; model không có shell, file tùy ý, gửi thông tin ra ngoài hoặc publish. Cách ly nguồn có lệnh độc hại, tiếp tục nguồn sạch.
- URL chỉ http/https công khai; chặn localhost/private/link-local, kiểm tra DNS/redirect, trần tải và timeout. Không vượt login/paywall.
- React escape nội dung; không render HTML nguồn tùy ý; chặn javascript URL. Không expose key, raw trace chứa tài liệu hoặc stack lỗi cho client.
- Lưu/cache tách project; approval không dùng chung. Local bind loopback; nếu mở nhiều người dùng, ownership/auth cho project/trace/export là điều kiện trước deploy.
- Test giả system role, comment/metadata, Unicode/Việt/Anh, exfiltration, false approval và benign bài giảng về injection. Không tuyên bố an toàn 100%.

## 6. Tốc độ và token

- LLM concurrency toàn server tối đa 4, gap 0 theo quota; tối đa 1 retry lỗi tạm thời, không retry cấu hình sai. Retry-After phải nằm trong deadline.
- Deadline khởi đầu: research 45s, QA 30s, draft 40 câu 45s; timeout từng call không vượt thời gian còn lại. Hết deadline trả partial rõ ràng.
- Rule chạy ngay, fetch/chấm song song; accept/reject không gọi model. Chỉ QA/verify lại câu thay đổi, giữ ngữ cảnh khi cần.
- Prompt gửi evidence cần dùng, không toàn bộ trang/lịch sử. Giới hạn output theo nhiệm vụ; giữ prefix/schema ổn định. Cache theo nội dung+brief+model/prompt/policy version, TTL theo chủ đề; không cache approval chung.
- Stream từng nguồn/câu sau validate; không tính raw token/loading là câu trả lời đúng. UI cập nhật tối thiểu, giữ scroll/focus.
- NDJSON hiện có stream trạng thái ứng dụng, không mặc định là token streaming GPT. Nếu model trả một JSON object, chờ parse/validate rồi mới phát câu; chỉ bổ sung LLM streaming nếu benchmark chứng minh cần, không hiển thị JSON dở. Giữ draft chưa verify ở trạng thái chờ kiểm chứng.
- Mục tiêu: phản hồi UI <200ms, status đầu <1s; research p50≤25s/p95≤45s; QA 40 câu p50≤15s/p95≤30s; draft 40 câu p50≤30s/p95≤45s.
- Đây là mục tiêu cần đo; so cold/warm và 1/4 run đồng thời, queue/timeout/usage. Báo thời gian first useful validated result và complete result riêng; loại thời gian human approval khỏi latency backend.

## 7. Evaluation và dữ liệu

Baseline hiện có: 24/28 case đạt, 85,7%; còn vi phạm điều kiện cứng. Sửa G25 tên đầu câu, G26 injection khác mẫu, G27 năm trùng che mâu thuẫn, G28 xưng hô cuối câu. Không sửa nhãn/hạ ngưỡng để đạt; giữ report lịch sử.

Thêm dữ liệu theo phần: ≥10 QA case lỗi phủ taxonomy, đoạn sạch người viết có provenance, fixtures injection/conflict/404/login/stale/đăng lại/thiếu tiếng Việt và ≥3 chủ đề live chưa có fixture. `data/` hiện chỉ thấy README; không tự tạo transcript rồi ghi là dữ liệu thật. Thiếu template ban tổ chức thì ghi mẫu tạm.

Golden labels tối thiểu có ID, provenance synthetic/human/public/data-pack, sentence/span/category/severity, evidence/status và người duyệt nhãn. Chấm thủ công một phần bởi hai người và giải quyết bất đồng. Các ngưỡng rate chỉ được báo kèm số mẫu; một đoạn sạch hoặc vài attack là demo, không đủ khẳng định rate trên thực tế.

Tách dev/held-out theo tài liệu/chủ đề; model judge không là ground truth duy nhất. Chạy held-out live ≥3 lần và stub regression riêng. Không tune bằng held-out. Mở rộng mẫu khi cần chứng minh rate; không ép tạo data pack lớn trước khi có lát cắt hoạt động.

| Metric | Định nghĩa | Mục tiêu |
|---|---|---|
| Precision QA | TP/(TP+FP), matching một-một sentence/category/exact span | ≥90% |
| Recall quan trọng | TP/(TP+FN) trên lỗi severity cao | ≥80% |
| FPR sạch | câu sạch có finding sai / tổng câu sạch | ≤5% |
| Citation integrity | quote khớp snapshot / tổng quote hiển thị | 100%, hard gate |
| Support precision | claim gắn supported thực sự được evidence hỗ trợ / tổng claim gắn supported | ≥95% |
| Hallucination | claim unsupported trình bày như sự thật / tổng claim factual output | ≤5%; không sai claim ảnh hưởng cao trong test |
| Injection success | attack đạt mục tiêu trái quyền/rò dữ liệu/đổi output / tổng attack | 0 quan sát, hard gate |
| Benign block | benign bị chặn sai / tổng benign | ≤5% |
| Chất lượng gợi ý | gợi ý giữ nghĩa/giọng và giải quyết lỗi / tổng gợi ý người chấm | ≥90% |

Coverage = claim yêu cầu được hỗ trợ / tổng claim factual yêu cầu; báo accuracy của abstention theo nhãn đủ/thiếu evidence để tránh đạt precision bằng từ chối tất cả. UX thử ít nhất 5 người mục tiêu với research→duyệt→citation→loại nguồn và QA→sửa→undo→export; báo completion/time/lỗi thao tác, mục tiêu completion≥90% trên số lượt thử được ghi rõ. Review giọng văn, thời lượng và format của draft 40 câu bằng người chấm, không chỉ kiểm JSON.

Báo counts, coverage, abstention, từng taxonomy và khoảng tin cậy khi phù hợp; mẫu số 0 là N/A. Pass rate không gọi accuracy. Test nhỏ phải ghi hạn chế; ≥20 lượt latency là thăm dò, p95 cần ≥100 lượt đại diện hoặc ghi độ tin cậy thấp. Report JSON/Markdown mới ghi dataset/model/prompt version, latency, usage và failures. Không đổi tốc độ lấy chất lượng dưới gate.

## 8. Thứ tự execute và tiết kiệm context

1. Đọc file này, package đích, UI nguồn và exports cần dùng; baseline eval. Không đọc toàn repo hoặc in `.env`/secret.
2. Copy UI vào đích; sửa import thiếu, build/proxy/types. Gate: frontend build/typecheck, backend/eval vẫn chạy.
3. Nối research và source approval thành lát cắt end-to-end nhìn thấy được; thêm storage JSON/revision. Gate: chủ đề mới tìm web thật, chưa duyệt không viết.
4. Nối draft/citation/rewrite. Gate: quote đúng, nguồn bỏ không còn hỗ trợ; câu không ảnh hưởng giữ nguyên.
5. Thêm QA độc lập, đủ finding/actions/read-aloud fallback/export. Gate: accept/reject/undo/reload đúng; mobile/keyboard/error/partial đầy đủ.
6. Hoàn tất regression/data/eval live/security/benchmark; README gồm lệnh dev/build/eval, biến cấu hình được hỗ trợ, chi phí dựa usage và giới hạn thực tế. Từ bước 1 chạy baseline deterministic; sửa G25–G28 và test security/output validation ngay khi sửa module liên quan, không dồn kiểm tra bảo mật về cuối.

Mỗi bước chỉ đọc/sửa file liên quan; dùng `rg` và batch đọc độc lập. Check cần thiết một lần, chạy lại khi code đổi hoặc có failure. Không sinh test mirror UI/CSS. Không phân tách thêm module hoặc viết lại component đã đủ dùng.
Ghi checklist tiến độ ngắn ngay dưới đây khi execute để resume không phải đọc lại mọi log. Docs chỉ tra API đang tích hợp, lấy nguồn chính thức; không research lan man. Hoàn tất từng lát cắt trước khi thêm tối ưu. Nếu thiếu key/data, tiếp tục phần độc lập và báo cụ thể, không giả kết quả đạt.

### Checklist thực thi

- [ ] UI kế thừa build/chạy trong đích
- [ ] Research thật và duyệt nguồn
- [ ] Draft/citation/rewrite đúng dependency
- [ ] QA/undo/reload/read-aloud/export
- [ ] Regression, injection, accuracy và latency report
- [ ] README và giới hạn thực tế

Tài liệu khi cần: [schema](https://developers.openai.com/api/docs/guides/structured-outputs), [agent safety](https://developers.openai.com/api/docs/guides/agent-builder-safety), [latency](https://developers.openai.com/api/docs/guides/latency-optimization). Schema/prompt giúp giảm rủi ro, không thay kiểm chứng nội dung.
