# Chạy không được? Đọc file này

## 1 · Kiểm tra Node đã có chưa

```powershell
node -v
```

Ra `v18.x` trở lên là được. Ra `not recognized` thì sang bước 2.

## 2 · Cài Node (chỉ làm một lần, ~2 phút)

```powershell
winget install OpenJS.NodeJS.LTS
```

**Xong phải ĐÓNG PowerShell rồi mở lại.** PowerShell chỉ nạp PATH lúc khởi động, nên
cửa sổ đang mở vẫn báo `not recognized` dù đã cài xong.

Máy không có `winget` thì tải bản LTS ở nodejs.org, cài bằng file `.msi`, rồi cũng mở lại PowerShell.

## 3 · Đứng ĐÚNG thư mục

Lệnh `node eval/run.js` phải chạy từ trong `nhom-c3`, không phải từ thư mục repo gốc.

```powershell
cd nhom-c3
node eval/run.js
```

Đứng sai chỗ thì Node báo `Cannot find module ...eval\run.js`.

## 4 · Hai lệnh chính

```powershell
cd nhom-c3
node eval/run.js          # chạy 28 case, ghi eval/run_results.md
node codebase/server.js   # mở http://localhost:5173
```

Chạy bằng khoá thật:

```powershell
$env:LLM_PROVIDER="gemini"
$env:LLM_API_KEY="khoá-của-nhóm"
node eval/run.js
```

Biến môi trường đặt kiểu này chỉ sống trong cửa sổ PowerShell hiện tại. Mở cửa sổ mới là mất.

## 5 · Lỗi hay gặp

| Báo lỗi | Nguyên nhân |
|---|---|
| `node : The term 'node' is not recognized` | Chưa cài Node, hoặc cài rồi mà chưa mở lại PowerShell |
| `Cannot find module '...\eval\run.js'` | Đang đứng sai thư mục — phải `cd nhom-c3` trước |
| `ERR_UNSUPPORTED_ESM_URL_SCHEME` | Bản cũ của `eval/run.js`. Bản hiện tại đã vá, tải lại file |
| `Thiếu LLM_API_KEY cho provider=gemini` | Đặt `LLM_PROVIDER` mà quên đặt `LLM_API_KEY` |
| `Gemini 429` | Hết hạn mức ngày. Đổi `LLM_PROVIDER=stub` để chạy tiếp bằng đáp án dựng sẵn |

Không đặt gì cả thì hệ thống chạy ở chế độ `stub` — đi trọn luồng, mọi phần code chạy thật,
chỉ phần model đọc từ `fixtures/llm/`. Dùng để kiểm mọi thứ khác đã đúng chưa trước khi tốn khoá.
