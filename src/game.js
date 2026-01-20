import {
    signUp,
    signInWithPassword,
    signOut,
    getMyProfile,
    createProfile,
    updateBestScore,
    getTopScores,
    getUserRank,
    getSession
} from './supabase-client.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const gameOverEl = document.getElementById('game-over');
const startScreenEl = document.getElementById('start-screen');
// Elements for Auth UI
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn'); // Renamed/New
const logoutBtn = document.getElementById('logout-btn');

const authContainer = document.getElementById('auth-container');
const profileContainer = document.getElementById('profile-container');
const nameInput = document.getElementById('player-name-input');
const startBtn = document.getElementById('start-btn');
const welcomeMsg = document.getElementById('welcome-msg');

const leaderboardList = document.getElementById('leaderboard-list');
const finalScoreEl = document.getElementById('final-score');
const bestScoreEl = document.getElementById('best-score');
const pauseMenuEl = document.getElementById('pause-menu');
const pauseLeaderboardList = document.getElementById('pause-leaderboard-list');
const resumeBtn = document.getElementById('resume-btn');

// Game Settings
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Assets
const walkImg = new Image();
walkImg.src = 'assets/images/walk.png';
const idleImg = new Image();
idleImg.src = 'assets/images/idle.png';
const throwImg = new Image();
throwImg.src = 'assets/images/throw.png';
const walkAttackImg = new Image();
walkAttackImg.src = 'assets/images/walk_attack.png';

const bgImg = new Image();
bgImg.src = 'assets/images/background.png';
let bgPattern = null;

bgImg.onload = () => {
    bgPattern = ctx.createPattern(bgImg, 'repeat');
};

// State
let gameActive = false;
let gamePaused = false;
let score = 0;
let lastTime = 0;
let spawnTimer = 0;
let difficultyMultiplier = 1;
let playerName = '';

// --- Auth & Start Logic ---

function showAuthenticatedUI(name) {
    playerName = name;
    authContainer.classList.add('hidden');
    profileContainer.classList.remove('hidden');

    // Hide name input since we have a profile
    nameInput.classList.add('hidden');
    welcomeMsg.innerText = `Olá, ${playerName}!`;
    welcomeMsg.classList.remove('hidden');

    startBtn.innerText = "JOGAR";
    startBtn.onclick = () => {
        startScreenEl.classList.add('hidden');
        startGame();
    };

    // Show logout
    logoutBtn.classList.remove('hidden');
}

function showNameCreationUI() {
    // User is logged in but table has no row
    authContainer.classList.add('hidden');
    profileContainer.classList.remove('hidden');

    nameInput.classList.remove('hidden');
    welcomeMsg.classList.add('hidden');
    startBtn.innerText = "Salvar Nome e Jogar";

    startBtn.onclick = async () => {
        const name = nameInput.value.trim().toUpperCase();
        if (name.length === 0) {
            alert("Escolha um nome!");
            return;
        }

        startBtn.disabled = true;
        const result = await createProfile(name);
        if (result.success) {
            showAuthenticatedUI(name); // Refresh UI
            startScreenEl.classList.add('hidden');
            startGame();
        } else {
            startBtn.disabled = false;
            if (result.error === 'NAME_TAKEN') alert("Nome já existe! Escolha outro.");
            else alert("Erro: " + result.error);
        }
    };
}

// Global Auth Listeners

async function handleLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) {
        alert("Preencha email e senha.");
        return;
    }

    loginBtn.innerText = "...";
    const res = await signInWithPassword(email, password);
    loginBtn.innerText = "Entrar";

    if (res.success) {
        window.location.reload();
    } else {
        alert("Erro no Login: " + res.error);
    }
}

async function handleSignUp() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) {
        alert("Preencha email e senha.");
        return;
    }

    signupBtn.innerText = "...";
    const res = await signUp(email, password);
    signupBtn.innerText = "Cadastrar";

    if (res.success) {
        // If email confirmation is off, they might be logged in.
        // Or they might see "Check your email".
        if (res.data.session) {
            window.location.reload();
        } else {
            alert("Cadastro realizado! Se o login não for automático, verifique seu email.");
        }
    } else {
        alert("Erro no Cadastro: " + res.error);
    }
}

if (loginBtn) loginBtn.addEventListener('click', handleLogin);
if (signupBtn) signupBtn.addEventListener('click', handleSignUp);

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await signOut();
        window.location.reload();
    });
}

// Initial Load
async function init() {
    loadLeaderboard();
    const session = await getSession();


    if (!session) {
        // State 1: Not Logged In
        authContainer.classList.remove('hidden');
        profileContainer.classList.add('hidden');
    } else {
        // Logged In
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        authContainer.classList.add('hidden');

        const profile = await getMyProfile();
        if (profile) {
            // State 3: Has Profile
            showAuthenticatedUI(profile.name);
        } else {
            // State 2: Needs Name
            showNameCreationUI();
        }
    }
}
init();

// Load Leaderboard on Init
async function loadLeaderboard() {
    if (leaderboardList) {
        leaderboardList.innerHTML = '<li>Carregando...</li>';
        const scores = await getTopScores(10);
        leaderboardList.innerHTML = '';
        if (scores.length === 0) {
            leaderboardList.innerHTML = '<li>Sem pontuações ainda</li>';
        }
        scores.forEach((s, i) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${i + 1}. ${s.name}</span><span>${s.score}</span>`;
            leaderboardList.appendChild(li);
        });
    }
}

// Objects
const player = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
    width: 32, // Hitbox size
    height: 32,
    speed: 3,
    targetX: GAME_WIDTH / 2,
    targetY: GAME_HEIGHT / 2,
    shootTimer: 0,
    shootInterval: 1000,
    // Animation
    currentFrame: 0,
    maxFrames: 6, // Default for walk
    frameTimer: 0,
    frameInterval: 100,
    state: 'idle', // walk, throw, walkAttack, idle
    attackTimer: 0, // Time remaining for attack animation
    attackDuration: 500, // ms
    sprites: {
        idle: { img: idleImg, frames: 4 },
        walk: { img: walkImg, frames: 6 },
        throw: { img: throwImg, frames: 4 },
        walkAttack: { img: walkAttackImg, frames: 6 }
    },
    isMoving: false
};

let projectiles = [];
let enemies = [];
let particles = [];

// Input
let isMouseDown = false;
canvas.addEventListener('mousedown', (e) => {
    if (gamePaused) return;
    isMouseDown = true;
    updateTarget(e);
});
canvas.addEventListener('mouseup', () => isMouseDown = false);
canvas.addEventListener('mousemove', (e) => {
    if (isMouseDown && !gamePaused) {
        updateTarget(e);
    }
});

// Pause Input
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && gameActive) {
        togglePause();
    }
});

resumeBtn.addEventListener('click', togglePause);

async function togglePause() {
    gamePaused = !gamePaused;
    if (gamePaused) {
        pauseMenuEl.classList.remove('hidden');
        // Fetch and show leaderboard
        updatePauseLeaderboard();
    } else {
        pauseMenuEl.classList.add('hidden');
        lastTime = performance.now(); // Reset delta so we don't jump
        requestAnimationFrame(gameLoop);
    }
}

async function updatePauseLeaderboard() {
    pauseLeaderboardList.innerHTML = '<li>Carregando...</li>';
    const topScores = await getTopScores(10);
    pauseLeaderboardList.innerHTML = '';

    let playerInTop10 = false;
    const currentBest = parseInt(localStorage.getItem('dinoRogueBest') || 0);

    topScores.forEach((s, i) => {
        const li = document.createElement('li');
        // Relaxed check: Highlight if name matches (simplifies logic for multiple tabs/devices)
        const sName = s.name ? s.name.trim().toUpperCase() : '';
        const pName = playerName ? playerName.trim().toUpperCase() : '';

        const isMe = (sName === pName && pName.length > 0);

        if (isMe) playerInTop10 = true;
        if (isMe) li.classList.add('highlight-row');

        li.innerHTML = `<span>${i + 1}. ${s.name}</span><span>${s.score}</span>`;
        pauseLeaderboardList.appendChild(li);
    });

    if (!playerInTop10) {
        // Fetch specific rank
        const rank = await getUserRank(currentBest);
        if (rank > 0) {
            // Only show dots if we have items above us
            if (pauseLeaderboardList.children.length > 0) {
                const dots = document.createElement('li');
                dots.innerHTML = '<span style="text-align:center; width:100%">...</span>';
                pauseLeaderboardList.appendChild(dots);
            }

            const meLi = document.createElement('li');
            meLi.classList.add('highlight-row');
            meLi.innerHTML = `<span>${rank}. ${playerName}</span><span>${currentBest}</span>`;
            pauseLeaderboardList.appendChild(meLi);
        }
    }
}

function updateTarget(e) {
    if (!gameActive || gamePaused) return;
    const rect = canvas.getBoundingClientRect();
    player.targetX = e.clientX - rect.left;
    player.targetY = e.clientY - rect.top;
}

// Restart
gameOverEl.addEventListener('click', () => {
    restartGame();
});

function startGame() {
    restartGame();
}

function restartGame() {
    gameActive = true;
    gamePaused = false;
    score = 0;
    difficultyMultiplier = 1;
    player.x = GAME_WIDTH / 2;
    player.y = GAME_HEIGHT / 2;
    player.targetX = GAME_WIDTH / 2;
    player.targetY = GAME_HEIGHT / 2;
    projectiles = [];
    enemies = [];
    particles = [];
    gameOverEl.classList.add('hidden');
    scoreEl.innerText = `Pontos: ${score}`;
    lastTime = performance.now(); // Reset time to avoid huge delta
    requestAnimationFrame(gameLoop);
}

// Classes/Factories
class Projectile {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.radius = 4;
        this.speed = 8;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.markedForDeletion = false;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > GAME_WIDTH || this.y < 0 || this.y > GAME_HEIGHT) {
            this.markedForDeletion = true;
        }
    }
    draw(context) {
        context.fillStyle = '#ff0';
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
    }
}

class Enemy {
    constructor() {
        // Spawn at random edge
        if (Math.random() < 0.5) {
            this.x = Math.random() < 0.5 ? -20 : GAME_WIDTH + 20;
            this.y = Math.random() * GAME_HEIGHT;
        } else {
            this.x = Math.random() * GAME_WIDTH;
            this.y = Math.random() < 0.5 ? -20 : GAME_HEIGHT + 20;
        }

        this.speed = 1 + (Math.random() * 0.5 * difficultyMultiplier);
        this.size = 16;
        this.markedForDeletion = false;
        this.angle = 0;
    }
    update() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.angle = Math.atan2(dy, dx);
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }
    draw(context) {
        context.fillStyle = '#0f0'; // Matrix green
        context.font = '24px "VT323"';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('@', this.x, this.y);
    }
}

// Game Loop
function gameLoop(timestamp) {
    if (!gameActive || gamePaused) return;

    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    if (deltaTime > 100) deltaTime = 100; // Cap large deltas

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Background
    if (bgPattern) {
        ctx.fillStyle = bgPattern;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    } else {
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Logic
    spawnTimer += deltaTime;
    if (spawnTimer > 1000) { // 1 sec base spawn
        spawnTimer = 0;
        difficultyMultiplier += 0.01;

        // Spawn chance based on difficulty
        const spawnCount = Math.floor(difficultyMultiplier);
        for (let i = 0; i < spawnCount; i++) {
            enemies.push(new Enemy());
        }
        if (Math.random() < (difficultyMultiplier % 1)) {
            enemies.push(new Enemy());
        }
    }

    // Update Player
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const distance = Math.hypot(dx, dy);

    if (distance > player.speed) {
        player.x += (dx / distance) * player.speed;
        player.y += (dy / distance) * player.speed;
        player.isMoving = true;
    } else {
        player.x = player.targetX;
        player.y = player.targetY;
        player.isMoving = false;
    }

    // Auto Shoot
    player.shootTimer += deltaTime;
    if (player.shootTimer > player.shootInterval) {
        // Find nearest enemy
        let nearest = null;
        let minDist = Infinity;
        enemies.forEach(e => {
            const d = Math.hypot(e.x - player.x, e.y - player.y);
            if (d < minDist) {
                minDist = d;
                nearest = e;
            }
        });

        if (nearest) {
            const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
            projectiles.push(new Projectile(player.x, player.y, angle));
            player.shootTimer = 0;
            player.attackTimer = player.attackDuration; // Trigger logic check
        }
    }

    // Update Projectiles
    projectiles.forEach(p => p.update());
    projectiles = projectiles.filter(p => !p.markedForDeletion);

    // Update Enemies & Collisions
    enemies.forEach(e => {
        e.update();

        // Player Collision
        const distPlayer = Math.hypot(e.x - player.x, e.y - player.y);
        if (distPlayer < player.width / 2 + e.size / 2) {
            gameOver();
        }

        // Projectile Collision
        projectiles.forEach(p => {
            const distProj = Math.hypot(e.x - p.x, e.y - p.y);
            if (distProj < e.size / 2 + p.radius) {
                e.markedForDeletion = true;
                p.markedForDeletion = true;
                score += 10;
                scoreEl.innerText = `Pontos: ${score}`;
            }
        });
    });
    enemies = enemies.filter(e => !e.markedForDeletion);

    // Draw Entities
    projectiles.forEach(p => p.draw(ctx));

    // Draw Player
    // Draw Player

    // Update State
    if (player.attackTimer > 0) {
        player.attackTimer -= deltaTime;
        if (player.isMoving) {
            player.state = 'walkAttack';
        } else {
            player.state = 'throw';
        }
    } else {
        if (player.isMoving) {
            player.state = 'walk';
        } else {
            player.state = 'idle';
        }
    }

    const currentSprite = player.sprites[player.state];
    player.maxFrames = currentSprite.frames;

    if (currentSprite.img.complete && currentSprite.img.width > 0) {
        // Animation Logic
        player.frameTimer += deltaTime;
        if (player.frameTimer > player.frameInterval) {
            player.currentFrame++;
            if (player.currentFrame >= player.maxFrames) player.currentFrame = 0;
            player.frameTimer = 0;
        }

        // 1 Row Horizontal Strip Logic
        const cols = player.maxFrames;
        const rows = 1;
        const frameWidth = currentSprite.img.width / cols;
        const frameHeight = currentSprite.img.height / rows;

        const col = player.currentFrame % cols;
        const row = 0;

        // Fixed render size
        const renderedSize = 64;

        ctx.drawImage(
            currentSprite.img,
            col * frameWidth, row * frameHeight, frameWidth, frameHeight,
            player.x - renderedSize / 2, player.y - renderedSize / 2,
            renderedSize, renderedSize
        );
    } else {
        ctx.fillStyle = '#eb4034';
        ctx.fillRect(player.x - 16, player.y - 16, 32, 32);
    }

    enemies.forEach(e => e.draw(ctx));

    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameActive = false;
    gameOverEl.classList.remove('hidden');
    finalScoreEl.innerText = `Pontos: ${score}`;

    // Local High Score (Just to show, auth is truth)
    const localBest = parseInt(localStorage.getItem('dinoRogueBest') || 0);
    if (score > localBest) {
        localStorage.setItem('dinoRogueBest', score);
        bestScoreEl.innerText = `Melhor: ${score} (NOVO!)`;
    } else {
        bestScoreEl.innerText = `Melhor: ${localBest}`;
    }

    // Submit Global Score (Auth handled)
    updateBestScore(score).then(() => {
        console.log("Score updated if better.");
    });
}
