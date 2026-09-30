<?php
/**
 * Configuração de Conexão com o Banco de Dados MySQL
 * Especialmente preparado para InfinityFree / cPanel / Localhost
 */

// Define fuso horário para horário de Brasília
date_default_timezone_set('America/Sao_Paulo');

// CREDENCIAIS DO BANCO DE DADOS INFINITYFREE:
// No painel do InfinityFree, vá em "MySQL Databases" para pegar estes dados:
define('DB_HOST', 'sql213.infinityfree.com'); // Ex: sql123.infinityfree.com ou localhost para testes locais
define('DB_NAME', 'if0_43046860_db');    // Nome completo do banco de dados gerado no InfinityFree
define('DB_USER', 'if0_43046860');             // Usuário do banco gerado pelo InfinityFree
define('DB_PASS', 'czpa2CVV2F');         // Sua senha da conta do InfinityFree (vPanel password)
define('DB_PORT', '3306');

/**
 * Função para calcular o identificador do ciclo semanal (reseta toda sexta-feira às 00:00:00)
 * Retorna uma string no formato 'YYYY-MM-DD' correspondente à sexta-feira do ciclo atual.
 */
function getCurrentWeekCycle(): string {
    $now = new DateTime('now', new DateTimeZone('America/Sao_Paulo'));
    $dayOfWeek = (int)$now->format('w'); // 0 (Domingo) a 6 (Sábado), 5 é Sexta-feira
    
    if ($dayOfWeek === 5) {
        $cycleStart = clone $now;
    } else {
        $cycleStart = (clone $now)->modify('last friday');
    }
    
    $cycleStart->setTime(0, 0, 0);
    return $cycleStart->format('Y-m-d');
}

/**
 * Obtém a conexão PDO com o MySQL
 */
function getDbConnection(): ?PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ];
        
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        // Em produção, evitamos expor credenciais em tela
        error_log("Erro de Conexão com o Banco de Dados: " . $e->getMessage());
        return null;
    }
}
