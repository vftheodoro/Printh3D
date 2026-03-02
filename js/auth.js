// ============================================
// PRINTH3D LITE — Módulo de Autenticação
// Login, logout, sessão e controle de acesso
// ============================================

const Auth = (() => {
    const SESSION_KEY = 'printh3d_session';

    function saveSession(session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    // ------------------------------------------
    // Realiza login verificando email e SHA-256
    // ------------------------------------------
    function login(email, password) {
        const users = Storage.getSheet('USERS');
        const hash = sha256(password);

        const user = users.find(
            u => u.email.toLowerCase() === email.toLowerCase() && u.senha_hash === hash
        );

        if (user) {
            const session = {
                id: user.id,
                nome: user.nome,
                email: user.email,
                tipo: user.tipo
            };
            saveSession(session);
            return { success: true, user: session };
        }

        return { success: false, message: 'Email ou senha inválidos.' };
    }

    // ------------------------------------------
    // Encerra sessão e redireciona para login
    // ------------------------------------------
    function logout() {
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        window.location.href = 'login.html';
    }

    // ------------------------------------------
    // Retorna dados do usuário logado ou null
    // ------------------------------------------
    function getCurrentUser() {
        const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            if (parsed) {
                saveSession(parsed);
            }
            return parsed;
        } catch {
            localStorage.removeItem(SESSION_KEY);
            sessionStorage.removeItem(SESSION_KEY);
            return null;
        }
    }

    // ------------------------------------------
    // Verifica se há sessão ativa
    // ------------------------------------------
    function isLoggedIn() {
        return getCurrentUser() !== null;
    }

    // ------------------------------------------
    // Verifica se o usuário logado é ADMIN
    // ------------------------------------------
    function isAdmin() {
        const user = getCurrentUser();
        return user !== null && user.tipo === 'ADMIN';
    }

    // ------------------------------------------
    // Guard: redireciona para login se não autenticado
    // Usar nas páginas protegidas (index.html)
    // ------------------------------------------
    function checkAuth() {
        if (!isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // ------------------------------------------
    // Guard: redireciona para index se já logado
    // Usar na página de login (login.html)
    // ------------------------------------------
    function checkLoginPage() {
        if (isLoggedIn()) {
            window.location.href = 'index.html';
            return true;
        }
        return false;
    }

    // API Pública
    return {
        login,
        logout,
        getCurrentUser,
        isLoggedIn,
        isAdmin,
        checkAuth,
        checkLoginPage
    };
})();
