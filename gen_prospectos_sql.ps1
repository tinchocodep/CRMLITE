$csvPath = "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\prospectos_clean.csv"
$sqlPath = "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\import_prospectos.sql"

# Mapa de comerciales Soldo Hue (tenant 3)
$comercialMap = @{
    "SOLER, CARLOS"       = "281c0f9b-9a2e-420b-a782-b2a92a107c3f"
    "BERMEJO, JUAN MANUEL"= "7c33ea28-a88b-4ee1-b57e-d605faca92b3"
    "Galindez, Santiago"  = "2993e3fc-f2cc-4323-a604-db8b06f784da"
    "SANTIAGO GALINDEZ"   = "2993e3fc-f2cc-4323-a604-db8b06f784da"
    "Ganza, Facundo"      = "ac1b77a4-5e69-482c-8e08-09657f04c9ec"
    "GANZA, FACUNDO"      = "ac1b77a4-5e69-482c-8e08-09657f04c9ec"
    "jose"                = "1d6877cd-8dfa-4d9b-992c-0f3c26006ec7"
    "JOSE"                = "1d6877cd-8dfa-4d9b-992c-0f3c26006ec7"
    "JUAN LOPEZ"          = "8c60db2c-2fc3-4f87-a814-f388bc8a8b15"
    "LUIS SERAN"          = "648882f5-4d10-4c18-a366-79475920bc84"
    "MIA VICENTE"         = "e669576b-8250-406b-9b04-20ddaeedeefb"
}

$lines = Import-Csv $csvPath -Header @("comercial","legal_name","cuit","telefono") | Select-Object -Skip 1

$values = @()
foreach ($row in $lines) {
    $com   = $row.comercial.Trim().Trim('"')
    $nom   = $row.legal_name.Trim().Trim('"')
    $cuit  = $row.cuit.Trim().Trim('"') -replace "[^0-9]",""
    $tel   = $row.telefono.Trim().Trim('"')
    
    if ($com -match "^\s*$" -or $nom -match "^\s*$") { continue }
    
    $comId = $comercialMap[$com]
    if (-not $comId) { $comId = "NULL"; $comStr = "NULL" } else { $comStr = "'$comId'" }
    
    # Escapar comillas simples
    $nom  = $nom  -replace "'", "''"
    $tel  = $tel  -replace "'", "''"
    if ($tel -match "en blanco|^\?+$|-$") { $tel = "" }
    
    # CUIT: si vacío o 0, generar pseudo-cuit con md5
    if ($cuit -eq "" -or $cuit -eq "0") {
        $cuitSql = "'SD-'||substr(md5('PROS$($nom.Substring(0, [Math]::Min($nom.Length,10)))'), 1, 8)"
    } else {
        $cuitSql = "'$cuit'"
    }
    
    $telSql = if ($tel -ne "") { "'$tel'" } else { "NULL" }
    
    $values += "($cuitSql, '$nom', $telSql, 'prospect', 'contacted', true, 3, $comStr)"
}

$sql = @"
INSERT INTO companies (cuit, legal_name, phone, company_type, status, is_active, tenant_id, comercial_id)
VALUES
$(($values | Select-Object -First 100) -join ",`n")
ON CONFLICT DO NOTHING;
"@

$sql | Set-Content $sqlPath -Encoding UTF8
Write-Host "Valores generados: $($values.Count)"
