
# Script para importar clientes Potenza al CSV -> SQL
$inputFile = "C:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\potenza_tmp.csv"
$outputFile = "C:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\potenza_insert.sql"

# Leer con encoding iso-8859-1
$enc = [System.Text.Encoding]::GetEncoding("iso-8859-1")
$lines = [System.IO.File]::ReadAllLines($inputFile, $enc)

# Filtrar lineas vacías
$lines = $lines | Where-Object { $_.Trim() -ne "" }

Write-Host "Total lines (including header): $($lines.Count)"

# Parse header para identificar índices
$header = $lines[0] -split ";"
Write-Host "Column count: $($header.Count)"
for ($i = 0; $i -lt $header.Count; $i++) {
    $colName = $header[$i].Trim().ToLower()
    Write-Host "$i -> $($header[$i].Trim())"
}

# Identificar índices clave
$idxNombre = -1
$idxApellido = -1
$idxRazonSocial = -1
$idxCuit = -1
$idxEmail = -1
$idxTelefono = -1

for ($i = 0; $i -lt $header.Count; $i++) {
    $col = $header[$i].Trim().ToLower()
    if ($col -match "nombre") { $idxNombre = $i }
    if ($col -match "apellido") { $idxApellido = $i }
    if ($col -match "raz") { $idxRazonSocial = $i }
    if ($col -match "n.?\s*cuil") { $idxCuit = $i }
    if ($col -match "email") { $idxEmail = $i }
    if ($col -match "telefono") { $idxTelefono = $i }
}

Write-Host "Indices: Nombre=$idxNombre, Apellido=$idxApellido, RazonSocial=$idxRazonSocial, Cuit=$idxCuit, Email=$idxEmail, Telefono=$idxTelefono"

# Generar SQL
$sqlLines = @()
$sqlLines += "-- Importacion de clientes Potenza (tenant_id=2)"
$sqlLines += "INSERT INTO companies (company_type, legal_name, trade_name, cuit, email, phone, tenant_id, is_active, status) VALUES"

$valueLines = @()
$skipped = 0

for ($i = 1; $i -lt $lines.Count; $i++) {
    $cols = $lines[$i] -split ";"
    
    # Obtener valores
    $nombre = if ($idxNombre -ge 0 -and $cols.Count -gt $idxNombre) { $cols[$idxNombre].Trim() } else { "" }
    $apellido = if ($idxApellido -ge 0 -and $cols.Count -gt $idxApellido) { $cols[$idxApellido].Trim() } else { "" }
    $razonSocial = if ($idxRazonSocial -ge 0 -and $cols.Count -gt $idxRazonSocial) { $cols[$idxRazonSocial].Trim() } else { "" }
    $cuit = if ($idxCuit -ge 0 -and $cols.Count -gt $idxCuit) { $cols[$idxCuit].Trim() } else { "" }
    $email = if ($idxEmail -ge 0 -and $cols.Count -gt $idxEmail) { $cols[$idxEmail].Trim() } else { "" }
    $telefono = if ($idxTelefono -ge 0 -and $cols.Count -gt $idxTelefono) { $cols[$idxTelefono].Trim() } else { "" }
    
    # Saltar filas sin razon social y sin cuit
    if ($razonSocial -eq "" -and $cuit -eq "") {
        $skipped++
        continue
    }
    
    # Generar trade_name = Nombre + Apellido
    $tradeName = ("$nombre $apellido").Trim()
    if ($tradeName -eq "") { $tradeName = $razonSocial }
    
    # Usar razón social si está vacía, usar trade_name como fallback
    $legalName = if ($razonSocial -ne "") { $razonSocial } else { $tradeName }
    
    # Escapar comillas simples
    $legalName = $legalName -replace "'", "''"
    $tradeName = $tradeName -replace "'", "''"
    $email = $email -replace "'", "''"
    $telefono = $telefono -replace "'", "''"
    $cuit = $cuit -replace "[^0-9]", ""  # Solo números en cuit
    
    # CUIT vacío -> usar placeholder
    if ($cuit -eq "") { $cuit = "00000000000" }
    
    # Email null si vacío
    $emailSql = if ($email -ne "") { "'$email'" } else { "NULL" }
    $telefonoSql = if ($telefono -ne "") { "'$telefono'" } else { "NULL" }
    
    $valueLines += "('client', '$legalName', '$tradeName', '$cuit', $emailSql, $telefonoSql, 2, true, 'active')"
}

Write-Host "Rows to insert: $($valueLines.Count), Skipped: $skipped"

# Unir con comas y terminar con punto y coma
if ($valueLines.Count -gt 0) {
    $sql = $sqlLines -join "`n"
    $sql += "`n" + ($valueLines -join ",`n") + ";"
    
    [System.IO.File]::WriteAllText($outputFile, $sql, [System.Text.Encoding]::UTF8)
    Write-Host "SQL generado en: $outputFile"
} else {
    Write-Host "ERROR: No se generaron filas"
}
