// =========================
// CONFIG
// =========================

// Базовый URL бэкенда
const API_BASE_URL = "https://api.qa-quiz-test.ru";

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
  questions: [],            // [{id, text, options}]
  currentIndex: 0,
  answers: {},              // questionId -> selectedIndex[]
  phase: 'quiz',            // 'quiz' | 'form' | 'result'
  // данные, которые приходят с бэка в TestResultResponse
  percentFromServer: null,
  verdictFromServer: null,
  strongAreasFromServer: [],
  weakAreasFromServer: [],
  categoriesFromServer: [],
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
// Загрузка вопросов из бэка
// =========================

async function loadQuestions() {
  try {
    const response = await fetch(`${API_BASE_URL}/public/tests/${TEST_ID}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    let questions = data.questions || [];

    if (!questions.length) {
      alert("Для этого теста нет вопросов.");
      return;
    }

    questions = questions
      .map(q => ({ q, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ q }) => q);

    const MAX_QUESTIONS = 30;
    state.questions = questions.slice(0, MAX_QUESTIONS);

    if (elements.testTitle) {
      elements.testTitle.textContent = data.title || "QA Quiz";
    }

    // Если restoreSession уже переключил нас с intro на quiz/form,
    // не трогаем текущий UI
    if (
      elements.quiz.style.display === "block" ||
      (elements.userForm && elements.userForm.style.display === "block") ||
      elements.result.style.display === "block"
    ) {
      return;
    }

    // Стартовое состояние только при самом первом заходе
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
  // Если уже не intro-экран, не даём повторно стартовать и сбивать восстановленное состояние
  if (elements.intro.style.display === "none" &&
      elements.quiz.style.display === "block") {
    return;
  }

  if (!state.questions.length) {
    alert("Вопросы ещё не загрузились");
    return;
  }

  state.currentIndex = 0;
  state.answers = {};
  state.phase = 'quiz';
  state.percentFromServer = null;
  state.verdictFromServer = null;
  state.strongAreasFromServer = [];
  state.weakAreasFromServer = [];
  state.categoriesFromServer = [];

  elements.intro.style.display = "none";
  elements.quiz.style.display = "block";
  elements.result.style.display = "none";

  elements.quizQuestions.style.display = "block";
  if (elements.userForm) elements.userForm.style.display = "none";

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

  elements.categoryText.textContent = "";
  elements.questionText.textContent = question.text;

  elements.questionHint.textContent =
    "Тип вопроса: выберите один вариант ответа.";

  renderOptions(question);
}

function renderOptions(question) {
  elements.optionsContainer.innerHTML = "";
  elements.nextBtn.disabled = true;

  const optionsList = document.createElement("div");

  const shuffledOptions = question.options
    .map((text, index) => ({ text, originalIndex: index }))
    .sort(() => Math.random() - 0.5);

  const selected = state.answers[question.id] || [];

  shuffledOptions.forEach((option) => {
    const wrapper = document.createElement("div");
    wrapper.className = "option-item";

    const label = document.createElement("label");
    label.className = "option-label";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "answer";
    input.value = option.originalIndex;

    if (selected.includes(option.originalIndex)) {
      input.checked = true;
      elements.nextBtn.disabled = false;
    }

    const textSpan = document.createElement("span");
    textSpan.textContent = option.text;

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
    showForm();
  }
}

// =========================
// Переход к форме данных
// =========================

function showForm() {
  // если форма уже показана или уже показан результат — ничего не делаем
  if (
    (elements.userForm && elements.userForm.style.display === "block") ||
    (elements.result && elements.result.style.display === "block")
  ) {
    return;
  }

  // прячем вопросы, показываем форму
  elements.quizQuestions.style.display = "none";
  if (elements.userForm) elements.userForm.style.display = "block";

  state.phase = 'form';
  if (typeof saveQuizState === 'function') saveQuizState();

  // останавливаем таймер, если есть
  if (window.timerInterval) {
    clearInterval(window.timerInterval);
  }

  elements.dataForm.onsubmit = (event) => {
    event.preventDefault();
    handleFormSubmit();
  };
}



// Вызывается таймером
function showResult() {
  showForm();
}

// =========================
// Отправка формы (на бэк)
// =========================

async function handleFormSubmit() {
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

  const submitButton = elements.dataForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Сохраняем...";

  try {
    const answersPayload = Object.entries(state.answers).map(
      ([questionId, selectedIndexes]) => ({
        question_id: Number(questionId),
        selected_index: selectedIndexes[0],
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

    let submitUrl = `${API_BASE_URL}/public/tests/${TEST_ID}/submit`;
    const urlParams = new URLSearchParams();
    urlParams.set("company_token", COMPANY_TOKEN);
    submitUrl += `?${urlParams.toString()}`;

    const response = await fetch(submitUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Submit error:", response.status, await response.text());
      alert("Ошибка при сохранении результата. Попробуйте позже.");
      return;
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error("Не удалось распарсить JSON ответа:", e);
      data = {};
    }

    state.percentFromServer = data?.percent ?? null;
    state.verdictFromServer = data?.verdict ?? null;
    state.strongAreasFromServer = data?.strong_areas || [];
    state.weakAreasFromServer = data?.weak_areas || [];
    state.categoriesFromServer = data?.categories || [];

    renderResult();
  } catch (error) {
    console.error("Ошибка сети при отправке результата:", error);
    alert("Не удалось отправить результат. Проверьте соединение.");
    // даже в случае ошибки всё равно покажем результат как есть (заглушки)
    renderResult();
  } finally {
    submitButton.textContent = "Результат сохранён";
  }
}

// =========================
// Рендер результата
// =========================

function renderResult() {
  if (elements.userForm) elements.userForm.style.display = "none";
  elements.quiz.style.display = "none";
  elements.result.style.display = "block";

  state.phase = 'result';
  if (typeof saveQuizState === 'function') saveQuizState();

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

  elements.strongAreas.innerHTML = "";
  elements.weakAreas.innerHTML = "";
  elements.categoriesBreakdown.innerHTML = "";

  state.strongAreasFromServer.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item.category;
    elements.strongAreas.appendChild(li);
  });

  state.weakAreasFromServer.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item.category;
    elements.weakAreas.appendChild(li);
  });

  state.categoriesFromServer.forEach((cat) => {
    const li = document.createElement("li");
    li.textContent = `${cat.category}: ${cat.percent}% (${cat.correct} из ${cat.total})`;
    elements.categoriesBreakdown.appendChild(li);
  });
}


// =========================
// EVENTS
// =========================

elements.startBtn?.addEventListener("click", startQuiz);

elements.restartBtn?.addEventListener("click", () => {
  window.location.reload();
});

loadQuestions();