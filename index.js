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
        { q: "Em qual cidade fica a comunidade Tia Eva?", options: ["Campo Grande", "Dourados", "Cuiabá"], correct: 0 },
        { q: "O que a comunidade Tia Eva celebra em maio?", options: ["Festa de São Benedito", "Carnaval", "Festa do Peão"], correct: 0 }
    ],
    medio: [
        { q: "Dionísio Antônio Vieira, de Furnas, veio de qual estado?", options: ["Bahia", "Minas Gerais", "Rio de Janeiro"], correct: 1 },
        { q: "A Igreja de São Benedito (Tia Eva) é feita de qual material original?", options: ["Pedra", "Tijolos de adobe", "Madeira"], correct: 1 },
        { q: "Qual dessas é uma comunidade quilombola de MS?", options: ["Furnas do Dionísio", "Pantal", "Serra Geral"], correct: 0 },
        { q: "Onde se localiza a comunidade Quilombo de Corumbá?", options: ["Área Urbana", "Beira do Rio Paraguai", "No topo da serra"], correct: 1 }
    ],
    dificil: [
        { q: "Em que ano a comunidade Tia Eva foi oficialmente reconhecida?", options: ["1905", "1998", "2005"], correct: 2 },
        { q: "Qual a principal luta das comunidades quilombolas hoje?", options: ["Turismo", "Regularização das terras", "Venda de artesanato"], correct: 1 },
        { q: "Quantas comunidades quilombolas existem aproximadamente em MS?", options: ["Mais de 20", "Apenas 5", "Exatamente 50"], correct: 0 },
        { q: "A comunidade 'Chácara do Buriti' fica em qual região?", options: ["Campo Grande", "Jaraguari", "Nioaque"], correct: 0 }
    ]
};

// --- FUNÇÕES DE NAVEGAÇÃO E PERFIL ---

function showScreen(screenId) {
    activeScreen = screenId;
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
    
    if (screenId === 'game-screen') startGame();
    else stopGameEngine();
    
    if (screenId === 'ranking-screen') updateRankingTable();
    
    if (screenId === 'profile-screen') {
        const input = document.getElementById('user-name-input');
        input.value = currentUser;
        updatePersonalRecordDisplay(currentUser); // Atualiza o recorde ao abrir
    }
}

// NOVA FUNÇÃO: Identifica o recorde do nome digitado
function updatePersonalRecordDisplay(name) {
    const display = document.getElementById('high-score-display');
    const userInRanking = ranking.find(item => item.user.toLowerCase() === name.toLowerCase().trim());
    
    if (userInRanking) {
        display.textContent = userInRanking.score;
    } else {
        display.textContent = "0";
    }
}

// Escuta a digitação no campo de nome para atualizar o recorde em tempo real
document.getElementById('user-name-input').addEventListener('input', (e) => {
    updatePersonalRecordDisplay(e.target.value);
});

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

// --- MOTOR DO JOGO ---

function stopGameEngine() {
    if (gameTimeout) clearTimeout(gameTimeout);
    gameStarted = false;
}

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

function generateFoodFarFromSnake() {
    let newFood; let tooClose = true; let attempts = 0;
    while (tooClose && attempts < 100) {
        newFood = { x: Math.floor(Math.random() * gridSize), y: Math.floor(Math.random() * gridSize) };
        const distance = Math.sqrt(Math.pow(newFood.x - snake[0].x, 2) + Math.pow(newFood.y - snake[0].y, 2));
        if (distance > 10 && !snake.some(s => s.x === newFood.x && s.y === newFood.y)) tooClose = false;
        attempts++;
    }
    food = newFood;
}

function updateSnake() {
    if (gameOver || isPaused || !gameStarted) return;
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize || snake.some(s => s.x === head.x && s.y === head.y)) {
        stopGameEngine();
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
    if (!gameStarted && !gameOver && !isPaused) {
        ctx.fillStyle = "white"; ctx.font = "bold 18px Montserrat"; ctx.textAlign = "center";
        ctx.fillText("USE AS SETAS PARA COMEÇAR", 300, 300);
    }
}

// --- SISTEMA DE RANKING E QUIZ ---

function saveToRanking(s) {
    ranking = JSON.parse(localStorage.getItem('quilomboRanking')) || [];
    const userIndex = ranking.findIndex(item => item.user.toLowerCase() === currentUser.toLowerCase().trim());

    if (userIndex !== -1) {
        if (s > ranking[userIndex].score) {
            ranking[userIndex].score = s;
        }
    } else {
        ranking.push({ user: currentUser, score: s });
    }

    ranking.sort((a, b) => b.score - a.score);
    ranking = ranking.slice(0, 5);
    localStorage.setItem('quilomboRanking', JSON.stringify(ranking));
    updateRankingTable();
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
        ranking = []; localStorage.removeItem('quilomboRanking');
        updateRankingTable();
        updatePersonalRecordDisplay(currentUser); // Reseta o recorde no perfil visualmente
    }
}

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
            e.target.blur();
            if (quizAnswered) { gameOverWithMessage("Sem trapacear!"); return; }
            quizAnswered = true;
            if (i === q.correct) resumeGame();
            else gameOverWithMessage("A jornada exige conhecimento!");
        };
        quizOptions.appendChild(btn);
    });
}

function resumeGame() {
    quizContainer.classList.add("hidden");
    generateFoodFarFromSnake();
    countdownElement.classList.remove("hidden");
    let c = 3; countdownElement.textContent = c;
    dx = 0; dy = 0; 
    const t = setInterval(() => {
        c--; 
        if (c > 0) { countdownElement.textContent = c; draw(); }
        else { clearInterval(t); countdownElement.classList.add("hidden"); isPaused = false; draw(); }
    }, 1000);
}

function gameOverWithMessage(msg) {
    gameOver = true; stopGameEngine();
    saveToRanking(score);
    quizContainer.classList.add("hidden");
    ctx.fillStyle = "rgba(26, 15, 8, 0.98)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffc800"; ctx.textAlign = "center"; ctx.font = "bold 40px Montserrat";
    ctx.fillText("FIM DA JORNADA", 300, 240);
    ctx.fillStyle = "white"; ctx.font = "18px Montserrat";
    
    const words = msg.split(' ');
    let line = '', y = 310;
    for(let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        if (testLine.length > 40 && n > 0) {
            ctx.fillText(line, 300, y);
            line = words[n] + ' ';
            y += 25;
        } else line = testLine;
    }
    ctx.fillText(line, 300, y);
    ctx.fillStyle = "#58cc02"; ctx.font = "bold 22px Montserrat";
    ctx.fillText(`${currentUser}: ${score} PONTOS`, 300, y + 60);
    ctx.fillStyle = "#94a3b8"; ctx.font = "bold 16px Montserrat";
    ctx.fillText("PRESSIONE [ENTER] PARA RECOMECAR", 300, 520);
}

function gameLoop() {
    if (gameOver || isPaused || activeScreen !== 'game-screen' || !gameStarted) return;
    updateSnake(); draw();
    gameTimeout = setTimeout(gameLoop, gameSpeed);
}

document.addEventListener('keydown', e => {
    if (activeScreen !== 'game-screen') return;
    if (gameOver && e.key === 'Enter') { startGame(); return; }
    if (isPaused) return;
    const k = e.key;
    let moved = false;
    if (k === 'ArrowUp' && dy !== 1) { dx = 0; dy = -1; moved = true; }
    if (k === 'ArrowDown' && dy !== -1) { dx = 0; dy = 1; moved = true; }
    if (k === 'ArrowLeft' && dx !== 1) { dx = -1; dy = 0; moved = true; }
    if (k === 'ArrowRight' && dx !== -1) { dx = 1; dy = 0; moved = true; }
    if (moved && !gameStarted && !gameOver) { gameStarted = true; gameLoop(); }
});

document.getElementById("restart-button").onclick = (e) => { e.target.blur(); startGame(); };
showScreen('main-menu');