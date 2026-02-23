
# Script: insert_potenza_supabase.ps1
# Lee el CSV, genera SQL por batches y los ejecuta contra Supabase via REST API

param(
    [string]$SupabaseUrl = "https://zydrtycqvhqleiuovfnu.supabase.co",
    [string]$AnonKey = ""  # Se leerá del .env
)

# Leer anon key del .env si existe
$envFile = "C:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "VITE_SUPABASE_ANON_KEY=(.+)") {
            $AnonKey = $matches[1].Trim()
        }
        if ($_ -match "VITE_SUPABASE_URL=(.+)") {
            $SupabaseUrl = $matches[1].Trim()
        }
    }
    Write-Host "Loaded from .env: URL=$SupabaseUrl"
} else {
    Write-Host ".env not found, using hardcoded values"
    $SupabaseUrl = "https://zydrtycqvhqleiuovfnu.supabase.co"
}

# Leer CSV
$enc = [System.Text.Encoding]::GetEncoding("iso-8859-1")
$lines = [System.IO.File]::ReadAllLines("C:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\potenza_tmp.csv", $enc)
$lines = $lines | Where-Object { $_.Trim() -ne "" }

$idxNombre = 1; $idxApellido = 2; $idxRazonSocial = 3; $idxCuit = 10; $idxEmail = 20; $idxTelefono = 21

# Ya insertamos filas 1-9 (primeras 9 del CSV, después del header)
# Empezamos desde fila 10 (índice 10 en $lines considerando que 0=header)
$allValues = @()
for ($i = 10; $i -lt $lines.Count; $i++) {
    $cols = $lines[$i] -split ";"
    if ($cols.Count -lt 11) { continue }
    
    $nombre = $cols[$idxNombre].Trim()
    $apellido = $cols[$idxApellido].Trim()
    $razonSocial = $cols[$idxRazonSocial].Trim()
    $cuit = ($cols[$idxCuit].Trim() -replace "[^0-9]", "")
    $email = if ($cols.Count -gt $idxEmail) { $cols[$idxEmail].Trim() } else { "" }
    $telefono = if ($cols.Count -gt $idxTelefono) { $cols[$idxTelefono].Trim() } else { "" }
    
    if ($razonSocial -eq "" -and $cuit -eq "") { continue }
    
    $tradeName = ("$nombre $apellido").Trim()
    if ($tradeName -eq "") { $tradeName = $razonSocial }
    $legalName = if ($razonSocial -ne "") { $razonSocial } else { $tradeName }
    
    $legalName = $legalName -replace "'", "''"
    $tradeName = $tradeName -replace "'", "''"
    $email = $email -replace "'", "''"
    $cuit = if ($cuit -eq "") { "00000000000" } else { $cuit }
    
    $emailSql = if ($email -ne "") { "'$email'" } else { "NULL" }
    $telefonoSql = if ($telefono -ne "") { "'$($telefono -replace "'","''")'" } else { "NULL" }
    
    $allValues += "('client', '$legalName', '$tradeName', '$cuit', $emailSql, $telefonoSql, 2, true, 'active')"
}

Write-Host "Rows remaining to insert: $($allValues.Count)"

# Generar un archivo SQL por batch de 40
$batchSize = 40; $batchNum = 1
for ($start = 0; $start -lt $allValues.Count; $start += $batchSize) {
    $end = [Math]::Min($start + $batchSize - 1, $allValues.Count - 1)
    $batchVals = $allValues[$start..$end]
    $sql = "INSERT INTO companies (company_type, legal_name, trade_name, cuit, email, phone, tenant_id, is_active, status) VALUES`n"
    $sql += ($batchVals -join ",`n") + ";"
    $outFile = "C:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\real_batch_$batchNum.sql"
    [System.IO.File]::WriteAllText($outFile, $sql, [System.Text.Encoding]::UTF8)
    Write-Host "Batch $batchNum saved ($($batchVals.Count) rows): $outFile"
    $batchNum++
}
Write-Host "Done. Total batches: $($batchNum - 1)"
