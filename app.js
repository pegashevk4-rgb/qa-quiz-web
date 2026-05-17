// =========================
// STATE
// =========================

const state = {
  questions: [],
  currentQuestion: null,
  currentIndex: 0,
  totalScore: 0,
  maxScore: 0,
  categoryStats: {}
};

// =========================
// CONFIG
// =========================

const QUESTIONS_PER_RUN = 30;

const TEST_TITLES = {
  qa_junior_web: 'QA Junior (Web)',
  qa_middle_web: 'QA Middle (Web)',
  qa_senior_web: 'QA Senior (Web)',
};

const TEST_JSON_MAP = {
  qa_junior_web: 'questions_junior.json',
  qa_middle_web: 'questions_middle.json',
  qa_senior_web: 'questions_senior.json',
};

// =========================
// URL PARAMS
// =========================

const params = new URLSearchParams(window.location.search);
const testId = params.get('test_id') || 'qa_middle_web';

// =========================
// DOM
// =========================

const elements = {
  questionText: document.getElementById('question-text'),
  optionsContainer: document.getElementById('options'),
  progress: document.getElementById('progress'),
  quiz: document.getElementById('quiz'),
  result: document.getElementById('result'),
  resultText: document.getElementById('result-text'),
  restartBtn: document.getElementById('restart-btn'),
  categoryText: document.getElementById('category-text'),
  nextBtn: document.getElementById('next-btn'),
  intro: document.getElementById('intro'),
  startBtn: document.getElementById('start-btn'),
  quizQuestions: document.getElementById('quiz-questions'),
  questionHint: document.getElementById('question-hint'),
  testTitle: document.getElementById('test-title'),

  userForm: document.getElementById('user-form'),
  dataForm: document.getElementById('data-form'),

  verdictText: document.getElementById('verdict-text'),
  verdictExplanation: document.getElementById('verdict-explanation'),

  strongAreas: document.getElementById('strong-areas'),
  weakAreas: document.getElementById('weak-areas'),
  categoriesBreakdown: document.getElementById('categories-breakdown')
};

// =========================
// HELPERS
// =========================

function shuffleArray(array) {
  const arr = [...array];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function prepareQuestion(question) {
  const optionsWithIndexes = question.options.map((text, originalIndex) => ({
    text,
    originalIndex
  }));

  const shuffledOptions = shuffleArray(optionsWithIndexes);

  const originalCorrectIndexes = Array.isArray(question.correct_indexes)
    ? question.correct_indexes
    : [];

  if (!Array.isArray(question.correct_indexes)) {
    console.warn(
      'Вопрос без корректных correct_indexes:',
      question.id,
      question.question
    );
  }

  const correctIndexesShuffled = shuffledOptions
    .map((option, newIndex) => ({
      newIndex,
      originalIndex: option.originalIndex
    }))
    .filter(item =>
      originalCorrectIndexes.includes(item.originalIndex)
    )
    .map(item => item.newIndex);

  return {
    ...question,
    shuffledOptions,
    correctIndexesShuffled
  };
}


// =========================
// LOAD QUESTIONS
// =========================

async function loadQuestions() {
  try {
    const jsonPath = TEST_JSON_MAP[testId];

    if (!jsonPath) {
      throw new Error(`Unknown test_id: ${testId}`);
    }

    const response = await fetch(jsonPath);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    state.questions = shuffleArray(data).slice(0, QUESTIONS_PER_RUN);

    if (elements.testTitle) {
      elements.testTitle.textContent =
        TEST_TITLES[testId] || 'QA Quiz';
    }

  } catch (error) {
    console.error(error);
    alert('Не удалось загрузить вопросы');
  }
}

// =========================
// QUIZ START
// =========================

function initializeCategoryStats() {
  state.categoryStats = {};

  state.questions.forEach(question => {
    if (!state.categoryStats[question.category]) {
      state.categoryStats[question.category] = {
        gained: 0,
        max: 0
      };
    }
  });
}

function startQuiz() {
  if (!state.questions.length) {
    alert('Вопросы ещё не загрузились');
    return;
  }

  state.currentIndex = 0;
  state.totalScore = 0;
  state.maxScore = state.questions.length;

  initializeCategoryStats();

  elements.intro.style.display = 'none';
  elements.quiz.style.display = 'block';
  elements.result.style.display = 'none';

  if (elements.userForm) {
    elements.userForm.style.display = 'none';
  }

  elements.quizQuestions.style.display = 'block';

  elements.nextBtn.style.display = 'block';
  elements.nextBtn.disabled = true;
  elements.nextBtn.onclick = handleAnswer;

  if (typeof startTimer === 'function') {
    startTimer();
  }

  showQuestion();
}

// =========================
// QUESTION RENDER
// =========================

function showQuestion() {
  const rawQuestion = state.questions[state.currentIndex];

  const preparedQuestion = prepareQuestion(rawQuestion);

  state.currentQuestion = preparedQuestion;

  renderQuestion(preparedQuestion);
  renderOptions(preparedQuestion);
}

function renderQuestion(question) {
  elements.progress.textContent =
    `Вопрос ${state.currentIndex + 1} из ${state.questions.length}`;

  elements.categoryText.textContent =
    `Категория: ${question.category}`;

  elements.questionText.textContent =
    question.question;

  if (question.type === 'multiple') {
    elements.questionHint.textContent =
      'Тип вопроса: можно выбрать несколько вариантов ответа.';
  } else {
    elements.questionHint.textContent =
      'Тип вопроса: выберите один вариант ответа.';
  }
}

function renderOptions(question) {
  elements.optionsContainer.innerHTML = '';

  const isMultiple = question.type === 'multiple';

  const optionsList = document.createElement('div');

  question.shuffledOptions.forEach((option, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'option-item';

    const label = document.createElement('label');
    label.className = 'option-label';

    const input = document.createElement('input');

    input.type = isMultiple ? 'checkbox' : 'radio';
    input.name = isMultiple
      ? `answer_${question.id}`
      : 'answer';

    input.value = index;

    const textSpan = document.createElement('span');
    textSpan.textContent = `${index + 1}. ${option.text}`;

    label.append(input, textSpan);
    wrapper.appendChild(label);
    optionsList.appendChild(wrapper);
  });

  elements.optionsContainer.appendChild(optionsList);

  elements.nextBtn.disabled = true;

  const inputs = optionsList.querySelectorAll('input');

  inputs.forEach(input => {
    input.addEventListener('change', () => {
      const anyChecked = [...inputs].some(i => i.checked);
      elements.nextBtn.disabled = !anyChecked;
    });
  });
}

// =========================
// ANSWERS
// =========================

function getUserAnswer(question) {
  if (question.type === 'single') {
    const checked = document.querySelector(
      '#options input[name="answer"]:checked'
    );

    return checked
      ? Number(checked.value)
      : null;
  }

  const checkedInputs =
    document.querySelectorAll(
      '#options input[type="checkbox"]:checked'
    );

  return [...checkedInputs].map(input =>
    Number(input.value)
  );
}

// =========================
// SCORING
// =========================

function scoreSingle(userIndex, question) {
  if (userIndex === null) return 0;

  return userIndex === question.correctIndexesShuffled[0]
    ? 1
    : 0;
}

function scoreMultiple(userIndexes, question) {
  const correctIndexes = question.correctIndexesShuffled;

  const K = correctIndexes.length;

  if (!userIndexes.length) {
    return 0;
  }

  const correctSet = new Set(correctIndexes);
  const userSet = new Set(userIndexes);

  let score = 0;

  for (const idx of userSet) {
    if (correctSet.has(idx)) {
      score += 1 / K;
    } else {
      score -= 1 / K;
    }
  }

  return Math.max(0, Math.min(score, 1));
}

// =========================
// CATEGORY ANALYTICS
// =========================

function updateCategoryStats(category, gained) {
  if (!state.categoryStats[category]) {
    state.categoryStats[category] = {
      gained: 0,
      max: 0
    };
  }

  state.categoryStats[category].gained += gained;
  state.categoryStats[category].max += 1;
}

function buildCategoryAnalytics() {
  const categories = Object.entries(state.categoryStats)
    .map(([category, stats]) => ({
      category,
      percent:
        stats.max > 0
          ? Math.round((stats.gained / stats.max) * 100)
          : 0
    }))
    .sort((a, b) => b.percent - a.percent);

  return {
    categories,
    strongAreas: categories.slice(0, 2),
    weakAreas: categories.slice(-2).reverse()
  };
}

// =========================
// HANDLE ANSWER
// =========================

function handleAnswer() {
  const question = state.currentQuestion;

  const userAnswer = getUserAnswer(question);

  let gained = 0;

  if (question.type === 'single') {
    gained = scoreSingle(userAnswer, question);
  } else {
    gained = scoreMultiple(userAnswer, question);
  }

  state.totalScore += gained;

  updateCategoryStats(question.category, gained);

  state.currentIndex++;

  if (state.currentIndex < state.questions.length) {
    showQuestion();
  } else {
    showResult();
  }
}

// =========================
// VERDICTS
// =========================

function getVerdict(percent) {
  if (percent >= 80) {
    return 'Recommended (Strong Middle level)';
  }

  if (percent >= 65) {
    return 'Recommended (Middle level)';
  }

  if (percent >= 50) {
    return 'Potential Junior/Middle';
  }

  return 'Requires additional evaluation';
}

function getRecommendationText(percent) {
  if (percent >= 80) {
    return 'Кандидат демонстрирует сильные знания уровня Middle.';
  }

  if (percent >= 65) {
    return 'Кандидат показывает уверенные знания QA.';
  }

  if (percent >= 50) {
    return 'Кандидат обладает базовыми знаниями.';
  }

  return 'Рекомендуется дополнительная проверка.';
}

// =========================
// RESULT RENDER
// =========================

function renderResultHeader(percent, roundedScore) {
  elements.resultText.textContent =
    `Ваш результат: ${roundedScore} из ${state.maxScore} (${percent}%).`;

  elements.verdictText.textContent =
    getVerdict(percent);

  elements.verdictExplanation.textContent =
    getRecommendationText(percent);
}

function renderAreasList(container, items) {
  container.innerHTML = '';

  items.forEach(item => {
    const li = document.createElement('li');

    li.textContent =
      `${item.category}: ${item.percent}%`;

    container.appendChild(li);
  });
}

function renderBreakdown(categories) {
  elements.categoriesBreakdown.innerHTML = '';

  categories.forEach(item => {
    const li = document.createElement('li');

    li.textContent =
      `${item.category}: ${item.percent}%`;

    elements.categoriesBreakdown.appendChild(li);
  });
}

function renderLowScoreState() {
  elements.strongAreas.innerHTML =
    '<li>Сильные стороны не определены</li>';

  elements.weakAreas.innerHTML =
    '<li>Недостаточно данных</li>';

  elements.categoriesBreakdown.innerHTML = '';
}

function showResult() {
  elements.quizQuestions.style.display = 'none';

  if (window.timerInterval) {
    clearInterval(window.timerInterval);
  }

  const percent = Math.round(
    (state.totalScore / state.maxScore) * 100
  );

  const roundedScore =
    Math.round(state.totalScore * 10) / 10;

  renderResultHeader(percent, roundedScore);

  if (percent < 30) {
    renderLowScoreState();
  } else {
    const analytics = buildCategoryAnalytics();

    renderAreasList(
      elements.strongAreas,
      analytics.strongAreas
    );

    renderAreasList(
      elements.weakAreas,
      analytics.weakAreas
    );

    renderBreakdown(analytics.categories);
  }

  elements.userForm.style.display = 'block';

  elements.dataForm.onsubmit = async event => {
    event.preventDefault();

    await handleFormSubmit(percent);
  };
}

// =========================
// FORM SUBMIT
// =========================

async function handleFormSubmit(percent) {
  const submitButton =
    elements.dataForm.querySelector(
      'button[type="submit"]'
    );

  submitButton.disabled = true;
  submitButton.textContent = 'Сохраняем...';

  const firstName =
    document.getElementById('firstName').value;

  const lastName =
    document.getElementById('lastName').value;

  const email =
    document.getElementById('email').value;

  try {
    await submitResults({
      firstName,
      lastName,
      email,
      percent
    });

    elements.userForm.style.display = 'none';
    elements.result.style.display = 'block';

  } finally {
    submitButton.textContent =
      'Результат сохранён';
  }
}

// =========================
// API
// =========================

async function submitResults({
  firstName,
  lastName,
  email,
  percent
}) {
  const analytics = buildCategoryAnalytics();

  const payload = {
    first_name: firstName,
    last_name: lastName,
    email,

    test_id: testId,

    total_score: state.totalScore,
    max_score: state.maxScore,

    percent,

    verdict: getVerdict(percent),

    categories: analytics.categories,
    strong_areas: analytics.strongAreas,
    weak_areas: analytics.weakAreas
  };

  try {
    const response = await fetch(
      'https://qa-quiz-web.vercel.app/api/results',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    console.log('Saved:', data);

  } catch (error) {
    console.error(error);

    alert('Ошибка сохранения результата');
  }
}

// =========================
// EVENTS
// =========================

elements.startBtn?.addEventListener(
  'click',
  startQuiz
);

elements.restartBtn?.addEventListener(
  'click',
  startQuiz
);

// =========================
// INIT
// =========================

loadQuestions();