// ----- КОНСТАНТЫ -----
const THEME_KEY = "qa_theme";
const API_BASE_URL = "https://api.qa-quiz-test.ru";

// ----- API-ФУНКЦИИ -----
async function apiRegisterHR({ name, company, email, password }) {
  // 1) создаём компанию
  const companyResp = await fetch(`${API_BASE_URL}/companies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: company }),
  });

  if (!companyResp.ok) {
    let payload = null;
    try {
      payload = await companyResp.json();
    } catch (_) {}

    const error = new Error(
      (payload && payload.detail) || "Ошибка создания компании"
    );
    if (payload) {
      error.backendPayload = payload;
    }
    throw error;
  }

  const companyData = await companyResp.json(); // { id, name, ... }

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
    let payload = null;
    try {
      payload = await hrResp.json();
    } catch (_) {}

    const error = new Error(
      (payload && payload.detail) || "Ошибка регистрации HR"
    );
    if (payload) {
      error.backendPayload = payload;
    }
    throw error;
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

  return await resp.json(); // ожидаем { id, email, company_id, company_name, ... }
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
      openAuthModal("login");
    });
  }

    // Кнопка "Получить доступ" в hero
  if (btnCta) {
    btnCta.addEventListener("click", (e) => {
      e.preventDefault();

      if (isLoggedIn()) {
        window.location.href = "/hr-dashboard/";
      } else {
        openAuthModal("login");
      }
    });
  }

   // ===== UI в хедере в зависимости от авторизации =====
  const navActions = document.querySelector(".nav-actions");

  if (isLoggedIn() && navActions) {
    const companyName = localStorage.getItem("qa_company_name") || "Компания";

    // убираем кнопку "Войти" из шапки
    if (btnLogin) {
      btnLogin.remove();
    }

    // плашка с названием компании
    const companySpan = document.createElement("span");
    companySpan.className = "company-pill";
    companySpan.textContent = `Компания: ${companyName}`;

    // кнопка "Выйти"
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

    // вставляем элементы в правую часть навигации
    navActions.appendChild(companySpan);
    navActions.appendChild(logoutBtn);
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

  // ===== МОДАЛКА КАНДИДАТА (демо в лендинге) =====
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

  const candidateTopicsByEmail = {
    "a.smirnova@mail.ru": [
      { name: "Теория тестирования", score: 85 },
      { name: "SQL", score: 70 },
      { name: "API", score: 60 },
      { name: "Инструменты QA", score: 90 },
    ],
    "d.kozlov@example.com": [
      { name: "Принципы тестирования", score: 50 },
      { name: "Виды тестирования", score: 55 },
      { name: "Документация", score: 65 },
      { name: "API", score: 45 },
    ],
    "m.ivanova@work.io": [
      { name: "Теория тестирования", score: 95 },
      { name: "SQL", score: 90 },
      { name: "API", score: 92 },
      { name: "Инструменты QA", score: 98 },
    ],
    "i.petrov@corp.ru": [
      { name: "Принципы тестирования", score: 35 },
      { name: "SQL", score: 25 },
      { name: "API", score: 30 },
      { name: "Жизненный цикл разработки", score: 40 },
    ],
    "o.sidorova@dev.com": [
      { name: "Теория тестирования", score: 80 },
      { name: "SQL", score: 70 },
      { name: "API", score: 75 },
      { name: "Инструменты QA", score: 65 },
    ],
  };


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

  const candidateCloseFooter = document.getElementById("candidate-close-footer");
  if (candidateCloseFooter) {
  candidateCloseFooter.addEventListener("click", closeCandidateModal);
  }

  if (tableBody) {
    tableBody.querySelectorAll("tr").forEach((row) => {
      row.addEventListener("click", () => {
        const cells = row.querySelectorAll("td");

        const email = cells[2]?.textContent.trim() || "";

        // Ищем темы для конкретного кандидата по email
        const topics =
          candidateTopicsByEmail[email] && candidateTopicsByEmail[email].length
            ? candidateTopicsByEmail[email]
            : demoTopics;

        const candidateData = {
          firstName: cells[0]?.textContent.trim() || "",
          lastName: cells[1]?.textContent.trim() || "",
          test: cells[3]?.textContent.trim() || "",
          score: parseInt(cells[4]?.innerText, 10) || 0,
          verdict: cells[5]?.textContent.trim() || "",
          date: cells[6]?.textContent.trim() || "",
          topics,
        };

        openCandidateModal(candidateData);
      });
    });
  }

  // ===== ОБРАБОТЧИКИ ФОРМ ВХОДА И РЕГИСТРАЦИИ =====

  // --- Вход ---
  if (loginForm) {
    const loginEmailInput = loginForm.querySelector('input[name="email"]');
    const loginPasswordInput = loginForm.querySelector(
      'input[name="password"]'
    );
    const loginEmailError = loginForm.querySelector(
      '.field-error-text[data-error-for="login-email"]'
    );
    const loginPasswordError = loginForm.querySelector(
      '.field-error-text[data-error-for="login-password"]'
    );

    function clearLoginErrors() {
      if (loginEmailInput) loginEmailInput.classList.remove("input-error");
      if (loginPasswordInput)
        loginPasswordInput.classList.remove("input-error");
      if (loginEmailError) loginEmailError.textContent = "";
      if (loginPasswordError) loginPasswordError.textContent = "";
    }

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearLoginErrors();

      const formData = new FormData(loginForm);
      const email = formData.get("email")?.toString().trim();
      const password = formData.get("password")?.toString().trim();

      let hasClientErrors = false;

      if (!email) {
        if (loginEmailInput) loginEmailInput.classList.add("input-error");
        if (loginEmailError) loginEmailError.textContent = "Укажите email";
        hasClientErrors = true;
      }
      if (!password) {
        if (loginPasswordInput)
          loginPasswordInput.classList.add("input-error");
        if (loginPasswordError)
          loginPasswordError.textContent = "Укажите пароль";
        hasClientErrors = true;
      }

      if (hasClientErrors) {
        return;
      }

      try {
        const data = await apiLoginHR({ email, password });

        localStorage.setItem("qa_is_logged_in", "1");
        localStorage.setItem("qa_company_id", data.company_id);
        localStorage.setItem("qa_company_name", data.company_name);

        // НОВОЕ:
        if (data.company_token) {
          localStorage.setItem("qa_company_token", data.company_token);
        }

        closeAuthModal();
        window.location.href = "/hr-dashboard/";

      } catch (err) {
        console.error(err);

        if (err.backendPayload) {
          const payload = err.backendPayload;
          const msg =
            typeof payload.detail === "string"
              ? payload.detail
              : err.message || "Ошибка входа";

          const lower = msg.toLowerCase();

          if (loginEmailInput)
            loginEmailInput.classList.add("input-error");
          if (loginPasswordInput)
            loginPasswordInput.classList.add("input-error");

          if (
            lower.includes("email") &&
            !lower.includes("парол") &&
            loginEmailError
          ) {
            loginEmailError.textContent = msg;
          } else if (loginPasswordError) {
            loginPasswordError.textContent = msg;
          } else {
            alert(msg);
          }
          return;
        }

        const msg = err.message || "Ошибка входа";
        const lower = msg.toLowerCase();

        if (loginEmailInput)
          loginEmailInput.classList.add("input-error");
        if (loginPasswordInput)
          loginPasswordInput.classList.add("input-error");

        if (
          lower.includes("email") &&
          !lower.includes("парол") &&
          loginEmailError
        ) {
          loginEmailError.textContent = msg;
        } else if (loginPasswordError) {
          loginPasswordError.textContent = msg;
        } else {
          alert(msg);
        }
      }
    });
  }

  // --- Регистрация ---
  if (registerForm) {
    const registerInputs = registerForm.querySelectorAll("input[name]");
    const errorBlocks = registerForm.querySelectorAll(".field-error-text");

    function clearRegisterErrors() {
      registerInputs.forEach((input) => {
        input.classList.remove("input-error");
      });
      errorBlocks.forEach((el) => {
        el.textContent = "";
      });
    }

    function setFieldError(fieldName, message) {
      const input = registerForm.querySelector(`input[name="${fieldName}"]`);
      const errorEl = registerForm.querySelector(
        `.field-error-text[data-error-for="${fieldName}"]`
      );
      if (input) {
        input.classList.add("input-error");
      }
      if (errorEl) {
        errorEl.textContent = message;
      }
    }

    // разбор ошибок бэка (HTTPException, 422 и т.п.)
    function applyBackendErrors(errPayload) {
      if (!errPayload) return;

      // detail — строка
      if (typeof errPayload.detail === "string") {
        const msg = errPayload.detail;
        const lower = msg.toLowerCase();

        if (lower.includes("email")) {
          setFieldError("email", msg);
        } else if (lower.includes("парол")) {
          setFieldError("password", msg);
        } else if (lower.includes("компан") || lower.includes("company")) {
          setFieldError("company", msg);
        } else if (lower.includes("имя") || lower.includes("name")) {
          setFieldError("name", msg);
        } else {
          alert(msg);
        }
        return;
      }

      // detail — массив ошибок (422 от FastAPI)
      if (Array.isArray(errPayload.detail)) {
        let hasFieldErrors = false;

        errPayload.detail.forEach((item) => {
          if (!item || !item.loc || !item.msg) return;

          const loc = item.loc;
          const fieldName = loc[loc.length - 1];

          if (["name", "company", "email", "password"].includes(fieldName)) {
            setFieldError(fieldName, item.msg);
            hasFieldErrors = true;
          }
        });

        if (!hasFieldErrors) {
          const first = errPayload.detail[0];
          if (first && first.msg) {
            alert(first.msg);
          }
        }

        return;
      }

      alert("Ошибка регистрации");
    }

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearRegisterErrors();

      const formData = new FormData(registerForm);
      const name = formData.get("name")?.toString().trim();
      const company = formData.get("company")?.toString().trim();
      const email = formData.get("email")?.toString().trim();
      const password = formData.get("password")?.toString().trim();

      let hasClientErrors = false;

      // Простая ручная проверка
      if (!name) {
        setFieldError("name", "Укажите имя");
        hasClientErrors = true;
      }
      if (!company) {
        setFieldError("company", "Укажите компанию");
        hasClientErrors = true;
      }
      if (!email) {
        setFieldError("email", "Укажите email");
        hasClientErrors = true;
      }
      if (!password) {
        setFieldError("password", "Укажите пароль");
        hasClientErrors = true;
      }

      // HTML5-валидация (minlength, pattern и т.п.)
      if (!registerForm.checkValidity()) {
        registerInputs.forEach((input) => {
          if (!input.checkValidity()) {
            const fieldName = input.name;
            if (fieldName === "password" && !input.validity.valid) {
              setFieldError(
                "password",
                "Минимум 8 символов, хотя бы одна буква и одна цифра"
              );
            } else if (fieldName === "email" && input.validity.typeMismatch) {
              setFieldError("email", "Некорректный email");
            } else if (fieldName === "name" && input.validity.tooShort) {
              setFieldError("name", "Имя слишком короткое");
            } else if (
              fieldName === "company" &&
              input.validity.tooShort
            ) {
              setFieldError("company", "Название компании слишком короткое");
            }
          }
        });
        hasClientErrors = true;
      }

      if (hasClientErrors) {
        return;
      }

      try {
        await apiRegisterHR({ name, company, email, password });
        const data = await apiLoginHR({ email, password });

        localStorage.setItem("qa_is_logged_in", "1");
        localStorage.setItem("qa_company_id", data.company_id);
        localStorage.setItem("qa_company_name", data.company_name);

        // НОВОЕ:
        if (data.company_token) {
        localStorage.setItem("qa_company_token", data.company_token);
        }

        closeAuthModal();
        window.location.href = "/hr-dashboard/";
      } catch (err) {
        console.error(err);

        if (err.backendPayload) {
          applyBackendErrors(err.backendPayload);
          return;
        }

        const msg = err.message || "Ошибка регистрации";
        const lower = msg.toLowerCase();

        if (lower.includes("email")) {
          setFieldError("email", msg);
        } else if (lower.includes("парол")) {
          setFieldError("password", msg);
        } else if (lower.includes("компан") || lower.includes("company")) {
          setFieldError("company", msg);
        } else if (lower.includes("имя") || lower.includes("name")) {
          setFieldError("name", msg);
        } else {
          alert(msg);
        }
      }
    });
  }
});