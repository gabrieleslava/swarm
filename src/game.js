import {
    createProfile,
    updateBestScore,
    getTopScores,
    getUserRank,
    getSession,
    getMyProfile
} from './supabase-client.js';

import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import { loadAssets, bgPattern } from './assets.js';
import * as UI from './ui.js';
import { initAuthListeners } from './auth-ui.js';
import { player } from './entities/player.js';
import { Enemy } from './entities/enemy.js';
import { Projectile } from './entities/projectile.js';
import { Pickup } from './entities/Pickup.js';
import { FloatingText } from './entities/FloatingText.js';

import { InputManager } from './core/InputManager.js';
import { PoolManager } from './core/PoolManager.js';
import { GameCamera } from './core/GameCamera.js';
import { EvolutionManager } from './managers/EvolutionManager.js';
import { WaveManager } from './managers/WaveManager.js';
import { LootManager } from './managers/LootManager.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// --- Core Systems ---
const inputManager = new InputManager();
const poolManager = new PoolManager();
const camera = new GameCamera(GAME_WIDTH, GAME_HEIGHT);
const evolutionManager = new EvolutionManager();
const waveManager = new WaveManager();
const lootManager = new LootManager(poolManager);

// Initialize Pools
poolManager.createPool('enemy', () => new Enemy(), 100);
poolManager.createPool('projectile', () => new Projectile(0, 0, 0), 50);
poolManager.createPool('pickup', () => new Pickup(), 50);
poolManager.createPool('text', () => new FloatingText(), 20);

// Entities Lists
let projectiles = [];
let enemies = [];
let particles = [];
let damageTexts = [];

// Initialize Weapons
// We need player ready? Player is imported singleton.
evolutionManager.init(player);


// Start Loading Assets
loadAssets(ctx);

// State
let gameActive = false;
let gamePaused = false;
let score = 0;
let lastTime = 0;
let spawnTimer = 0;
let difficultyMultiplier = 1;
let playerName = '';

// Entities Arrays


// Initialize Auth
initAuthListeners();

// --- Initialization Logic ---

async function init() {
    try {
        await loadLeaderboard();
        const session = await getSession();

        if (!session) {
            // Not Logged In
            UI.authContainer.classList.remove('hidden');
            UI.profileContainer.classList.add('hidden');
            if (UI.leaderboardList && UI.leaderboardList.innerHTML === '<li>Carregando...</li>') {
                UI.leaderboardList.innerHTML = '<li>Erro ao carregar ranking</li>';
            }
        } else {
            // Logged In
            if (UI.logoutBtn) UI.logoutBtn.classList.remove('hidden');
            UI.authContainer.classList.add('hidden');

            const profile = await getMyProfile();
            if (profile) {
                showAuthenticatedUI(profile.name);
            } else {
                showNameCreationUI(async (name) => {
                    // Placeholder
                });
            }
        }
    } catch (e) {
        console.error("Init Error:", e);
        if (UI.leaderboardList) UI.leaderboardList.innerHTML = '<li>Erro de Conexão</li>';
        UI.showMsg("Erro ao iniciar: " + e.message, true);
    }

    // Hook Level Up
    player.onLevelUp = (level) => {
        triggerLevelUp(level);
    };
}

function triggerLevelUp(level) {
    if (!gameActive) return;

    // Pause Game
    gamePaused = true;

    // Get Options
    const options = evolutionManager.getUpgrades();

    // Show UI
    UI.showLevelUpScreen(options, (selectedOption) => {
        // On Select
        evolutionManager.applyUpgrade(player, selectedOption);

        // Resume
        gamePaused = false;
        lastTime = performance.now(); // Reset delta
        requestAnimationFrame(gameLoop);
    });
}

init();

// --- UI Helpers for State ---

function showAuthenticatedUI(name) {
    playerName = name;
    UI.authContainer.classList.add('hidden');
    UI.profileContainer.classList.remove('hidden');

    UI.nameInput.classList.add('hidden');
    UI.welcomeMsg.innerText = `Olá, ${playerName}!`;
    UI.welcomeMsg.classList.remove('hidden');

    UI.startBtn.innerText = "JOGAR";
    UI.startBtn.onclick = () => {
        UI.startScreenEl.classList.add('hidden');
        startGame();
    };

    UI.logoutBtn.classList.remove('hidden');
}

function showNameCreationUI() {
    UI.authContainer.classList.add('hidden');
    UI.profileContainer.classList.remove('hidden');

    UI.nameInput.classList.remove('hidden');
    UI.welcomeMsg.classList.add('hidden');
    UI.startBtn.innerText = "Salvar Nome e Jogar";

    UI.startBtn.onclick = async () => {
        const name = UI.nameInput.value.trim().toUpperCase();
        if (name.length === 0) {
            alert("Escolha um nome!");
            return;
        }

        UI.startBtn.disabled = true;
        const result = await createProfile(name);
        if (result.success) {
            showAuthenticatedUI(name);
            UI.startScreenEl.classList.add('hidden');
            startGame();
        } else {
            UI.startBtn.disabled = false;
            if (result.error === 'NAME_TAKEN') alert("Nome já existe! Escolha outro.");
            else alert("Erro: " + result.error);
        }
    };
}

async function loadLeaderboard() {
    if (UI.leaderboardList) {
        UI.leaderboardList.innerHTML = '<li>Carregando...</li>';
        const scores = await getTopScores(10);
        UI.updateLeaderboardUI(UI.leaderboardList, scores, playerName, 0);
    }
}

// --- Game Control ---

function startGame() {
    restartGame();
}

function restartGame() {
    gameActive = true;
    gamePaused = false;
    score = 0;
    difficultyMultiplier = 1;

    player.reset();

    // Release all active entities back to pool
    projectiles.forEach(p => poolManager.release('projectile', p));
    enemies.forEach(e => poolManager.release('enemy', e));
    damageTexts.forEach(t => poolManager.release('text', t)); // Release text

    projectiles = [];
    enemies = [];
    particles = [];
    damageTexts = [];
    lootManager.reset();

    UI.gameOverEl.classList.add('hidden');
    UI.scoreEl.innerText = `Pontos: ${score}`;

    player.initSprites();
    camera.follow(player);

    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameActive = false;
    UI.gameOverEl.classList.remove('hidden');
    UI.finalScoreEl.innerText = `Pontos: ${score}`;

    const localBest = parseInt(localStorage.getItem('dinoRogueBest') || 0);
    if (score > localBest) {
        localStorage.setItem('dinoRogueBest', score);
        UI.bestScoreEl.innerText = `Melhor: ${score} (NOVO!)`;
    } else {
        UI.bestScoreEl.innerText = `Melhor: ${localBest}`;
    }

    updateBestScore(score).then(() => {
        console.log("Score updated if better.");
    });
}

// --- Game Logic ---
// Pause Logic
window.addEventListener('keydown', (e) => {
    // InputManager handles movement keys, but we can keep global UI keys here or move to InputManager
    if (e.key === 'Escape' && gameActive) {
        togglePause();
    }
});

if (UI.resumeBtn) UI.resumeBtn.addEventListener('click', togglePause);
if (UI.exitGameBtn) UI.exitGameBtn.addEventListener('click', () => window.location.reload());

// Restart Listener
UI.gameOverEl.addEventListener('click', () => {
    restartGame();
});

async function togglePause() {
    gamePaused = !gamePaused;
    if (gamePaused) {
        UI.pauseMenuEl.classList.remove('hidden');
        updatePauseLeaderboard();
    } else {
        UI.pauseMenuEl.classList.add('hidden');
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    }
}

async function updatePauseLeaderboard() {
    if (UI.pauseLeaderboardList) {
        UI.pauseLeaderboardList.innerHTML = '<li>Carregando...</li>';
        const topScores = await getTopScores(10);
        UI.pauseLeaderboardList.innerHTML = ''; // Clear loading

        let playerInTop10 = false;
        const currentBest = parseInt(localStorage.getItem('dinoRogueBest') || 0);
        const pName = playerName ? playerName.trim().toUpperCase() : '';

        topScores.forEach((s, i) => {
            const li = document.createElement('li');
            const sName = s.name ? s.name.trim().toUpperCase() : '';
            const isMe = (sName === pName && pName.length > 0);

            if (isMe) {
                playerInTop10 = true;
                li.classList.add('highlight-row');
            }
            li.innerHTML = `<span>${i + 1}. ${s.name}</span><span>${s.score}</span>`;
            UI.pauseLeaderboardList.appendChild(li);
        });

        if (!playerInTop10 && currentBest > 0 && pName.length > 0) {
            const rank = await getUserRank(currentBest);
            if (rank > 0) {
                if (UI.pauseLeaderboardList.children.length > 0) {
                    const dots = document.createElement('li');
                    dots.innerHTML = '<span style="text-align:center; width:100%">...</span>';
                    UI.pauseLeaderboardList.appendChild(dots);
                }
                const meLi = document.createElement('li');
                meLi.classList.add('highlight-row');
                meLi.innerHTML = `<span>${rank}. ${playerName}</span><span>${currentBest}</span>`;
                UI.pauseLeaderboardList.appendChild(meLi);
            }
        }
    }
}

// --- Game Loop ---

function gameLoop(timestamp) {
    if (!gameActive || gamePaused) return;

    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    if (deltaTime > 100) deltaTime = 100;

    // --- 1. Update Logic ---

    // Wave Management (Spawning)
    const waveContext = {
        poolManager,
        enemies,
        player,
        gameWidth: GAME_WIDTH,
        gameHeight: GAME_HEIGHT
    };
    waveManager.update(deltaTime, waveContext);

    // Updates
    player.update(deltaTime, inputManager, enemies, projectiles, poolManager);

    // Weapon System Update
    // Pass necessary context for weapons to find targets and spawn projectiles
    const combatContext = { player, enemies, poolManager, projectiles };
    evolutionManager.update(deltaTime, combatContext);

    // Loot Update
    lootManager.update(deltaTime, player);

    // Visual FX Update
    damageTexts.forEach(t => t.update(deltaTime));

    // Cleanup Floating Text
    for (let i = damageTexts.length - 1; i >= 0; i--) {
        const t = damageTexts[i];
        if (t.markedForDeletion) {
            poolManager.release('text', t);
            damageTexts.splice(i, 1);
        }
    }

    camera.update(deltaTime);

    // Projectiles
    projectiles.forEach(p => p.update());

    // Enemies (with Steering using neighbors)
    enemies.forEach(e => e.update(player.x, player.y, enemies));

    // Collisions
    // Player vs Enemy
    for (const e of enemies) {
        if (!e.active) continue;
        const distPlayer = Math.hypot(e.x - player.x, e.y - player.y);
        // Collision: Player Radius (16) + Enemy Radius (8)
        if (distPlayer < player.width / 2 + e.size / 2) {
            gameOver();
            return; // Stop frame
        }
    }

    // Projectile vs Enemy
    for (const p of projectiles) {
        if (!p.active) continue;
        for (const e of enemies) {
            if (!e.active) continue;

            const distProj = Math.hypot(e.x - p.x, e.y - p.y);
            if (distProj < e.size / 2 + p.radius) {
                e.markedForDeletion = true;
                p.markedForDeletion = true;
                score += 10;

                // Spawn Loot
                lootManager.spawnLoot(e.x, e.y, 'xp', 20);

                // Spawn Damage Text
                const txt = poolManager.get('text');
                const txtX = e.x + (Math.random() * 20 - 10);
                const txtY = e.y + (Math.random() * 20 - 10);
                if (txt) { // Safety
                    txt.reset(txtX, txtY, "15", "#fff");
                    damageTexts.push(txt);
                }

                UI.scoreEl.innerText = `Pontos: ${score} - Lv ${player.stats.level}`;
            }
        }
    }

    // Cleanup (Release to Pool)
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        if (p.markedForDeletion) {
            poolManager.release('projectile', p);
            projectiles.splice(i, 1);
        }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.markedForDeletion) {
            poolManager.release('enemy', e);
            enemies.splice(i, 1);
        }
    }


    // --- 2. Render ---
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Camera Transform Start
    camera.apply(ctx);

    // Draw Background (Static relative to view)
    // To make background "infinite" or at least cover the screen, we draw around the camera.
    // For now, let's just fill the camera view.
    if (bgPattern) {
        ctx.fillStyle = bgPattern;
        // Optimization: only fill relevant area or use transform
        // Simple: fillRect using camera coordinates
        ctx.save();
        ctx.translate(camera.x, camera.y); // Counteract camera apply to draw "screen space" pattern? 
        // No, we want world space pattern.
        // Actually ctx.fillStyle pattern is usually fixed to origin.
        ctx.fillRect(-camera.x, -camera.y, GAME_WIDTH + camera.x * 2, GAME_HEIGHT + camera.y * 2); // This is hacky.
        // Better:
        ctx.restore();

        // Simple fallback: Fill a huge rect
        ctx.fillRect(camera.x - 100, camera.y - 100, GAME_WIDTH + 200, GAME_HEIGHT + 200);
    } else {
        ctx.fillStyle = '#222';
        ctx.fillRect(camera.x, camera.y, GAME_WIDTH, GAME_HEIGHT);
    }

    // Draw Loot (Under player/enemies)
    lootManager.draw(ctx);

    player.draw(ctx, deltaTime);
    enemies.forEach(e => e.draw(ctx));
    projectiles.forEach(p => p.draw(ctx));

    // Draw FX
    damageTexts.forEach(t => t.draw(ctx));

    // Camera Transform End (Restore for UI)
    camera.reset(ctx);

    // Draw HUD (On top of everything, screen space)
    drawHUD(ctx);

    requestAnimationFrame(gameLoop);
}

function drawHUD(ctx) {
    // XP Bar
    const barWidth = GAME_WIDTH - 40;
    const barHeight = 20;
    const x = 20;
    const y = GAME_HEIGHT - 40;

    // Bg
    ctx.fillStyle = '#444';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Fill
    const xpPercent = Math.min(1, player.stats.xp / player.stats.nextLevelXp);
    ctx.fillStyle = '#00ccff';
    ctx.fillRect(x, y, barWidth * xpPercent, barHeight);

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Text
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Level ${player.stats.level} (${Math.floor(player.stats.xp)}/${player.stats.nextLevelXp})`, GAME_WIDTH / 2, y + 16);
}
