// =========================
// CONFIG
// =========================

// Базовый URL бэкенда
const API_BASE_URL = "http://localhost:8000";

// =========================
// URL PARAMS
// =========================

const params = new URLSearchParams(window.location.search);
const TEST_ID = params.get("test_id") || "qa_junior_web";
const COMPANY_TOKEN = params.get("company_token") || null;

// =========================
// STATE
// =========================

const state = {
  questions: [],           // [{id, text, options}]
  currentIndex: 0,
  answers: {},             // questionId -> selectedIndex[]
  percentFromServer: null,
  verdictFromServer: null,
};

// =========================
// DOM
// =========================

const elements = {
  questionText: document.getElementById("question-text"),
  optionsContainer: document.getElementById("options"),
  progress: document.getElementById("progress"),
  quiz: document.getElementById("quiz"),
  result: document.getElementById("result"),
  resultText: document.getElementById("result-text"),
  restartBtn: document.getElementById("restart-btn"),
  categoryText: document.getElementById("category-text"),
  nextBtn: document.getElementById("next-btn"),
  intro: document.getElementById("intro"),
  startBtn: document.getElementById("start-btn"),
  quizQuestions: document.getElementById("quiz-questions"),
  questionHint: document.getElementById("question-hint"),
  testTitle: document.getElementById("test-title"),

  userForm: document.getElementById("user-form"),
  dataForm: document.getElementById("data-form"),

  verdictText: document.getElementById("verdict-text"),
  verdictExplanation: document.getElementById("verdict-explanation"),

  strongAreas: document.getElementById("strong-areas"),
  weakAreas: document.getElementById("weak-areas"),
  categoriesBreakdown: document.getElementById("categories-breakdown"),
};

// =========================
// Загрузка вопросов с бэка
// =========================

async function loadQuestions() {
  try {
    const response = await fetch(`${API_BASE_URL}/public/tests/${TEST_ID}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json(); // {test_id, title, questions}
    state.questions = data.questions || [];

    if (!state.questions.length) {
      alert("Для этого теста нет вопросов.");
      return;
    }

    if (elements.testTitle) {
      elements.testTitle.textContent = data.title || "QA Quiz";
    }

    elements.intro.style.display = "block";
    elements.quiz.style.display = "none";
    elements.result.style.display = "none";
    if (elements.userForm) elements.userForm.style.display = "none";
  } catch (error) {
    console.error("Ошибка загрузки теста:", error);
    alert("Не удалось загрузить тест. Попробуйте позже.");
  }
}

// =========================
// Старт квиза
// =========================

function startQuiz() {
  if (!state.questions.length) {
    alert("Вопросы ещё не загрузились");
    return;
  }

  state.currentIndex = 0;
  state.answers = {};
  state.percentFromServer = null;
  state.verdictFromServer = null;

  elements.intro.style.display = "none";
  elements.quiz.style.display = "block";
  elements.result.style.display = "none";
  if (elements.userForm) {
    elements.userForm.style.display = "none";
  }

  elements.quizQuestions.style.display = "block";

  elements.nextBtn.style.display = "block";
  elements.nextBtn.disabled = true;
  elements.nextBtn.onclick = handleNext;

  if (typeof startTimer === "function") {
    startTimer();
  }

  showQuestion();
}

// =========================
// Показ вопроса
// =========================

function showQuestion() {
  const question = state.questions[state.currentIndex];
  if (!question) return;

  elements.progress.textContent =
    `Вопрос ${state.currentIndex + 1} из ${state.questions.length}`;

  // Категорий у нас пока нет — оставляем пустым
  elements.categoryText.textContent = "";

  elements.questionText.textContent = question.text;

  // Все вопросы пока с одним вариантом
  elements.questionHint.textContent =
    "Тип вопроса: выберите один вариант ответа.";

  renderOptions(question);
}

function renderOptions(question) {
  elements.optionsContainer.innerHTML = "";
  elements.nextBtn.disabled = true;

  const optionsList = document.createElement("div");

  const selected = state.answers[question.id] || [];

  question.options.forEach((text, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "option-item";

    const label = document.createElement("label");
    label.className = "option-label";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "answer";
    input.value = index;

    if (selected.includes(index)) {
      input.checked = true;
      elements.nextBtn.disabled = false;
    }

    const textSpan = document.createElement("span");
    textSpan.textContent = `${index + 1}. ${text}`;

    label.append(input, textSpan);
    wrapper.appendChild(label);
    optionsList.appendChild(wrapper);
  });

  elements.optionsContainer.appendChild(optionsList);

  const inputs = optionsList.querySelectorAll("input");
  inputs.forEach((input) => {
    input.addEventListener("change", () => {
      const chosenIndex = Number(input.value);
      state.answers[question.id] = [chosenIndex];
      elements.nextBtn.disabled = false;
    });
  });
}

// =========================
// Переход вперёд
// =========================

function handleNext() {
  const question = state.questions[state.currentIndex];
  if (!question) return;

  const selected = state.answers[question.id] || [];
  if (!selected.length) {
    return;
  }

  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex += 1;
    showQuestion();
  } else {
    // Вопросы закончились ДО окончания времени
    // Показываем ту же модалку, что и при таймауте
    const modal = document.getElementById("timeup-modal");
    const okBtn = document.getElementById("timeup-ok-btn");

    if (modal && okBtn) {
      const titleEl = modal.querySelector("h2");
      const textEl = modal.querySelector("p");

      if (titleEl) titleEl.textContent = "Тест завершён";
      if (textEl) {
        textEl.textContent =
          "Вы ответили на все вопросы. Мы сохраним ваши ответы и покажем результат после ввода данных.";
      }

      modal.style.display = "flex";
      okBtn.onclick = () => {
        modal.style.display = "none";
        showResult(); // переводим на форму данных
      };
    } else {
      // На всякий случай — без модалки просто идём на форму
      showResult();
    }
  }
}

// =========================
// showResult — общий вход на форму данных
// =========================

// Вызывается:
/*
  - таймером из index.html, когда время вышло (handleTimeIsUp -> showResult)
  - из handleNext, когда кандидат дошёл до последнего вопроса
*/
function showResult() {
  // Если уже на форме или на результате — ничего не делаем
  if (
    elements.userForm.style.display === "block" ||
    elements.result.style.display === "block"
  ) {
    return;
  }

  elements.quizQuestions.style.display = "none";
  elements.quiz.style.display = "none";
  elements.userForm.style.display = "block";

  if (window.timerInterval) {
    clearInterval(window.timerInterval);
  }

  elements.dataForm.onsubmit = async (event) => {
    event.preventDefault();
    await handleFormSubmit();
  };
}

// =========================
// Отправка формы
// =========================

async function handleFormSubmit() {
  const submitButton = elements.dataForm.querySelector(
    'button[type="submit"]'
  );

  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim() || null;

  if (!firstName || !lastName) {
    alert("Пожалуйста, заполните имя и фамилию.");
    return;
  }

  if (!COMPANY_TOKEN) {
    alert("В ссылке нет токена компании. Обратитесь к HR.");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Сохраняем...";

  try {
    const answersPayload = Object.entries(state.answers).map(
      ([questionId, selectedIndexes]) => ({
        question_id: Number(questionId),
        selected_index: selectedIndexes[0], // одиночный выбор
      })
    );

    const payload = {
      test_id: TEST_ID,
      answers: answersPayload,
      candidate: {
        first_name: firstName,
        last_name: lastName,
        email: email,
      },
    };

    const response = await fetch(
      `${API_BASE_URL}/public/tests/${TEST_ID}/submit?company_token=${encodeURIComponent(
        COMPANY_TOKEN
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
        alert(
          "Лимит тестов для вашей компании исчерпан. Обратитесь к HR по поводу тарифа."
        );
      } else {
        alert("Ошибка при сохранении результата. Попробуйте позже.");
      }
      console.error("Submit error:", response.status);
      return;
    }

    const data = await response.json(); // {percent, verdict}
    state.percentFromServer = data.percent;
    state.verdictFromServer = data.verdict;

    renderResult();
  } catch (error) {
    console.error("Ошибка сети при отправке результата:", error);
    alert("Не удалось отправить результат. Проверьте соединение.");
  } finally {
    submitButton.textContent = "Результат сохранён";
  }
}

// =========================
// Рендер результата
// =========================

function renderResult() {
  elements.userForm.style.display = "none";
  elements.result.style.display = "block";

  const percent = state.percentFromServer ?? 0;
  const verdict = state.verdictFromServer || "On the edge";

  elements.resultText.textContent = `Ваш результат: ${percent}%.`;

  let verdictText = "";
  let explanation = "";

  if (verdict === "Passed") {
    verdictText = "Рекомендуем к следующему этапу.";
    explanation =
      "Кандидат показал высокий уровень знаний и может быть рассмотрен на позицию.";
  } else if (verdict === "On the edge") {
    verdictText = "На грани.";
    explanation =
      "Рекомендуется дополнительно оценить кандидата на собеседовании.";
  } else {
    verdictText = "Не прошёл.";
    explanation =
      "Кандидат показал недостаточный уровень знаний для этой позиции.";
  }

  elements.verdictText.textContent = verdictText;
  elements.verdictExplanation.textContent = explanation;

  // Пока нет детальной аналитики — очищаем блоки
  elements.strongAreas.innerHTML = "";
  elements.weakAreas.innerHTML = "";
  elements.categoriesBreakdown.innerHTML = "";
}

// =========================
// EVENTS
// =========================

elements.startBtn?.addEventListener("click", startQuiz);

elements.restartBtn?.addEventListener("click", () => {
  // Перезапускаем страницу, чтобы начать сначала
  window.location.reload();
});

// =========================
// INIT
// =========================

loadQuestions();