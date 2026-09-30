$path = "C:\Users\enrico\Downloads\site\index.html"
$content = Get-Content -Path $path -Raw -Encoding UTF8

if ($content -notmatch 'data-target="ranking"') {
    $navButton = '<button class="nav-btn" data-target="ranking">Ranking</button>'
    $content = $content -replace '(<button class="nav-btn" data-target="premiacao">.*?</button>)', "`$1`n                $navButton"
}

if ($content -notmatch 'id="ranking"') {
    $rankingSection = @"
            <!-- Ranking Tab -->
            <section id="ranking" class="tab-content">
                <div class="constitution-layout">
                    <h2>🏆 Ranking da Semana</h2>
                    <p class="manifesto">Os melhores jogadores de Ping Pong. O ranking reseta toda sexta-feira às 00:00.</p>
                    <div class="rules-container" id="ranking-container">
                        <p style="text-align:center; color: var(--text-muted);">Carregando ranking...</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="../jogo/index.html" target="_blank" class="btn-join" style="text-decoration:none; display:inline-block;">Jogar Agora 🏓</a>
                    </div>
                </div>
            </section>
"@
    $content = $content -replace '(</main>)', "$rankingSection`n`$1"
}

Set-Content -Path $path -Value $content -Encoding UTF8
Write-Host "HTML updated"
