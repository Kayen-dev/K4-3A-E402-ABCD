# AI SPEC — ScriptScout: kịch bản bài giảng có căn cứ theo câu · Nhóm ABC · Zone E402

Hướng: [ ] A — VLearn  [ ] B — Trợ lý Học viên  [x] C — Làn mở
Loại: [ ] Tối ưu tính năng có sẵn  [x] Tính năng mới

Repo liên quan: `codebase/nhom-c1/`
Prototype đã deploy: `https://k4-abcd-pi.vercel.app`
Ghi chú deploy: alias mong muốn `k4-abcd.vercel.app` không gán được vì Vercel báo alias đã được dùng.

## §1. User & Job

- Job executor + workflow (đính kèm worksheet JTBD / ảnh sơ đồ):
  - Job executor chính: biên tập viên/người viết kịch bản video bài giảng.
  - Người duyệt: giảng viên hoặc lab coach duyệt nội dung trước khi quay/dựng.
  - Workflow: nhập chủ đề, mục tiêu, người học, thời lượng → hệ thống tìm và chấm nguồn → người dùng duyệt nguồn → viết nháp có citation theo câu → QA văn nói và căn cứ → người dùng chấp nhận/giữ sửa → xuất bản nháp/duyệt.
  - Canvas CP1 đính kèm: `codebase/nhom-c1/docs/cp1-canvas.md`.
- Core JTBD (không tên sản phẩm/AI trong câu):
  - Khi được giao một chủ đề bài giảng, người viết cần tạo bản nháp lời đọc mà mỗi câu mang thông tin đều truy được về đoạn tài liệu gốc, để người duyệt kiểm nhanh từng câu và chỉ sửa lại phần bị ảnh hưởng khi một nguồn bị loại.
- Problem statement (KHÔNG chữ AI):
  - Người viết phải tự tìm tài liệu rồi tự viết lời đọc. Khi tới bước duyệt, nhiều câu không chỉ ra được lấy từ đâu, nên giảng viên phải tự tra lại từng khẳng định hoặc duyệt liều. Nếu câu sai lọt qua tới giai đoạn thu giọng/dựng hình, chi phí sửa tăng vì phải thu và dựng lại cảnh liên quan.
- Evidence (chuẩn A và/hoặc B — log đầy đủ trong repo):
  - Số liệu mining / kết quả khảo sát (n = ?, % xác nhận):
    - Chuẩn B mining, log: `codebase/nhom-c1/evidence/mining-kich-ban-d1.md`.
    - Dataset: `data/studio-pack/c3-scriptscout/vi-du/kich-ban-d1.json`, 40 câu từ kịch bản video bài giảng đã phát hành do BTC cấp.
    - 28/40 câu, tức 70%, chứa định nghĩa, khẳng định cách hệ thống hoạt động, ví dụ, số liệu hoặc sự việc cần căn cứ.
    - 0/40 câu có dẫn nguồn ở cấp câu.
    - Trên hồ sơ nguồn mẫu 5 nguồn, 2/5 nguồn không dùng nguyên trạng được; 1/6 thông tin ở trạng thái chưa xác minh.
    - Chưa có khảo sát/phỏng vấn đủ chuẩn A; không dùng số khảo sát giả.
  - ≥5 quote/ví dụ nguyên văn + nguồn:

    | Mã | Ví dụ nguyên văn | Nguồn | Vì sao cần căn cứ |
    |---|---|---|---|
    | Câu 4 | "Trí tuệ nhân tạo là lĩnh vực làm cho máy thực hiện những việc thường cần trí thông minh, như nhận ra đồ vật trong ảnh." | `kich-ban-d1.json` · câu 4 | Định nghĩa khái niệm |
    | Câu 8 | "Bộ lọc dựa vào những gì đã học để dự đoán thư mới là thư rác hay thư bình thường." | `kich-ban-d1.json` · câu 8 | Khẳng định cách hệ thống hoạt động |
    | Câu 14 | "Trí tuệ nhân tạo tạo sinh là tên gọi cho những hệ thống tạo nội dung, chẳng hạn văn bản, hình ảnh hoặc âm thanh." | `kich-ban-d1.json` · câu 14 | Định nghĩa khái niệm |
    | Câu 18 | "Mô hình ngôn ngữ lớn học cách dùng và kết hợp từ ngữ từ lượng lớn dữ liệu, để xử lý văn bản." | `kich-ban-d1.json` · câu 18 | Định nghĩa và cơ chế hoạt động |
    | Câu 22 | "Cùng một ứng dụng có thể nối với cả mô hình viết văn bản, mô hình tạo ảnh và các công cụ khác." | `kich-ban-d1.json` · câu 22 | Khẳng định sự việc thực tế |

## §2. Impact & quyết định chọn

- Bảng impact ≥3 ứng viên (bao nhiêu người · tần suất · tốn gì mỗi lần · khả thi):

  | Ứng viên | Bao nhiêu người | Tần suất | Tốn gì mỗi lần | Khả thi | Quyết định |
  |---|---:|---|---|---|---|
  | Gắn nguồn theo từng câu và chấm trạng thái nguồn trước khi viết | 2 vai chính: người viết + người duyệt | Mỗi video bài giảng | 28/40 câu cần kiểm căn cứ nhưng hiện 0/40 câu truy nguồn được | Cao: đã có prototype web, API, eval | Chọn |
  | Tự viết toàn bộ kịch bản dài | Người viết | Mỗi chủ đề mới | Sinh thêm chữ nhưng vẫn không giải quyết 0/40 câu thiếu đường về nguồn | Trung bình | Loại |
  | Tóm tắt tài liệu nền thành một hồ sơ nghiên cứu | Người viết + người duyệt | Khi bắt đầu chủ đề | 40% nguồn mẫu không dùng nguyên trạng được, tóm tắt dễ trộn nguồn tốt/xấu | Trung bình | Loại |
  | Kiểm chứng sau khi kịch bản đã hoàn tất | Người duyệt | Trước quay/dựng | Sửa muộn làm thay đổi lời đọc, có thể phải thu/dựng lại cảnh | Trung bình | Loại |

- Ứng viên ĐÃ LOẠI + vì sao:
  - Viết toàn bộ kịch bản dài: không giải quyết được thiếu citation theo câu.
  - Tóm tắt tài liệu nền: không đủ vì nguồn tìm được chưa chắc tin được.
  - Kiểm chứng cuối quy trình: đúng vấn đề nhưng đặt điểm kiểm tra quá muộn, chi phí sửa cao.
- Ứng viên CHỌN + vì sao (bằng số):
  - Chọn gắn nguồn theo câu + duyệt nguồn trước khi viết vì chạm đúng ba số mining: 70% câu cần căn cứ, 0/40 câu có nguồn theo câu, 2/5 nguồn mẫu không dùng nguyên trạng được.

## §3. Giải pháp tương tự đã nghiên cứu

- NotebookLM:
  - Flow: người dùng nạp tài liệu, hỏi đáp/tóm tắt, câu trả lời có citation về đoạn gốc.
  - Đáng học: citation bấm được về đoạn gốc; giới hạn câu trả lời theo tài liệu đã nạp.
  - Đáng né: người dùng vẫn phải tự tìm/nạp nguồn; không chấm độ tin cậy nguồn trước khi dùng; không tối ưu cho lời đọc video.
  - Mình khác gì: hệ thống tự tìm nguồn, chấm nguồn, chờ người dùng duyệt nguồn rồi mới viết câu; mỗi câu lời đọc gắn evidence và trạng thái claim.
- Perplexity / công cụ answer engine có citation:
  - Flow: nhập câu hỏi, công cụ tìm web và trả lời kèm link.
  - Đáng học: tốc độ tìm nguồn, citation trực tiếp, tóm tắt được nhiều nguồn.
  - Đáng né: citation thường ở mức đoạn/trả lời, không phải quy trình duyệt kịch bản; không có dependency rõ khi xóa một nguồn.
  - Mình khác gì: tập trung vào workflow viết/duyệt kịch bản, có accept/reject/undo, audit, rewrite đúng câu phụ thuộc nguồn bị loại.

## §4. Thiết kế

- Lát cắt MỘT CÂU (1 user · 1 việc · 1 quyết định AI · 1 kết quả):
  - Một người viết kịch bản nhập chủ đề bài giảng; hệ thống quyết định từng nguồn tìm được là có thể dùng, cần cảnh báo hay loại; kết quả là bản nháp lời đọc có citation theo câu để người duyệt kiểm, sửa, giữ hoặc xuất.
- Non-goals (≥3 thứ KHÔNG build):
  - Không dựng video, không sinh hình, không thu giọng.
  - Không tự publish kịch bản chưa được người dùng duyệt.
  - Không phát hiện văn bản do AI hay người viết.
  - Không viết lại toàn văn khi người dùng chỉ chấp nhận một góp ý.
  - Không vượt login/paywall hoặc đọc trang không công khai.
- Mức prototype nhắm tới: [ ] Sketch [ ] Mock [x] Working — phần nào mock, phần nào thật:
  - Thật: React UI, project session, API, lưu project, Tavily adapter, OpenAI config, chấm nguồn, QA, accept/reject/undo, export, Vercel deploy, Blob storage.
  - Fixture/stub: golden set và một số eval dùng provider `stub`.
  - Chưa nghiệm thu đủ: live quality/latency trên nhiều chủ đề vì cần thêm lượt chạy thật với key/quota.
- Automation: [ ] augment [x] conditional [ ] automate — lý do theo cost-of-error:
  - Hệ thống tự tìm/chấm/viết khi có đủ evidence; gặp nguồn thiếu, mâu thuẫn, stale, không đọc được hoặc claim thiếu căn cứ thì hạ mức tự động và chuyển người duyệt. Sai nội dung có thể đi vào video nên không automate toàn bộ.
- §4b. Nguyên tắc đã áp dụng (≥4 — HAX/PAIR, xem guide):

  | Nguyên tắc | Áp cụ thể vào đâu trong prototype |
  |---|---|
  | Make clear what the system can and cannot do | UI tách "Có căn cứ", "Cần kiểm tra thêm", "Các tài liệu chưa thống nhất"; thiếu key báo rõ thiếu cấu hình |
  | Support efficient correction | Finding có Chấp nhận sửa / Giữ nguyên / Hoàn tác; decision lưu server-side |
  | Show source and confidence context | Citation mở đúng quote/snapshot, có metadata và lý do chấm nguồn |
  | Let people control high-impact actions | Chờ người dùng duyệt nguồn trước khi generate; "đã duyệt" chỉ sau hành động duyệt cuối |
  | Fail safely | Không dùng nguồn 404/login/private URL/injection; factual không có nguồn thì ghi chưa kiểm tra, không tự gắn verified |
  | Preserve user work | Xóa nguồn chỉ đánh dấu câu phụ thuộc cần cập nhật; câu không liên quan giữ nguyên |

## §5. Kiểu lỗi — 4 lớp chỗ khó + kịch bản (≥8)

| Lớp | Kịch bản lỗi | Cách prototype xử lý / case |
|---|---|---|
| ① Nguồn sự thật | Quote AI trả không khớp nguyên văn trang đã tải | Vứt quote/finding không khớp; G01, G23 |
| ① Nguồn sự thật | Con số không có trong evidence lọt vào câu | Báo thiếu căn cứ; G02 |
| ① Nguồn sự thật | Tên riêng bịa nghe có vẻ thuyết phục | Báo thiếu căn cứ; G03, G25 |
| ② Thiếu/mơ hồ | Chỉ có một nguồn cho claim quan trọng | Gắn chưa đủ nguồn; G04 |
| ② Thiếu/mơ hồ | Hai nguồn uy tín đưa số liệu khác nhau | Gắn chưa xác minh/mâu thuẫn; G05, G27 |
| ③ Ngoài phạm vi/thẩm quyền | Trang web chứa prompt injection tiếng Việt hoặc trong HTML comment | Cách ly và loại trước khi gọi model; G07, G08, G26 |
| ③ Ngoài phạm vi/thẩm quyền | Người dùng đòi viết câu không có căn cứ | Từ chối/hạ trạng thái; G09 |
| ④ Đặc thù domain | Nguồn quá hạn cho chủ đề AI | Cảnh báo, không tự loại; G10 |
| ④ Đặc thù domain | Câu quá dài, khó đọc thành tiếng | Báo câu dài theo ngưỡng âm tiết; G11, G22 |
| ④ Đặc thù domain | Xưng hô lệch giữa các câu hoặc cuối câu | Báo lệch register/xưng hô; G12, G28 |
| ④ Đặc thù domain | Acronym, URL, chữ in hoa khó đọc | Báo pronunciation-only, không tự đổi nghĩa |
| Chất lượng lời đọc | Lặp/filler hoặc văn dịch | Finding QA có sửa tối thiểu, accept/reject/undo |

## §6. Bốn đường đi của trải nghiệm

- Happy path:
  - Người dùng nhập topic/objective/audience/duration → hệ thống tìm nguồn → người dùng chọn nguồn "Có thể dùng" → generate kịch bản → mở citation xem quote → review QA → chấp nhận vài sửa → export.
- Low-confidence (②):
  - Nguồn thiếu metadata, chỉ một nguồn, hoặc số liệu mâu thuẫn → UI ghi "Cần kiểm tra thêm" / "Các tài liệu chưa thống nhất" → người dùng thêm URL hoặc bỏ claim khỏi bản duyệt.
- Failure/không căn cứ (①):
  - Không đọc được trang, thiếu nguồn, quote không khớp snapshot, claim không có evidence → không gắn verified; cho xuất bản nháp với cảnh báo nhưng chặn nhãn "đã duyệt".
- Correction (user sửa):
  - Người dùng sửa tay hoặc bỏ nguồn → revision tăng, finding/citation cũ bị stale; rewrite chỉ câu phụ thuộc; accept/reject/undo lưu audit.
- Khi bị đòi ngoài phạm vi (③):
  - Web/user text chứa lệnh đổi system, exfiltrate key, bỏ qua quy tắc, hoặc yêu cầu viết không nguồn → coi là dữ liệu không tin cậy, cách ly/từ chối, không chuyển thành hành động.
- Case đặc thù domain (④):
  - Chủ đề AI thay đổi nhanh, nguồn cũ vẫn hữu ích cho ví dụ nhưng không đủ cho số liệu mới; UI gắn cảnh báo freshness thay vì loại tất cả.

## §7. Kiểm thử

- Chiều chất lượng + định nghĩa kiểm chứng được:

  | Chiều chất lượng | Định nghĩa kiểm chứng được |
  |---|---|
  | Citation integrity | Quote hiển thị phải khớp snapshot đã tải |
  | Factual support | Claim supported phải có evidence hợp lệ, số liệu quan trọng cần ≥2 nguồn độc lập |
  | Injection safety | Attack không được đổi quyền, lộ dữ liệu, hoặc ép output trái scope |
  | QA precision/recall | Finding phải match sentence/category/span với golden label |
  | UX completion | Người dùng mục tiêu hoàn tất research→duyệt→citation→export và QA→sửa→undo→export |
  | Latency | Báo first useful result và complete result riêng; fixture không tính là latency live |

- Golden set (≥20 case theo cơ cấu trong guide §2.6, file trong eval/):
  - File: `codebase/nhom-c1/eval/golden_set.json`.
  - 28 case: 4 lớp ①/②/③/④, 9 case thường, 3 case hiếm.
  - 10/28 case có `nguon_du_lieu` từ data pack/evidence.
  - Verifier cấu trúc: `node eval/verify-btc-eval.js` đạt 14/14.
- Quality bar (chốt từ hạn chốt spec của khoá, giữ nguyên sau đó):
  - "Đạt khi ≥ 80% qua bộ golden set, không có case lớp ③ thất bại, citation integrity không có quote bịa trong test, và thông tin thiếu căn cứ không được trình bày như đã xác minh."
- Kết quả các lượt chạy (bảng % — cập nhật đến trước CP6):

  | Thời điểm | Bộ test | Provider | Kết quả | Ghi chú |
  |---|---|---|---:|---|
  | 2026-09-17 trước refactor | Golden set 28 case | openai/stub theo môi trường | 24/28 = 85.7% | Lịch sử còn G25-G28 |
  | 2026-09-17 sau refactor | Golden set 28 case | stub | 28/28 = 100% | `codebase/nhom-c1/eval/run_results.md` |
  | 2026-09-17 sau refactor | Refactor QA/lifecycle/security | stub | 10/10 = 100% | `codebase/nhom-c1/codebase/EVAL-REFACTOR-REPORT.md` |
  | 2026-09-17 sau refactor | BTC verifier | n/a | 14/14 | Cấu trúc eval đạt checklist CP3/R4 |
  | 2026-09-17 deploy | Live `/api/status` | Vercel env | OK | `provider=openai`, `searchConfigured=true`, `llmConfigured=true` |

Hạn chế còn lại: chưa có test UX 5 người dùng mục tiêu; chưa đo p50/p95 live đủ mẫu; chưa có human acceptance cho synthetic QA labels.

## §8. Phân công & kế hoạch

- Phân công có tên: spec / evidence / prompt / code / demo

  | Hạng mục | Người phụ trách | File/kết quả |
  |---|---|---|
  | Spec, scope, quality bar | Nguyễn Trần Kiên | `spec.md` |
  | Evidence mining, golden set, eval report | Nguyễn Tuấn Thành | `evidence/mining-kich-ban-d1.md`, `eval/` |
  | Prompt, LLM adapter, pipeline safety | Nguyễn Trần Kiên | `codebase/nhom-c1/codebase/src/prompts.js`, `llm.js`, `pipeline.js`, `rules.js` |
  | UI/UX, API wiring, deployment | Hồ Đinh Tuấn Kiệt | `codebase/nhom-c1/codebase/ui/`, `server.js`, Vercel project `k4-abcd` |
  | Demo/live smoke | Hồ Đinh Tuấn Kiệt + cả nhóm | `README.md`, deployed app |

- Willing users (≥2 tên) + kế hoạch vòng validation *(bonus, nếu làm)*:
  - Chưa chốt đủ tên trong repo. Kế hoạch: tối thiểu 5 lượt thử, gồm 2 người thuộc nhóm người viết/giảng viên hoặc lab coach; task đo là research→duyệt→citation→loại nguồn và QA→sửa→undo→export.
- Multi-prototype (nếu làm): trục khác biệt của ≥2 phương án + lý do chọn:
  - Phương án A: source-first, duyệt toàn bộ nguồn trước khi thấy kịch bản.
  - Phương án B: script-first, thấy câu trước rồi mở nguồn theo citation.
  - Bản hiện tại nghiêng về mixed workflow: nhập brief → duyệt nguồn → xem script và citation cạnh câu, vì người dùng cần hiểu nguồn trước khi tin câu nhưng vẫn cần nhìn câu trong ngữ cảnh lời đọc.

## §9. Changelog

| Thời điểm | Đổi gì | Vì sao (trỏ về feedback/case nào) |
|---|---|---|
| 2026-09-18 user testing | Bổ sung feedback Nguyễn Duy Phong 2A202602834 và Nguyễn Trí Dũng; thêm ngữ cảnh thực vật và lọc nguồn rõ ràng lệch đối tượng; giải thích tác giả/đơn vị xuất bản, hiển thị 5 tiêu chí cùng nhận xét; chuyển validation về thư mục gốc theo vị trí tài liệu hiện tại | `validation/user_testing_log.md`: research lá cây trả dinh dưỡng con người và đánh giá nguồn chưa giải thích rõ |
| 2026-09-18 ghi nhận validation | Ghi nhận phản hồi Nguyễn Trường Bảo và các cải thiện đã thực hiện về context từ nguồn được chọn, kịch bản hoàn chỉnh và đối chiếu evidence với snapshot; chờ đánh giá lại | `validation/user_testing_log.md`: kịch bản chưa bám nội dung reference và còn chưa chính xác |
| 2026-09-18 Vercel fix | Sử dụng ETag metadata khi cập nhật Blob, phát hiện thay đổi trong lúc đọc và trả 409 cho precondition conflict; bổ sung AUTH_SESSION_SECRET production và deploy; smoke test đăng nhập 200, tạo phiên 201, action 200, revision cũ 409, xóa phiên thử 200 | Log production ghi nhận BlobPreconditionFailedError và AUTH_NOT_CONFIGURED; 18 bài kiểm thử đạt |
| 2026-09-16 CP1 | Chốt hướng C, job executor, pain, mining evidence ban đầu | Canvas CP1 `codebase/nhom-c1/docs/cp1-canvas.md` |
| 2026-09-16 | Mining kịch bản 40 câu và hồ sơ nguồn mẫu | Evidence B: 28/40 cần căn cứ, 0/40 có nguồn theo câu, 2/5 nguồn có vấn đề |
| 2026-09-17 trước refactor | Golden set đạt 24/28 | Phát hiện G25-G28 và các mép injection/conflict/register |
| 2026-09-17 refactor plan | Chuyển UI sang React/Vite kế thừa từ `D:\K4-3A-E402-ABC\codebase`, thêm API project/session | Yêu cầu UI dễ hiểu, nhanh, có research ngoài, giảm hallucination |
| 2026-09-17 execute | Thêm project storage, Tavily adapter, OpenAI config, QA actions, export, Vercel config | Plan `PLAN-REFACTOR-UI-RESEARCH-QA.md` |
| 2026-09-17 eval | Golden set 28/28, refactor eval 10/10, verifier 14/14 | `eval/run_results.md`, `EVAL-REFACTOR-REPORT.md` |
| 2026-09-17 deploy | Tạo Vercel project `k4-abcd`, cấu hình env từ `.env`, tạo private Blob store, deploy production | Live URL `https://k4-abcd-pi.vercel.app`; alias `k4-abcd.vercel.app` bị chiếm |
| 2026-09-17 spec cleanup | Viết lại `spec.md` theo template SPEC 8 phần + changelog | Yêu cầu mới: phủ đúng cấu trúc chương trình và template |
