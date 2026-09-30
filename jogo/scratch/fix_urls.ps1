$indexPath = "C:\Users\enrico\Downloads\site\index.html"
$indexContent = Get-Content -Path $indexPath -Raw -Encoding UTF8

# Fix the href for the "Jogar Agora" button
$indexContent = $indexContent -replace 'href="juncaogame\.ct\.ws"', 'href="http://juncaogame.ct.ws"'

Set-Content -Path $indexPath -Value $indexContent -Encoding UTF8
Write-Host "index.html updated"

$scriptPath = "C:\Users\enrico\Downloads\site\script.js"
$scriptContent = Get-Content -Path $scriptPath -Raw -Encoding UTF8

# Fix the fetch URL
$scriptContent = $scriptContent -replace "await fetch\('\.\./jogo/api/get_ranking\.php'\);", "await fetch('http://juncaogame.ct.ws/api/get_ranking.php');"

Set-Content -Path $scriptPath -Value $scriptContent -Encoding UTF8
Write-Host "script.js updated"
