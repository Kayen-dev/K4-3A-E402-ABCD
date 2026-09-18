# Chặn lộ data pack của ban tổ chức

## Vấn đề, nói thẳng

Thư mục `nhom-c3/` đang nằm **bên trong** bản clone repo của ban tổ chức:

```
K4-3A-Day05-06-AI-Product-Hackathon/   ← .git nằm ở ĐÂY
├── .git/
├── .gitignore                          ← chỉ có .DS_Store, __pycache__, .env, node_modules
├── data/                               ← DATA PACK, đang được git theo dõi
│   ├── vlearn-pack/transcript/         6 transcript buổi học
│   ├── vlearn-pack/chatlog/            tutor_turns.csv — 22 MB
│   ├── vlearn-pack/slides/             2 file PDF slide, ~12 MB
│   ├── discord-pack/                   k4_messages.csv
│   └── studio-pack/                    kèm d1.mp4 13 MB
└── nhom-c3/                            ← bài nộp của nhóm
    └── .gitignore                      ← file này CHỈ che được thứ trong nhom-c3/
```

`git` lấy `.git` gần nhất đi ngược lên. Đứng trong `nhom-c3/` gõ `git status` thì
git vẫn đang làm việc với repo của BTC. **Thêm một remote GitHub công khai vào đó
rồi `git push` là toàn bộ `data/` lên mạng.** `.gitignore` trong `nhom-c3/` không
cứu được, vì file đã được theo dõi từ trước thì `.gitignore` không có tác dụng.

## Cách làm đúng: repo nộp bài là một repo RIÊNG

Chạy đúng một lần, từ trong `nhom-c3`:

```powershell
cd C:\Users\Admin\OneDrive\Desktop\AI20K\K4-3A-Day05-06-AI-Product-Hackathon\nhom-c3

git init                       # tạo .git RIÊNG ngay tại nhom-c3
git add .
git status                     # ĐỌC KỸ danh sách này trước khi commit
node soat-an-toan.js           # soát tự động
git commit -m "CP3: prototype AI that + golden set"
```

Sau `git init`, `git rev-parse --show-toplevel` phải in ra đường dẫn kết thúc bằng
`nhom-c3`. Nếu nó in ra `K4-3A-Day05-06-AI-Product-Hackathon` thì `git init` chưa
chạy, và **chưa được push**.

Chỉ tạo repo GitHub rồi `git remote add origin ...` **sau khi** đã xác nhận điều trên.

## Đừng làm những việc này

| Việc | Vì sao hỏng |
|---|---|
| Thêm remote vào repo của BTC rồi push | Đẩy cả `data/` lên công khai |
| Copy `data/` vào trong `nhom-c3/` cho tiện chạy | `.gitignore` chặn được, nhưng chỉ cần một lần `git add -f` là lọt |
| Dựa vào `.gitignore` để che file đã commit | `.gitignore` chỉ có tác dụng với file CHƯA được theo dõi |
| `git add -A` ở thư mục cha | Quét cả `data/` |

## Nếu lỡ push rồi

Xoá commit không đủ — người khác vẫn `git log -p` đọc lại được. Phải:

1. Xoá repo trên GitHub ngay (Settings → Delete this repository).
2. Tạo repo mới, push từ `nhom-c3` đã `git init` riêng.
3. Nếu có khoá API trong đó thì **thu hồi khoá** trên Google AI Studio / OpenRouter.

## Được trích dẫn data pack như thế nào

Luật của BTC cho phép **trích ngắn minh hoạ**, không cho commit nguyên file.
Cách nhóm đang làm trong `eval/golden_set.json`: dẫn bằng **mã câu / mã đoạn**
(`[T03-118]`) và chép lại đúng một câu, không chép cả đoạn. Không suy ngược
danh tính từ nhãn `[học viên]`.

## Soát tự động

```powershell
node soat-an-toan.js
```

Script kiểm bốn thứ và trả mã thoát khác 0 nếu có vấn đề:

1. `.git` có đúng nằm tại `nhom-c3` không
2. có file nào thuộc data pack lọt vào thư mục nộp bài không
3. có chuỗi trông giống khoá API trong file nguồn không
4. `.env` có bị theo dõi không
