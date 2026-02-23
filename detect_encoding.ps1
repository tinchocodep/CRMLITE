
# Intentar leer con encoding Latin-1 y mostrar bytes del inicio para detectar BOM
$rawPath = "c:\Users\ASUS Tuf\Documents\GitHub\CRMLITE\SOLDO-PROSPECTO-raw.csv"

# Mostrar primeros bytes para detectar encoding
$bytes = [System.IO.File]::ReadAllBytes($rawPath)
Write-Host "Primeros 20 bytes (hex):"
$bytes[0..19] | ForEach-Object { Write-Host -NoNewline "$($_.ToString('X2')) " }
Write-Host ""

# El archivo puede ser UTF-16 LE (BOM FF FE) o UTF-16 BE (FE FF)
# Detectar
if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) {
    Write-Host "Encoding: UTF-16 LE"
    $enc = [System.Text.Encoding]::Unicode
} elseif ($bytes[0] -eq 0xFE -and $bytes[1] -eq 0xFF) {
    Write-Host "Encoding: UTF-16 BE"
    $enc = [System.Text.Encoding]::BigEndianUnicode
} elseif ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Write-Host "Encoding: UTF-8 BOM"
    $enc = [System.Text.Encoding]::UTF8
} else {
    Write-Host "Encoding: Latin-1/1252 (sin BOM)"
    $enc = [System.Text.Encoding]::GetEncoding(1252)
}

$text  = $enc.GetString($bytes)
$lines = $text -split "`r?`n"

Write-Host "`n=== LÍNEAS 0-5 ==="
for ($i = 0; $i -le 5; $i++) {
    Write-Host "L$i: $($lines[$i])"
}

# Buscar primera línea real con datos
$firstData = ""
for ($j = 0; $j -lt $lines.Count; $j++) {
    $l = $lines[$j].Trim()
    if ($l.Length -gt 10 -and $l -notmatch "^Cliente" -and $l -notmatch "^Elemental" -and $l -notmatch "^Total") {
        $firstData = $l
        Write-Host "`nPrimera fila de datos (linea $j): $firstData"
        $parts = $firstData -split ';'
        for ($i = 0; $i -lt $parts.Count; $i++) {
            Write-Host "  Col $i -> '$($parts[$i].Trim())'"
        }
        break
    }
}
