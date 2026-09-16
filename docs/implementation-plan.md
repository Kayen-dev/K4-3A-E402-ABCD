# Implementation Plan - bản đơn giản

Mục tiêu: build prototype demo được luồng chính trong 5 phút.

Luồng chính:

```text
Nhập yêu cầu
-> Xem 3 nguồn
-> Xem 5 câu có citation
-> Bỏ 1 nguồn
-> Chỉ câu phụ thuộc nguồn đó được viết lại
-> Bấm soát văn nói C2 nếu cần
```

## 0. Data dùng để triển khai

Đọc data local ở:

```text
D:\K4-3A-E402-ABC\data\studio-pack\c3-scriptscout
```

Dùng đúng gói `c3-scriptscout` vì đây là data cho bài ScriptScout.

Các file cần dùng:

| File | Dùng để làm gì |
|---|---|
| `README.md` | Đọc yêu cầu C3 và tiêu chí demo. |
| `mau-kich-ban.md` | Mẫu output cho `kich-ban.md`. |
| `chu-de-goi-y.md` | Lấy input mẫu để chạy demo. |
| `vi-du/ho-so-nguon-mau.json` | Lấy mock `Source` và `Fact`. |
| `vi-du/kich-ban-co-nguon.json` | Lấy mock `Sentence` đã có citation. |

Không dùng `c4-storyboardai` và `c5-feedbackradar` cho prototype chính, vì hai gói đó không phải bài ScriptScout.

Lưu ý: URL trong `ho-so-nguon-mau.json` là URL giả `.test`, chỉ dùng làm fixture/mock, không trích dẫn như nguồn thật khi nộp báo cáo.

Folder `data/` đã có `.gitignore`, nên data pack chỉ nằm local để đọc khi dev/test. Không add raw data pack vào commit.

## 1. Data cần có

Chỉ cần 4 loại dữ liệu:

```ts
type Source = {
  id: string;
  title: string;
  url: string;
  date: string;
  score: number;
  reason: string;
  status: "accepted" | "rejected" | "flagged";
};

type Fact = {
  id: string;
  text: string;
  source_ids: string[];
  quote: string;
};

type Sentence = {
  n: number;
  text: string;
  fact_ids: string[];
  status: "normal" | "kept" | "rewritten" | "needs_review";
  old_text?: string;
};

type Finding = {
  sentence_n: number;
  type: "translationese" | "wrong_tone" | "too_long" | "missing_source";
  excerpt: string;
  reason: string;
};
```

## 2. Các màn hình

### Màn 1 - Nhập yêu cầu

- Chủ đề.
- Mục tiêu bài học.
- Học viên là ai.
- Thời lượng video.
- Nút `Tạo kịch bản`.

### Màn 2 - Nguồn

Hiển thị 3 nguồn.

Mỗi nguồn có:

- Tên nguồn.
- URL.
- Ngày.
- Điểm tin cậy.
- Lý do chấm.
- Nút `Loại nguồn`.

### Màn 3 - Kịch bản

Hiển thị 5 câu.

Mỗi câu có:

- Nội dung câu.
- Citation chip, ví dụ `[f01]`.
- Bấm citation thì hiện đoạn trích gốc.

### Màn 4 - Sau khi loại nguồn

Hiển thị số:

```text
2/5 câu viết lại
3/5 câu giữ nguyên
```

Câu giữ nguyên:

- Badge `giữ nguyên`.

Câu bị viết lại:

- Badge `đã viết lại`.
- Hiện câu cũ và câu mới.

### Màn 5 - Soát văn nói C2

Nút:

- `Soát văn nói`

Khi bấm:

- Hiện finding dưới từng câu.
- Ví dụ: câu quá dài, văn dịch máy, sai giọng, thiếu nguồn.

## 3. Logic quan trọng nhất

Khi người dùng loại một nguồn:

```ts
function getAffectedSentences(sourceId, facts, sentences) {
  const affectedFactIds = facts
    .filter(fact => fact.source_ids.includes(sourceId))
    .map(fact => fact.id);

  return sentences.filter(sentence =>
    sentence.fact_ids.some(id => affectedFactIds.includes(id))
  );
}
```

Sau đó:

1. Chỉ gửi các câu bị ảnh hưởng đi rewrite.
2. Câu không bị ảnh hưởng giữ nguyên text.
3. Câu rewrite xong thì gắn `status = "rewritten"`.
4. Câu giữ nguyên thì gắn `status = "kept"`.

Đây là phần quan trọng nhất để demo.

## 4. AI cần gọi

### AI 1 - Tạo nguồn/fact

Input:

- Chủ đề.
- Mục tiêu.
- Học viên.
- Thời lượng.

Output:

- 3 `Source`.
- Danh sách `Fact`.

Prototype có thể dùng mock data trước, chưa cần search thật.

### AI 2 - Viết 5 câu

Input:

- Request người dùng.
- Facts.

Output:

- 5 `Sentence`.
- Mỗi câu có `fact_ids`.

### AI 3 - Rewrite câu bị ảnh hưởng

Input:

- Các câu bị ảnh hưởng.
- Facts còn lại sau khi bỏ nguồn.

Output:

- Câu mới cho đúng các `n` bị ảnh hưởng.

Không được rewrite toàn bộ 5 câu.

### AI 4 - Soát văn nói C2

Input:

- 5 câu hiện tại.

Output:

- Danh sách `Finding`.

Finding chỉ là cảnh báo, không tự sửa câu.

## 5. Mock data tối thiểu

Lấy mock data từ:

```text
data/studio-pack/c3-scriptscout/vi-du/ho-so-nguon-mau.json
data/studio-pack/c3-scriptscout/vi-du/kich-ban-co-nguon.json
```

Map dữ liệu như sau:

| Trong data pack | Trong app |
|---|---|
| `nguon[]` | `Source[]` |
| `thongTin[]` | `Fact[]` |
| `thongTin[].bangChung[].nguonId` | `Fact.source_ids[]` |
| `thongTin[].bangChung[].doanTrich` | `Fact.quote` |
| `cau[]` | `Sentence[]` |
| `cau[].nguon[]` | `Sentence.fact_ids[]` |

Cần chuẩn bị sẵn:

- 3 nguồn.
- 5 fact.
- 5 câu.
- Trong đó có 1 nguồn được dùng bởi 2 câu.

Như vậy khi loại nguồn đó, demo sẽ thấy:

```text
2 câu viết lại
3 câu giữ nguyên
```

## 6. Export đơn giản

Có thể làm 3 nút hoặc 1 nút export:

- `kich-ban.md`
- `ho-so-nguon.json`
- `audit-trail.json`

Nếu chưa kịp làm download thật, demo có thể hiển thị nội dung export trong modal.

## 7. Thứ tự làm

1. Tạo mock data.
2. Render 3 nguồn.
3. Render 5 câu và citation.
4. Bấm citation mở đoạn trích.
5. Bấm loại nguồn.
6. Tính câu bị ảnh hưởng.
7. Rewrite/mock rewrite đúng các câu đó.
8. Hiển thị câu giữ nguyên và câu viết lại.
9. Thêm nút C2.
10. Thêm export nếu còn thời gian.

## 8. Done khi nào?

Đạt khi demo được:

- Có 3 nguồn.
- Có 5 câu.
- Mỗi câu có citation.
- Bấm citation xem được quote.
- Loại nguồn thì chỉ vài câu đổi.
- Câu còn lại giữ nguyên.
- Có nút soát văn nói C2.
