# Source code

`nhom-c1/` là dự án chính ScriptScout. `codebase-demo/` là prototype React cũ để tham khảo.

## Chạy dự án chính

```powershell
cd codebase/nhom-c1/codebase
npm install
npm --prefix ui install
npm run build
npm run dev
```

Mở http://127.0.0.1:5173. Cấu hình local trong `codebase/nhom-c1/codebase/.env` theo `.env.example` của app.

## Kiểm tra

```powershell
npm run typecheck
node --test tests/*.test.js
```

Chạy các lệnh kiểm tra từ thư mục app `codebase/nhom-c1/codebase/`.

## Vercel

Project: `k4-abcd`. Production branch: `main`.
Root Directory: `codebase/nhom-c1/codebase`.
Build, output và API rewrites được khai báo trong `vercel.json` tại Root Directory của app.
Đặt secrets qua Environment Variables trên Vercel.

Bài reflection cá nhân nằm tại `reflection/02785.DinhTuanKiet.md` ở gốc repository.
