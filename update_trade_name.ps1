
# update_trade_name.ps1
# Lee el CSV de clientes y genera SQL UPDATE para poblar trade_name con la columna "Nombre"

$csvPath = "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\SOLDO-CLIENTE-raw.txt"
$outSql  = "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\update_trade_name.sql"

$lines = Get-Content -Path $csvPath -Encoding UTF8
$updates = @()

foreach ($line in $lines) {
    if ($line -match '^\s*$') { continue }
    if ($line -match '^Cliente/prospecto') { continue }
    if ($line -match '^Elemental') { continue }
    if ($line -match '^Total general') { continue }

    $parts = $line -split ';'
    if ($parts.Count -lt 4) { continue }

    $legalName  = $parts[1].Trim()
    $cuit       = $parts[2].Trim() -replace '[^0-9]', ''
    $nombre     = $parts[3].Trim()

    # Skip invalids
    if ([string]::IsNullOrEmpty($legalName) -or $legalName -eq '(en blanco)') { continue }
    if ([string]::IsNullOrEmpty($nombre) -or $nombre -eq '(en blanco)') { continue }

    $nombreEsc    = $nombre    -replace "'", "''"
    $legalNameEsc = $legalName -replace "'", "''"

    # Preferir CUIT como clave, fallback a legal_name ILIKE
    if (-not [string]::IsNullOrEmpty($cuit) -and $cuit.Length -ge 10 -and $cuit -ne '0') {
        $updates += "UPDATE companies SET trade_name = '$nombreEsc' WHERE tenant_id = 3 AND cuit = '$cuit' AND company_type = 'client';"
    } else {
        $updates += "UPDATE companies SET trade_name = '$nombreEsc' WHERE tenant_id = 3 AND legal_name ILIKE '$legalNameEsc' AND company_type = 'client';"
    }
}

$updates | Out-File -FilePath $outSql -Encoding UTF8
Write-Host "Total UPDATEs: $($updates.Count)"
