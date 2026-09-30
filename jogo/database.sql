-- =========================================================================
-- BANCO DE DADOS: PING PONG CHALLENGE (INFINITYFREE / MYSQL)
-- Script para criar a tabela de pontuações e índices de desempenho
-- =========================================================================

-- Certifique-se de selecionar seu banco de dados no phpMyAdmin antes de rodar,
-- ou execute diretamente na aba SQL do phpMyAdmin do InfinityFree.

CREATE TABLE IF NOT EXISTS `pontuacoes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL COMMENT 'Nome completo do jogador',
  `instagram` VARCHAR(60) NOT NULL COMMENT 'Perfil do Instagram (@usuario)',
  `curso` VARCHAR(100) NOT NULL COMMENT 'Curso do participante',
  `score` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Pontuação obtida na partida',
  `rallies` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Quantidade total de rebatidas',
  `max_combo` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Maior sequência de rebatidas contínuas',
  `duration_seconds` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Duração da partida em segundos',
  `week_cycle` DATE NOT NULL COMMENT 'Data da sexta-feira que iniciou o ciclo semanal (YYYY-MM-DD)',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'IP do jogador para auditoria',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora exata do registro',
  PRIMARY KEY (`id`),
  INDEX `idx_week_score` (`week_cycle`, `score` DESC),
  INDEX `idx_instagram` (`instagram`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- COMO FUNCIONA O REINÍCIO AUTOMÁTICO TODA SEXTA-FEIRA:
-- =========================================================================
-- O sistema calcula automaticamente a data da última sexta-feira às 00:00:00
-- e grava no campo `week_cycle`.
--
-- Exemplo prático:
-- - Se alguém jogar na Sexta-feira (02/10), o ciclo será '2026-10-02'.
-- - Se alguém jogar no Domingo (04/10) ou na Quinta (08/10), o ciclo continuará '2026-10-02'.
-- - Quando virar para a próxima Sexta-feira (09/10), automaticamente o novo ciclo será '2026-10-09'!
--
-- Isso significa que o ranking zera automaticamente toda sexta-feira sem precisar
-- apagar dados nem rodar cronjobs no servidor! O histórico de quem venceu
-- nas semanas anteriores fica guardado para você conferir e premiar.
-- =========================================================================


-- =========================================================================
-- CONSULTAS PRONTAS PARA A SUA PÁGINA DE RANKING:
-- =========================================================================

-- 1. RANKING DA SEMANA ATUAL (Apenas a melhor pontuação de cada jogador nesta semana):
-- Substitua '2026-10-02' pela sexta-feira atual ou use a consulta dinâmica abaixo:

/*
SELECT 
    nome,
    instagram,
    curso,
    MAX(score) AS maior_pontuacao,
    MAX(max_combo) AS maior_combo,
    COUNT(id) AS total_partidas,
    MAX(created_at) AS ultima_partida
FROM pontuacoes
WHERE week_cycle = (
    -- Calcula dinamicamente a data da última sexta-feira no MySQL:
    DATE_SUB(CURDATE(), INTERVAL (DAYOFWEEK(CURDATE()) + 1) % 7 DAY)
)
GROUP BY instagram, nome, curso
ORDER BY maior_pontuacao DESC
LIMIT 50;
*/

-- 2. RANKING SIMPLES COM DATA FIXA (PASSANDO O $weekCycle DO PHP):
/*
SELECT 
    nome,
    instagram,
    curso,
    MAX(score) AS melhor_pontuacao,
    MAX(max_combo) AS combo,
    MAX(created_at) AS data_registro
FROM pontuacoes
WHERE week_cycle = :weekCycle
GROUP BY instagram, nome, curso
ORDER BY melhor_pontuacao DESC
LIMIT 50;
*/

-- 3. VER O VENCEDOR DE UMA SEXTA-FEIRA ESPECÍFICA (Ex: semana de 2026-10-02):
/*
SELECT nome, instagram, curso, MAX(score) AS pontuacao_vencedora
FROM pontuacoes
WHERE week_cycle = '2026-10-02'
GROUP BY instagram, nome, curso
ORDER BY pontuacao_vencedora DESC
LIMIT 1;
*/
