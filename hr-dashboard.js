const THEME_KEY = "qa_theme";

// --- Проверка авторизации перед показом дашборда ---

(function guardDashboard() {
  const DEV_BYPASS_AUTH = true; // <-- пока отладка, потом поставишь false или удалишь

  if (DEV_BYPASS_AUTH) {
    return; // не блокируем дашборд, просто выходим из guard
  }

  const isLoggedIn = localStorage.getItem("qa_is_logged_in") === "1";

  if (!isLoggedIn) {
    window.location.href = "hr.html";
  }
})();

// --- Демо-кандидаты (пока без БД) ---

const candidates = [
  {
    id: 1,
    name: "Иван Петров",
    testName: "Middle QA",
    score: 88,
    verdict: "Passed",
    date: "2026-05-20",
    topicScores: {
      Theory: 90,
      SQL: 84,
      API: 92,
      Tools: 85
    }
  },
  {
    id: 2,
    name: "Екатерина Смирнова",
    testName: "Senior QA",
    score: 54,
    verdict: "On the edge",
    date: "2026-05-18",
    topicScores: {
      Theory: 60,
      SQL: 52,
      API: 49,
      Tools: 58
    }
  },
  {
    id: 3,
    name: "Алексей Иванов",
    testName: "Junior QA",
    score: 95,
    verdict: "Passed",
    date: "2026-05-17",
    topicScores: {
      Theory: 97,
      SQL: 88,
      API: 94,
      Tools: 96
    }
  },
  {
    id: 4,
    name: "Мария Соколова",
    testName: "Middle QA",
    score: 31,
    verdict: "Failed",
    date: "2026-05-15",
    topicScores: {
      Theory: 40,
      SQL: 22,
      API: 35,
      Tools: 27
    }
  },
  {
    id: 5,
    name: "Денис Кузнецов",
    testName: "Junior QA",
    score: 72,
    verdict: "Passed",
    date: "2026-05-14",
    topicScores: {
      Theory: 70,
      SQL: 66,
      API: 80,
      Tools: 72
    }
  },
  {
    id: 6,
    name: "Ольга Лебедева",
    testName: "Senior QA",
    score: 61,
    verdict: "On the edge",
    date: "2026-05-12",
    topicScores: {
      Theory: 65,
      SQL: 58,
      API: 63,
      Tools: 59
    }
  },
  {
    id: 7,
    name: "Роман Орлов",
    testName: "Middle QA",
    score: 82,
    verdict: "Passed",
    date: "2026-05-10",
    topicScores: {
      Theory: 85,
      SQL: 79,
      API: 81,
      Tools: 84
    }
  }
];

// --- Генерация ссылок на тесты ---

const testButtons = document.querySelectorAll(".tests-list .btn-primary");

function getTestLink(testId) {
  return `https://pegashevk4-rgb.github.io/qa-quiz-web/index.html?test_id=${testId}`;
}

testButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const testId = btn.getAttribute("data-test-id");
    const url = getTestLink(testId);

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

// Новые кнопки-фильтры вместо select
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

// Обработчики фильтров
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
const themeIcon = document.getElementById("themeIcon"); // может быть null

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);

  if (!themeIcon) {
    // На этом дашборде нет отдельного icon-элемента – просто выходим
    return;
  }

  if (theme === "dark") {
    themeIcon.textContent = "🌙";
  } else {
    themeIcon.textContent = "☀";
  }
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


// --- Инициализация ---

updateMetrics();
setVerdictFilter("All"); // сразу активируем "Все"
renderTable();

// --- Кнопка "Выйти" ---
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("qa_is_logged_in");
    window.location.href = "hr.html";
  });
}