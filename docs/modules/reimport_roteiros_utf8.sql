SET NAMES utf8mb4;
SET @OLD_UNIQUE_CHECKS = @@UNIQUE_CHECKS, UNIQUE_CHECKS = 0;
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

-- Rebuild only the imported module tables.
TRUNCATE TABLE noticias_gaveta;
TRUNCATE TABLE materias;
TRUNCATE TABLE gavetas;
TRUNCATE TABLE roteiros;

-- 1) Roteiros by legacy date
INSERT INTO roteiros (
    titulo,
    data,
    programa,
    status,
    observacoes,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT
    CONCAT('Roteiro Importado - ', DATE_FORMAT(ni.`date`, '%Y-%m-%d')) AS titulo,
    ni.`date`,
    'Legado' AS programa,
    'publicado' AS status,
    'Importado automaticamente de viproteiro.sql (news_items).' AS observacoes,
    NULL AS created_by,
    NULL AS updated_by,
    MIN(ni.created_at) AS created_at,
    MAX(ni.updated_at) AS updated_at
FROM viproteiro_tmp_utf8.news_items ni
WHERE ni.`date` IS NOT NULL
GROUP BY ni.`date`
ORDER BY ni.`date`;

-- 2) Materias ordered by legacy priority and id
INSERT INTO materias (
    roteiro_id,
    categoria_id,
    shortcut,
    titulo,
    descricao,
    duracao,
    status,
    creditos_gc,
    ordem,
    created_at,
    updated_at
)
SELECT
    r.id AS roteiro_id,
    NULL AS categoria_id,
    NULLIF(o.shortcut, '') AS shortcut,
    CASE
        WHEN o.title IS NULL OR TRIM(o.title) = '' THEN '(Sem titulo)'
        ELSE o.title
    END AS titulo,
    NULLIF(o.description, '') AS descricao,
    COALESCE(TIME_FORMAT(o.duration, '%H:%i:%s'), '00:00:00') AS duracao,
    CASE
        WHEN o.is_aired = 1 THEN 'no_ar'
        ELSE 'pendente'
    END AS status,
    NULL AS creditos_gc,
    o.ordem_norm AS ordem,
    o.created_at,
    o.updated_at
FROM (
    SELECT
        ni.id,
        ni.`date`,
        ni.shortcut,
        ni.title,
        ni.description,
        ni.duration,
        ni.is_aired,
        ni.created_at,
        ni.updated_at,
        ROW_NUMBER() OVER (
            PARTITION BY ni.`date`
            ORDER BY COALESCE(NULLIF(ni.priority, 0), 999999), ni.id
        ) AS ordem_norm
    FROM viproteiro_tmp_utf8.news_items ni
    WHERE ni.`date` IS NOT NULL
) o
INNER JOIN roteiros r
    ON r.data = o.`date`;

-- 3) Gavetas grouped by legacy author
-- Rows 59 and 60 in legacy drafts have title/author swapped.
INSERT INTO gavetas (
    nome,
    descricao,
    active,
    created_at,
    updated_at
)
SELECT
    d.author_norm AS nome,
    NULL AS descricao,
    1 AS active,
    MIN(d.created_at) AS created_at,
    MAX(d.updated_at) AS updated_at
FROM (
    SELECT
        nd.id,
        CASE
            WHEN nd.id IN (59, 60) THEN TRIM(nd.title)
            WHEN nd.author IS NULL OR TRIM(nd.author) = '' THEN 'Sem Autor'
            ELSE TRIM(nd.author)
        END AS author_norm,
        nd.created_at,
        nd.updated_at
    FROM viproteiro_tmp_utf8.news_drafts nd
) d
GROUP BY d.author_norm
ORDER BY d.author_norm;

-- 4) Noticias inside each gaveta
INSERT INTO noticias_gaveta (
    gaveta_id,
    titulo,
    conteudo,
    ordem,
    is_checked,
    created_at,
    updated_at
)
SELECT
    g.id AS gaveta_id,
    CASE
        WHEN nd.id IN (59, 60) THEN nd.author
        WHEN nd.title IS NULL OR TRIM(nd.title) = '' THEN '(Sem titulo)'
        ELSE nd.title
    END AS titulo,
    NULL AS conteudo,
    ROW_NUMBER() OVER (
        PARTITION BY g.id
        ORDER BY nd.created_at, nd.id
    ) AS ordem,
    nd.is_checked,
    nd.created_at,
    nd.updated_at
FROM viproteiro_tmp_utf8.news_drafts nd
INNER JOIN gavetas g
    ON g.nome = (
        CASE
            WHEN nd.id IN (59, 60) THEN TRIM(nd.title)
            WHEN nd.author IS NULL OR TRIM(nd.author) = '' THEN 'Sem Autor'
            ELSE TRIM(nd.author)
        END COLLATE utf8mb4_unicode_ci
    );

COMMIT;

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS = @OLD_UNIQUE_CHECKS;
