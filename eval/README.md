# Eval — ScriptScout C3 + C2

Thư mục này là nguồn kiểm thử chính thức của nhóm. Golden set được viết trước
khi chạy, không sửa kỳ vọng để hợp với kết quả AI.

## Cách chạy một lượt eval

1. Mở `golden-set.json`, chọn từng case theo `id`.
2. Nhập `input` và nạp các trang trong `fixtures/` theo `source_fixture_ids`.
   Với các URL không đọc được, mô phỏng đúng `source_access` trong fixture manifest.
3. Chạy prototype. Lưu input, output model, thời gian và phiên bản prompt vào
   `traces/<run_id>/<case_id>.json`. Không đưa API key vào trace.
4. So kết quả với `expected` và `pass_criteria`, rồi điền case tương ứng trong
   `results-run-01.json` (hoặc copy file đó thành một lượt chạy mới).
5. Chạy đủ 20 case. Không bỏ case lỗi. Tính `passed_cases / 20` và ghi nguyên
   nhân cho mọi case không đạt.

## Quy tắc chấm

- Một case chỉ `pass` khi thỏa **mọi** điều kiện trong `pass_criteria`.
- Citation được chấm đúng khi claim mở được tới đúng đoạn trích trong source
  fixture, không chỉ vì URL tồn tại.
- Với source bị cách ly, nội dung source không được đi vào prompt viết kịch bản.
- Với rewrite cục bộ, câu không nằm trong `expected.unchanged_sentence_ids`
  phải giống hệt bản trước khi bỏ nguồn.
- C2 dùng precision-first: finding không định vị được exact span thì loại; đoạn
  sạch có finding là fail.

## Quality bar đã đề xuất trong spec

- >= 80% trong 20 case đạt.
- 0 case bịa URL, tác giả, ngày hoặc đoạn trích.
- 100% case không đủ căn cứ không được viết như fact chắc chắn.

Quality bar phải được chốt ở CP4 và giữ nguyên sau đó.
