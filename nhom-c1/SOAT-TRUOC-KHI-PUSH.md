# Soát trước khi push — bắt buộc, vì repo phải để công khai

`02-guide.md` §3.4 luật an toàn: **không commit API key / .env** · repo public thì trước khi push
phải soát không có khoá, không có thông tin cá nhân, không đổ nguyên data pack lên.

## ⚠ Việc nguy hiểm nhất: push nhầm repo của BTC

`nhom-c3/` đang nằm **bên trong** bản clone repo của ban tổ chức, và `.git` nằm ở thư mục cha
cùng chỗ với `data/`. Đứng trong `nhom-c3` gõ `git status` thì git vẫn đang làm việc với repo
của BTC — thêm remote công khai vào đó rồi push là **đẩy cả data pack lên mạng**.
`.gitignore` trong `nhom-c3` không cứu được, vì file đã được theo dõi từ trước.

Phải `git init` RIÊNG tại `nhom-c3`. Chi tiết và cách xử lý nếu lỡ push: **`AN-TOAN-DU-LIEU.md`**.

## Một lệnh soát tất cả

```powershell
cd nhom-c3
node soat-an-toan.js
```

Soát bốn thứ: git root có đúng chỗ · data pack có lọt vào thư mục nộp bài · có chuỗi nào trông
giống khoá API · `.env` có bị theo dõi. Có vấn đề thì trả mã thoát 1 và nói luôn cách xử lý.

Viết bằng Node chứ không phải PowerShell: `.ps1` không có BOM thì Windows PowerShell 5.1 đọc
bằng bảng mã ANSI và vỡ ngay ở ký tự tiếng Việt đầu tiên — đã gặp một lần với `DON-REPO.ps1`.

Ra dòng nào thì xoá khoá ở đó **và thu hồi khoá đó** — git giữ lịch sử, xoá sau vẫn tra lại được.

## Khoá phải đặt ở đâu

| Chỗ | Được không |
|---|---|
| `codebase/.env` | ✅ đúng chỗ. Đã nằm trong `.gitignore` |
| `$env:LLM_API_KEY` trong PowerShell | ✅ được, nhưng mất khi đóng cửa sổ |
| `codebase/.env.example` | ❌ file này **được commit**. Chỉ để làm mẫu, không để khoá thật |
| Trong file `.js` bất kỳ | ❌ tuyệt đối không. Vừa bị trừ điểm R7, vừa là lộ khoá thật |

## Vì sao hardcode khoá trong `run.js` không có tác dụng

`llm.js` đọc `process.env.LLM_API_KEY` trực tiếp. Khai một biến `apiKey` trong `run.js` thì
**không module nào đọc biến đó** — nó là code chết, chỉ để lại rủi ro lộ khoá mà không đem lại gì.

Tương tự, đừng để `run.js` tự đọc `process.env.LLM_PROVIDER`. Đã có một lần header in ra `gemini`
trong khi lời gọi thật đi vào `stub`, vì hai file đọc hai chỗ khác nhau với hai giá trị mặc định
khác nhau. Bản hiện tại lấy provider từ chính `llm.js` nên không lệch được nữa.

## Kiểm lại trước khi push

```powershell
git rev-parse --show-toplevel   # PHẢI kết thúc bằng \nhom-c3
node soat-an-toan.js            # bốn phép soát, phải ra "Sạch"
git status                      # .env KHÔNG được xuất hiện trong danh sách
node codebase/kiem-tra-khoa.js  # xác minh khoá vẫn chạy sau khi đã dọn
node eval/run.js                # 28 case vẫn chạy
```

## Nếu đã từng commit khoá lên rồi

Thu hồi khoá đó **ngay** trên Google AI Studio rồi tạo khoá mới. Xoá dòng code và commit tiếp
**không** xoá được khoá khỏi lịch sử git — ai clone repo vẫn đọc lại được bằng `git log -p`.
