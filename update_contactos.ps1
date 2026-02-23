
# update_contactos.ps1
# Lee el CSV de clientes y genera SQL UPDATE para poblar phone y email

$csvPath = "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\SOLDO-CLIENTE-raw.txt"
$outSql  = "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\update_contactos_clientes.sql"

$lines = Get-Content -Path $csvPath -Encoding UTF8

$updates = @()

foreach ($line in $lines) {
    # Saltar cabeceras y totales
    if ($line -match '^\s*$') { continue }
    if ($line -match '^Cliente/prospecto') { continue }
    if ($line -match '^Elemental') { continue }
    if ($line -match '^Total general') { continue }
    if ($line -match '^^^^^^^^;') { continue }

    $parts = $line -split ';'
    if ($parts.Count -lt 6) { continue }

    $legalName = $parts[1].Trim()
    $phone     = $parts[4].Trim()
    $email     = $parts[5].Trim()

    # Saltar si no hay legal_name
    if ([string]::IsNullOrEmpty($legalName)) { continue }
    if ($legalName -eq '(en blanco)') { continue }

    # Limpiar phone
    if ($phone -eq '(en blanco)' -or $phone -eq '-') { $phone = '' }
    # Limpiar email 
    if ($email -eq '(en blanco)' -or $email -eq '-') { $email = '' }

    # Solo generar UPDATE si hay algo que actualizar
    if ([string]::IsNullOrEmpty($phone) -and [string]::IsNullOrEmpty($email)) { continue }

    # Escapar comillas simples para SQL
    $legalNameEsc = $legalName -replace "'", "''"
    $phoneEsc     = $phone  -replace "'", "''"
    $emailEsc     = $email  -replace "'", "''"

    $setClauses = @()
    if (-not [string]::IsNullOrEmpty($phone)) {
        $setClauses += "phone = '$phoneEsc'"
    }
    if (-not [string]::IsNullOrEmpty($email)) {
        # Si hay múltiples emails separados por '/', ',' o ';', tomamos solo el primero
        $firstEmail = ($emailEsc -split '[;,/]')[0].Trim()
        if (-not [string]::IsNullOrEmpty($firstEmail)) {
            $setClauses += "email = '$firstEmail'"
        }
    }

    if ($setClauses.Count -eq 0) { continue }

    $setStr = $setClauses -join ', '
    $updates += "UPDATE companies SET $setStr WHERE tenant_id = 3 AND legal_name = '$legalNameEsc' AND company_type = 'client';"
}

# Escribir SQL
$updates | Out-File -FilePath $outSql -Encoding UTF8

Write-Host "Total UPDATEs generados: $($updates.Count)"
Write-Host "Archivo: $outSql"
