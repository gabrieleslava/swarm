// DOM Elements
export const scoreEl = document.getElementById('score');
export const gameOverEl = document.getElementById('game-over');
export const startScreenEl = document.getElementById('start-screen');
export const authContainer = document.getElementById('auth-container');
export const profileContainer = document.getElementById('profile-container');
export const nameInput = document.getElementById('player-name-input');
export const startBtn = document.getElementById('start-btn');
export const welcomeMsg = document.getElementById('welcome-msg');
export const leaderboardList = document.getElementById('leaderboard-list');
export const finalScoreEl = document.getElementById('final-score');
export const bestScoreEl = document.getElementById('best-score');
export const pauseMenuEl = document.getElementById('pause-menu');
export const pauseLeaderboardList = document.getElementById('pause-leaderboard-list');
export const resumeBtn = document.getElementById('resume-btn');
export const logoutBtn = document.getElementById('logout-btn');

// Auth DOM
export const emailInput = document.getElementById('email-input');
export const passwordInput = document.getElementById('password-input');
export const loginBtn = document.getElementById('login-btn');
export const signupOpenBtn = document.getElementById('signup-open-btn');
export const authMessageEl = document.getElementById('auth-message');

// Modal DOM
export const signupModal = document.getElementById('signup-modal');
export const signupSubmitBtn = document.getElementById('signup-submit-btn');
export const signupCancelBtn = document.getElementById('signup-cancel-btn');
export const signupEmailInput = document.getElementById('signup-email');
export const signupPassInput = document.getElementById('signup-password');
export const signupConfirmInput = document.getElementById('signup-confirm');
export const signupMessageEl = document.getElementById('signup-message');
export const exitGameBtn = document.getElementById('exit-game-btn');
export const levelUpScreen = document.getElementById('level-up-screen');
export const upgradeOptions = document.getElementById('upgrade-options');


export function showLevelUpScreen(options, onSelect) {
    if (!levelUpScreen || !upgradeOptions) return;

    upgradeOptions.innerHTML = '';

    options.forEach(opt => {
        const card = document.createElement('div');
        card.classList.add('upgrade-card');
        card.innerHTML = `<h3>${opt.name}</h3><p>${opt.description}</p>`;

        card.onclick = () => {
            onSelect(opt);
            levelUpScreen.classList.add('hidden');
        };

        upgradeOptions.appendChild(card);
    });

    levelUpScreen.classList.remove('hidden');
}


export function showMsg(msg, isError = false) {
    if (authMessageEl) {
        authMessageEl.innerText = msg;
        authMessageEl.style.color = isError ? '#ff4444' : '#ffcc00';
    } else {
        console.log(msg);
        if (isError) alert(msg);
    }
}

export function showSignupMsg(msg, isError = false) {
    if (signupMessageEl) {
        signupMessageEl.innerText = msg;
        signupMessageEl.style.color = isError ? '#ff4444' : '#ffcc00';
    }
}

export function updateLeaderboardUI(listElement, scores, currentPlayerName, currentBest) {
    listElement.innerHTML = '';

    if (scores.length === 0) {
        listElement.innerHTML = '<li>Sem pontuações ainda</li>';
        return;
    }

    let playerInTop10 = false;
    const pName = currentPlayerName ? currentPlayerName.trim().toUpperCase() : '';

    scores.forEach((s, i) => {
        const li = document.createElement('li');
        const sName = s.name ? s.name.trim().toUpperCase() : '';
        const isMe = (sName === pName && pName.length > 0);

        if (isMe) {
            playerInTop10 = true;
            li.classList.add('highlight-row');
        }

        li.innerHTML = `<span>${i + 1}. ${s.name}</span><span>${s.score}</span>`;
        listElement.appendChild(li);
    });

    // If generic leaderboard (not pause), we might just show top 10. 
    // If pause leaderboard, we add "..." and user rank if not in top 10.
    if (!playerInTop10 && listElement.id === 'pause-leaderboard-list' && currentBest > 0) {
        // This logic was in game.js, checking if we need to show rank separately
        // We might need to handle this logic mostly in game.js and just pass the extra <li> to append,
        // or handle the "fetching rank" outside and pass the rank here.
        // For now, let's keep simple update here.
    }
}
