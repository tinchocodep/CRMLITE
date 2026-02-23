
# insert_via_api.ps1 - Insertar clientes Potenza via Supabase REST API
$supabaseUrl = "https://zydrtycqvhqleiuovfnu.supabase.co"
$serviceKey = ""

# Buscar la service key en el .env
$envPaths = @(
    "C:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\.env",
    "C:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\.env.local"
)
foreach ($envPath in $envPaths) {
    if (Test-Path $envPath) {
        Get-Content $envPath | ForEach-Object {
            if ($_ -match "VITE_SUPABASE_SERVICE_KEY=(.+)") { $serviceKey = $matches[1].Trim() }
            if ($_ -match "SUPABASE_SERVICE_ROLE_KEY=(.+)") { $serviceKey = $matches[1].Trim() }
            if ($_ -match "VITE_SUPABASE_ANON_KEY=(.+)" -and $serviceKey -eq "") { $serviceKey = $matches[1].Trim() }
        }
        Write-Host "Loaded .env from $envPath"
        break
    }
}

if ($serviceKey -eq "") {
    Write-Host "ERROR: No key found in .env files"
    Write-Host "Available .env content:"
    Get-Content "C:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\.env" -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "Using key: $($serviceKey.Substring(0,20))..."

# Leer CSV
$enc = [System.Text.Encoding]::GetEncoding("iso-8859-1")
$lines = [System.IO.File]::ReadAllLines("C:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\potenza_tmp.csv", $enc)
$lines = $lines | Where-Object { $_.Trim() -ne "" }

$idxNombre = 1; $idxApellido = 2; $idxRazonSocial = 3; $idxCuit = 10; $idxEmail = 20; $idxTelefono = 21

$records = @()
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
    $cuit = if ($cuit -eq "") { "00000000000" } else { $cuit }
    
    $record = [ordered]@{
        company_type = "client"
        legal_name   = $legalName
        trade_name   = $tradeName
        cuit         = $cuit
        tenant_id    = 2
        is_active    = $true
        status       = "active"
    }
    if ($email -ne "") { $record.email = $email }
    if ($telefono -ne "") { $record.phone = $telefono }
    
    $records += $record
}

Write-Host "Records to insert: $($records.Count)"

# Insertar en batches de 50 via REST API
$batchSize = 50
$inserted = 0
$errors = 0

for ($start = 0; $start -lt $records.Count; $start += $batchSize) {
    $end = [Math]::Min($start + $batchSize - 1, $records.Count - 1)
    $batch = $records[$start..$end]
    
    $jsonBody = $batch | ConvertTo-Json -Depth 3
    
    $headers = @{
        "apikey"        = $serviceKey
        "Authorization" = "Bearer $serviceKey"
        "Content-Type"  = "application/json"
        "Prefer"        = "return=minimal"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/companies" `
            -Method POST `
            -Headers $headers `
            -Body $jsonBody `
            -ErrorAction Stop
        $inserted += $batch.Count
        Write-Host "Batch $([Math]::Ceiling($start / $batchSize) + 1) OK: $($batch.Count) rows inserted (total: $inserted)"
    } catch {
        $errors++
        Write-Host "Batch $([Math]::Ceiling($start / $batchSize) + 1) ERROR: $_"
        Write-Host "Response: $($_.Exception.Response)"
    }
}

Write-Host "`n=== RESULT ==="
Write-Host "Inserted: $inserted"
Write-Host "Errors: $errors"
