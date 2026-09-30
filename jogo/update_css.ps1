$path = "C:\Users\enrico\Downloads\site\style.css"
$content = Get-Content -Path $path -Raw -Encoding UTF8

if ($content -notmatch 'ranking-list') {
    $rankingCSS = @"

/* --- Estilos do Ranking do Ping Pong --- */
.ranking-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 15px;
}

.ranking-item {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 12px 15px;
    transition: transform 0.2s, background 0.2s;
}

.ranking-item:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
}

.ranking-pos {
    font-size: 1.5rem;
    font-weight: bold;
    width: 40px;
    text-align: center;
    margin-right: 15px;
    color: var(--accent);
}

.ranking-info {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.ranking-info strong {
    font-size: 1.1rem;
    color: var(--text-light);
}

.ranking-info small {
    color: var(--text-muted);
}

.ranking-score {
    text-align: right;
    display: flex;
    flex-direction: column;
}

.ranking-score strong {
    font-size: 1.2rem;
    color: var(--accent);
}

.ranking-score small {
    color: var(--text-muted);
}
"@
    $content = $content + "`n" + $rankingCSS
}

Set-Content -Path $path -Value $content -Encoding UTF8
Write-Host "CSS updated"
