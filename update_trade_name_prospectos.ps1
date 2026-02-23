
# update_trade_name_prospectos.ps1
# Lee el CSV raw de prospectos y genera SQL UPDATE para trade_name

$rawPath = "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\SOLDO-PROSPECTO-raw.csv"
$outSql  = "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\update_trade_name_prospectos.sql"
$logPath = "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\prospect_rows_debug.txt"

# Leer con multiples encodings hasta encontrar el correcto
$text = $null
foreach ($encName in @("utf-16", "unicode", "utf-8", "utf-8-sig")) {
    try {
        $enc  = [System.Text.Encoding]::GetEncoding($encName)
        $bytes = [System.IO.File]::ReadAllBytes($rawPath)
        $candidate = $enc.GetString($bytes)
        if ($candidate -match "BERMEJO|SOLER|GALINDEZ") {
            $text = $candidate
            Write-Host "Encoding encontrado: $encName"
            break
        }
    } catch {}
}

if ($null -eq $text) {
    # Fallback: leer como Unicode directamente
    $text = [System.IO.File]::ReadAllText($rawPath, [System.Text.Encoding]::Unicode)
    Write-Host "Usando Unicode como fallback"
}

$lines = $text -split "`r?`n"
Write-Host "Total lineas: $($lines.Count)"

# Guardar primeras 10 lineas para debug
$lines[0..9] | Out-File -FilePath $logPath -Encoding UTF8

# Parsear buscando columna Nombre (col 3 en el CSV de prospectos como el de clientes)
$updates = @()
$skipped = 0
$processed = 0

foreach ($line in $lines) {
    $l = $line.Trim()
    if ($l -eq "") { $skipped++; continue }
    if ($l -match "^Cliente/prospecto") { $skipped++; continue }
    if ($l -match "^Elemental") { $skipped++; continue }
    if ($l -match "^Total general") { $skipped++; continue }

    $parts = $l -split ';'
    if ($parts.Count -lt 4) { $skipped++; continue }

    $comercial  = $parts[0].Trim()
    $legalName  = $parts[1].Trim()
    $cuit       = $parts[2].Trim() -replace '[^0-9]', ''
    $nombre     = $parts[3].Trim()

    if ([string]::IsNullOrEmpty($legalName) -or $legalName -eq '(en blanco)') { $skipped++; continue }
    if ([string]::IsNullOrEmpty($nombre) -or $nombre -eq '(en blanco)' -or $nombre -eq $legalName) { $skipped++; continue }

    $nombreEsc    = $nombre    -replace "'", "''"
    $legalNameEsc = $legalName -replace "'", "''"

    if (-not [string]::IsNullOrEmpty($cuit) -and $cuit.Length -ge 10 -and $cuit -ne '0') {
        $updates += "UPDATE companies SET trade_name = '$nombreEsc' WHERE tenant_id = 3 AND cuit = '$cuit' AND company_type = 'prospect';"
    } else {
        $updates += "UPDATE companies SET trade_name = '$nombreEsc' WHERE tenant_id = 3 AND legal_name ILIKE '$legalNameEsc' AND company_type = 'prospect';"
    }
    $processed++
}

$updates | Out-File -FilePath $outSql -Encoding UTF8
Write-Host "Procesados: $processed | Skipped: $skipped | UPDATEs generados: $($updates.Count)"
