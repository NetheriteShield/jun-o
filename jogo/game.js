/**
 * =========================================================================
 * PING PONG CHALLENGE - ENGINE & LÓGICA DO JOGO
 * Sistema de física, renderização em alta performance, áudio sintetizado
 * e sincronização com banco de dados MySQL para o torneio semanal.
 * =========================================================================
 */

'use strict';

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

// =========================================================================
// 1. SISTEMA DE ÁUDIO PROCEDURAL (WEB AUDIO API - ZERO ARQUIVOS EXTERNOS)
// =========================================================================
class SoundController {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('pingpong_sound') !== 'false';
    this.initAudioContext();
  }

  initAudioContext() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('pingpong_sound', this.enabled);
    return this.enabled;
  }

  playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.15) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Ignora restrições de autoplay silenciosamente
    }
  }

  // Efeitos sonoros temáticos
  hitPlayer() {
    this.playTone(520, 'triangle', 0.09, 0.2);
  }

  hitAI() {
    this.playTone(380, 'triangle', 0.09, 0.18);
  }

  hitWall() {
    this.playTone(220, 'sine', 0.06, 0.12);
  }

  sweetSpot() {
    // Efeito metálico de rebatida perfeita
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    [660, 880, 1320].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.03);
      gain.gain.setValueAtTime(0.18, now + i * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.03);
      osc.stop(now + i * 0.03 + 0.15);
    });
  }

  pointWon() {
    // Acorde triunfal
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.2, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.25);
    });
  }

  gameOver() {
    // Tom dramático descendente
    if (!this.enabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const notes = [440, 370, 311, 220, 160];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.22, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.22);
    });
  }

  countdown(count) {
    if (count > 0) {
      this.playTone(440, 'sine', 0.1, 0.25);
    } else {
      this.playTone(880, 'triangle', 0.25, 0.3); // "GO!"
    }
  }
}

// =========================================================================
// 2. SISTEMA DE PARTÍCULAS & IMPACTOS VISUAIS
// =========================================================================
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, color = '#00f0ff', count = 16, speedScale = 1) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 5 + 2) * speedScale;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.size = Math.max(0, p.size - 0.05);

      if (p.alpha <= 0 || p.size <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  clear() {
    this.particles = [];
  }
}

// =========================================================================
// 3. MOTOR PRINCIPAL DO JOGO PING PONG
// =========================================================================
class PingPongGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.wrapper = document.getElementById('canvas-wrapper');

    // Módulos
    this.sound = new SoundController();
    this.particles = new ParticleSystem();

    // Elementos do DOM
    this.dom = {
      score: document.getElementById('hud-score'),
      comboPill: document.getElementById('combo-pill'),
      comboText: document.getElementById('combo-text'),
      speed: document.getElementById('hud-speed'),
      speedBar: document.getElementById('speed-bar'),
      playerName: document.getElementById('hud-player-name'),
      playerMeta: document.getElementById('hud-player-meta'),
      soundBtn: document.getElementById('btn-sound-toggle'),
      soundIcon: document.getElementById('sound-icon'),
      pauseBtn: document.getElementById('btn-pause-toggle'),
      pauseIcon: document.getElementById('pause-icon'),
      countdown: document.getElementById('countdown-text'),
      banner: document.getElementById('floating-banner'),
      hint: document.getElementById('controls-hint'),
      modalRegister: document.getElementById('modal-register'),
      formRegister: document.getElementById('form-register'),
      inputName: document.getElementById('reg-name'),
      inputInsta: document.getElementById('reg-instagram'),
      inputCurso: document.getElementById('reg-curso'),
      attemptsInfo: document.getElementById('attempts-info'),
      attemptsCount: document.getElementById('attempts-count'),
      modalGameOver: document.getElementById('modal-gameover'),
      goScore: document.getElementById('go-score'),
      goCombo: document.getElementById('go-combo'),
      goRallies: document.getElementById('go-rallies'),
      goMaxSpeed: document.getElementById('go-maxspeed'),
      goDuration: document.getElementById('go-duration'),
      dbStatusBox: document.getElementById('db-status-box'),
      dbTitle: document.getElementById('db-status-title'),
      dbDetail: document.getElementById('db-status-detail'),
      goAttemptsLeft: document.getElementById('go-attempts-left'),
      btnReplay: document.getElementById('btn-replay')
    };

    // Estado do Jogador
    this.playerProfile = {
      nome: '',
      instagram: '',
      curso: ''
    };

    // Sistema de Tentativas (limite por IP via API)
    this.MAX_ATTEMPTS = 15;
    this.attemptsRemaining = 15; // Atualizado via API ao carregar
    this.attemptsBlocked = false;

    // Dimensões Virtuais (Lógicas) do Jogo
    this.virtualWidth = 1000;
    this.virtualHeight = 600;
    this.scale = 1;

    // Estado da Partida
    this.state = 'REGISTER'; // 'REGISTER', 'COUNTDOWN', 'PLAYING', 'PAUSED', 'GAMEOVER'
    this.score = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.totalRallies = 0;
    this.maxSpeedReached = 1.0;
    this.startTime = 0;
    this.gameDuration = 0;

    // Configuração de Velocidade
    // A bola começa DEVAGAR e vai acelerando gradualmente a cada rebatida.
    this.baseBallSpeed  = 4.2;   // Velocidade inicial da bola (bem lenta no começo)
    this.speedMultiplier = 1.0;
    this.speedIncrement = 0.015; // Aumenta apenas 1.5% por rebatida — cresça bem suave

    // Velocidade do jogador também começa lenta e escala junto com a bola.
    this.playerBaseKeySpeed = 4.0;   // Velocidade inicial das teclas (muito suave)
    this.playerMaxKeySpeed  = 18;    // Teto máximo para teclas
    this.playerBaseLerp     = 0.07;  // Interp. do mouse/toque inicial (bem lenta)
    this.playerMaxLerp      = 0.32;  // Teto do lerp

    // Efeitos
    this.screenShake = 0;
    this.ballTrail = [];

    // Objetos do Jogo (Valores em escala virtual 1000x600)
    this.paddleWidth = 16;
    this.paddleHeight = 110;

    this.player = {
      x: 35,
      y: this.virtualHeight / 2 - this.paddleHeight / 2,
      w: this.paddleWidth,
      h: this.paddleHeight,
      targetY: this.virtualHeight / 2 - this.paddleHeight / 2
      // speed calculada dinamicamente em update() com base no speedMultiplier
    };

    this.ai = {
      x: this.virtualWidth - 35 - this.paddleWidth,
      y: this.virtualHeight / 2 - this.paddleHeight / 2,
      w: this.paddleWidth,
      h: this.paddleHeight,
      speed: 4.5,   // Começa lenta, escala com o jogo em updateAI()
      reactionLag: 0.15
    };

    this.ball = {
      x: this.virtualWidth / 2,
      y: this.virtualHeight / 2,
      radius: 9,
      vx: 0,
      vy: 0
    };

    // Controles por teclado
    this.keys = {
      up: false,
      down: false
    };

    this.init();
  }

  // =======================================================================
  // INICIALIZAÇÃO E EVENTOS
  // =======================================================================
  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.bindControls();
    this.loadSavedProfile();
    this.updateSoundIcon();

    // Consulta tentativas restantes via API logo ao carregar
    this.checkAttempts();

    // Loop de Animação 60fps
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  loadSavedProfile() {
    const saved = localStorage.getItem('pingpong_player');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.nome) this.dom.inputName.value = parsed.nome;
        if (parsed.instagram) this.dom.inputInsta.value = parsed.instagram;
        if (parsed.curso) this.dom.inputCurso.value = parsed.curso;
      } catch (e) {}
    }
  }

  bindControls() {
    // Submissão do Formulário de Inscrição
    this.dom.formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Verifica tentativas ANTES de deixar entrar (sem recarregar se já sabemos)
      if (this.attemptsBlocked) {
        this.showBlockedAlert();
        return;
      }

      const nome = this.dom.inputName.value.trim();
      let instagram = this.dom.inputInsta.value.trim();
      const curso = this.dom.inputCurso.value.trim();

      if (!nome || !instagram || !curso) {
        alert('Por favor, preencha todos os campos obrigatórios!');
        return;
      }

      if (!instagram.startsWith('@')) {
        instagram = '@' + instagram;
      }

      // Re-confirma tentativas com servidor antes de iniciar
      const canPlay = await this.checkAttempts();
      if (!canPlay) {
        this.showBlockedAlert();
        return;
      }

      this.playerProfile = { nome, instagram, curso };
      localStorage.setItem('pingpong_player', JSON.stringify(this.playerProfile));

      // Atualiza HUD
      this.dom.playerName.textContent = nome;
      this.dom.playerMeta.textContent = `${instagram} • ${curso}`;

      // Inicia áudio com o clique do usuário
      this.sound.resume();

      // Esconde Modal e Inicia Contagem
      this.dom.modalRegister.classList.add('hidden');
      this.startCountdown();
    });

    // Botão de Som
    this.dom.soundBtn.addEventListener('click', () => {
      const enabled = this.sound.toggle();
      this.updateSoundIcon();
    });

    // Botão de Pausa
    this.dom.pauseBtn.addEventListener('click', () => {
      this.togglePause();
    });

    // Tecla ESC para pausar
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.togglePause();
      }
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.keys.up = true;
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        this.keys.down = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.keys.up = false;
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        this.keys.down = false;
      }
    });

    // Movimentação do Mouse no Canvas
    this.wrapper.addEventListener('mousemove', (e) => {
      if (this.state !== 'PLAYING') return;
      const rect = this.canvas.getBoundingClientRect();
      const clientY = e.clientY - rect.top;
      const virtualY = (clientY - (this.offsetY || 0)) / this.scale;
      this.player.targetY = virtualY - this.player.h / 2;
    });

    // Movimentação Touch no Celular
    const handleTouch = (e) => {
      if (this.state !== 'PLAYING') return;
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const clientY = touch.clientY - rect.top;
        const virtualY = (clientY - (this.offsetY || 0)) / this.scale;
        this.player.targetY = virtualY - this.player.h / 2;
      }
    };

    this.wrapper.addEventListener('touchstart', (e) => {
      this.sound.resume();
      handleTouch(e);
    }, { passive: true });

    this.wrapper.addEventListener('touchmove', (e) => {
      handleTouch(e);
    }, { passive: true });

    // Botões do Game Over
    this.dom.btnReplay.addEventListener('click', async () => {
      if (this.attemptsBlocked) {
        this.showBlockedAlert();
        return;
      }
      // Confirma tentativas com servidor antes de cada replay
      const canPlay = await this.checkAttempts();
      if (!canPlay) {
        this.showBlockedAlert();
        return;
      }
      this.dom.modalGameOver.classList.add('hidden');
      this.startCountdown();
    });
  }

  // =======================================================================
  // VERIFICAÇÃO DE TENTATIVAS RESTANTES (API)
  // =======================================================================
  async checkAttempts() {
    this.attemptsRemaining = 15;
    this.attemptsBlocked = false;
    this.updateAttemptsUI();
    return true;
  }

  updateAttemptsUI() {
    // Atualiza o contador de tentativas no formulário de registro
    if (this.dom.attemptsCount) {
      this.dom.attemptsCount.textContent = this.attemptsRemaining;
    }
    if (this.dom.attemptsInfo) {
      this.dom.attemptsInfo.dataset.blocked = this.attemptsBlocked ? 'true' : 'false';
    }
    // Atualiza o texto do botão replay no game over
    if (this.dom.btnReplay) {
      if (this.attemptsBlocked) {
        this.dom.btnReplay.innerHTML = '<span>Sem tentativas esta semana 🔒</span>';
        this.dom.btnReplay.style.opacity = '0.45';
        this.dom.btnReplay.style.cursor = 'not-allowed';
      } else {
        const leftLabel = this.attemptsRemaining === this.MAX_ATTEMPTS
          ? ''
          : ` (${this.attemptsRemaining} restantes)`;
        this.dom.btnReplay.innerHTML = `<span>JOGAR NOVAMENTE 🔄${leftLabel}</span>`;
        this.dom.btnReplay.style.opacity = '1';
        this.dom.btnReplay.style.cursor = 'pointer';
      }
    }
    // Tentativas restantes no game over
    if (this.dom.goAttemptsLeft) {
      if (this.attemptsBlocked) {
        this.dom.goAttemptsLeft.textContent = 'Você usou todas as suas 15 tentativas desta semana!';
        this.dom.goAttemptsLeft.style.color = 'var(--accent-red)';
      } else {
        this.dom.goAttemptsLeft.textContent = `Tentativas restantes esta semana: ${this.attemptsRemaining}`;
        this.dom.goAttemptsLeft.style.color = 'var(--accent-cyan)';
      }
    }
  }

  showBlockedAlert() {
    // Exibe aviso amigável de tentativas esgotadas
    alert('Você já utilizou todas as 15 tentativas desta semana!\n\nO ranking reinicia toda sexta-feira às 00:00.\n\nFique de olho no Instagram para saber se você ganhou o prêmio! 🏆');
  }

  updateSoundIcon() {
    this.dom.soundIcon.textContent = this.sound.enabled ? '🔊' : '🔇';
    this.dom.soundBtn.style.opacity = this.sound.enabled ? '1' : '0.5';
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.dom.pauseIcon.textContent = '▶️';
      this.showBanner('JOGO PAUSADO');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.dom.pauseIcon.textContent = '⏸️';
      this.hideBanner();
    }
  }

  resizeCanvas() {
    const rect = this.wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Ajusta resolução do canvas de acordo com o tamanho real
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    // Fator de escala virtual
    const scaleX = rect.width / this.virtualWidth;
    const scaleY = rect.height / this.virtualHeight;
    this.scale = Math.min(scaleX, scaleY);

    // Ajusta viewport virtual centralizado
    this.offsetX = (rect.width - this.virtualWidth * this.scale) / 2;
    this.offsetY = (rect.height - this.virtualHeight * this.scale) / 2;

    this.dpr = dpr;
  }

  // =======================================================================
  // FLUXO DE JOGO E CONTAGEM
  // =======================================================================
  startCountdown() {
    this.state = 'COUNTDOWN';
    this.resetMatchVariables();
    this.resetPositions();

    let count = 3;
    this.dom.countdown.textContent = count;
    this.dom.countdown.classList.add('active');
    this.sound.countdown(count);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        this.dom.countdown.textContent = count;
        this.sound.countdown(count);
      } else if (count === 0) {
        this.dom.countdown.textContent = 'GO!';
        this.sound.countdown(0);
      } else {
        clearInterval(interval);
        this.dom.countdown.classList.remove('active');
        this.state = 'PLAYING';
        this.startTime = Date.now();
        this.serveBall(1); // Saca para a IA primeiro: jogador vê a bola chegando de volta
      }
    }, 850);
  }

  resetMatchVariables() {
    this.score = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.totalRallies = 0;
    this.speedMultiplier = 1.0;
    this.maxSpeedReached = 1.0;
    this.ballTrail = [];
    this.particles.clear();
    this.updateHUD();
  }

  resetPositions() {
    this.player.y = this.virtualHeight / 2 - this.player.h / 2;
    this.player.targetY = this.player.y;
    this.ai.y = this.virtualHeight / 2 - this.ai.h / 2;

    this.ball.x = this.virtualWidth / 2;
    this.ball.y = this.virtualHeight / 2;
    this.ball.vx = 0;
    this.ball.vy = 0;
  }

  serveBall(direction = 1) {
    const currentSpeed = this.baseBallSpeed * this.speedMultiplier;
    // Ângulo aleatório leve para o saque
    const angle = (Math.random() * 0.6 - 0.3); // Entre -17 e +17 graus
    this.ball.vx = Math.cos(angle) * currentSpeed * direction;
    this.ball.vy = Math.sin(angle) * currentSpeed;
  }

  // =======================================================================
  // ATUALIZAÇÕES DA FÍSICA E INTELIGÊNCIA ARTIFICIAL
  // =======================================================================
  update() {
    if (this.state !== 'PLAYING') return;

    // Atualiza partículas
    this.particles.update();

    // 1. Controle do Jogador — Velocidade dinâmica que cresce junto com a bola
    // A velocidade de teclado e a interpolação do mouse aumentam gradualmente
    // com o speedMultiplier, igualando o crescimento da dificuldade da bolinha.
    const dynamicKeySpeed = Math.min(
      this.playerMaxKeySpeed,
      this.playerBaseKeySpeed * Math.sqrt(this.speedMultiplier)
    );
    const dynamicLerp = Math.min(
      this.playerMaxLerp,
      this.playerBaseLerp * Math.pow(this.speedMultiplier, 0.65)
    );

    if (this.keys.up) {
      this.player.targetY -= dynamicKeySpeed;
    }
    if (this.keys.down) {
      this.player.targetY += dynamicKeySpeed;
    }

    // Limites de tela para o Jogador
    this.player.targetY = Math.max(10, Math.min(this.virtualHeight - this.player.h - 10, this.player.targetY));
    // Interpolação suave com velocidade crescente (mouse/touch)
    this.player.y += (this.player.targetY - this.player.y) * dynamicLerp;

    // 2. Inteligência Artificial do Adversário
    this.updateAI();

    // 3. Atualização da Bola
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Armazena rastro da bola
    this.ballTrail.push({ x: this.ball.x, y: this.ball.y });
    if (this.ballTrail.length > Math.min(18, Math.floor(6 + this.speedMultiplier * 3))) {
      this.ballTrail.shift();
    }

    // 4. Colisão com Paredes Superior e Inferior
    if (this.ball.y - this.ball.radius <= 10) {
      this.ball.y = 10 + this.ball.radius;
      this.ball.vy = -this.ball.vy;
      this.sound.hitWall();
      this.particles.emit(this.ball.x, this.ball.y, '#94a3b8', 6);
    } else if (this.ball.y + this.ball.radius >= this.virtualHeight - 10) {
      this.ball.y = this.virtualHeight - 10 - this.ball.radius;
      this.ball.vy = -this.ball.vy;
      this.sound.hitWall();
      this.particles.emit(this.ball.x, this.ball.y, '#94a3b8', 6);
    }

    // 5. Colisão com a Raquete do Jogador (Esquerda)
    if (
      this.ball.vx < 0 &&
      this.ball.x - this.ball.radius <= this.player.x + this.player.w &&
      this.ball.x + this.ball.radius >= this.player.x &&
      this.ball.y >= this.player.y - 4 &&
      this.ball.y <= this.player.y + this.player.h + 4
    ) {
      this.handlePlayerHit();
    }

    // 6. Colisão com a Raquete da IA (Direita)
    if (
      this.ball.vx > 0 &&
      this.ball.x + this.ball.radius >= this.ai.x &&
      this.ball.x - this.ball.radius <= this.ai.x + this.ai.w &&
      this.ball.y >= this.ai.y - 4 &&
      this.ball.y <= this.ai.y + this.ai.h + 4
    ) {
      this.handleAIHit();
    }

    // 7. Verificação de Pontos / Derrota
    if (this.ball.x + this.ball.radius < 0) {
      // Jogador deixou a bola passar: FIM DE JOGO
      this.triggerGameOver();
    } else if (this.ball.x - this.ball.radius > this.virtualWidth) {
      // IA deixou a bola passar: Super Bônus e Nova Rodada com velocidade mantida!
      this.handleRoundWon();
    }

    // Reduz screen shake
    if (this.screenShake > 0) {
      this.screenShake *= 0.88;
      if (this.screenShake < 0.2) this.screenShake = 0;
    }
  }

  updateAI() {
    const aiCenter = this.ai.y + this.ai.h / 2;
    let targetY = this.ai.y;

    // Se a bola estiver vindo para a IA, ela acompanha com precisão proporcional
    if (this.ball.vx > 0) {
      // Previsão simples de onde a bola vai chegar
      const distance = this.ai.x - this.ball.x;
      const framesToReach = Math.max(1, distance / this.ball.vx);
      const predictedBallY = this.ball.y + this.ball.vy * Math.min(framesToReach, 40);

      // Pequena imperfeição humana na IA
      const errorMargin = (Math.sin(Date.now() / 300) * 18);
      targetY = (predictedBallY + errorMargin) - this.ai.h / 2;
    } else {
      // Quando a bola vai para o jogador, a IA volta calmamente ao centro
      targetY = (this.virtualHeight / 2) - this.ai.h / 2;
    }

    // Limites de tela para a IA
    targetY = Math.max(10, Math.min(this.virtualHeight - this.ai.h - 10, targetY));

    // Velocidade da IA escala levemente com o jogo para manter o desafio alto
    const dynamicAiSpeed = this.ai.speed * Math.min(1.6, 0.95 + this.speedMultiplier * 0.12);
    const diff = targetY - this.ai.y;

    if (Math.abs(diff) > dynamicAiSpeed) {
      this.ai.y += Math.sign(diff) * dynamicAiSpeed;
    } else {
      this.ai.y = targetY;
    }
  }

  handlePlayerHit() {
    this.totalRallies++;
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    // Aumenta a velocidade progressivamente a cada batida!
    this.speedMultiplier += this.speedIncrement;
    if (this.speedMultiplier > this.maxSpeedReached) {
      this.maxSpeedReached = this.speedMultiplier;
    }

    // Cálculo do Ponto de Impacto na Raquete (-1 topo, 0 centro, +1 base)
    const hitOffset = (this.ball.y - (this.player.y + this.player.h / 2)) / (this.player.h / 2);
    const clampedOffset = Math.max(-1, Math.min(1, hitOffset));

    this.score += 10;
    this.sound.hitPlayer();
    this.particles.emit(this.ball.x, this.ball.y, '#00f0ff', 14);
    if (this.speedMultiplier > 2.0) {
      this.screenShake = 3;
    }

    // Ângulo de reflexão dinâmico (máximo 60 graus)
    const maxBounceAngle = Math.PI / 3;
    const bounceAngle = clampedOffset * maxBounceAngle;

    const totalSpeed = this.baseBallSpeed * this.speedMultiplier;
    this.ball.vx = Math.abs(Math.cos(bounceAngle) * totalSpeed);
    this.ball.vy = Math.sin(bounceAngle) * totalSpeed;

    // Reposiciona a bola fora da raquete para evitar overlap
    this.ball.x = this.player.x + this.player.w + this.ball.radius + 1;

    this.popScoreHUD();
    this.updateHUD();
  }

  handleAIHit() {
    this.totalRallies++;
    this.sound.hitAI();
    this.particles.emit(this.ball.x, this.ball.y, '#ec4899', 14);

    // Reflexão da IA
    const hitOffset = (this.ball.y - (this.ai.y + this.ai.h / 2)) / (this.ai.h / 2);
    const clampedOffset = Math.max(-1, Math.min(1, hitOffset));
    const maxBounceAngle = Math.PI / 3;
    const bounceAngle = clampedOffset * maxBounceAngle;

    const totalSpeed = this.baseBallSpeed * this.speedMultiplier;
    this.ball.vx = -Math.abs(Math.cos(bounceAngle) * totalSpeed);
    this.ball.vy = Math.sin(bounceAngle) * totalSpeed;

    this.ball.x = this.ai.x - this.ball.radius - 1;
  }

  handleRoundWon() {
    // Jogador venceu o round contra a IA!
    this.score += 50;
    this.sound.pointWon();
    this.particles.emit(this.virtualWidth - 50, this.virtualHeight / 2, '#10b981', 40, 2);
    this.updateHUD();

    // Mantém a velocidade alta e reinicia o serviço para o jogador continuar pontuando!
    this.ball.x = this.virtualWidth / 2;
    this.ball.y = this.virtualHeight / 2;
    this.ball.vx = 0;
    this.ball.vy = 0;

    setTimeout(() => {
      if (this.state === 'PLAYING') {
        this.serveBall(-1);
      }
    }, 700);
  }

  triggerGameOver() {
    this.state = 'GAMEOVER';
    this.gameDuration = Math.max(1, Math.floor((Date.now() - this.startTime) / 1000));
    this.sound.gameOver();
    this.screenShake = 8;
    this.particles.emit(this.ball.x, this.ball.y, '#ef4444', 35, 1.8);

    // Preenche o Modal de Game Over
    this.dom.goScore.textContent = this.score.toLocaleString('pt-BR');
    this.dom.goCombo.textContent = `${this.maxCombo}x`;
    this.dom.goRallies.textContent = this.totalRallies;
    this.dom.goMaxSpeed.textContent = `${this.maxSpeedReached.toFixed(1)}x`;

    const mins = String(Math.floor(this.gameDuration / 60)).padStart(2, '0');
    const secs = String(this.gameDuration % 60).padStart(2, '0');
    this.dom.goDuration.textContent = `${mins}:${secs}`;

    // Exibe o modal
    this.dom.modalGameOver.classList.remove('hidden');

    // Salva automaticamente no banco de dados do InfinityFree
    this.submitScoreToDatabase();
  }

  // =======================================================================
  // SINCRONIZAÇÃO COM O BANCO DE DADOS (API PHP NO INFINITYFREE)
  // =======================================================================
  async submitScoreToDatabase() {
    const statusBox = this.dom.dbStatusBox;
    const title = this.dom.dbTitle;
    const detail = this.dom.dbDetail;

    statusBox.className = 'db-status-box';
    title.textContent = 'Gravando pontuação no ranking...';
    detail.textContent = 'Enviando seus pontos para o Firebase...';

    const payload = {
      nome: this.playerProfile.nome,
      instagram: this.playerProfile.instagram,
      curso: this.playerProfile.curso,
      score: this.score,
      rallies: this.totalRallies,
      max_combo: this.maxCombo,
      duration_seconds: this.gameDuration,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      await db.collection("scores").add(payload);
      statusBox.classList.add('success');
      title.textContent = 'Pontuação Registrada! ✅';
      detail.textContent = 'Pontos salvos com sucesso no servidor do Firebase!';
    } catch (err) {
      statusBox.classList.add('error');
      title.textContent = 'Erro de Conexão';
      detail.textContent = 'Não foi possível salvar no Firebase. Tente novamente mais tarde.';
      console.warn('Erro ao salvar no Firebase:', err);
    }
  }

  // =======================================================================
  // ATUALIZAÇÃO DA INTERFACE (HUD)
  // =======================================================================
  updateHUD() {
    this.dom.score.textContent = this.score.toLocaleString('pt-BR');
    this.dom.comboText.textContent = `COMBO ${this.combo}x`;

    const speedVal = this.speedMultiplier.toFixed(1) + 'x';
    this.dom.speed.textContent = speedVal;

    // Barra de progresso da velocidade (escala até 3.5x)
    const pct = Math.min(100, Math.max(10, ((this.speedMultiplier - 1.0) / 2.5) * 100));
    this.dom.speedBar.style.width = `${pct}%`;

    // Efeito de destaque no combo
    if (this.combo >= 4) {
      this.dom.comboPill.style.display = 'flex';
      this.dom.comboPill.style.borderColor = 'rgba(236, 72, 153, 0.7)';
      this.dom.comboPill.style.color = 'var(--accent-magenta)';
    } else {
      this.dom.comboPill.style.display = 'flex';
      this.dom.comboPill.style.borderColor = 'rgba(249, 115, 22, 0.4)';
      this.dom.comboPill.style.color = 'var(--accent-orange)';
    }
  }

  popScoreHUD() {
    this.dom.score.classList.remove('score-pop');
    void this.dom.score.offsetWidth; // Trigger reflow
    this.dom.score.classList.add('score-pop');
    setTimeout(() => {
      this.dom.score.classList.remove('score-pop');
    }, 150);
  }

  showTemporaryBanner(text, color = '#00f0ff') {
    this.dom.banner.textContent = text;
    this.dom.banner.style.color = color;
    this.dom.banner.style.borderColor = color;
    this.dom.banner.classList.add('show');

    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      this.dom.banner.classList.remove('show');
    }, 900);
  }

  showBanner(text) {
    this.dom.banner.textContent = text;
    this.dom.banner.classList.add('show');
  }

  hideBanner() {
    this.dom.banner.classList.remove('show');
  }

  // =======================================================================
  // RENDERIZAÇÃO GRÁFICA NO CANVAS
  // =======================================================================
  render() {
    const { ctx, canvas } = this;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ajusta para DPR e Escala Virtual
    ctx.scale(this.dpr, this.dpr);
    ctx.translate(this.offsetX, this.offsetY);

    // Efeito Screen Shake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    ctx.scale(this.scale, this.scale);

    // 1. Fundo da Mesa de Ping Pong
    this.drawTable();

    // 2. Rastro da Bola
    this.drawBallTrail();

    // 3. Raquetes
    this.drawPaddles();

    // 4. Bola com Efeito Neon
    this.drawBall();

    // 5. Partículas
    this.particles.draw(ctx);

    ctx.restore();
  }

  drawTable() {
    const { ctx, virtualWidth: w, virtualHeight: h } = this;

    // Bordas externas da mesa com brilho azul
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Linha Central (Rede)
    ctx.save();
    ctx.setLineDash([12, 12]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2, 12);
    ctx.lineTo(w / 2, h - 12);
    ctx.stroke();
    ctx.restore();

    // Círculo Central Sutil
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 70, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawBallTrail() {
    const { ctx } = this;
    if (this.ballTrail.length < 2) return;

    ctx.save();
    for (let i = 0; i < this.ballTrail.length; i++) {
      const pt = this.ballTrail[i];
      const ratio = (i + 1) / this.ballTrail.length;
      const radius = this.ball.radius * ratio * 0.75;

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);

      let trailColor = `rgba(0, 240, 255, ${ratio * 0.35})`;
      if (this.speedMultiplier >= 2.4) {
        trailColor = `rgba(236, 72, 153, ${ratio * 0.4})`;
      } else if (this.speedMultiplier >= 1.6) {
        trailColor = `rgba(250, 204, 21, ${ratio * 0.38})`;
      }

      ctx.fillStyle = trailColor;
      ctx.fill();
    }
    ctx.restore();
  }

  drawPaddles() {
    const { ctx } = this;

    // Raquete do Jogador (Esquerda - Ciano)
    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    const playerGrad = ctx.createLinearGradient(this.player.x, 0, this.player.x + this.player.w, 0);
    playerGrad.addColorStop(0, '#00f0ff');
    playerGrad.addColorStop(1, '#3b82f6');
    ctx.fillStyle = playerGrad;
    this.roundRect(ctx, this.player.x, this.player.y, this.player.w, this.player.h, 6);
    ctx.fill();

    // Núcleo da raquete (efeito de luz central)
    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, this.player.x + 3, this.player.y + 4, this.player.w - 6, this.player.h - 8, 3);
    ctx.fill();
    ctx.restore();

    // Raquete da IA (Direita - Magenta)
    ctx.save();
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 15;
    const aiGrad = ctx.createLinearGradient(this.ai.x, 0, this.ai.x + this.ai.w, 0);
    aiGrad.addColorStop(0, '#ec4899');
    aiGrad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = aiGrad;
    this.roundRect(ctx, this.ai.x, this.ai.y, this.ai.w, this.ai.h, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, this.ai.x + 3, this.ai.y + 4, this.ai.w - 6, this.ai.h - 8, 3);
    ctx.fill();
    ctx.restore();
  }

  drawBall() {
    const { ctx, ball } = this;

    ctx.save();
    // Brilho da bola muda de cor de acordo com o nível de velocidade
    let glowColor = '#00f0ff';
    if (this.speedMultiplier >= 2.6) {
      glowColor = '#ec4899'; // Hipervelocidade Magenta
    } else if (this.speedMultiplier >= 1.7) {
      glowColor = '#facc15'; // Alta Velocidade Dourada
    }

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = Math.min(28, 12 + this.speedMultiplier * 5);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // =======================================================================
  // LOOP PRINCIPAL DO JOGO
  // =======================================================================
  gameLoop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
}

// Inicia o jogo assim que a página carregar
window.addEventListener('DOMContentLoaded', () => {
  window.game = new PingPongGame();
});
