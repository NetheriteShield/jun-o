<?php
/**
 * Endpoint para salvar o resultado da partida no Banco de Dados
 * Recebe via POST (JSON ou Form-Data) os dados do jogador e pontuação.
 * Valida limite de tentativas por IP no servidor (anti-burla).
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Habilita CORS se for necessário (útil durante testes locais)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método não permitido. Utilize POST.']);
    exit;
}

require_once __DIR__ . '/db.php';

define('MAX_ATTEMPTS', 15); // Máximo de tentativas por IP por ciclo semanal

// Obtém o payload (suporta JSON no corpo da requisição e multipart/x-www-form-urlencoded)
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!is_array($data)) {
    $data = $_POST;
}

// Sanitização e Coleta dos Campos
$nome             = isset($data['nome']) ? trim(strip_tags((string)$data['nome'])) : '';
$instagram        = isset($data['instagram']) ? trim(strip_tags((string)$data['instagram'])) : '';
$curso            = isset($data['curso']) ? trim(strip_tags((string)$data['curso'])) : '';
$score            = isset($data['score']) ? filter_var($data['score'], FILTER_VALIDATE_INT) : false;
$rallies          = isset($data['rallies']) ? filter_var($data['rallies'], FILTER_VALIDATE_INT) : 0;
$max_combo        = isset($data['max_combo']) ? filter_var($data['max_combo'], FILTER_VALIDATE_INT) : 0;
$duration_seconds = isset($data['duration_seconds']) ? filter_var($data['duration_seconds'], FILTER_VALIDATE_INT) : 0;

// Validações básicas
if (empty($nome) || mb_strlen($nome) < 2 || mb_strlen($nome) > 100) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'O nome deve ter entre 2 e 100 caracteres.']);
    exit;
}

// Formatação amigável do Instagram (garante @ no início)
if (!empty($instagram)) {
    $instagram = ltrim($instagram, '@');
    $instagram = '@' . preg_replace('/[^a-zA-Z0-9._]/', '', $instagram);
}

if (empty($instagram) || mb_strlen($instagram) < 2 || mb_strlen($instagram) > 60) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Informe um perfil de Instagram válido.']);
    exit;
}

if (empty($curso) || mb_strlen($curso) < 2 || mb_strlen($curso) > 100) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Informe o curso do participante.']);
    exit;
}

if ($score === false || $score < 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Pontuação inválida.']);
    exit;
}

// Validação simples anti-abuso: pontuação muito alta em tempo zero
if ($duration_seconds <= 1 && $score > 50) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Partida inconsistente detectada.']);
    exit;
}

// Verificação de segurança (Token)
$token = isset($data['token']) ? $data['token'] : '';
$expectedToken = base64_encode("{$score}-{$duration_seconds}-infinityfree-secure");

if ($token !== $expectedToken) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Assinatura da partida inválida. Suspeita de burla.']);
    exit;
}

// IP do jogador (definido antes de qualquer consulta)
$ip = substr($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0', 0, 45);

// Ciclo semanal automático (reseta toda sexta-feira às 00:00:00)
$weekCycle = getCurrentWeekCycle();

// Conexão com o Banco
$pdo = getDbConnection();
if (!$pdo) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Não foi possível conectar ao banco de dados MySQL. Verifique as credenciais no arquivo api/db.php.'
    ]);
    exit;
}

// ── LIMITE DE TENTATIVAS POR IP (SERVER-SIDE) ────────────────────────────────
// Impede burlas ao frontend: conta no banco quantas partidas este IP já registrou
// no ciclo semanal atual e rejeita se o limite MAX_ATTEMPTS foi atingido.
try {
    $countStmt = $pdo->prepare(
        "SELECT COUNT(id) AS total FROM pontuacoes WHERE ip_address = :ip AND week_cycle = :week_cycle"
    );
    $countStmt->execute([':ip' => $ip, ':week_cycle' => $weekCycle]);
    $countRow = $countStmt->fetch();
    $attemptsUsed = (int)($countRow['total'] ?? 0);

    if ($attemptsUsed >= MAX_ATTEMPTS) {
        http_response_code(429);
        echo json_encode([
            'success'            => false,
            'error'              => 'Limite de tentativas atingido! Você já jogou ' . MAX_ATTEMPTS . ' vezes nesta semana. O ranking reinicia toda sexta-feira às 00:00.',
            'attempts_used'      => $attemptsUsed,
            'attempts_remaining' => 0,
            'max_attempts'       => MAX_ATTEMPTS,
            'blocked'            => true
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
} catch (PDOException $e) {
    // Em caso de erro na contagem, não bloqueamos (benefício da dúvida)
    error_log('Erro ao contar tentativas: ' . $e->getMessage());
    $attemptsUsed = 0;
}
// ─────────────────────────────────────────────────────────────────────────────

try {
    // Insere a pontuação registrando dados do jogador e ciclo semanal
    $sql = "INSERT INTO pontuacoes 
            (nome, instagram, curso, score, rallies, max_combo, duration_seconds, week_cycle, ip_address, created_at)
            VALUES 
            (:nome, :instagram, :curso, :score, :rallies, :max_combo, :duration_seconds, :week_cycle, :ip_address, NOW())";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':nome'             => $nome,
        ':instagram'        => $instagram,
        ':curso'            => $curso,
        ':score'            => $score,
        ':rallies'          => $rallies,
        ':max_combo'        => $max_combo,
        ':duration_seconds' => $duration_seconds,
        ':week_cycle'       => $weekCycle,
        ':ip_address'       => $ip
    ]);

    $insertedId = $pdo->lastInsertId();
    $attemptsNow = ($attemptsUsed ?? 0) + 1;
    $attemptsLeft = max(0, MAX_ATTEMPTS - $attemptsNow);

    // Consulta qual a melhor posição do usuário nesta semana para retornar um feedback motivador!
    $rankSql = "SELECT COUNT(DISTINCT instagram) + 1 AS posicao 
                FROM pontuacoes 
                WHERE week_cycle = :week_cycle AND score > :score";
    $rankStmt = $pdo->prepare($rankSql);
    $rankStmt->execute([
        ':week_cycle' => $weekCycle,
        ':score'      => $score
    ]);
    $rankInfo = $rankStmt->fetch();
    $posicaoSemana = $rankInfo ? (int)$rankInfo['posicao'] : 1;

    echo json_encode([
        'success'            => true,
        'message'            => 'Pontuação registrada com sucesso!',
        'id'                 => $insertedId,
        'score'              => $score,
        'posicao_semana'     => $posicaoSemana,
        'attempts_used'      => $attemptsNow,
        'attempts_remaining' => $attemptsLeft,
        'max_attempts'       => MAX_ATTEMPTS,
        'week_cycle'         => $weekCycle
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro ao salvar pontuação: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error'   => 'Erro ao gravar pontuação no banco de dados. Verifique a tabela no MySQL.'
    ]);
}
