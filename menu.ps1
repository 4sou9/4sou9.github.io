# Common command menu for the blog repo.
# Launch by double-clicking menu.bat (or: powershell -File menu.ps1).
# NOTE: kept ASCII-only on purpose. Windows PowerShell 5.1 mojibakes
#       Japanese in UTF-8 (no BOM) .ps1 files and fails to parse them.

Set-Location -LiteralPath $PSScriptRoot

function Stop-StaleServers {
    # Kill leftover astro dev/preview servers on the usual ports.
    foreach ($port in 4321..4330) {
        $c = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($c) { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue }
    }
}

while ($true) {
    Write-Host ""
    Write-Host "==== blog commands ====" -ForegroundColor Cyan
    Write-Host "  1) dev         npm run dev"
    Write-Host "  2) pull        git pull"
    Write-Host "  3) push        git add -A + commit + push origin main"
    Write-Host "  4) build       npm run build"
    Write-Host "  5) preview     npm run preview"
    Write-Host "  6) clean dev   stop stale servers + clear cache + npm run dev"
    Write-Host "  q) quit"
    Write-Host ""
    $choice = Read-Host "select"

    switch ($choice) {
        '1' { npm run dev }
        '2' { git pull }
        '3' {
            $msg = Read-Host "commit message (empty = update)"
            if ([string]::IsNullOrWhiteSpace($msg)) { $msg = "update" }
            git add -A
            git commit -m $msg
            git push origin main
        }
        '4' { npm run build }
        '5' { npm run preview }
        '6' {
            Stop-StaleServers
            Remove-Item -Recurse -Force ".\.astro", ".\node_modules\.vite" -ErrorAction SilentlyContinue
            npm run dev
        }
        { $_ -eq 'q' -or $_ -eq 'Q' } { return }
        default { Write-Host "unknown choice: $choice" -ForegroundColor Yellow }
    }
}
