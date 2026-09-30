const fs = require('fs');

const path = 'C:/Users/enrico/Downloads/site/script.js';
let content = fs.readFileSync(path, 'utf8');

// Remover a parte quebrada do script
if (content.includes('// --- L')) {
    content = content.split('// --- L')[0];
}

const rankingScript = `
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
                html += \`
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
                \`;
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
fetchRanking();
`;

content = content.trim() + '\n\n' + rankingScript;

fs.writeFileSync(path, content, 'utf8');
console.log('done');
