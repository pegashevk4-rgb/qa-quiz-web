const THEME_KEY = "qa_theme";

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.textContent = theme === "dark" ? "🌙" : "☀";
    btn.setAttribute(
      "aria-label",
      theme === "dark"
        ? "Переключить на светлую тему"
        : "Переключить на тёмную тему"
    );
  }
}

// Инициализация темы при загрузке
(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const initialTheme = saved || (prefersDark ? "dark" : "light");
  applyTheme(initialTheme);
})();

document.addEventListener("DOMContentLoaded", () => {
  // Кнопка переключения темы
  const toggleBtn = document.getElementById("theme-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const current = document.body.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  // Кнопка "Начать бесплатно"
  const freeBtn = document.querySelector(".pricing-btn-free");
  if (freeBtn) {
    freeBtn.addEventListener("click", () => {
      const isLoggedIn = localStorage.getItem("qa_is_logged_in") === "1";
      if (isLoggedIn) {
        window.location.href = "hr-dashboard.html";
      } else {
        window.location.href = "hr.html";
      }
    });
  }
});
