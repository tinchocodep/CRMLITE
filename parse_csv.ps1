$lines = Get-Content "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\SOLDO-CLIENTE-raw.txt" -Encoding UTF8
$results = @()

foreach ($line in $lines) {
    $cols = $line -split ";"
    if ($cols.Count -lt 2) { continue }
    
    $comercial = $cols[0].Trim()
    $cliente   = $cols[1].Trim()
    $cuit      = if ($cols.Count -gt 2) { $cols[2].Trim() } else { "" }
    $contacto  = if ($cols.Count -gt 3) { $cols[3].Trim() } else { "" }
    $telefono  = if ($cols.Count -gt 4) { $cols[4].Trim() } else { "" }
    $email     = if ($cols.Count -gt 5) { $cols[5].Trim() } else { "" }
    
    # Ignorar encabezado, filas vacías, totales y "en blanco"
    if ($comercial -match "Cliente/prospecto|Total general|^\s*$") { continue }
    if ($cliente -match "^\s*$|en blanco|CLIENTE") { continue }
    if ($comercial -match "en blanco") { continue }
    
    $results += [PSCustomObject]@{
        Comercial = $comercial
        Cliente   = $cliente
        CUIT      = $cuit -replace "[^0-9]",""
        Contacto  = $contacto
        Telefono  = $telefono
        Email     = $email
    }
}

# Guardar resultado
$results | Export-Csv "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\CLIENTES-parsed.csv" -Delimiter "|" -NoTypeInformation -Encoding UTF8
Write-Host "Total registros: $($results.Count)"
$results | ForEach-Object { "$($_.Comercial) >>> $($_.Cliente) | CUIT: $($_.CUIT)" }
