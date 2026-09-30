document.addEventListener('DOMContentLoaded', () => {

    /* ── TAB SWITCHING ─────────────────────────── */
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            const target = document.getElementById(btn.dataset.target);
            if (target) target.classList.add('active');
        });
    });

    /* ── CARD ENTRANCE ANIMATION ───────────────── */
    const cards = document.querySelectorAll('.member-card');

    const entranceObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entranceObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
        card.style.transition = `opacity .4s ease ${i * 35}ms, transform .4s ease ${i * 35}ms, border-left-color .25s ease, padding-left .25s ease, background .25s ease`;
        entranceObserver.observe(card);
    });

    /* ── STICKY PHOTO ON SCROLL & HOVER ────────── */
    const stickyPanel = document.getElementById('sticky-panel');
    const stickyImg = document.getElementById('sticky-photo');
    const stickyLabel = document.getElementById('sticky-label');

    if (stickyPanel && stickyImg) {
        const updateStickyPhoto = (card) => {
            if (!card) return;
            const photo = card.getAttribute('data-photo');
            const name = card.querySelector('.member-name')?.textContent || '';
            const nick = card.querySelector('.member-nickname')?.textContent || '';

            cards.forEach(c => c.classList.remove('is-active'));
            card.classList.add('is-active');

            if (photo) {
                stickyImg.src = photo;
                stickyLabel.textContent = nick ? `${name} ${nick}` : name;
                stickyPanel.classList.add('has-photo');
            } else {
                stickyPanel.classList.remove('has-photo');
                stickyImg.src = '';
                stickyLabel.textContent = '';
            }
        };

        // Hover effect on PC
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                updateStickyPhoto(card);
            });
        });

        // IntersectionObserver for scroll tracking
        const photoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateStickyPhoto(entry.target);
                }
            });
        }, {
            rootMargin: '-15% 0px -50% 0px',
            threshold: 0
        });

        cards.forEach(card => photoObserver.observe(card));

        // Default initialization on page load
        if (cards.length > 0) {
            updateStickyPhoto(cards[0]);
        }
    }

    /* ── MODAL ─────────────────────────────────── */
    const modalOverlay = document.getElementById('member-modal');
    const modalImg = document.getElementById('modal-img');
    const modalInfo = document.getElementById('modal-info');
    const modalIg = document.getElementById('modal-instagram');
    const closeBtn = document.querySelector('.close-modal');

    function openModal(card) {
        const photo = card.getAttribute('data-photo');
        const igBtn = card.querySelector('.instagram-btn');

        if (photo) {
            modalImg.src = photo;
            modalImg.style.display = 'block';
        } else {
            modalImg.style.display = 'none';
        }

        modalInfo.innerHTML = card.querySelector('.member-info')?.innerHTML || '';
        modalIg.href = igBtn?.href || '#';
        modalIg.innerHTML = igBtn?.innerHTML || '';

        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    cards.forEach(card => {
        card.addEventListener('click', e => {
            if (e.target.closest('a')) return;
            openModal(card);
        });
    });

    closeBtn?.addEventListener('click', closeModal);
    modalOverlay?.addEventListener('click', e => {
        if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });
});


const firebaseConfig = {
  apiKey: "AIzaSyD2s1LzGVJxVOTHwDFlUpXbNRc7qJ8UCRU",
  authDomain: "juncao-cee81.firebaseapp.com",
  projectId: "juncao-cee81",
  storageBucket: "juncao-cee81.firebasestorage.app",
  messagingSenderId: "182504701486",
  appId: "1:182504701486:web:7b3bec033f812f7caf69bf",
  measurementId: "G-6NHNNXRLXL"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- Lógica do Ranking do Ping Pong com Firebase ---
async function fetchRanking() {
    const container = document.getElementById('ranking-container');
    if (!container) return;

    try {
        const scoresRef = db.collection("scores");
        const querySnapshot = await scoresRef.orderBy("score", "desc").limit(50).get();

        let ranking = [];
        querySnapshot.forEach((doc) => {
            ranking.push(doc.data());
        });

        // Filtrar instagrams duplicados, mantendo apenas a maior pontuação de cada
        let uniqueRanking = [];
        let seenInstas = new Set();
        for (let player of ranking) {
            if (!seenInstas.has(player.instagram)) {
                uniqueRanking.push(player);
                seenInstas.add(player.instagram);
            }
        }
        
        // Limitar aos top 10
        uniqueRanking = uniqueRanking.slice(0, 10);

        if (uniqueRanking.length > 0) {
            let html = '<div class="ranking-list">';
            uniqueRanking.forEach((player, index) => {
                const medal = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : (index + 1 + 'º')));
                html += `
                    <div class="ranking-item">
                        <div class="ranking-pos">${medal}</div>
                        <div class="ranking-info">
                            <strong>${player.nome}</strong> (${player.instagram})
                            <br><small>${player.curso}</small>
                        </div>
                        <div class="ranking-score">
                            <strong>${player.score}</strong> pts
                            <br><small>${player.rallies} rebatidas</small>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="text-align:center; color: var(--muted);">Nenhum jogador registrado nesta semana ainda.</p>';
        }
    } catch (error) {
        console.error('Erro ao buscar ranking do Firebase:', error);
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


