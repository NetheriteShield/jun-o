import re

try:
    with open('C:/Users/enrico/Downloads/site/index.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Add button to nav
    nav_button = '<button class="nav-btn" data-target="ranking">Ranking</button>'
    if 'data-target="ranking"' not in content:
        content = re.sub(r'(<button class="nav-btn" data-target="premiacao">.*?</button>)', r'\1\n                ' + nav_button, content)

    # Add section to main
    ranking_section = '''
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
'''
    if 'id="ranking"' not in content:
        content = re.sub(r'(</main>)', ranking_section + r'\1', content)

    with open('C:/Users/enrico/Downloads/site/index.html', 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("HTML updated")
except Exception as e:
    print(e)
