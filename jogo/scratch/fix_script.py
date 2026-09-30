import re

with open('C:/Users/enrico/Downloads/site/script.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Strip out the broken ranking logic
if '// --- Lógica do Ranking' in content:
    content = content.split('// --- Lógica do Ranking')[0]
elif '// --- Lgica' in content:
    content = content.split('// --- Lgica')[0]

# Add it back properly
ranking_script = """
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
                        <div class="ranking-pos">${medal}</div>
                        <div class="ranking-info">
                            <strong>${player.nome}</strong> (${player.instagram})
                            <br><small>${player.curso}</small>
                        </div>
                        <div class="ranking-score">
                            <strong>${player.melhor_score}</strong> pts
                            <br><small>${player.max_rallies} rebatidas</small>
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
fetchRanking();
"""

content = content.strip() + '\n\n' + ranking_script

with open('C:/Users/enrico/Downloads/site/script.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
