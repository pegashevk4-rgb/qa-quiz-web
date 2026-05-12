let questions = [];
let currentIndex = 0;
// let correctCount = 0;
let totalScore = 0;      // набранные баллы (может быть дробным)
let maxScore = 0;        // максимум (по сути = числу вопросов)

// testId из URL (?test_id=qa_middle_web), по умолчанию middle
const params = new URLSearchParams(window.location.search);
const testId = params.get('test_id') || 'qa_middle_web';

const questionTextEl = document.getElementById('question-text');
const optionsContainer = document.getElementById('options');
const progressEl = document.getElementById('progress');
const quizEl = document.getElementById('quiz');
const resultEl = document.getElementById('result');
const resultTextEl = document.getElementById('result-text');
const restartBtn = document.getElementById('restart-btn');
const categoryTextEl = document.getElementById('category-text');
const nextBtn = document.getElementById('next-btn');
const introEl = document.getElementById('intro');
const startBtn = document.getElementById('start-btn');

const QUESTIONS_PER_RUN = 30;
const TEST_TITLES = {
  qa_junior_web: 'QA Junior (Web)',
  qa_middle_web: 'QA Middle (Web)',
  qa_senior_web: 'QA Senior (Web)',
};

// мапа testId -> файл с вопросами (лежат рядом с index.html)
const TEST_JSON_MAP = {
  qa_junior_web: 'questions_junior.json',
  qa_middle_web: 'questions_middle.json',
  qa_senior_web: 'questions_senior.json',
};

// Загрузка вопросов из статического JSON по test_id
async function loadQuestions() {
  try {
    const jsonPath = TEST_JSON_MAP[testId];
    if (!jsonPath) {
      throw new Error(`Неизвестный test_id: ${testId}`);
    }

    const res = await fetch(jsonPath);
    if (!res.ok) {
      throw new Error('Ошибка загрузки теста: ' + res.status);
    }

    const data = await res.json();
    console.log('data из JSON:', data);

    // senior-файл — массив вопросов
    questions = data;

    // перемешиваем
    questions = shuffleArray(questions);

    // ограничиваем 30 вопросами
    if (questions.length > QUESTIONS_PER_RUN) {
      questions = questions.slice(0, QUESTIONS_PER_RUN);
    }

    console.log('questions после шифла:', questions.length);

    const testTitleEl = document.getElementById('test-title');
    if (testTitleEl) {
      testTitleEl.textContent = TEST_TITLES[testId] || 'QA Quiz';
    }
  } catch (e) {
    console.error('Ошибка в loadQuestions:', e);
    alert('Не удалось загрузить вопросы. Проверь JSON и test_id в URL.');
  }
}


function shuffleArray(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function startQuiz() {
  if (!questions || questions.length === 0) {
    alert('Вопросы ещё не загрузились или список пуст. Обновите страницу.');
    return;
  }

  currentIndex = 0;
  totalScore = 0;
  maxScore = questions.length; // по 1 максимальному баллу за вопрос

  if (introEl) introEl.style.display = 'none';
  quizEl.style.display = 'block';
  resultEl.style.display = 'none';

  const userFormEl = document.getElementById('user-form');
  if (userFormEl) userFormEl.style.display = 'none';

  nextBtn.style.display = 'none';
  nextBtn.onclick = null;

  // запускаем таймер только при старте теста
  if (typeof startTimer === 'function') {
    startTimer();
  }

  showQuestion();
}


function showQuestion() {
  const q = questions[currentIndex];

  progressEl.textContent = `Вопрос ${currentIndex + 1} из ${questions.length}`;
  categoryTextEl.textContent = `Категория: ${q.category}`;
  questionTextEl.textContent = q.question;

  // Перемешиваем варианты, сохраняем соответствие индексов
  const originalOptions = q.options;
  const shuffledOptions = shuffleArray(originalOptions);

  // Строим карту "старый индекс -> новый индекс"
  const indexMap = {};
  shuffledOptions.forEach((opt, newIdx) => {
    const oldIdx = originalOptions.indexOf(opt);
    indexMap[oldIdx] = newIdx;
  });

  // Пересчитываем правильные индексы под перемешанный порядок
  const originalCorrectIndexes = q.correct_indexes || [];
  const shuffledCorrectIndexes = originalCorrectIndexes.map(
    oldIdx => indexMap[oldIdx]
  );

  // Сохраняем во временные поля
  q._shuffledOptions = shuffledOptions;
  q._correctIndexesShuffled = shuffledCorrectIndexes;

  // Рендер вариантов как radio/checkbox
  renderOptions(q);

}

function renderOptions(question) {
  // очищаем контейнер
  optionsContainer.innerHTML = '';

  const isMultiple = question.type === 'multiple';
  const optionsList = document.createElement('div');

  question._shuffledOptions.forEach((opt, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'option-item';

    const label = document.createElement('label');
    const input = document.createElement('input');

    if (isMultiple) {
      input.type = 'checkbox';
      input.name = `answer_${i}`;
    } else {
      input.type = 'radio';
      input.name = 'answer';
    }
    input.value = i;

    label.appendChild(input);
    label.appendChild(document.createTextNode(` ${i + 1}. ${opt}`));
    wrapper.appendChild(label);
    optionsList.appendChild(wrapper);

    // Клик по всей строке переключает input (кроме прямого клика по самому input)
    wrapper.addEventListener('click', (e) => {
      if (e.target === input) return;

      if (isMultiple) {
        input.checked = !input.checked;
      } else {
        input.checked = true;
      }

      updateNextButtonState();
    });
  });

  optionsContainer.appendChild(optionsList);

  // Собираем все инпуты текущего вопроса
  const inputs = optionsContainer.querySelectorAll('input[type="radio"], input[type="checkbox"]');

  function updateNextButtonState() {
    let hasSelection = false;
    inputs.forEach(inp => {
      if (inp.checked) hasSelection = true;
    });
    nextBtn.disabled = !hasSelection;
  }

  // Следим за изменениями в инпутах
  inputs.forEach(inp => {
    inp.addEventListener('change', updateNextButtonState);
  });

  // Изначально показываем "Далее", но блокируем, пока нет выбора
  nextBtn.style.display = 'block';
  nextBtn.disabled = true;
  nextBtn.onclick = handleAnswer;
}

function getUserAnswer(question) {
  if (question.type === 'single') {
    const checked = document.querySelector(
      '#options input[name="answer"]:checked'
    );
    if (!checked) return null;
    return parseInt(checked.value, 10);
  } else {
    const inputs = document.querySelectorAll('#options input[type="checkbox"]');
    const indexes = [];
    inputs.forEach(inp => {
      if (inp.checked) {
        indexes.push(parseInt(inp.value, 10));
      }
    });
    return indexes;
  }
}

function scoreSingle(userIndex, question) {
  if (userIndex === null) return 0;
  const correctIdx = question._correctIndexesShuffled[0];
  return userIndex === correctIdx ? 1 : 0;
}

function scoreMultiple(userIndexes, question) {
  const correctIndexes = question._correctIndexesShuffled;
  const K = correctIndexes.length;

  if (!Array.isArray(userIndexes) || userIndexes.length === 0) {
    return 0;
  }

  const correctSet = new Set(correctIndexes);
  const userSet = new Set(userIndexes);

  let score = 0;

  // +1/K за каждый правильный отмеченный
  for (const idx of userSet) {
    if (correctSet.has(idx)) {
      score += 1 / K;
    } else {
      // -1/K за каждый лишний
      score -= 1 / K;
    }
  }

  // Не уходим ниже 0
  if (score < 0) score = 0;
  // Не больше 1 на всякий случай
  if (score > 1) score = 1;

  return score;
}

function handleAnswer() {
  const q = questions[currentIndex];
  const userAnswer = getUserAnswer(q);

  let gained = 0;

  if (q.type === 'single') {
    gained = scoreSingle(userAnswer, q);
  } else {
    gained = scoreMultiple(userAnswer, q);
  }

  totalScore += gained;

  // Переходим к следующему
  currentIndex++;
  if (currentIndex < questions.length) {
    showQuestion();
  } else {
    showResult();
  }
}

function showResult() {
  const userFormEl = document.getElementById('user-form');
  const form = document.getElementById('data-form');

  // Если результат уже показан — ничего не делаем
  if (resultEl.style.display === 'block') {
    return;
  }

  quizEl.style.display = 'none';
  resultEl.style.display = 'none';
  userFormEl.style.display = 'block';

  // Останавливаем таймер, как только перешли к форме
  if (window.timerInterval) {
    clearInterval(window.timerInterval);
  }

  const totalQuestions = questions.length;
  const percent = Math.round((totalScore / maxScore) * 100);

  // Сбрасываем предыдущий обработчик, чтобы не навешивать дубль
  form.onsubmit = e => {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;

    submitResults(firstName, lastName, email, totalScore, maxScore);

    userFormEl.style.display = 'none';
    resultEl.style.display = 'block';
    resultTextEl.textContent =
      `Ваш результат: ${percent}%. (Вопросов: ${totalQuestions})`;
  };
}

function submitResults(firstName, lastName, email, score, total) {
  // Пока без бэкенда: просто логируем в консоль
  console.log('Результат теста:', {
    firstName,
    lastName,
    email,
    score,
    total,
    testId,
  });
}

// Кнопка "Начать тест"
if (startBtn) {
  startBtn.addEventListener('click', () => {
    // Если вопросы ещё не загрузились по какой‑то причине — ничего не делаем
    if (!questions || questions.length === 0) {
      alert('Вопросы ещё не загрузились, попробуйте через пару секунд.');
      return;
    }
    startQuiz();
  });
}

// Кнопка "Пройти ещё раз"
restartBtn.addEventListener('click', () => {
  // Можно сбросить таймер в localStorage, если нужно начинать заново по времени
  // localStorage.removeItem('quiz_end_time_' + testId);
  startQuiz();
});

loadQuestions();
