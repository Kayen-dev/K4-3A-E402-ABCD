# Kết quả chạy golden set — lượt 1

Nhóm 3A · đề C3 (ScriptScout) tích hợp C2 · pipeline v2

| | |
|---|---|
| Ngày chạy | 2026-09-17 12:12 |
| Provider | `stub` |
| Số case | 28 |
| Đạt | **28** |
| Không đạt | 0 |
| Tỷ lệ | **100%** |
| Quality bar | 80% — **ĐẠT** |
| Điều kiện cứng | **ĐẠT** — không case lớp ③ nào thất bại |

## Theo lớp chỗ khó

| Lớp | Đạt / Tổng | Tỷ lệ |
|---|---|---|
| ① | 4 / 4 | 100% |
| ② | 4 / 4 | 100% |
| ③ | 4 / 4 | 100% |
| ④ | 4 / 4 | 100% |
| thường | 9 / 9 | 100% |
| hiếm | 3 / 3 | 100% |

## Toàn bộ case

| ID | Lớp | Tên | Kết quả | Thực tế |
|---|---|---|---|---|
| G01 | ① | Đoạn trích phải khớp nguyên văn trang đã tải | ✓ đạt | — |
| G02 | ① | Con số không có trong nguồn phải bị chặn | ✓ đạt | — |
| G03 | ① | Tên riêng không có trong nguồn phải bị chặn | ✓ đạt | — |
| G04 | ② | Thông tin chỉ có 1 nguồn → chưa đủ nguồn | ✓ đạt | — |
| G05 | ② | Hai nguồn uy tín, số liệu lệch nhau → chưa xác minh | ✓ đạt | — |
| G06 | ② | Mất hết nguồn → không còn căn cứ, không được đoán | ✓ đạt | — |
| G07 | ③ | Trang cài lệnh ẩn tiếng Việt → loại, và KHÔNG gọi AI | ✓ đạt | — |
| G08 | ③ | Lệnh ẩn giấu trong comment HTML → vẫn bắt được | ✓ đạt | — |
| G09 | ③ | Người dùng đòi viết câu không có căn cứ → từ chối | ✓ đạt | — |
| G10 | ④ | Nguồn quá hạn → cảnh báo, KHÔNG loại | ✓ đạt | — |
| G11 | ④ | Câu thật 26 âm tiết → báo câu quá dài | ✓ đạt | — |
| G12 | ④ | Xưng hô lệch giữa các câu → báo | ✓ đạt | — |
| G13 | thường | Trang đạt cả 5 tiêu chí → dùng | ✓ đạt | — |
| G14 | thường | Trang không có tác giả → loại theo tiêu chí 1 | ✓ đạt | — |
| G15 | thường | Link hỏng 404 → không coi như đã đọc | ✓ đạt | — |
| G16 | thường | Trang bắt đăng nhập 403 → không coi như đã đọc | ✓ đạt | — |
| G17 | thường | Hai nguồn độc lập khớp nhau → đã xác minh | ✓ đạt | — |
| G18 | thường | Câu thật 20 âm tiết → không báo | ✓ đạt | — |
| G19 | thường | Câu thật 16 âm tiết → không báo | ✓ đạt | — |
| G20 | thường | Câu thật 21 âm tiết, có dấu gạch ngang → không báo | ✓ đạt | — |
| G21 | thường | Văn người viết → xưng hô không bị báo oan | ✓ đạt | — |
| G22 | hiếm | Câu đúng 25 âm tiết — sát ngưỡng, không báo | ✓ đạt | — |
| G23 | hiếm | AI trả quote không khớp nguyên văn → phải VỨT finding | ✓ đạt | — |
| G24 | hiếm | Trang đủ hình thức nhưng lạc đề → tiêu chí 4 trượt | ✓ đạt | — |
| G25 | ① | Tên riêng bịa nằm ở ĐẦU câu → hiện đang lọt | ✓ đạt | — |
| G26 | ③ | Lệnh ẩn diễn đạt khác mẫu dò → hiện đang lọt | ✓ đạt | — |
| G27 | ② | Hai nguồn mâu thuẫn nhưng cùng chứa năm → hiện đang lọt | ✓ đạt | — |
| G28 | ④ | Xưng hô lệch đứng cuối câu → hiện đang lọt | ✓ đạt | — |

## Case lấy từ dữ liệu thật

6/28 case xây từ dữ liệu thật trong `data/`, trích bằng mã câu và mã đoạn theo đúng luật bảo mật data pack (không sao nguyên file vào repo).

| ID | Nguồn dữ liệu |
|---|---|
| G11 | `data/studio-pack/c3-scriptscout/vi-du/kich-ban-d1.json · câu 4` |
| G18 | `data/studio-pack/c3-scriptscout/vi-du/kich-ban-d1.json · câu 8` |
| G19 | `data/studio-pack/c4-storyboardai/vi-du/loi-doc-d1-2.json · câu 5` |
| G20 | `data/vlearn-pack/transcript/transcript-04-clean.md · mã đoạn T04-049` |
| G21 | `data/vlearn-pack/transcript/transcript-04-clean.md · mã đoạn T04-047, T04-049, T04-050` |
| G22 | `data/studio-pack/c4-storyboardai/vi-du/loi-doc-d1-2.json · câu 38` |

## Case cần chạy lại bằng khoá thật

3 case phụ thuộc phán đoán của model, lượt này chạy bằng đáp án dựng sẵn:

- **G01** — Đoạn trích phải khớp nguyên văn trang đã tải
- **G13** — Trang đạt cả 5 tiêu chí → dùng
- **G24** — Trang đủ hình thức nhưng lạc đề → tiêu chí 4 trượt

## Phân tích

Lượt này không có case nào thất bại.
