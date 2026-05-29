// ----- КОНСТАНТЫ -----
const THEME_KEY = "qa_theme";
const API_BASE_URL = "http://127.0.0.1:8000";

// ----- API-ФУНКЦИИ -----
async function apiRegisterHR({ name, company, email, password }) {
  // 1) создаём компанию
  const companyResp = await fetch(`${API_BASE_URL}/companies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: company }),
  });

  if (!companyResp.ok) {
    const err = await companyResp.json().catch(() => ({}));
    throw new Error(err.detail || "Ошибка создания компании");
  }

  const companyData = await companyResp.json(); // ожидаем { id, name, ... }

  // 2) регистрируем HR
  const hrResp = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      name,
      company_id: companyData.id,
      role: "hr",
    }),
  });

  if (!hrResp.ok) {
    const err = await hrResp.json().catch(() => ({}));
    throw new Error(err.detail || "Ошибка регистрации HR");
  }

  return await hrResp.json();
}

async function apiLoginHR({ email, password }) {
  const resp = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.detail || "Неверный email или пароль");
  }

  return await resp.json(); // здесь можно взять user/id/token, если бек их вернёт
}

// ----- ТЕМА -----
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);

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

// ----- ОСНОВНОЙ КОД -----
document.addEventListener("DOMContentLoaded", () => {
  // ===== ТЕМА =====
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

  // ===== МОДАЛКА АВТОРИЗАЦИИ =====
  const authModal = document.getElementById("auth-modal");
  const authOverlay = document.getElementById("auth-overlay");
  const authClose = document.getElementById("auth-close");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const tabs = document.querySelectorAll(".modal-tab");

  // Кнопки "Войти" и "Получить доступ"
  const btnLogin = document.getElementById("open-auth-btn");
  const btnCta = document.getElementById("cta-btn");

  // Проверка авторизации
  function isLoggedIn() {
    return localStorage.getItem("qa_is_logged_in") === "1";
  }

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

  // Кнопка "Войти" в шапке
  if (btnLogin) {
    btnLogin.addEventListener("click", (e) => {
      e.preventDefault();
      if (!isLoggedIn()) {
        openAuthModal("login");
      } else {
        window.location.href = "hr-dashboard.html";
      }
    });
  }

  // Кнопка "Получить доступ" в hero
  if (btnCta) {
    btnCta.addEventListener("click", (e) => {
      e.preventDefault();
      if (!isLoggedIn()) {
        openAuthModal("login");
      } else {
        window.location.href = "hr-dashboard.html";
      }
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

  // ===== МОДАЛКА КАНДИДАТА (демо) =====
  const candidateOverlay = document.getElementById("candidate-overlay");
  const candidateModal = document.getElementById("candidate-modal");
  const candidateClose = document.getElementById("candidate-close");

  const candNameEl = document.getElementById("cand-name");
  const candTestEl = document.getElementById("cand-test");
  const candScoreEl = document.getElementById("cand-score");
  const candVerdictEl = document.getElementById("cand-verdict");
  const candDateEl = document.getElementById("cand-date");
  const candTestShortEl = document.getElementById("cand-test-short");
  const candTopicsBody = document.getElementById("cand-topics-body");
  const tableBody = document.getElementById("results-table-body");

  const demoTopics = [
    { name: "Теория тестирования", score: 85 },
    { name: "SQL", score: 70 },
    { name: "API", score: 60 },
    { name: "Инструменты QA", score: 90 },
  ];

  function openCandidateModal(candidateData) {
    if (!candidateModal || !candidateOverlay) return;

    const fullName = `${candidateData.firstName} ${candidateData.lastName}`.trim();

    if (candNameEl) {
      candNameEl.textContent = fullName || "Кандидат";
    }

    if (candTestEl) {
      candTestEl.textContent = candidateData.test
        ? `Тест: ${candidateData.test}`
        : "Тест";
    }

    if (candScoreEl) {
      candScoreEl.textContent = `${candidateData.score}%`;
    }

    if (candVerdictEl) {
      candVerdictEl.textContent = candidateData.verdict || "";
    }

    if (candDateEl) {
      candDateEl.textContent = candidateData.date || "";
    }

    if (candTestShortEl) {
      candTestShortEl.textContent = candidateData.test || "";
    }

    if (candTopicsBody) {
      candTopicsBody.innerHTML = "";

      candidateData.topics.forEach((topic) => {
        const row = document.createElement("div");
        row.className = "topic-row";

        row.innerHTML = `
          <div class="topic-name">${topic.name}</div>
          <div class="topic-score">${topic.score}%</div>
        `;

        candTopicsBody.appendChild(row);
      });
    }

    candidateModal.classList.add("open");
    candidateOverlay.classList.add("open");
  }

  function closeCandidateModal() {
    if (!candidateModal || !candidateOverlay) return;
    candidateModal.classList.remove("open");
    candidateOverlay.classList.remove("open");
  }

  if (candidateClose) {
    candidateClose.addEventListener("click", closeCandidateModal);
  }

  if (candidateOverlay) {
    candidateOverlay.addEventListener("click", closeCandidateModal);
  }

  if (tableBody) {
    tableBody.querySelectorAll("tr").forEach((row) => {
      row.addEventListener("click", () => {
        const cells = row.querySelectorAll("td");

        const candidateData = {
          firstName: cells[0]?.textContent.trim() || "",
          lastName: cells[1]?.textContent.trim() || "",
          test: cells[3]?.textContent.trim() || "",
          score: parseInt(cells[4]?.innerText, 10) || 0,
          verdict: cells[5]?.textContent.trim() || "",
          date: cells[6]?.textContent.trim() || "",
          topics: demoTopics,
        };

        openCandidateModal(candidateData);
      });
    });
  }

  // ===== ОБРАБОТЧИКИ ФОРМ ВХОДА И РЕГИСТРАЦИИ =====
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(loginForm);
      const email = formData.get("email")?.toString().trim();
      const password = formData.get("password")?.toString().trim();

      if (!email || !password) {
        alert("Введите email и пароль");
        return;
      }

      try {
        const data = await apiLoginHR({ email, password });

        // при желании: localStorage.setItem("qa_user_id", data.id);
        localStorage.setItem("qa_is_logged_in", "1");

        closeAuthModal();
        window.location.href = "hr-dashboard.html";
      } catch (err) {
        console.error(err);
        alert(err.message || "Ошибка входа");
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(registerForm);
      const name = formData.get("name")?.toString().trim();
      const company = formData.get("company")?.toString().trim();
      const email = formData.get("email")?.toString().trim();
      const password = formData.get("password")?.toString().trim();

      if (!name || !company || !email || !password) {
        alert("Заполните все обязательные поля");
        return;
      }

      if (!registerForm.checkValidity()) {
        alert("Проверьте корректность полей формы");
        return;
      }

      try {
        await apiRegisterHR({ name, company, email, password });

        // после успешной регистрации сразу делаем вход
        const data = await apiLoginHR({ email, password });

        localStorage.setItem("qa_is_logged_in", "1");
        // localStorage.setItem("qa_user_id", data.id);

        closeAuthModal();
        window.location.href = "hr-dashboard.html";
      } catch (err) {
        console.error(err);
        alert(err.message || "Ошибка регистрации");
      }
    });
  }
});