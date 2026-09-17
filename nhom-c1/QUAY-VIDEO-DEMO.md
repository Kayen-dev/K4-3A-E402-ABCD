# Quay video demo 30 giây cho CP3

CP3 đòi **video thao tác 30 giây** cho thấy AI chạy thật, kèm **số đo**.

## 1 · Mở sản phẩm

```powershell
cd nhom-c3
node codebase/server.js
```

Mở trình duyệt vào **http://localhost:5173**

Nhãn góc trên phải phải hiện **`AI thật · gemini`** màu xanh. Nếu hiện `đáp án dựng sẵn · stub`
thì khoá chưa vào — chạy `node codebase/kiem-tra-khoa.js` để xem vướng đâu.

## 2 · Quay màn hình

Windows có sẵn, không cần cài gì:

| Phím | Việc |
|---|---|
| `Win + Alt + R` | bắt đầu / dừng quay |
| `Win + G` | mở bảng Game Bar nếu lần đầu dùng |

File lưu ở `C:\Users\Admin\Videos\Captures\`.

Game Bar chỉ quay **một cửa sổ**, không quay được desktop — nên bấm vào cửa sổ trình duyệt
cho nó active rồi mới bấm `Win + Alt + R`.

## 3 · Kịch bản 30 giây

Chạy thử một lượt TRƯỚC khi quay, để lúc quay không phải chờ và không bấm nhầm.

| Giây | Làm gì | Chứng minh điều gì |
|---|---|---|
| 0–4 | Form đã điền sẵn, trỏ vào nhãn **`AI thật · gemini`**, bấm **Chạy pipeline** | Có lời gọi AI thật, không hardcode |
| 4–12 | Để bản ghi bên phải chạy — chỉ vào dòng `n03 -> loai · 2 chỉ thị ẩn đã cách ly` | Chỗ khó lớp ③, code chặn trước khi model thấy |
| 12–18 | Cuộn tới thẻ **n03**, dừng ở khối đỏ hiện nguyên văn lệnh ẩn kèm *"Không thi hành"* | Chữ trên trang là dữ liệu, không phải lệnh |
| 18–24 | Cuộn tới thẻ **n04** — nhãn `dùng · cảnh báo`, lý do *"đã 28 tháng, vượt ngưỡng 18 tháng"* | Nguồn quá hạn thì cảnh báo chứ không vứt |
| 24–30 | Xuống kịch bản, bấm chỗ tô đỏ ở **câu 4** — panel hiện *"Con số 12 lấy từ t03, mà t03 đang CHƯA XÁC MINH"* | Khâu soát tra vào hồ sơ nguồn — chỗ ghép C2 vào C3 |

Đoạn 24–30 là đoạn đáng giá nhất. Nếu chỉ kịp quay một thứ thì quay đoạn đó.

## 4 · Nếu chạy quá chậm để quay trong 30 giây

Với khoá thật, AI 2 được gọi **một lần cho mỗi nguồn đọc được** — 8 nguồn thì mất khoảng
20–40 giây, dài hơn video.

Ba cách xử lý, chọn một:

1. **Bấm Chạy, chờ xong, rồi mới bắt đầu quay.** Quay từ lúc kết quả đã hiện, thao tác cuộn và
   bấm finding. Vẫn là AI thật, chỉ không quay phần chờ. Cách này gọn nhất.
2. **Quay hai đoạn rồi ghép**: 10 giây lúc bấm chạy + 20 giây thao tác trên kết quả.
3. **Bật chế độ trang bẫy** (nút trên form) — vẫn gọi AI thật để chấm nguồn, nhưng đọc trang
   từ đĩa nên không mất thời gian tải. Nhanh hơn hẳn.

## 5 · Số đo nộp kèm

```powershell
node eval/run.js
```

In ra bảng, đồng thời ghi `eval/run_results.md`. Nộp cả file đó.

Con số hiện tại: **24/28 = 85,7%**, quality bar 80% — đạt, nhưng **vi phạm điều kiện cứng** vì
case G26 thuộc lớp ③ thất bại. Nói thẳng điều này khi trình bày: rubric ghi rõ *"kết quả thấp
không ảnh hưởng — cần ghi nhận đầy đủ, trung thực"*, còn giấu số thì không được tính điểm.

## 6 · Soát trước khi nộp

- [ ] Nhãn trong video hiện `AI thật · gemini`, không phải `stub`
- [ ] Video dưới 35 giây
- [ ] `eval/run_results.md` có ngày chạy và dòng `Provider: gemini`
- [ ] `codebase/traces/` có file JSON của lượt chạy đó
- [ ] `.env` KHÔNG xuất hiện trong `git status`
