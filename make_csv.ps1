$inputFile = "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\SOLDO-CLIENTE-raw.txt"
$outputFile = "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\clientes_clean.csv"

$lines = Get-Content $inputFile
$out = @("comercial,legal_name,cuit,telefono")

foreach ($l in $lines) {
    $c = $l -split ";"
    if ($c.Count -lt 2) { continue }
    
    $com = $c[0].Trim()
    $nom = $c[1].Trim()
    $cui = if ($c.Count -gt 2) { $c[2].Trim() -replace "[^0-9]","" } else { "" }
    $tel = if ($c.Count -gt 4) { $c[4].Trim() } else { "" }
    
    if ($com -match "^\s*$|en blanco|Total|Cliente|Elemental") { continue }
    if ($nom -match "^\s*$|en blanco|CLIENTE") { continue }
    
    $row = "`"$com`",`"$nom`",`"$cui`",`"$tel`""
    $out += $row
}

$out | Set-Content $outputFile -Encoding UTF8
Write-Host "Registros: $($out.Count - 1)"
