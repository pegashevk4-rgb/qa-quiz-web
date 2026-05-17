let questions = [];
let currentIndex = 0;    // let correctCount = 0;
let totalScore = 0;      // набранные баллы (может быть дробным)
let maxScore = 0;        // максимум (по сути = числу вопросов)
let categoryStats = {};  // { "SQL": { gained: 0, max: 0 }, ... }

// testId из URL (?test_id=qa_middle_web), по умолчанию middle
const params = new URLSearchParams(window.location.search);
const testId = params.get('test_id') || 'qa_middle_web';

const questionTextEl   = document.getElementById('question-text');
const optionsContainer = document.getElementById('options');
const progressEl       = document.getElementById('progress');
const quizEl           = document.getElementById('quiz');
const resultEl         = document.getElementById('result');
const resultTextEl     = document.getElementById('result-text');
const restartBtn       = document.getElementById('restart-btn');
const categoryTextEl   = document.getElementById('category-text');
const nextBtn          = document.getElementById('next-btn');
const introEl          = document.getElementById('intro');
const startBtn         = document.getElementById('start-btn');
const quizQuestionsEl  = document.getElementById('quiz-questions');
const questionHintEl   = document.getElementById('question-hint');

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

    questions = shuffleArray(data);

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
  maxScore = questions.length;

  // Инициализируем статистику по категориям
  categoryStats = {};
  questions.forEach(q => {
    if (!categoryStats[q.category]) {
      categoryStats[q.category] = { gained: 0, max: 0 };
    }
  });

  if (introEl) introEl.style.display = 'none';
  quizEl.style.display = 'block';
  resultEl.style.display = 'none';

  const userFormEl = document.getElementById('user-form');
  if (userFormEl) userFormEl.style.display = 'none';

  if (quizQuestionsEl) quizQuestionsEl.style.display = 'block';

  nextBtn.style.display = 'block';
  nextBtn.disabled = true;
  nextBtn.onclick = handleAnswer;

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

  // Подсказка под вопросом: один / несколько вариантов
  if (questionHintEl) {
    if (q.type === 'multiple') {
      questionHintEl.textContent = 'Тип вопроса: можно выбрать несколько вариантов ответа.';
    } else {
      questionHintEl.textContent = 'Тип вопроса: выберите один вариант ответа.';
    }
  }

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
  optionsContainer.innerHTML = '';

  const isMultiple = question.type === 'multiple';
  const optionsList = document.createElement('div');

  question._shuffledOptions.forEach((opt, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'option-item';

    const label = document.createElement('label');
    label.className = 'option-label';

    const input = document.createElement('input');
    input.type = isMultiple ? 'checkbox' : 'radio';
    input.name = isMultiple ? `answer_${question.id}` : 'answer';
    input.value = i;

    const textSpan = document.createElement('span');
    textSpan.textContent = `${i + 1}. ${opt}`;

    label.appendChild(input);
    label.appendChild(textSpan);

    wrapper.appendChild(label);
    optionsList.appendChild(wrapper);
  });

  optionsContainer.appendChild(optionsList);

  const nextBtn = document.getElementById('next-btn');
  nextBtn.disabled = true;

  const inputs = optionsList.querySelectorAll(
    'input[type="radio"], input[type="checkbox"]'
  );
  inputs.forEach(input => {
    input.addEventListener('change', () => {
      const anyChecked = Array.from(inputs).some(inp => inp.checked);
      nextBtn.disabled = !anyChecked;
    });
  });
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

  for (const idx of userSet) {
    if (correctSet.has(idx)) {
      score += 1 / K;
    } else {
      score -= 1 / K;
    }
  }

  if (score < 0) score = 0;
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

  // обновляем статистику по категории
  const cat = q.category;
  if (!categoryStats[cat]) {
    categoryStats[cat] = { gained: 0, max: 0 };
  }
  categoryStats[cat].gained += gained;
  categoryStats[cat].max += 1;

  currentIndex++;
  if (currentIndex < questions.length) {
    showQuestion();
  } else {
    showResult();
  }
}

function getVerdict(percent) {
  if (percent >= 80) return 'Recommended (Strong Middle level)';
  if (percent >= 65) return 'Recommended (Middle level)';
  if (percent >= 50) return 'Potential Junior/Middle';
  return 'Requires additional evaluation';
}

function getRecommendationText(percent) {
  if (percent >= 80) {
    return 'Кандидат демонстрирует сильные знания уровня Middle и может быть рекомендован к следующему этапу интервью.';
  }
  if (percent >= 65) {
    return 'Кандидат показывает уверенные знания QA и может рассматриваться на позицию Middle.';
  }
  if (percent >= 50) {
    return 'Кандидат обладает базовыми знаниями и может подойти на Junior+/Middle после дополнительного интервью.';
  }
  return 'Рекомендуется дополнительная проверка практических навыков кандидата.';
}

function showResult() {
  const userFormEl = document.getElementById('user-form');
  const form = document.getElementById('data-form');

  // Если результат уже показан — выходим
  if (resultEl.style.display === 'block') {
    return;
  }

  // 1) прячем блок с вопросами
  if (quizQuestionsEl) {
    quizQuestionsEl.style.display = 'none';
  }

  // 2) гарантированно прячем результат
  resultEl.style.display = 'none';

  // 3) показываем форму
  userFormEl.style.display = 'block';

  // Останавливаем таймер
  if (window.timerInterval) {
    clearInterval(window.timerInterval);
  }

  const totalQuestions = questions.length;
  const percent = Math.round((totalScore / maxScore) * 100);

  form.onsubmit = async e => {
  e.preventDefault();
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const email = document.getElementById('email').value;
  
  await submitResults(firstName, lastName, email, totalScore, maxScore);

    // 4) прячем форму
    userFormEl.style.display = 'none';

    // 5) показываем только результат
    resultEl.style.display = 'block';

    // общий текст
    resultTextEl.textContent =
    `Ваш результат: ${percent}%. (Вопросов: ${totalQuestions})`;

    // вердикт
    const verdict = getVerdict(percent);
    const verdictTextEl   = document.getElementById('verdict-text');
    const strongAreasEl   = document.getElementById('strong-areas');
    const weakAreasEl     = document.getElementById('weak-areas');
    const breakdownEl     = document.getElementById('categories-breakdown');

    if (verdictTextEl) verdictTextEl.textContent = verdict;

    const verdictExplanationEl = document.getElementById('verdict-explanation');
    if (verdictExplanationEl) {
      verdictExplanationEl.textContent = getRecommendationText(percent);
    }

    // Если общий результат меньше 30% — не пытаемся искать сильные/слабые стороны
    if (percent < 30) {
      if (strongAreasEl) {
        strongAreasEl.innerHTML =
          '<li>Сильные стороны не определены — слишком мало правильных ответов</li>';
      }
      if (weakAreasEl) {
        weakAreasEl.innerHTML =
      '<li>Слабые зоны не определены по тем же причинам</li>';
      }
      if (breakdownEl) {
        breakdownEl.innerHTML = '';
      }
      return;
    }

    // собираем проценты по категориям
    const categoryPercents = Object.entries(categoryStats).map(
      ([category, { gained, max }]) => ({
        category,
        percent: max > 0 ? Math.round((gained / max) * 100) : 0
      })
    );

    // сортируем по убыванию
    categoryPercents.sort((a, b) => b.percent - a.percent);

    // чистим списки
    if (strongAreasEl) strongAreasEl.innerHTML = '';
    if (weakAreasEl)   weakAreasEl.innerHTML   = '';
    if (breakdownEl)   breakdownEl.innerHTML   = '';

    // top-2 как сильные стороны
    const strongAreas = categoryPercents.slice(0, Math.min(2, categoryPercents.length));
    // bottom-2 как слабые (разворачиваем, чтобы шли от худшего к лучше)
    const weakAreas   = categoryPercents.slice(-2).reverse();

    // выводим сильные
    strongAreas.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.category}: ${item.percent}%`;
      strongAreasEl.appendChild(li);
    });

    // выводим слабые
    weakAreas.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.category}: ${item.percent}%`;
      weakAreasEl.appendChild(li);
    });

    // полный breakdown
    categoryPercents.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.category}: ${item.percent}%`;
      breakdownEl.appendChild(li);
    });
  };
}

async function submitResults(firstName, lastName, email, score, total) {
  const percent = Math.round((score / total) * 100);
  
  // Готовим категории
  const categories = Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    percent: stats.max > 0 ? Math.round((stats.gained / stats.max) * 100) : 0
  }));

  // Сортируем для определения сильных/слабых сторон
  const sortedCategories = [...categories].sort((a, b) => b.percent - a.percent);
  const strong_areas = sortedCategories.slice(0, 2); // Топ-2
  const weak_areas = sortedCategories.slice(-2).reverse(); // Худшие 2

  // Вердикт
  const verdict = getVerdict(percent);

  // Данные для отправки
  const resultData = {
    first_name: firstName,
    last_name: lastName,
    email: email,
    test_id: testId,
    total_score: score,
    max_score: total,
    percent: percent,
    verdict: verdict,
    categories: categories,
    strong_areas: strong_areas,
    weak_areas: weak_areas
  };

  try {
    const response = await fetch('https://qa-quiz-web.vercel.app/api/results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resultData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Результаты сохранены в БД:', data);
    
  } catch (error) {
    console.error('❌ Ошибка при сохранении результатов:', error);
    alert('Не удалось сохранить результаты. Проверьте, что backend запущен.');
  }
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
