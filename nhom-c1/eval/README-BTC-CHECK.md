# Kiểm tra Eval theo BTC — CP3/R4

File này không tạo thêm golden case. Nó kiểm tra trực tiếp bộ hiện có:

- `golden_set.json`: cấu trúc và coverage case.
- `run_results.json`: kết quả lượt chạy gần nhất.

## Chạy

Từ thư mục `nhom-c1`:

```powershell
node eval/verify-btc-eval.js
```

Script kiểm tra đúng các điểm BTC yêu cầu cho CP3/R4:

1. Golden set có ít nhất 20 case.
2. Mỗi lớp chỗ khó ①②③④ có ít nhất 2 case.
3. Có 8–10 case thường và 2–4 case hiếm.
4. Có ít nhất 10 case lấy hoặc phát triển từ dữ liệu thật, ghi mã nguồn ở trường `nguon_du_lieu`.
5. Kết quả chạy phủ đủ mọi case trong golden set.
6. Tổng số case và tỷ lệ phần trăm trong kết quả khớp với các case đã chạy.
7. Quality bar là một tỷ lệ phần trăm rõ ràng.

## Cách đọc kết quả

- `✓`: điều kiện đã đáp ứng.
- `✗`: chưa đáp ứng; không sửa quality bar để biến thành đạt.
- Script trả exit code `1` khi còn điều kiện chưa đạt, để nhóm không vô tình quay video/ghi slide với bộ eval thiếu.

## Trạng thái ban đầu

Khi thêm file này, golden set hiện có 28 case với coverage 4/4/4/4, 9 case thường và 3 case hiếm.
Script sẽ báo các thiếu sót còn lại dựa trên `golden_set.json` và `run_results.json` thực tế, thay vì ghi tay.
