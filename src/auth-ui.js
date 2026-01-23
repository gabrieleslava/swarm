import { signUp, signInWithPassword, signOut } from './supabase-client.js';
import * as UI from './ui.js';

export function initAuthListeners() {
    // Login
    if (UI.loginBtn) {
        UI.loginBtn.addEventListener('click', async () => {
            const email = UI.emailInput.value.trim();
            const password = UI.passwordInput.value.trim();
            if (!email || !password) {
                UI.showMsg("Preencha email e senha.", true);
                return;
            }

            UI.loginBtn.innerText = "...";
            UI.showMsg("Entrando...");

            const res = await signInWithPassword(email, password);
            UI.loginBtn.innerText = "Entrar";

            if (res.success) {
                UI.showMsg("Sucesso! Recarregando...");
                setTimeout(() => window.location.reload(), 500);
            } else {
                UI.showMsg("Erro: " + res.error, true);
            }
        });
    }

    // Modal Open/Close
    if (UI.signupOpenBtn) {
        UI.signupOpenBtn.addEventListener('click', () => {
            if (UI.signupModal) {
                UI.signupModal.classList.remove('hidden');
                UI.showSignupMsg("");
            }
        });
    }

    if (UI.signupCancelBtn) {
        UI.signupCancelBtn.addEventListener('click', () => {
            if (UI.signupModal) UI.signupModal.classList.add('hidden');
        });
    }

    // Sign Up Submit
    if (UI.signupSubmitBtn) {
        UI.signupSubmitBtn.addEventListener('click', async () => {
            const email = UI.signupEmailInput.value.trim();
            const password = UI.signupPassInput.value.trim();
            const confirm = UI.signupConfirmInput.value.trim();

            if (!email || !password) {
                UI.showSignupMsg("Preencha todos os campos.", true);
                return;
            }
            if (password !== confirm) {
                UI.showSignupMsg("As senhas não coincidem!", true);
                return;
            }

            UI.signupSubmitBtn.innerText = "...";
            UI.showSignupMsg("Cadastrando...");

            const res = await signUp(email, password);
            UI.signupSubmitBtn.innerText = "Finalizar";

            if (res.success) {
                if (res.data.session) {
                    UI.showSignupMsg("Conta criada! Entrando...");
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    if (UI.signupModal) UI.signupModal.classList.add('hidden');
                    UI.showMsg("Verifique seu email para confirmar.", false);
                    alert("Caso seu email esteja correto, enviamos uma confirmação para " + email);
                }
            } else {
                if (res.error && (res.error.includes("User already registered") || res.error.includes("already registered"))) {
                    UI.showSignupMsg("Email já cadastrado!", true);
                } else {
                    UI.showSignupMsg("Erro: " + res.error, true);
                }
            }
        });
    }

    // Logout
    if (UI.logoutBtn) {
        UI.logoutBtn.addEventListener('click', async () => {
            await signOut();
            window.location.reload();
        });
    }
}
