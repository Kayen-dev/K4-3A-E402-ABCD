# DON-REPO.ps1 - don file khong can thiet. Chay MOT LAN tu trong nhom-c3.
#
#     powershell -ExecutionPolicy Bypass -File DON-REPO.ps1
#
# File nay luu UTF-8 CO BOM. Bat buoc: Windows PowerShell 5.1 doc file .ps1
# khong co BOM theo bang ma ANSI, nen moi ky tu tieng Viet trong file se bi
# doc sai. Ky tu ke ngang co byte 0x94, ma 0x94 trong ANSI la dau nhay dong
# chuoi - parser mat dau chuoi va bao "Missing closing brace".
# Vi vay: comment chi dung ASCII, tieng Viet chi nam trong chuoi.

$ErrorActionPreference = "Continue"
Write-Host ""
Write-Host "=== Don repo nhom 3A ===" -ForegroundColor Cyan

# 1 - Xoa han: da bi thu khac thay the hoan toan
$xoa = @(
  "track-c-chain",
  "codebase\scriptscout-studio.html",
  "codebase\scriptscout-mock.html",
  "de-xuat-hanh-dong.md"
)
foreach ($f in $xoa) {
  if (Test-Path $f) {
    Remove-Item $f -Recurse -Force
    Write-Host ("  xoa     " + $f) -ForegroundColor DarkGray
  }
}

# 2 - Chuyen vao docs: con gia tri nhung khong thuoc phan bi cham
New-Item -ItemType Directory -Force -Path "docs" | Out-Null
$chuyen = @{
  "cp1-canvas.md"        = "docs\cp1-canvas.md"
  "cp2-luong.md"         = "docs\cp2-luong.md"
  "danh-gia-pipeline.md" = "docs\danh-gia-pipeline.md"
}
foreach ($k in $chuyen.Keys) {
  if (Test-Path $k) {
    Move-Item $k $chuyen[$k] -Force
    Write-Host ("  chuyen  " + $k + " -> " + $chuyen[$k]) -ForegroundColor DarkGray
  }
}

# 3 - Chuyen tai lieu van hanh xuong canh code
$sangCodebase = @("KIEM-TRA-NHANH.md", "SOAT-TRUOC-KHI-PUSH.md")
foreach ($f in $sangCodebase) {
  if (Test-Path $f) {
    Move-Item $f ("codebase\" + $f) -Force
    Write-Host ("  chuyen  " + $f + " -> codebase\" + $f) -ForegroundColor DarkGray
  }
}

# 4 - Don trace cu, giu 20 file moi nhat
if (Test-Path "codebase\traces") {
  $files = @(Get-ChildItem "codebase\traces\*.json" -ErrorAction SilentlyContinue)
  if ($files.Count -gt 40) {
    $bo = $files | Sort-Object LastWriteTime | Select-Object -First ($files.Count - 20)
    $bo | Remove-Item -Force
    Write-Host ("  don     codebase\traces - giu 20 file moi nhat (co " + $files.Count + ")") -ForegroundColor DarkGray
  }
}

# 5 - Soat khoa API truoc khi push
Write-Host ""
Write-Host "=== Soat khoa API ===" -ForegroundColor Cyan
$duong = @("codebase\*.js", "codebase\src\*.js", "eval\*.js", "*.md", "docs\*.md")
$hit = Select-String -Path $duong -Pattern "AIza|AQ\.[A-Za-z0-9]|sk-ant-|sk-proj-" -ErrorAction SilentlyContinue
if ($hit) {
  Write-Host "  CO KHOA TRONG FILE - xoa truoc khi push:" -ForegroundColor Red
  foreach ($h in $hit) { Write-Host ("    " + $h.Path + ":" + $h.LineNumber) -ForegroundColor Red }
} else {
  Write-Host "  sach - khong co khoa trong file duoc commit" -ForegroundColor Green
}
if (Test-Path "codebase\.env") {
  Write-Host "  codebase\.env ton tai (dung cho, da trong .gitignore)" -ForegroundColor Green
}

# 6 - Con thieu gi de du cau truc nop bai
Write-Host ""
Write-Host "=== Con thieu de du cau truc nop bai ===" -ForegroundColor Cyan
foreach ($f in @("README.md", "spec.md", "demo-slides.pdf")) {
  if (-not (Test-Path $f)) { Write-Host ("  THIEU   " + $f) -ForegroundColor Yellow }
}
$r = @(Get-ChildItem "reflection\*.md" -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne "README.md" })
if ($r.Count -lt 3) {
  Write-Host ("  THIEU   reflection - co " + $r.Count + "/3 file thu hoach ca nhan") -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Xong. Kiem lai: git status" -ForegroundColor Cyan
Write-Host ""
