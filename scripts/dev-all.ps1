# Mở 3 cửa sổ PowerShell: API mock (:3000), website public (:3002), CMS admin (:3001)
$root = Split-Path -Parent $PSScriptRoot
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$root\euni-api-mock'; npm run dev"
Start-Sleep 2
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$root\euni-public'; npm run dev"
Start-Process powershell -ArgumentList '-NoExit','-Command',"cd '$root\euni-admin'; npm run dev"
Write-Host 'API http://127.0.0.1:3000 · Public http://localhost:3002 · Admin http://localhost:3001/cms'
