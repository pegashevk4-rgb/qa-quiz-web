let questions = [];
let currentIndex = 0;
let correctCount = 0;

// testId из URL (?test_id=qa_middle_web), по умолчанию middle
const params = new URLSearchParams(window.location.search);
const testId = params.get('test_id') || 'qa_middle_web';

const questionTextEl = document.getElementById('question-text');
const optionButtons = document.querySelectorAll('#options button');
const progressEl = document.getElementById('progress');
const quizEl = document.getElementById('quiz');
const resultEl = document.getElementById('result');
const resultTextEl = document.getElementById('result-text');
const restartBtn = document.getElementById('restart-btn');
const categoryTextEl = document.getElementById('category-text');
const nextBtn = document.getElementById('next-btn');
const QUESTIONS_PER_RUN = 30;
const TEST_TITLES = {
  qa_junior_web: 'QA Junior (Web)',
  qa_middle_web: 'QA Middle (Web)',
  qa_senior_web: 'QA Senior (Web)',
};

// Загрузка вопросов теперь с бэка по test_id
async function loadQuestions() {
  try {
    const res = await fetch(`http://localhost:5000/api/test/${testId}`);
    if (!res.ok) {
      throw new Error('Ошибка загрузки теста');
    }
    const data = await res.json();
    questions = data.questions || [];

    if (questions.length > QUESTIONS_PER_RUN) {
      questions = questions.slice(0, QUESTIONS_PER_RUN);
    }

    const testTitleEl = document.getElementById('test-title');
    if (testTitleEl) {
      // берём title с бэка, если его нет — из TEST_TITLES, если и там нет — просто QA Quiz
      testTitleEl.textContent = data.title || TEST_TITLES[testId] || 'QA Quiz';
    }
    
    startQuiz();
  } catch (e) {
    console.error(e);
    alert('Не удалось загрузить вопросы. Проверь сервер и test_id в URL.');
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
  currentIndex = 0;
  correctCount = 0;
  quizEl.style.display = 'block';
  resultEl.style.display = 'none';

  const userFormEl = document.getElementById('user-form');
  if (userFormEl) userFormEl.style.display = 'none';

  nextBtn.style.display = 'none';
  showQuestion();
}

function showQuestion() {
  const q = questions[currentIndex];

  progressEl.textContent = `Вопрос ${currentIndex + 1} из ${questions.length}`;
  categoryTextEl.textContent = `Категория: ${q.category}`;
  questionTextEl.textContent = q.question;

  const originalOptions = q.options;
  const originalCorrectIndex = q.correct_index;
  const correctText = originalOptions[originalCorrectIndex];

  const shuffledOptions = shuffleArray(originalOptions);
  const newCorrectIndex = shuffledOptions.indexOf(correctText);

  q._shuffledOptions = shuffledOptions;
  q._correctIndexShuffled = newCorrectIndex;

  optionButtons.forEach((btn, index) => {
    const optionText = shuffledOptions[index];
    btn.textContent = `${index + 1}. ${optionText}`;
    btn.disabled = false;
    btn.style.backgroundColor = '';
    btn.onclick = () => handleAnswer(index);
  });

  nextBtn.style.display = 'none';
  nextBtn.onclick = null;
}

function handleAnswer(selectedIndex) {
  const q = questions[currentIndex];
  const correctIndex = q._correctIndexShuffled;

  if (selectedIndex === correctIndex) {
    correctCount++;
    optionButtons[selectedIndex].style.backgroundColor = '#c8e6c9';
  } else {
    optionButtons[selectedIndex].style.backgroundColor = '#ffcdd2';
    optionButtons[correctIndex].style.backgroundColor = '#c8e6c9';
  }

  optionButtons.forEach(btn => (btn.disabled = true));

  nextBtn.style.display = 'block';
  nextBtn.onclick = () => {
    currentIndex++;
    if (currentIndex < questions.length) {
      showQuestion();
    } else {
      showResult();
    }
  };
}

function showResult() {
  quizEl.style.display = 'none';
  resultEl.style.display = 'none';

  const userFormEl = document.getElementById('user-form');
  userFormEl.style.display = 'block';

  const total = questions.length;
  const percent = Math.round((correctCount / total) * 100);

  const form = document.getElementById('data-form');
  form.onsubmit = e => {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;

    submitResults(firstName, lastName, email, correctCount, total);

    userFormEl.style.display = 'none';
    resultEl.style.display = 'block';
    resultTextEl.textContent = `Правильных ответов: ${correctCount} из ${total} (${percent}%).`;
  };
}

function submitResults(firstName, lastName, email, score, total) {
  fetch('http://localhost:5000/api/save-result', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      firstName: firstName,
      lastName: lastName,
      email: email,
      score: score,
      total: total,
      testId: testId, // ВАЖНО: передаём, чтобы сохранить, по какому тесту
    }),
  })
    .then(response => response.json())
    .then(data => {
      console.log('✅ Результат сохранён в БД:', data);
    })
    .catch(error => {
      console.error('❌ Ошибка при сохранении:', error);
      alert('Не удалось сохранить результат. Проверь, запущен ли сервер.');
    });
}

restartBtn.addEventListener('click', startQuiz);

loadQuestions();
