const THEME_KEY = "qa_theme";
const API_BASE_URL = "https://api.qa-quiz-test.ru";

// ===== ТЕМА =====
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);

  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.textContent = theme === "dark" ? "🌙" : "☀";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // --- Инициализация темы ---
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const initialTheme = saved || (prefersDark ? "dark" : "light");
  applyTheme(initialTheme);

  const toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const current =
        document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";

      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  // ===== ПРОВЕРКА АВТОРИЗАЦИИ =====
  function isLoggedIn() {
    return localStorage.getItem("qa_is_logged_in") === "1";
  }

  // ===== МОДАЛКА АВТОРИЗАЦИИ =====
  const authModal = document.getElementById("auth-modal");
  const authOverlay = document.getElementById("auth-overlay");
  const authClose = document.getElementById("auth-close");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const tabs = document.querySelectorAll(".modal-tab");

  const freeBtn = document.querySelector(".pricing-btn-free");
  const openAuthBtn = document.getElementById("open-auth-btn");

  function openAuthModal(initialTab = "login") {
    if (!authModal || !authOverlay) return;

    authModal.classList.add("open");
    authOverlay.classList.add("open");

    tabs.forEach((tab) => {
      const isActive = tab.dataset.tab === initialTab;
      tab.classList.toggle("active", isActive);
    });

    if (loginForm && registerForm) {
      loginForm.classList.toggle("active", initialTab === "login");
      registerForm.classList.toggle("active", initialTab === "register");
    }
  }

  function closeAuthModal() {
    if (!authModal || !authOverlay) return;
    authModal.classList.remove("open");
    authOverlay.classList.remove("open");
  }

  // "Начать бесплатно" → просто открывает модалку (можно сразу на регистрацию)
  if (freeBtn) {
    freeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openAuthModal("register");
    });
  }

  // "Войти" в хедере → открывает модалку
  if (openAuthBtn) {
    openAuthBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openAuthModal("login");
    });
  }

  // Закрытие модалки
  if (authClose) {
    authClose.addEventListener("click", closeAuthModal);
  }
  if (authOverlay) {
    authOverlay.addEventListener("click", closeAuthModal);
  }

  // Переключение вкладок Вход / Регистрация
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      tabs.forEach((t) => t.classList.toggle("active", t === tab));

      if (loginForm && registerForm) {
        loginForm.classList.toggle("active", target === "login");
        registerForm.classList.toggle("active", target === "register");
      }
    });
  });

     // ===== UI в хедере в зависимости от авторизации =====
  const navActions = document.querySelector(".nav-actions");

  if (isLoggedIn() && navActions) {
    const companyName = localStorage.getItem("qa_company_name") || "Компания";

    // убираем кнопку "Войти"
    if (openAuthBtn) {
      openAuthBtn.remove();
    }

    // добавляем плашку компании и кнопку "Выйти"
    const companySpan = document.createElement("span");
    companySpan.className = "company-pill";
    companySpan.textContent = `Компания: ${companyName}`;

    const logoutBtn = document.createElement("button");
    logoutBtn.type = "button";
    logoutBtn.className = "nav-link";
    logoutBtn.textContent = "Выйти";

    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("qa_is_logged_in");
      localStorage.removeItem("qa_company_id");
      localStorage.removeItem("qa_company_name");
      localStorage.removeItem("qa_company_token");
      window.location.href = "/";
    });

    navActions.prepend(companySpan);
    navActions.appendChild(logoutBtn);
  }

  // ===== ПЕРЕХОД В ДАШБОРД ПО ССЫЛКЕ В НАВИГАЦИИ =====
  const dashboardLink = document.getElementById("dashboard-link");

  if (dashboardLink) {
    dashboardLink.addEventListener("click", (e) => {
      if (!isLoggedIn()) {
        e.preventDefault();
        openAuthModal("login");
      }
      // если залогинен — обычный переход на /hr-dashboard/ по href
    });
  }

  // ===== API-ФУНКЦИИ ДЛЯ ЛОГИНА =====
  async function apiLoginHR({ email, password }) {
    const resp = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!resp.ok) {
      let payload = null;
      try {
        payload = await resp.json();
      } catch (_) {}

      const error = new Error(
        (payload && payload.detail) || "Неверный email или пароль"
      );
      if (payload) {
        error.backendPayload = payload;
      }
      throw error;
    }

    return await resp.json(); // { id, email, company_id, company_name, ... }
  }

  // ===== ОБРАБОТЧИК ФОРМЫ ЛОГИНА =====
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(loginForm);
      const email = formData.get("email")?.toString().trim();
      const password = formData.get("password")?.toString().trim();

      if (!email || !password) {
        alert("Укажите email и пароль");
        return;
      }

      try {
        const data = await apiLoginHR({ email, password });

        localStorage.setItem("qa_is_logged_in", "1");
        localStorage.setItem("qa_company_id", data.company_id);
        localStorage.setItem("qa_company_name", data.company_name);
        if (data.company_token) {
          localStorage.setItem("qa_company_token", data.company_token);
        }
        if (data.access_token) {
          localStorage.setItem("qa_access_token", data.access_token);
        }

        closeAuthModal();
        window.location.href = "/hr-dashboard/";
      } catch (err) {
        console.error(err);

        const msg =
          (err.backendPayload && err.backendPayload.detail) ||
          err.message ||
          "Ошибка входа";
        alert(msg);
      }
    });
  }

  // (Опционально) Можно позже добавить регистрацию через API так же, как на главной
});