
# update_contactos_cuit.ps1
# Lee el CSV de clientes y genera SQL UPDATE usando CUIT como clave

$csvPath = "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\SOLDO-CLIENTE-raw.txt"
$outSql  = "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\update_contactos_cuit.sql"

$lines = Get-Content -Path $csvPath -Encoding UTF8
$updates = @()

foreach ($line in $lines) {
    if ($line -match '^\s*$') { continue }
    if ($line -match '^Cliente/prospecto') { continue }
    if ($line -match '^Elemental') { continue }
    if ($line -match '^Total general') { continue }

    $parts = $line -split ';'
    if ($parts.Count -lt 6) { continue }

    $legalName = $parts[1].Trim()
    $cuit      = $parts[2].Trim() -replace '[^0-9]', ''
    $phone     = $parts[4].Trim()
    $email     = $parts[5].Trim()

    if ([string]::IsNullOrEmpty($legalName) -or $legalName -eq '(en blanco)') { continue }

    # Limpiar phone y email
    if ($phone -eq '(en blanco)' -or $phone -eq '-' -or $phone -match '^VENDIDO') { $phone = '' }
    if ($email -eq '(en blanco)' -or $email -eq '-') { $email = '' }

    if ([string]::IsNullOrEmpty($phone) -and [string]::IsNullOrEmpty($email)) { continue }

    $phoneEsc = $phone -replace "'", "''"
    # Tomar solo el primer email
    $firstEmail = ($email -split '[;,/ ]')[0].Trim() -replace "'", "''"
    $firstEmail = $firstEmail -replace '"', ''

    $setClauses = @()
    if (-not [string]::IsNullOrEmpty($phone)) {
        $setClauses += "phone = '$phoneEsc'"
    }
    if (-not [string]::IsNullOrEmpty($firstEmail) -and $firstEmail -match '@') {
        $setClauses += "email = '$firstEmail'"
    }

    if ($setClauses.Count -eq 0) { continue }
    $setStr = $setClauses -join ', '

    # Preferir actualizar por CUIT si está disponible y es válido
    if (-not [string]::IsNullOrEmpty($cuit) -and $cuit.Length -ge 10 -and $cuit -ne '0') {
        $updates += "UPDATE companies SET $setStr WHERE tenant_id = 3 AND cuit = '$cuit' AND company_type = 'client';"
    } else {
        # Fallback: por nombre ILIKE  
        $legalNameEsc = $legalName -replace "'", "''"
        $updates += "UPDATE companies SET $setStr WHERE tenant_id = 3 AND legal_name ILIKE '$($legalNameEsc.Trim())' AND company_type = 'client';"
    }
}

$updates | Out-File -FilePath $outSql -Encoding UTF8
Write-Host "Total UPDATEs: $($updates.Count)"
