$root = "src"
$cwd = (Get-Location).Path
$files = Get-ChildItem -Path $root -Recurse -File -Include *.ts,*.tsx
$result = @()
foreach ($f in $files) {
    $full = $f.FullName
    $rel = $full.Replace($cwd + '\\', '')
    $name = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)

    # Search for basename occurrences across src (recursively) by piping files into Select-String, exclude the file itself
    $matches = Get-ChildItem -Path $root -Recurse -File | Select-String -Pattern $name -SimpleMatch | Where-Object { $_.Path -ne $full }
    if ($matches.Count -eq 0) {
        $result += $rel
    }
}
$result = $result | Sort-Object
$outFile = ".\unused_files.txt"
$result | Out-File $outFile -Encoding utf8
Write-Output "WROTE $outFile with $($result.Count) entries"
Write-Output "---LIST START---"
$result
Write-Output "---LIST END---"