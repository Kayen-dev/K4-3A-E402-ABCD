# Evidence B · Mining — kịch bản thật 40 câu không truy được nguồn ở cấp câu

**Ngày chạy:** 16/9/2026 · **Người làm:** Nguyễn Tuấn Thành
**Nguồn dữ liệu:** `data/studio-pack/c3-scriptscout/vi-du/kich-ban-d1.json` (kịch bản của một video bài giảng VLearn đã phát hành, 40 câu, do BTC cấp làm đích) và `data/studio-pack/c3-scriptscout/vi-du/ho-so-nguon-mau.json` (hồ sơ nguồn mẫu đã điền).

---

## Đếm 1 — Bao nhiêu câu cần căn cứ, bao nhiêu câu có dẫn nguồn

**Đếm gì:** mỗi câu trong 40 câu của kịch bản, xếp vào một trong hai nhóm.

**Quy tắc xếp loại.** Một câu là **"cần căn cứ"** nếu chứa ít nhất một trong ba thứ:

1. Định nghĩa một khái niệm kỹ thuật.
2. Khẳng định về cách một hệ thống hoạt động.
3. Ví dụ, con số hoặc sự việc thực tế.

Một câu là **"không cần"** nếu nó chỉ dẫn dắt, chuyển ý, nêu kế hoạch của video, đặt câu hỏi tương tác, chốt lại điều vừa nói bằng lời khác, hoặc là khoảng lặng.

**Kết quả:**

| Nhóm | Số câu | Tỉ lệ | Danh sách số câu |
|---|---|---|---|
| Cần căn cứ | 28 | **70%** | 2, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26, 28, 30, 31, 36, 37, 38, 39 |
| Không cần | 12 | 30% | 1, 3, 12, 13, 24, 27, 29, 32, 33, 34, 35, 40 |
| **Có dẫn nguồn ở cấp câu** | **0** | **0%** | — |

**Kiểm lại:**

```bash
cd data/studio-pack/c3-scriptscout
python3 -c "import json; d=json.load(open('vi-du/kich-ban-d1.json')); print('so cau:', len(d['cau']), '| co truong nguon:', sum(1 for c in d['cau'] if 'nguon' in c))"
# so cau: 40 | co truong nguon: 0
```

**Ghi chú về ranh giới.** BTC ghi trong `vi-du/kich-ban-co-nguon.json` rằng câu 5, 10, 12, 13 "chỉ chuyển ý hoặc dẫn dắt". Nhóm xếp câu 5 và câu 10 vào nhóm *cần căn cứ* vì hai câu này khẳng định cách một hệ thống hoạt động. Nếu theo cách xếp của BTC thì con số là 26/40 = 65%. Hai cách đều cho kết quả ≥65%. Định nghĩa sẽ được chốt lại trong `spec.md` §7 trước CP4.

## 5 ví dụ nguyên văn — câu mang thông tin nhưng không có đường truy về nguồn

| Câu | Lời đọc nguyên văn | Cần căn cứ vì |
|---|---|---|
| 4 | "Trí tuệ nhân tạo là lĩnh vực làm cho máy thực hiện những việc thường cần trí thông minh, như nhận ra đồ vật trong ảnh." | Định nghĩa khái niệm |
| 8 | "Bộ lọc dựa vào những gì đã học để dự đoán thư mới là thư rác hay thư bình thường." | Khẳng định cách hệ thống hoạt động |
| 14 | "Trí tuệ nhân tạo tạo sinh là tên gọi cho những hệ thống tạo nội dung, chẳng hạn văn bản, hình ảnh hoặc âm thanh." | Định nghĩa khái niệm |
| 18 | "Mô hình ngôn ngữ lớn học cách dùng và kết hợp từ ngữ từ lượng lớn dữ liệu, để xử lý văn bản." | Định nghĩa + khẳng định cách hoạt động |
| 22 | "Cùng một ứng dụng có thể nối với cả mô hình viết văn bản, mô hình tạo ảnh và các công cụ khác." | Khẳng định về sự việc thực tế |

Không câu nào trong năm câu trên có trường `nguon`. Người duyệt muốn kiểm "câu này lấy ở đâu" thì phải tự đi tra lại từ đầu.

---

## Đếm 2 — "Tìm được" khác "tin được"

**Đếm gì:** trên hồ sơ nguồn mẫu do BTC cấp (5 nguồn, 6 thông tin), đếm số nguồn và số thông tin không dùng nguyên trạng được.

| Mã | Loại | Độ tin cậy | Trạng thái | Ghi chú |
|---|---|---|---|---|
| n01 | tài liệu chính thức | cao | đang dùng | |
| n02 | bài báo khoa học | cao | đang dùng | |
| n03 | blog cá nhân | thấp | **bị loại** | không ghi tác giả, không dẫn nguồn nào |
| n04 | báo chí | trung bình | đang dùng | **có cảnh báo**: số liệu đã 3 năm, đã có bản 2026 |
| n05 | tài liệu chính thức | cao | đang dùng | |

**Kết quả:** **2/5 nguồn (40%)** không dùng nguyên trạng được — 1 bị loại, 1 bị gắn cảnh báo. **1/6 thông tin (t03, loại `so-lieu`)** ở trạng thái `chua-xac-minh` vì chỉ có một nguồn xác nhận, kèm ghi chú của BTC: *"KHÔNG được đưa vào kịch bản dưới dạng con số; nếu muốn nhắc thì phải nói rõ là số liệu cũ và nêu năm."*

**Kiểm lại:**

```bash
python3 -c "
import json; d=json.load(open('vi-du/ho-so-nguon-mau.json'))
print('nguon bi loai/canh bao:', sum(1 for n in d['nguon'] if n.get('trangThai')=='bi-loai' or n.get('canhBao')), '/', len(d['nguon']))
print('thong tin chua xac minh:', sum(1 for t in d['thongTin'] if t.get('trangThai')=='chua-xac-minh'), '/', len(d['thongTin']))
"
# nguon bi loai/canh bao: 2 / 5
# thong tin chua xac minh: 1 / 6
```

---

## Kết luận rút ra cho lát cắt

1. Phần lớn nội dung một kịch bản (≈70% số câu) là thông tin cần căn cứ — nên việc gắn nguồn **ở cấp câu** là việc chính, không phải việc phụ.
2. Danh sách nguồn ở cuối tài liệu không giải quyết được gì: 0/40 câu truy ngược được.
3. Khoảng 40% nguồn tìm được không dùng nguyên trạng — nên **quyết định AI trung tâm phải là quyết định về nguồn** (`DÙNG` / `CHƯA-XÁC-MINH` / `LOẠI`), không phải quyết định về câu chữ.

## Còn thiếu, làm trước CP4

- Phỏng vấn ≥3 người Studio team / lab coach theo Mom Test, log nguyên văn — hỏi về **lần gần nhất** họ duyệt một kịch bản: mất bao lâu, kiểm được mấy câu, có câu nào lọt lưới không.
- Bảng impact ≥3 ứng viên có con số + ứng viên đã loại (`spec.md` §2).
