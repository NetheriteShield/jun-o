<?php
/**
 * Endpoint para buscar o ranking semanal atualizado, sem dados duplicados (apenas o melhor score de cada pessoa)
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

$weekCycle = getCurrentWeekCycle();
$pdo = getDbConnection();

if (!$pdo) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erro de conexão com o banco de dados.']);
    exit;
}

try {
    // Busca os 10 melhores da semana, agrupando pelo instagram para não ter duplicatas
    $sql = "SELECT nome, instagram, curso, MAX(score) as melhor_score, MAX(rallies) as max_rallies, MAX(max_combo) as melhor_combo
            FROM pontuacoes 
            WHERE week_cycle = :week_cycle
            GROUP BY instagram, nome, curso
            ORDER BY melhor_score DESC, max_rallies DESC
            LIMIT 20";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':week_cycle' => $weekCycle]);
    
    $ranking = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'week_cycle' => $weekCycle,
        'ranking' => $ranking
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Erro ao buscar ranking: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'error' => 'Erro ao buscar dados do ranking.'
    ]);
}
