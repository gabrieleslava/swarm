import { saveScore, getTopScores, getUserRank } from './supabase-client.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const gameOverEl = document.getElementById('game-over');
const startScreenEl = document.getElementById('start-screen');
const nameInput = document.getElementById('player-name-input');
const startBtn = document.getElementById('start-btn');
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
let gameActive = false; // Start inactive
let gamePaused = false;
let score = 0;
let lastTime = 0;
let spawnTimer = 0;
let difficultyMultiplier = 1;
let playerName = localStorage.getItem('dinoRogueName') || '';

// Load Leaderboard on Init
async function loadLeaderboard() {
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
loadLeaderboard();

// Setup Start Screen
if (playerName) {
    nameInput.value = playerName;
}

startBtn.addEventListener('click', () => {
    const name = nameInput.value.trim().toUpperCase();
    if (name.length > 0) {
        playerName = name;
        localStorage.setItem('dinoRogueName', playerName);
        startScreenEl.classList.add('hidden');
        startGame();
    } else {
        alert("Por favor, digite um nome!");
    }
});

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
    const displayScore = Math.max(score, currentBest); // Show current run score if better? Or just best? detailed req implied best. 
    // Requirement: "highlight player name". Usually means "Personal Best". 
    // If I am playing right now and have 50, but my best is 100, checking rank of 100 makes sense.

    topScores.forEach((s, i) => {
        const li = document.createElement('li');
        const isMe = s.name === playerName && s.score === currentBest; // Simple check
        if (isMe) playerInTop10 = true;

        if (isMe) li.classList.add('highlight-row');

        li.innerHTML = `<span>${i + 1}. ${s.name}</span><span>${s.score}</span>`;
        pauseLeaderboardList.appendChild(li);
    });

    if (!playerInTop10) {
        // Fetch specific rank
        const rank = await getUserRank(currentBest);
        if (rank > 0) {
            const dots = document.createElement('li');
            dots.innerHTML = '<span style="text-align:center; width:100%">...</span>';
            pauseLeaderboardList.appendChild(dots);

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
    // Return to start screen to see leaderboard? Or just fast restart?
    // Let's just restart for better flow, but maybe update leaderboard in background?
    // Actually, user requested "Play Again" button. The click on Game Over div acts as that.
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
        ctx.fillStyle = '#202020';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    // Update Player Movement
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > player.speed) {
        const angle = Math.atan2(dy, dx);
        player.x += Math.cos(angle) * player.speed;
        player.y += Math.sin(angle) * player.speed;
        player.isMoving = true;
    } else {
        player.x = player.targetX;
        player.y = player.targetY;
        player.isMoving = false;
    }

    // Keep Player in Bounds
    player.x = Math.max(player.width / 2, Math.min(GAME_WIDTH - player.width / 2, player.x));
    player.y = Math.max(player.height / 2, Math.min(GAME_HEIGHT - player.height / 2, player.y));

    // Auto Shoot
    player.shootTimer += deltaTime;
    if (player.shootTimer >= player.shootInterval) {
        let targetAngle = -Math.PI / 2;
        if (enemies.length > 0) {
            let closestDist = Infinity;
            let closestEnemy = null;
            enemies.forEach(e => {
                const edx = e.x - player.x;
                const edy = e.y - player.y;
                const dist = edx * edx + edy * edy;
                if (dist < closestDist) {
                    closestDist = dist;
                    closestEnemy = e;
                }
            });
            if (closestEnemy) {
                targetAngle = Math.atan2(closestEnemy.y - player.y, closestEnemy.x - player.x);
            }
        }
        projectiles.push(new Projectile(player.x, player.y, targetAngle));
        player.shootTimer = 0;
        player.attackTimer = player.attackDuration; // Trigger attack animation
        player.currentFrame = 0; // Reset frame for new animation
    }

    // Spawn Enemies
    spawnTimer += deltaTime;
    if (spawnTimer > 1000 / difficultyMultiplier) {
        enemies.push(new Enemy());
        spawnTimer = 0;
    }
    difficultyMultiplier += 0.0001;

    // Update Projectiles
    projectiles.forEach(p => p.update());
    projectiles = projectiles.filter(p => !p.markedForDeletion);

    // Update Enemies & Collision
    enemies.forEach(e => {
        e.update();
        const pdx = player.x - e.x;
        const pdy = player.y - e.y;
        const pDist = Math.sqrt(pdx * pdx + pdy * pdy);
        if (pDist < 20) {
            gameOver();
        }
        projectiles.forEach(p => {
            const edx = p.x - e.x;
            const edy = p.y - e.y;
            const eDist = Math.sqrt(edx * edx + edy * edy);
            if (eDist < 15) {
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

    // Local High Score
    const localBest = localStorage.getItem('dinoRogueBest') || 0;
    if (score > localBest) {
        localStorage.setItem('dinoRogueBest', score);
        bestScoreEl.innerText = `Melhor: ${score} (NOVO!)`;
    } else {
        bestScoreEl.innerText = `Melhor: ${localBest}`;
    }

    // Submit Global Score
    saveScore(playerName, score).then(() => {
        console.log("Score saved!");
    });
}

// Start
// Start moved to Event Listener
// requestAnimationFrame(gameLoop);
