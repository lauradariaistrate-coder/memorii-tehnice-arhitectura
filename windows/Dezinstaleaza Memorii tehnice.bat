@echo off
chcp 65001 >NUL
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=[IO.File]::ReadAllText('%~f0'); iex $s.Substring($s.LastIndexOf('#PSSTART')+8)"
pause
exit /b
#PSSTART
$name = 'Memorii tehnice'
$app  = Join-Path $env:LOCALAPPDATA 'MemoriiTehnice'
foreach ($t in @([Environment]::GetFolderPath('Desktop'), (Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'))) {
  $p = Join-Path $t "$name.lnk"; if (Test-Path $p) { Remove-Item $p -Force }
}
if (Test-Path $app) { Remove-Item $app -Recurse -Force -ErrorAction SilentlyContinue }
Write-Host "Aplicatia '$name' a fost dezinstalata. Datele din Supabase nu sunt afectate."
