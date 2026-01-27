const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const quizContainer = document.getElementById("quiz-container");
const quizQuestion = document.getElementById("quiz-question");
const quizOptions = document.getElementById("quiz-options");
const countdownElement = document.getElementById("countdown");

const gridSize = 30; const cellSize = 20;
let snake = [], food = {}, dx = 0, dy = 0, score = 0;
let gameOver = false, isPaused = false, gameStarted = false, gameSpeed = 150, gameTimeout;
let activeScreen = 'main-menu';
let quizAnswered = false;

let currentUser = localStorage.getItem('quilomboUserName') || "";
let ranking = JSON.parse(localStorage.getItem('quilomboRanking')) || [];

const questionsDatabase = {
    facil: [
        { q: "Quem foi a fundadora da comunidade Tia Eva?", options: ["Tia Eva", "Tia Maria", "Benedita"], correct: 0 },
        { q: "Qual o principal doce feito em Furnas do Dionísio?", options: ["Goiabada", "Rapadura", "Pé de moleque"], correct: 1 },
        { q: "O Quilombo Tia Eva é famoso por qual construção?", options: ["Um Castelo", "Uma Pequena Igreja", "Um Estádio"], correct: 1 },
        { q: "Qual é a cor predominante da bandeira quilombola?", options: ["Verde, Vermelho e Preto", "Azul e Branco", "Amarelo e Cinza"], correct: 0 }
    ],
    medio: [
        { q: "Dionísio Antônio Vieira veio de qual estado?", options: ["Bahia", "Minas Gerais", "Rio de Janeiro"], correct: 1 },
        { q: "A comunidade Furnas do Dionísio vive principalmente de quê?", options: ["Pesca", "Agricultura familiar", "Mineração"], correct: 1 },
        { q: "O 'Banho de São Benedito' é tradição de qual comunidade?", options: ["Furnas do Dionísio", "Tia Eva", "Chácara do Buriti"], correct: 1 },
        { q: "Qual o nome do estado onde ficam esses Quilombos?", options: ["Mato Grosso", "Mato Grosso do Sul", "Goiás"], correct: 1 }
    ],
    dificil: [
        { q: "O reconhecimento de terras é garantido por qual lei?", options: ["Constituição de 1988", "Lei Áurea", "Código Civil"], correct: 0 },
        { q: "Quantas comunidades quilombolas existem aproximadamente em MS?", options: ["Mais de 20", "Apenas 5", "Exatamente 50"], correct: 0 },
        { q: "O que significa a palavra 'Quilombo'?", options: ["Acampamento ou povoação", "Lugar de descanso", "Fazenda de ouro"], correct: 0 },
        { q: "A Furnas do Dionísio faz parte de qual bioma?", options: ["Caatinga", "Cerrado", "Mata Atlântica"], correct: 1 }
    ]
};

// --- NAVEGAÇÃO E PERFIL ---
function showScreen(screenId) {
    activeScreen = screenId;
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');

    if (screenId === 'game-screen') startGame();
    else stopGameEngine();
    if (screenId === 'ranking-screen') updateRankingTable();
    if (screenId === 'profile-screen') {
        document.getElementById('user-name-input').value = currentUser;
        updatePersonalRecordDisplay(currentUser);
    }
}

function updatePersonalRecordDisplay(name) {
    const display = document.getElementById('high-score-display');
    const userInRanking = ranking.find(item => item.user.toLowerCase() === name.toLowerCase().trim());
    display.textContent = userInRanking ? userInRanking.score : "0";
}

document.getElementById('user-name-input').addEventListener('input', (e) => updatePersonalRecordDisplay(e.target.value));

function checkUserBeforePlay() {
    if (!currentUser || currentUser.trim() === "") {
        document.getElementById('play-warning').classList.remove('hidden');
        setTimeout(() => document.getElementById('play-warning').classList.add('hidden'), 3000);
    } else showScreen('game-screen');
}

function saveUserAndReturn() {
    const input = document.getElementById('user-name-input').value.trim();
    if (input !== "") {
        currentUser = input;
        localStorage.setItem('quilomboUserName', currentUser);
        showScreen('main-menu');
    } else alert("Digite seu nome!");
}

// --- LÓGICA DO JOGO ---
function stopGameEngine() { if (gameTimeout) clearTimeout(gameTimeout); gameStarted = false; }

function startGame() {
    stopGameEngine();
    snake = [{ x: 15, y: 15 }];
    dx = 0; dy = 0; score = 0; gameSpeed = 150;
    gameOver = false; isPaused = false; quizAnswered = false;
    scoreElement.textContent = score;
    quizContainer.classList.add("hidden");
    generateFood();
    draw();
}

function generateFood() {
    food = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
    if (snake.some(s => s.x === food.x && s.y === food.y)) generateFood();
}

// FUNÇÃO BOOT: Gera comida longe da cabeça da cobra
function generateFoodFarFromSnake() {
    let newFood; let tooClose = true; let attempts = 0;
    while (tooClose && attempts < 100) {
        newFood = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
        const dist = Math.sqrt(Math.pow(newFood.x - snake[0].x, 2) + Math.pow(newFood.y - snake[0].y, 2));
        if (dist > 10 && !snake.some(s => s.x === newFood.x && s.y === newFood.y)) tooClose = false;
        attempts++;
    }
    food = newFood;
}

function updateSnake() {
    if (gameOver || isPaused || !gameStarted) return;
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize || snake.some(s => s.x === head.x && s.y === head.y)) {
        gameOverWithMessage("Você saiu do caminho ancestral!"); 
        return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = score;
        if (gameSpeed > 45) gameSpeed -= 4;
        if (score % 3 === 0) startQuiz(); else generateFood();
    } else snake.pop();
}

function draw() {
    if (gameOver) return;
    ctx.fillStyle = "#1a0f08"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffc800"; ctx.beginPath();
    ctx.arc(food.x * cellSize + cellSize/2, food.y * cellSize + cellSize/2, cellSize/2.2, 0, Math.PI * 2); ctx.fill();
    snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? "#58cc02" : "#78d937";
        ctx.beginPath(); ctx.roundRect(s.x * cellSize, s.y * cellSize, cellSize - 2, cellSize - 2, 8); ctx.fill();
    });
    if (!gameStarted && !gameOver) {
        ctx.fillStyle = "white"; ctx.font = "bold 18px Montserrat"; ctx.textAlign = "center";
        ctx.fillText("USE AS SETAS PARA COMEÇAR", 300, 300);
    }
}

// --- QUIZ E RANKING ---
function startQuiz() {
    isPaused = true; stopGameEngine(); quizAnswered = false;
    let level = score < 9 ? "facil" : (score < 18 ? "medio" : "dificil");
    const pool = questionsDatabase[level];
    const q = pool[Math.floor(Math.random() * pool.length)];
    quizContainer.classList.remove("hidden");
    quizQuestion.innerHTML = `<small style="color:var(--primary)">Nível: ${level.toUpperCase()}</small><br>${q.q}`;
    quizOptions.innerHTML = "";
    q.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.textContent = opt;
        btn.onclick = (e) => {
            if (quizAnswered) return;
            quizAnswered = true;
            if (i === q.correct) {
                btn.style.backgroundColor = "#58cc02"; btn.style.color = "white";
                setTimeout(resumeGame, 700);
            } else {
                btn.style.backgroundColor = "#ff4b4b"; btn.style.color = "white";
                setTimeout(() => gameOverWithMessage("A jornada exige conhecimento!"), 700);
            }
        };
        quizOptions.appendChild(btn);
    });
}

function resumeGame() {
    quizContainer.classList.add("hidden");
    generateFoodFarFromSnake(); // Garante distância segura
    countdownElement.classList.remove("hidden");
    let c = 3; countdownElement.textContent = c;
    const t = setInterval(() => {
        c--; 
        if (c > 0) { countdownElement.textContent = c; draw(); }
        else { clearInterval(t); countdownElement.classList.add("hidden"); isPaused = false; gameLoop(); }
    }, 1000);
}

function saveToRanking(s) {
    ranking = JSON.parse(localStorage.getItem('quilomboRanking')) || [];
    const idx = ranking.findIndex(item => item.user.toLowerCase() === currentUser.toLowerCase().trim());
    if (idx !== -1) { if (s > ranking[idx].score) ranking[idx].score = s; }
    else ranking.push({ user: currentUser, score: s });
    ranking.sort((a, b) => b.score - a.score);
    ranking = ranking.slice(0, 5);
    localStorage.setItem('quilomboRanking', JSON.stringify(ranking));
}

function updateRankingTable() {
    ranking = JSON.parse(localStorage.getItem('quilomboRanking')) || [];
    const body = document.getElementById('ranking-body');
    if (!body) return;
    body.innerHTML = ranking.length ? "" : "<tr><td colspan='3'>Sem recordes</td></tr>";
    ranking.forEach((item, i) => {
        body.innerHTML += `<tr><td>${i+1}º</td><td>${item.user}</td><td>${item.score} pts</td></tr>`;
    });
}

function clearRanking() {
    if (confirm("Deseja apagar o ranking?")) {
        localStorage.removeItem('quilomboRanking'); ranking = [];
        updateRankingTable(); updatePersonalRecordDisplay(currentUser);
    }
}

function gameOverWithMessage(msg) {
    gameOver = true; stopGameEngine();
    saveToRanking(score);
    quizContainer.classList.add("hidden");
    ctx.fillStyle = "rgba(26, 15, 8, 0.98)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffc800"; ctx.textAlign = "center"; ctx.font = "bold 35px Montserrat";
    ctx.fillText("FIM DA JORNADA", 300, 240);
    ctx.fillStyle = "white"; ctx.font = "18px Montserrat";
    ctx.fillText(msg, 300, 310);
    ctx.fillStyle = "#58cc02"; ctx.font = "bold 22px Montserrat";
    ctx.fillText(`${currentUser.toUpperCase()}: ${score} PONTOS`, 300, 380);
    ctx.fillStyle = "#94a3b8"; ctx.font = "bold 14px Montserrat";
    ctx.fillText("PRESSIONE [ENTER] PARA RECOMECAR", 300, 480);
}

function gameLoop() {
    if (gameOver || isPaused || activeScreen !== 'game-screen') return;
    updateSnake(); draw();
    gameTimeout = setTimeout(gameLoop, gameSpeed);
}

// --- INPUTS ---
document.addEventListener('keydown', e => {
    if (activeScreen !== 'game-screen') return;
    if (gameOver && e.key === 'Enter') { startGame(); return; }
    if (isPaused) return;
    const k = e.key;
    let moved = false;
    if (k === 'ArrowUp' && dy !== 1) { dx = 0; dy = -1; moved = true; }
    else if (k === 'ArrowDown' && dy !== -1) { dx = 0; dy = 1; moved = true; }
    else if (k === 'ArrowLeft' && dx !== 1) { dx = -1; dy = 0; moved = true; }
    else if (k === 'ArrowRight' && dx !== -1) { dx = 1; dy = 0; moved = true; }
    if (moved && !gameStarted && !gameOver) { gameStarted = true; gameLoop(); }
});

document.getElementById("restart-button").onclick = (e) => { e.target.blur(); startGame(); };
showScreen('main-menu');

// No final do seu index.js
function handleDirection(newDx, newDy) {
    if (isPaused || gameOver || activeScreen !== 'game-screen') return;
    if ((newDx === 1 && dx === -1) || (newDx === -1 && dx === 1)) return;
    if ((newDy === 1 && dy === -1) || (newDy === -1 && dy === 1)) return;
    
    dx = newDx; dy = newDy;
    if (!gameStarted) { gameStarted = true; gameLoop(); }
}

// Mobile Clicks
document.getElementById('btn-up').onclick = () => handleDirection(0, -1);
document.getElementById('btn-down').onclick = () => handleDirection(0, 1);
document.getElementById('btn-left').onclick = () => handleDirection(-1, 0);
document.getElementById('btn-right').onclick = () => handleDirection(1, 0);

// Desktop Keys
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') handleDirection(0, -1);
    if (e.key === 'ArrowDown') handleDirection(0, 1);
    if (e.key === 'ArrowLeft') handleDirection(-1, 0);
    if (e.key === 'ArrowRight') handleDirection(1, 0);
});