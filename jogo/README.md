# 🏓 Ping Pong Challenge | Torneio Semanal

Jogo arcade de Ping Pong desenvolvido em HTML5 Canvas, CSS moderno e JavaScript, com integração a banco de dados MySQL para hospedagem no **InfinityFree** (ou qualquer servidor PHP/MySQL).

---

## 🚀 Funcionalidades Principais

1. **Aumento Contínuo de Velocidade:**
   - A velocidade da bola escala a cada rebatida na raquete (+3.8% cumulativo).
   - Efeitos visuais reativos: o rastro e o brilho da bola mudam de cor (Ciano ➔ Amarelo ➔ Magenta/Fogo) e a barra de velocidade no HUD reflete o ritmo eletrizante.
   - Ponto de impacto dinâmico: rebater no centro da raquete ativa o **Sweet Spot** ("PERFEITO!"), concedendo pontos bônus e faíscas.

2. **Cadastro Obrigatório Pré-Jogo:**
   - Antes de iniciar, o jogador informa: **Nome Completo**, **Instagram** (com auto-formatação `@`) e **Curso** (com lista de sugestões).
   - Os dados são salvos localmente para que o participante não precise redigitar caso queira jogar novamente.

3. **Reinício Automático Toda Sexta-Feira:**
   - O sistema calcula automaticamente a data da **sexta-feira mais recente às 00:00:00** e associa as pontuações ao ciclo daquela semana (`week_cycle`).
   - Toda sexta-feira, o ciclo muda automaticamente, reiniciando o placar da semana sem apagar o histórico de quem venceu nas semanas passadas.
   - **Zero manutenção:** Não exige agendamento de tarefas (cron jobs), funcionando 100% no plano gratuito do InfinityFree.

4. **Áudio Procedural Sintetizado (Web Audio API):**
   - Não depende de arquivos `.mp3` ou `.wav` externos, eliminando qualquer risco de erro 404 de áudio. Sons autênticos de toque, rebatida perfeita, vitória de round e derrota.

---

## 📁 Estrutura de Arquivos

```
jogo/
├── index.html            # Interface principal do jogo, HUD, modais de registro e Game Over
├── style.css             # Estilização neon esportiva, glassmorphism e responsividade
├── game.js               # Motor de física, IA, partículas, áudio e integração com o backend
├── database.sql          # Script SQL para criar a tabela `pontuacoes` no phpMyAdmin
├── exemplo_ranking.php   # Exemplo pronto da página de ranking para você usar como modelo
└── api/
    ├── db.php            # Configurações de conexão PDO e cálculo do ciclo de sexta-feira
    └── save_score.php    # Endpoint POST seguro que valida e grava os pontos no MySQL
```

---

## 🛠️ Como Hospedar no InfinityFree (Passo a Passo)

### 1. Criar o Banco de Dados no InfinityFree
1. Acesse o painel de controle da sua conta no **InfinityFree**.
2. Vá em **MySQL Databases**.
3. Crie uma nova base de dados (ex: `pingpong`). O InfinityFree irá gerar um nome como `if0_12345678_pingpong`.
4. Anote os dados informados na tela:
   - **MySQL Hostname:** (ex: `sql123.infinityfree.com`)
   - **MySQL Database Name:** (ex: `if0_12345678_pingpong`)
   - **MySQL Username:** (ex: `if0_12345678`)
   - **MySQL Password:** (sua senha do vPanel/InfinityFree)

### 2. Importar a Tabela no phpMyAdmin
1. Ainda na página de **MySQL Databases**, clique no botão **phpMyAdmin** ao lado do seu banco.
2. Com o banco selecionado, clique na aba superior **Importar** (ou **SQL**).
3. Abra o arquivo `database.sql`, copie o conteúdo e execute, ou envie o arquivo `database.sql` diretamente.
4. A tabela `pontuacoes` será criada com todos os campos e índices otimizados.

### 3. Configurar as Credenciais no Arquivo `api/db.php`
Abra o arquivo `api/db.php` e substitua as constantes com os dados que você anotou no Passo 1:

```php
define('DB_HOST', 'sql123.infinityfree.com'); // Seu MySQL Hostname do InfinityFree
define('DB_NAME', 'if0_12345678_pingpong');    // Seu Database Name
define('DB_USER', 'if0_12345678');             // Seu Database Username
define('DB_PASS', 'SUA_SENHA_AQUI');         // Sua senha da conta
```

### 4. Enviar os Arquivos via Gerenciador de Arquivos / FTP
1. No painel do InfinityFree, abra o **Online File Manager** (ou use o FileZilla via FTP).
2. Entre na pasta **`htdocs/`**.
3. Envie todos os arquivos do projeto para dentro da pasta `htdocs/`.
4. Pronto! Ao acessar seu domínio ou subdomínio do InfinityFree, o jogo estará online e gravando as pontuações no banco.

---

## 🏆 Como Fazer a Sua Página de Ranking

Quando você for criar a sua página separada de ranking, pode simplesmente consultar a tabela `pontuacoes` filtrando pela semana atual. 

Consulte o arquivo **`exemplo_ranking.php`** que deixamos preparado: ele já possui o código PHP + SQL e um design que você pode adaptar como desejar!
