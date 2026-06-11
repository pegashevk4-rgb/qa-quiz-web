const THEME_KEY = "qa_theme";
const API_BASE_URL = "https://api.qa-quiz-test.ru";

// --- Проверка авторизации перед показом дашборда ---
(function guardDashboard() {
  const DEV_BYPASS_AUTH = false; // на проде обязательно false

  if (DEV_BYPASS_AUTH) {
    return;
  }

  const isLoggedIn = localStorage.getItem("qa_is_logged_in") === "1";
  const companyId = localStorage.getItem("qa_company_id");

  if (!isLoggedIn || !companyId) {
    window.location.href = "hr.html";
  }
})();

// --- Кандидаты (изначально пусто) ---
let candidates = [];

// --- Информация о тарифе ---
function renderPlanInfo(planData) {
  const el = document.getElementById("planInfo");
  if (!el) return;

  const {
    plan_name = "Free trial",
    tests_limit = 10,
    tests_used = 0,
    subscription_expires_at = null,
    is_trial = plan_name === "Free trial",
  } = planData || {};

  const remaining =
    tests_limit == null ? Infinity : Math.max(0, tests_limit - tests_used);

  // Считаем дни до окончания, если есть дата
  let daysLeft = null;
  if (subscription_expires_at) {
    const today = new Date();
    const exp = new Date(subscription_expires_at);
    const diffMs = exp.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
    daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  el.classList.remove("plan-card-okay", "plan-card-danger", "plan-card-warning");

  let textHtml = "";

  if (is_trial) {
    // --- ВЕТКА ПРОБНИКА ---
    const limitText =
      tests_limit == null
        ? "Безлимит по тестам"
        : `Осталось ${remaining} из ${tests_limit} тестов`;

    const isOverLimit = tests_limit != null && remaining <= 0;

    el.classList.add(isOverLimit ? "plan-card-danger" : "plan-card-okay");

    textHtml = `
      Текущий тариф: <strong>${plan_name}</strong>
      · ${limitText}
    `;
  } else {
    // --- ВЕТКА ПОДПИСКИ ---
    let expiresText = "";
    if (subscription_expires_at) {
      expiresText = `Подписка до ${subscription_expires_at}`;
      if (daysLeft !== null && daysLeft <= 3) {
        el.classList.add("plan-card-warning");
        expiresText += ` · Осталось ${daysLeft} дн.`;
      } else {
        el.classList.add("plan-card-okay");
      }
    } else {
      el.classList.add("plan-card-okay");
      expiresText = "Подписка активна";
    }

    textHtml = `
      Текущий тариф: <strong>${plan_name}</strong>
      · ${expiresText}
    `;
  }

  el.innerHTML = `
    <span>${textHtml}</span>
    <a href="pricing.html">Перейти к тарифам</a>
  `;
}

// --- Блокировка/разблокировка кнопок тестов по тарифу ---
function applyPlanLimitToButtons(planData) {
  const {
    plan_name = "Free trial",
    tests_limit = 10,
    tests_used = 0,
    subscription_expires_at = null,
    is_trial = plan_name === "Free trial",
  } = planData || {};

  const remaining =
    tests_limit == null ? Infinity : Math.max(0, tests_limit - tests_used);

  // Считаем дни до окончания, если есть дата
  let daysLeft = null;
  if (subscription_expires_at) {
    const today = new Date();
    const exp = new Date(subscription_expires_at);
    const diffMs = exp.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
    daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  const testButtons = document.querySelectorAll(".btn-copy");

  const disableAll = (label) => {
    testButtons.forEach((btn) => {
      btn.disabled = true;
      btn.classList.add("btn-disabled");
      btn.textContent = label;
    });
  };

  const enableAll = () => {
    testButtons.forEach((btn) => {
      btn.disabled = false;
      btn.classList.remove("btn-disabled");
      btn.textContent = "Скопировать ссылку";
    });
  };

  // --- ЛОГИКА ---

  // 1) TRIAL: ограничиваем чисто по лимиту
  if (is_trial) {
    if (tests_limit != null && remaining <= 0) {
      disableAll("Лимит тестов пробной версии исчерпан");
    } else {
      enableAll();
    }
    return;
  }

  // 2) ПЛАТНАЯ ПОДПИСКА

  // 2.1. Если есть лимит и он выбит — блокируем независимо от даты
  if (tests_limit != null && remaining <= 0) {
    if (daysLeft !== null && daysLeft < 0) {
      disableAll("Подписка завершена и лимит тестов исчерпан");
    } else {
      disableAll("Лимит тестов по тарифу исчерпан");
    }
    return;
  }

  // 2.2. Лимит ещё есть
  // Если подписка истекла (daysLeft < 0), но remaining > 0 — разрешаем использовать
  if (daysLeft !== null && daysLeft < 0 && remaining > 0) {
    enableAll();
    return;
  }

  // 2.3. Во всех остальных случаях (активная подписка, лимит не выбит)
  enableAll();
}

// --- Загрузка тарифа компании (с заглушкой, как у тебя) ---
async function loadCompanyPlan() {
  const companyId = localStorage.getItem("qa_company_id");
  if (!companyId) {
    console.warn("Нет company_id в localStorage для плана");
    // Мягкий дефолт, если что-то пошло не так
    const fallback = {
      plan_name: "Free trial",
      tests_limit: 10,
      tests_used: 0,
      subscription_expires_at: null,
      is_trial: true,
    };
    renderPlanInfo(fallback);
    applyPlanLimitToButtons(fallback);
    return;
  }

  try {
    const resp = await fetch(`${API_BASE_URL}/api/company/${companyId}/plan`);
    if (!resp.ok) {
      throw new Error("Ошибка ответа плана " + resp.status);
    }
    const planData = await resp.json();

    renderPlanInfo(planData);
    applyPlanLimitToButtons(planData);
  } catch (err) {
    console.error("Ошибка загрузки плана компании", err);
    const fallback = {
      plan_name: "Free trial",
      tests_limit: 10,
      tests_used: 0,
      subscription_expires_at: null,
      is_trial: true,
    };
    renderPlanInfo(fallback);
    applyPlanLimitToButtons(fallback);
  }
}

// --- Загрузка результатов компании из API ---
async function loadCompanyResults() {
  const companyId = localStorage.getItem("qa_company_id");
  if (!companyId) {
    console.warn("Нет company_id в localStorage");
    return;
  }

  try {
    const resp = await fetch(
      `${API_BASE_URL}/api/company/${companyId}/results`,
      {
        credentials: "include",
      }
    );
    if (!resp.ok) {
      console.error("Ошибка загрузки результатов компании", resp.status);
      return;
    }

    const data = await resp.json(); // массив ResultRow

    candidates = data.map((row, index) => {
      const fullName = `${row.first_name} ${row.last_name}`.trim();
      const dateStr = row.created_at
        ? row.created_at.slice(0, 10)
        : "";

      let testName = row.test_id;
      if (row.test_id === "qa_junior_web") testName = "Junior QA";
      if (row.test_id === "qa_middle_web") testName = "Middle QA";
      if (row.test_id === "qa_senior_web") testName = "Senior QA";

      const verdict = row.verdict || "On the edge";

      // Детальная разбивка по темам
      const topicScores = {};

      if (Array.isArray(row.categories)) {
        for (const cat of row.categories) {
          topicScores[cat.category] = {
            percent: cat.percent ?? 0,
            correct: cat.correct ?? null,
            total: cat.total ?? null,
          };
        }
      } else {
        topicScores["Общий результат"] = {
          percent: row.percent ?? 0,
          correct: null,
          total: null,
        };
      }

      return {
        id: row.result_id ?? index + 1,
        name: fullName || "Кандидат",
        testName,
        score: row.percent,
        verdict,
        date: dateStr,
        topicScores,
        weakAreas: row.weak_areas || [],
        strongAreas: row.strong_areas || [],
      };
    });

    updateMetrics();
    renderTable();
  } catch (err) {
    console.error("Ошибка при запросе результатов компании", err);
  }
}


// --- Генерация ссылок на тесты ---
const testButtons = document.querySelectorAll(".btn-copy");

function getTestLink(testId) {
  const companyToken = localStorage.getItem("qa_company_token");

  if (!companyToken) {
    alert("Не найден токен компании. Зайдите в систему заново.");
    return "";
  }

  // Квиз живёт в папке quiz
  const baseUrl = "https://qa-quiz-test.ru/quiz/index.html";

  const params = new URLSearchParams({
    test_id: testId,           // qa_junior_web / qa_middle_web / qa_senior_web
    company_token: companyToken,
  });

  return `${baseUrl}?${params.toString()}`;
}



testButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const testId = btn.getAttribute("data-test-id");
    const url = getTestLink(testId);
    if (!url) return;

    navigator.clipboard
      .writeText(url)
      .then(() => {
        btn.textContent = "Ссылка скопирована";
        setTimeout(() => {
          btn.textContent = "Скопировать ссылку";
        }, 2000);
      })
      .catch(() => {
        alert(`Скопируйте ссылку вручную:\n${url}`);
      });
  });
});

// --- Таблица кандидатов и метрики ---
const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("searchInput");
const scoreSort = document.getElementById("scoreSortButton");
const sortIndicator = document.getElementById("sortIndicator");
const emptyState = document.getElementById("emptyState");

const modal = document.getElementById("candidateModal");
const overlay = document.getElementById("modalOverlay");

const modalName = document.getElementById("modalName");
const modalTest = document.getElementById("modalTest");
const modalScore = document.getElementById("modalScore");
const modalVerdict = document.getElementById("modalVerdict");
const modalDate = document.getElementById("modalDate");
const modalId = document.getElementById("modalId");
const topicsContainer = document.getElementById("topicsContainer");
const questionsContainer = document.getElementById("questionsContainer");
const filterButtons = document.querySelectorAll(".filter-btn");
const testFilterButtons = document.querySelectorAll(".test-filter-btn");

const exportCsvBtn = document.getElementById("exportCsvBtn");

let sortDirection = "desc";
let activeVerdict = "All";
let activeTestFilter = "All";
let currentCandidate = null;

function updateMetrics() {
  document.getElementById("metricTotal").textContent = candidates.length;

  document.getElementById("metricPassed").textContent = candidates.filter(
    (c) => c.verdict === "Passed"
  ).length;

  document.getElementById("metricEdge").textContent = candidates.filter(
    (c) => c.verdict === "On the edge"
  ).length;

  document.getElementById("metricFailed").textContent = candidates.filter(
    (c) => c.verdict === "Failed"
  ).length;
}

function getVerdictClass(verdict) {
  if (verdict === "Passed") return "passed";
  if (verdict === "On the edge") return "edge";
  return "failed";
}

function translateVerdict(verdict) {
  if (verdict === "Passed") return "Прошёл";
  if (verdict === "On the edge") return "На грани";
  if (verdict === "Failed") return "Провалил";
  return verdict;
}

function setVerdictFilter(value) {
  activeVerdict = value;

  filterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.value === value);
  });

  renderTable();
}

function getFilteredCandidates() {
  const searchValue = searchInput.value.trim().toLowerCase();

  let filtered = [...candidates];

  // Фильтр по вердикту
  if (activeVerdict !== "All") {
    filtered = filtered.filter(
      (candidate) => candidate.verdict === activeVerdict
    );
  }

  // Фильтр по тесту
  if (activeTestFilter !== "All") {
    filtered = filtered.filter(
      (candidate) => candidate.testName === activeTestFilter
    );
  }

  // Поиск по имени
  if (searchValue) {
    filtered = filtered.filter((candidate) =>
      candidate.name.toLowerCase().includes(searchValue)
    );
  }

  // Сортировка по результату
  filtered.sort((a, b) => {
    return sortDirection === "desc" ? b.score - a.score : a.score - b.score;
  });

  return filtered;
}

function setTestFilter(value) {
  activeTestFilter = value;

  testFilterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.test === value);
  });

  renderTable();
}

testFilterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setTestFilter(btn.dataset.test);
  });
});

function renderTable() {
  const data = getFilteredCandidates();

  tableBody.innerHTML = "";

  if (!data.length) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  data.forEach((candidate) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${candidate.name}</td>
      <td>${candidate.testName}</td>
      <td class="score-cell">
        <span class="score-badge">
          ${candidate.score}%
        </span>
      </td>
      <td>
        <span class="verdict ${getVerdictClass(candidate.verdict)}">
          ${translateVerdict(candidate.verdict)}
        </span>
      </td>
      <td class="date-cell">${candidate.date}</td>
    `;

    row.addEventListener("click", () => {
      openCandidateModal(candidate);
    });

    tableBody.appendChild(row);
  });
}

function openCandidateModal(candidate) {
  currentCandidate = candidate; // сохраняем для экспорта
  modalName.textContent = candidate.name;
  modalTest.textContent = candidate.testName;
  modalScore.textContent = `${candidate.score}%`;
  modalVerdict.textContent = translateVerdict(candidate.verdict);
  modalDate.textContent = candidate.date;
  modalId.textContent = `#${candidate.id}`;

  topicsContainer.innerHTML = "";

  const topicScores = candidate.topicScores || {};

  for (const [topicName, topicData] of Object.entries(topicScores)) {
    const item = document.createElement("div");
    item.className = "topic-row";

    const percent = topicData.percent ?? 0;
    const correct = topicData.correct;
    const total = topicData.total;

    let text = `${topicName} — ${percent}%`;

    if (typeof correct === "number" && typeof total === "number") {
      text += ` (${correct} из ${total})`;
    }

    item.textContent = text;
    topicsContainer.appendChild(item);
  }

  overlay.classList.add("active");
  modal.classList.add("active");
}

const exportCandidateBtn = document.getElementById("exportCandidateBtn");

function exportCurrentCandidateToCsv() {
  if (!currentCandidate) {
    alert("Нет данных для экспорта.");
    return;
  }

  const c = currentCandidate;

  const headers = [
    "Result ID",
    "Имя",
    "Тест",
    "Результат %",
    "Вердикт",
    "Дата",
    "Тема",
    "Процент",
    "Правильных",
    "Всего"
  ];

  const rows = [];

  const topicScores = c.topicScores || {};

  const entries = Object.entries(topicScores);

  if (!entries.length) {
    // хотя бы одна строка без тем
    rows.push([
      c.id,
      c.name,
      c.testName,
      c.score,
      translateVerdict(c.verdict),
      c.date,
      "",
      "",
      "",
      ""
    ]);
  } else {
    entries.forEach(([topicName, topicData]) => {
      const percent = topicData.percent ?? 0;
      const correct =
        typeof topicData.correct === "number" ? topicData.correct : "";
      const total =
        typeof topicData.total === "number" ? topicData.total : "";

      rows.push([
        c.id,
        c.name,
        c.testName,
        c.score,
        translateVerdict(c.verdict),
        c.date,
        topicName,
        percent,
        correct,
        total
      ]);
    });
  }

  const lines = [];
  lines.push(headers.join(";"));

  rows.forEach((row) => {
    const safeRow = row.map((value) => {
      if (value == null) return "";
      const str = String(value).replace(/"/g, '""');
      return `"${str}"`;
    });
    lines.push(safeRow.join(";"));
  });

  const csvContent = lines.join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const today = new Date().toISOString().slice(0, 10);
  const safeName = c.name.replace(/\s+/g, "_");

  const link = document.createElement("a");
  link.href = url;
  link.download = `qa_result_${safeName}_${today}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

if (exportCandidateBtn) {
  exportCandidateBtn.addEventListener("click", exportCurrentCandidateToCsv);
}



function closeModal() {
  overlay.classList.remove("active");
  modal.classList.remove("active");
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setVerdictFilter(btn.dataset.value);
  });
});

searchInput.addEventListener("input", renderTable);

scoreSort.addEventListener("click", () => {
  sortDirection = sortDirection === "desc" ? "asc" : "desc";
  sortIndicator.textContent = sortDirection === "desc" ? "↓" : "↑";
  renderTable();
});

document
  .getElementById("closeModalBtn")
  .addEventListener("click", closeModal);

document
  .getElementById("closeFooterBtn")
  .addEventListener("click", closeModal);

overlay.addEventListener("click", closeModal);

// --- Переключатель темы ---
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);

  if (!themeIcon) return;

  themeIcon.textContent = theme === "dark" ? "🌙" : "☀";
}

const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current =
      document.documentElement.getAttribute("data-theme") || "dark";
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

// --- Кнопка "Выйти" ---
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("qa_is_logged_in");
    localStorage.removeItem("qa_company_id");
    localStorage.removeItem("qa_company_name");
    window.location.href = "/";
  });
}

// --- ЕДИНСТВЕННЫЙ DOMContentLoaded ---
document.addEventListener("DOMContentLoaded", () => {
  // Company pill
  const companyPill = document.getElementById("companyPill");
  const companyName = localStorage.getItem("qa_company_name");

  if (companyPill && companyName) {
    const cleanName = companyName.replace(/\\_/g, "_").replace(/\\(.)/g, "$1");
    companyPill.textContent = `Компания: ${cleanName}`;
  }

  // 1) Загружаем тариф и рендерим план
  loadCompanyPlan().then(() => {
    // 2) Загружаем результаты
    loadCompanyResults().then(() => {
      updateMetrics();
      setVerdictFilter("All");
      renderTable();
    });
  });
});

function exportResultsToCsv() {
  const data = getFilteredCandidates();
  if (!data.length) {
    alert("Нет данных для экспорта.");
    return;
  }

  // Шапка CSV
  const headers = [
    "Result ID",
    "Имя",
    "Тест",
    "Результат %",
    "Вердикт",
    "Дата",
    "Темы (проценты)",
    "Темы (детально)"
  ];

  const rows = [];

  data.forEach((candidate) => {
    // Темы: короткий вид и детальный
    const topicScores = candidate.topicScores || {};
    const topicsShort = [];
    const topicsDetailed = [];

    for (const [topicName, topicData] of Object.entries(topicScores)) {
      const percent = topicData.percent ?? 0;
      topicsShort.push(`${topicName}: ${percent}%`);

      const correct = topicData.correct;
      const total = topicData.total;

      if (typeof correct === "number" && typeof total === "number") {
        topicsDetailed.push(
          `${topicName}: ${percent}% (${correct} из ${total})`
        );
      } else {
        topicsDetailed.push(`${topicName}: ${percent}%`);
      }
    }

    rows.push([
      candidate.id,
      candidate.name,
      candidate.testName,
      candidate.score,
      translateVerdict(candidate.verdict),
      candidate.date,
      topicsShort.join(" | "),
      topicsDetailed.join(" | ")
    ]);
  });

  // Собираем CSV-строку
  const lines = [];
  lines.push(headers.join(";"));

  rows.forEach((row) => {
    // Экранируем ; и переносы строк
    const safeRow = row.map((value) => {
      if (value == null) return "";
      const str = String(value).replace(/"/g, '""');
      // обернем в кавычки, чтобы ; и переносы строк не ломали формат
      return `"${str}"`;
    });
    lines.push(safeRow.join(";"));
  });

  const csvContent = lines.join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;

  const today = new Date().toISOString().slice(0, 10);
  link.download = `qa_results_${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", exportResultsToCsv);
}
