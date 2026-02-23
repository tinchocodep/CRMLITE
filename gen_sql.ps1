$rawLines = Get-Content "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\SOLDO-CLIENTE-raw.txt" -Encoding UTF8

$sqlLines = @()
$sqlLines += "-- Clientes Soldo Hue (tenant 3)"
$sqlLines += "INSERT INTO companies (legal_name, cuit, phone, email, company_type, label, tenant_id, comercial_id)"
$sqlLines += "SELECT"
$sqlLines += "  tc.legal_name,"
$sqlLines += "  NULLIF(tc.cuit,''),"
$sqlLines += "  NULLIF(tc.telefono,''),"
$sqlLines += "  NULLIF(LOWER(tc.email),''),"
$sqlLines += "  'empresa' AS company_type,"
$sqlLines += "  'client' AS label,"
$sqlLines += "  3 AS tenant_id,"
$sqlLines += "  c.id AS comercial_id"
$sqlLines += "FROM (VALUES"

$values = @()
$skipPatterns = @("Cliente/prospecto","Total general","Elemental","^\s*$")

foreach ($line in $rawLines) {
    $cols = $line -split ";"
    if ($cols.Count -lt 2) { continue }
    
    $comercial = $cols[0].Trim()
    $cliente   = $cols[1].Trim()
    $cuit      = if ($cols.Count -gt 2) { ($cols[2].Trim() -replace "[^0-9]","") } else { "" }
    $tel       = if ($cols.Count -gt 4) { $cols[4].Trim() } else { "" }
    $mail      = if ($cols.Count -gt 5) { $cols[5].Trim().ToLower() } else { "" }
    
    $skip = $false
    foreach ($p in $skipPatterns) { if ($comercial -match $p) { $skip = $true; break } }
    if ($skip) { continue }
    if ($cliente -match "en blanco|^\s*$|CLIENTE") { continue }
    if ($comercial -match "en blanco") { continue }
    
    # Sanitize for SQL
    $comercial = $comercial -replace "'","''"
    $cliente   = $cliente -replace "'","''"
    $tel       = $tel -replace "'","''"
    $mail      = $mail -replace "'","''"
    
    $values += "  ('$comercial','$cliente','$cuit','$tel','$mail')"
}

# Join con coma menos la última
for ($i = 0; $i -lt $values.Count; $i++) {
    if ($i -lt $values.Count - 1) {
        $sqlLines += $values[$i] + ","
    } else {
        $sqlLines += $values[$i]
    }
}

$sqlLines += ") AS tc(comercial_nombre, legal_name, cuit, telefono, email)"
$sqlLines += "LEFT JOIN comerciales c ON UPPER(c.name) = UPPER(tc.comercial_nombre) AND c.tenant_id = 3"
$sqlLines += "ON CONFLICT DO NOTHING;"

$sqlLines | Set-Content "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\import_clientes.sql" -Encoding UTF8
Write-Host "SQL generado con $($values.Count) registros"
