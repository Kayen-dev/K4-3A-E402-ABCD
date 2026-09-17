# Soát trước khi push — bắt buộc, vì repo phải để công khai

`02-guide.md` §3.4 luật an toàn: **không commit API key / .env** · repo public thì trước khi push
phải soát không có khoá, không có thông tin cá nhân, không đổ nguyên data pack lên.

## Một lệnh soát khoá

```powershell
cd nhom-c3
Select-String -Path codebase\*.js,codebase\src\*.js,eval\*.js,*.md -Pattern "AIza|AQ\.|sk-ant-|sk-proj-|sk-"
```

Không ra dòng nào là sạch. Ra dòng nào thì xoá khoá ở đó **và thu hồi khoá đó** — git giữ lịch sử,
xoá sau vẫn tra lại được.

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
git status                      # .env KHÔNG được xuất hiện trong danh sách
node codebase/kiem-tra-khoa.js  # xác minh khoá vẫn chạy sau khi đã dọn
node eval/run.js                # 28 case vẫn chạy
```

## Nếu đã từng commit khoá lên rồi

Thu hồi khoá đó **ngay** trên Google AI Studio rồi tạo khoá mới. Xoá dòng code và commit tiếp
**không** xoá được khoá khỏi lịch sử git — ai clone repo vẫn đọc lại được bằng `git log -p`.
