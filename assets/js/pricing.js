const THEME_KEY = "qa_theme";

function applyTheme(theme) {
  // вешаем тему на <html>, чтобы :root[data-theme="..."] работало везде
  document.documentElement.setAttribute("data-theme", theme);

  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.textContent = theme === "dark" ? "🌙" : "☀";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // ===== ТЕМА =====
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

  // "Начать бесплатно" → модалка (если не залогинен)
  if (freeBtn) {
    freeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openAuthModal("register"); // или "login" — как тебе удобнее
    });
  }

  // "Войти" в хедере
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

});