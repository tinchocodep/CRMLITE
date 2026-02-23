
$rawPath = "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\SOLDO-PROSPECTO-raw.csv"
$bytes = [System.IO.File]::ReadAllBytes($rawPath)
$enc   = [System.Text.Encoding]::GetEncoding(1252)
$text  = $enc.GetString($bytes)
$lines = $text -split "`n"

Write-Host "=== HEADER ==="
Write-Host $lines[0]
$parts = $lines[0] -split ';'
for ($i = 0; $i -lt $parts.Count; $i++) {
    Write-Host "$i -> '$($parts[$i].Trim())'"
}

Write-Host "`n=== PRIMERA FILA DE DATOS ==="
$dataLine = ""
for ($j = 1; $j -lt $lines.Count; $j++) {
    $l = $lines[$j].Trim()
    if ($l -ne "" -and $l -notmatch "^Cliente/prospecto" -and $l -notmatch "^Elemental" -and $l -notmatch "^Total general") {
        $dataLine = $l
        break
    }
}
Write-Host $dataLine
$dparts = $dataLine -split ';'
for ($i = 0; $i -lt $dparts.Count; $i++) {
    Write-Host "$i -> '$($dparts[$i].Trim())'"
}
