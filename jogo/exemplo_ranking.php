<?php
/**
 * EXEMPLO DE PÁGINA DE RANKING SEMANAL (REFERÊNCIA PARA VOCÊ)
 * Você pode usar este arquivo como base ou modelo quando for criar a página de ranking separada!
 */

require_once __DIR__ . '/api/db.php';

$pdo = getDbConnection();
$ranking = [];
$weekCycle = getCurrentWeekCycle(); // Sexta-feira que iniciou a disputa atual

if ($pdo) {
    // Consulta a melhor pontuação de cada jogador na semana atual
    // Ordenado da maior para a menor pontuação
    $sql = "SELECT 
                nome,
                instagram,
                curso,
                MAX(score) AS maior_score,
                MAX(max_combo) AS maior_combo,
                COUNT(id) AS total_partidas,
                DATE_FORMAT(MAX(created_at), '%d/%m/%Y às %H:%i') AS data_registro
            FROM pontuacoes
            WHERE week_cycle = :week_cycle
            GROUP BY instagram, nome, curso
            ORDER BY maior_score DESC
            LIMIT 50";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':week_cycle' => $weekCycle]);
    $ranking = $stmt->fetchAll();
}

// Formata a data do ciclo para exibição amigável
$dataCiclo = DateTime::createFromFormat('Y-m-d', $weekCycle);
$dataInicioFormatada = $dataCiclo ? $dataCiclo->format('d/m/Y') : $weekCycle;
$proximaSexta = $dataCiclo ? (clone $dataCiclo)->modify('+7 days') : null;
$dataFimFormatada = $proximaSexta ? $proximaSexta->format('d/m/Y') : '';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ranking Semanal | Ping Pong Challenge</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      background: #0a0c14;
      color: #f8fafc;
      font-family: 'Outfit', sans-serif;
      padding: 30px 16px;
      display: flex;
      justify-content: center;
    }
    .ranking-container {
      width: 100%;
      max-width: 800px;
    }
    .header-card {
      background: rgba(18, 22, 36, 0.85);
      border: 1px solid rgba(0, 240, 255, 0.2);
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      margin-bottom: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .header-card h1 {
      margin: 0 0 8px 0;
      font-size: 2rem;
      background: linear-gradient(135deg, #fff, #00f0ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .cycle-badge {
      display: inline-block;
      background: rgba(0, 240, 255, 0.1);
      color: #00f0ff;
      border: 1px solid rgba(0, 240, 255, 0.3);
      padding: 4px 14px;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: rgba(18, 22, 36, 0.65);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    th, td {
      padding: 14px 18px;
      text-align: left;
    }
    th {
      background: rgba(255, 255, 255, 0.03);
      color: #94a3b8;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    tr:not(:last-child) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .pos {
      font-weight: 800;
      font-size: 1.1rem;
      font-family: 'Space Grotesk', monospace;
    }
    .pos-1 { color: #facc15; font-size: 1.3rem; }
    .pos-2 { color: #cbd5e1; }
    .pos-3 { color: #f97316; }
    .score {
      font-family: 'Space Grotesk', monospace;
      font-weight: 700;
      color: #00f0ff;
      font-size: 1.15rem;
    }
    .meta {
      font-size: 0.8rem;
      color: #94a3b8;
    }
    .btn-play {
      display: inline-block;
      margin-top: 20px;
      background: linear-gradient(135deg, #00f0ff, #3b82f6);
      color: #030712;
      padding: 12px 28px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 800;
    }
  </style>
</head>
<body>
  <div class="ranking-container">
    <div class="header-card">
      <h1>🏆 Ranking do Torneio Semanal</h1>
      <p style="color: #94a3b8; margin-bottom: 12px;">Quem estiver em 1º lugar na sexta-feira leva a premiação!</p>
      <span class="cycle-badge">Ciclo Atual: <?php echo htmlspecialchars($dataInicioFormatada); ?> até <?php echo htmlspecialchars($dataFimFormatada); ?></span>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Participante</th>
          <th>Curso</th>
          <th>Melhor Score</th>
          <th>Combo</th>
        </tr>
      </thead>
      <tbody>
        <?php if (empty($ranking)): ?>
          <tr>
            <td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">
              Nenhum ponto registrado neste ciclo semanal ainda. Seja o primeiro a jogar! 🏓
            </td>
          </tr>
        <?php else: ?>
          <?php foreach ($ranking as $i => $row): ?>
            <tr>
              <td class="pos pos-<?php echo ($i + 1); ?>">
                <?php 
                  if ($i === 0) echo '🥇 1º';
                  else if ($i === 1) echo '🥈 2º';
                  else if ($i === 2) echo '🥉 3º';
                  else echo ($i + 1) . 'º';
                ?>
              </td>
              <td>
                <strong><?php echo htmlspecialchars($row['nome']); ?></strong><br>
                <span class="meta"><?php echo htmlspecialchars($row['instagram']); ?></span>
              </td>
              <td style="color: #cbd5e1;"><?php echo htmlspecialchars($row['curso']); ?></td>
              <td class="score"><?php echo number_format($row['maior_score'], 0, ',', '.'); ?></td>
              <td><span style="color: #f97316; font-weight: bold;"><?php echo $row['maior_combo']; ?>x</span></td>
            </tr>
          <?php endforeach; ?>
        <?php endif; ?>
      </tbody>
    </table>

    <div style="text-align: center;">
      <a href="index.html" class="btn-play">JOGAR AGORA 🏓</a>
    </div>
  </div>
</body>
</html>
