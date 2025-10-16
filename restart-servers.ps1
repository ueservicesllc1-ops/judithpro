# Reiniciar servidores Judith - PowerShell

Write-Host "🔄 Reiniciando servidores Judith..." -ForegroundColor Yellow

# Matar todos los procesos de Node.js
Write-Host "🔪 Matando procesos de Node.js..." -ForegroundColor Red
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Verificar que no queden procesos
$remainingNodes = (Get-Process -Name "node" -ErrorAction SilentlyContinue).Count
if ($remainingNodes -gt 0) {
    Write-Host "⚠️  Aún hay $remainingNodes procesos de Node.js, forzando terminación..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 1
}

Write-Host "✅ Procesos de Node.js terminados" -ForegroundColor Green

Write-Host "🚀 Para reiniciar los servicios en el servidor, ejecuta:" -ForegroundColor Cyan
Write-Host "   ssh heavencoffee_us@34.135.41.116 -p 1619" -ForegroundColor White
Write-Host "   ./restart-servers.sh" -ForegroundColor White

Write-Host "📋 O ejecuta manualmente:" -ForegroundColor Cyan
Write-Host "   sudo systemctl restart judith-frontend" -ForegroundColor White
Write-Host "   sudo systemctl restart judith-backend" -ForegroundColor White
Write-Host "   sudo systemctl restart judith-b2-proxy" -ForegroundColor White
