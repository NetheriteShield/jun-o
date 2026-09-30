$path = "C:\Users\enrico\Downloads\site\script.js"
$content = Get-Content -Path $path -Raw -Encoding UTF8

if ($content -notmatch 'fetchRanking\(\)') {
    $rankingScript = @"

// --- Lógica do Ranking do Ping Pong ---
async function fetchRanking() {
    const container = document.getElementById('ranking-container');
    if (!container) return;

    try {
        const response = await fetch('../jogo/api/get_ranking.php');
        const data = await response.json();

        if (data.success && data.ranking && data.ranking.length > 0) {
            let html = '<div class="ranking-list">';
            data.ranking.forEach((player, index) => {
                const medal = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : (index + 1 + 'º')));
                html += `
                    <div class="ranking-item">
                        <div class="ranking-pos">\${medal}</div>
                        <div class="ranking-info">
                            <strong>\${player.nome}</strong> (\${player.instagram})
                            <br><small>\${player.curso}</small>
                        </div>
                        <div class="ranking-score">
                            <strong>\${player.melhor_score}</strong> pts
                            <br><small>\${player.max_rallies} rebatidas</small>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="text-align:center; color: var(--text-muted);">Nenhum jogador registrado nesta semana ainda.</p>';
        }
    } catch (error) {
        console.error('Erro ao buscar ranking:', error);
        container.innerHTML = '<p style="text-align:center; color: #ef4444;">Erro ao carregar o ranking.</p>';
    }
}

// Chamar quando a aba ranking for clicada ou no load inicial
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (e.target.dataset.target === 'ranking') {
            fetchRanking();
        }
    });
});
// Tenta carregar caso a aba seja a inicial (embora não seja por padrão)
fetchRanking();
"@
    $content = $content + "`n" + $rankingScript
}

Set-Content -Path $path -Value $content -Encoding UTF8
Write-Host "JS updated"
