<?php
/**
 * Endpoint para verificar quantas tentativas um IP já usou na semana atual.
 * Retorna o número de tentativas restantes (máximo: MAX_ATTEMPTS por ciclo semanal).
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

define('MAX_ATTEMPTS', 15);

$ip = substr($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0', 0, 45);
$weekCycle = getCurrentWeekCycle();

$pdo = getDbConnection();

if (!$pdo) {
    // Em caso de falha de conexão, libera o jogo (não bloqueia por erro de infraestrutura)
    echo json_encode([
        'success'           => true,
        'attempts_used'     => 0,
        'attempts_remaining'=> MAX_ATTEMPTS,
        'max_attempts'      => MAX_ATTEMPTS,
        'week_cycle'        => $weekCycle,
        'blocked'           => false,
        'db_error'          => true
    ]);
    exit;
}

try {
    // Conta o total de tentativas (partidas) deste IP no ciclo semanal atual
    $sql = "SELECT COUNT(id) AS total FROM pontuacoes WHERE ip_address = :ip AND week_cycle = :week_cycle";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':ip' => $ip, ':week_cycle' => $weekCycle]);
    $row = $stmt->fetch();

    $used = (int)($row['total'] ?? 0);
    $remaining = max(0, MAX_ATTEMPTS - $used);
    $blocked = $used >= MAX_ATTEMPTS;

    echo json_encode([
        'success'            => true,
        'attempts_used'      => $used,
        'attempts_remaining' => $remaining,
        'max_attempts'       => MAX_ATTEMPTS,
        'week_cycle'         => $weekCycle,
        'blocked'            => $blocked
    ]);
} catch (PDOException $e) {
    error_log('Erro ao verificar tentativas: ' . $e->getMessage());
    // Em caso de erro, libera o jogo
    echo json_encode([
        'success'            => true,
        'attempts_used'      => 0,
        'attempts_remaining' => MAX_ATTEMPTS,
        'max_attempts'       => MAX_ATTEMPTS,
        'week_cycle'         => $weekCycle,
        'blocked'            => false,
        'db_error'           => true
    ]);
}
