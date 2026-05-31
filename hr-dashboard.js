const THEME_KEY = "qa_theme";
const API_BASE_URL = "http://127.0.0.1:8000";

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

      const topicScores = {
        Theory: row.percent,
        SQL: row.percent,
        API: row.percent,
        Tools: row.percent,
      };

      return {
        id: row.result_id ?? index + 1,
        name: fullName || "Кандидат",
        testName,
        score: row.percent,
        verdict,
        date: dateStr,
        topicScores,
      };
    });

    updateMetrics();
    renderTable();
  } catch (err) {
    console.error("Ошибка при запросе результатов компании", err);
  }
}

// --- Генерация ссылок на тесты ---
const testButtons = document.querySelectorAll(".tests-list .btn-primary");

function getTestLink(testId) {
  // Берём только токен компании
  const companyToken = localStorage.getItem("qa_company_token");

  if (!companyToken) {
    alert("Не найден токен компании. Зайдите в систему заново.");
    return "";
  }

  const baseUrl = "https://pegashevk4-rgb.github.io/qa-quiz-web/index.html";
  const params = new URLSearchParams({
    test_id: testId,
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
const scoreSort = document.getElementById("scoreSort");
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

const filterButtons = document.querySelectorAll(".filter-btn");

let sortDirection = "desc";
let activeVerdict = "All";

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

  if (activeVerdict !== "All") {
    filtered = filtered.filter(
      (candidate) => candidate.verdict === activeVerdict
    );
  }

  if (searchValue) {
    filtered = filtered.filter((candidate) =>
      candidate.name.toLowerCase().includes(searchValue)
    );
  }

  filtered.sort((a, b) => {
    return sortDirection === "desc" ? b.score - a.score : a.score - b.score;
  });

  return filtered;
}

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
  modalName.textContent = candidate.name;
  modalTest.textContent = candidate.testName;
  modalScore.textContent = `${candidate.score}%`;
  modalVerdict.textContent = translateVerdict(candidate.verdict);
  modalDate.textContent = candidate.date;
  modalId.textContent = `#${candidate.id}`;

  topicsContainer.innerHTML = "";

  Object.entries(candidate.topicScores).forEach(([topic, score]) => {
    const row = document.createElement("div");

    row.className = "topic-row";

    row.innerHTML = `
      <div class="topic-name">${topic}</div>
      <div class="topic-score">${score}%</div>
    `;

    topicsContainer.appendChild(row);
  });

  overlay.classList.add("active");
  modal.classList.add("active");
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
    window.location.href = "hr.html";
  });
}

// --- Инициализация после загрузки DOM ---
document.addEventListener("DOMContentLoaded", () => {
  const companyPill = document.getElementById("companyPill");
  const companyName = localStorage.getItem("qa_company_name");

  if (companyPill && companyName) {
    companyPill.textContent = `Компания: ${companyName}`;
  }

  loadCompanyResults().then(() => {
    updateMetrics();
    setVerdictFilter("All");
    renderTable();
  });
});