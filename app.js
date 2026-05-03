let questions = [];
let currentIndex = 0;
let correctCount = 0;

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

async function loadQuestions() {
  const res = await fetch('questions.json');
  questions = await res.json();
  shuffleAndSliceQuestions();
  startQuiz();
}

function shuffleAndSliceQuestions() {
  questions.sort(() => Math.random() - 0.5);
  questions = questions.slice(0, QUESTIONS_PER_RUN);
}

// Функция для перемешивания массива (Фишер–Йетс)
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
  nextBtn.style.display = 'none';
  showQuestion();
}

function showQuestion() {
  const q = questions[currentIndex];

  progressEl.textContent = `Вопрос ${currentIndex + 1} из ${questions.length}`;
  categoryTextEl.textContent = `Категория: ${q.category}`;
  questionTextEl.textContent = q.question;

  // исходные варианты и правильный текст
  const originalOptions = q.options;
  const originalCorrectIndex = q.correct_index;
  const correctText = originalOptions[originalCorrectIndex];

  // перемешиваем копию вариантов
  const shuffledOptions = shuffleArray(originalOptions);

  // находим новый индекс правильного ответа
  const newCorrectIndex = shuffledOptions.indexOf(correctText);

  // сохраняем на время текущего прохода
  q._shuffledOptions = shuffledOptions;
  q._correctIndexShuffled = newCorrectIndex;

  optionButtons.forEach((btn, index) => {
    const optionText = shuffledOptions[index];
    btn.textContent = `${index + 1}. ${optionText}`;
    btn.disabled = false;
    btn.style.backgroundColor = '';
    btn.onclick = () => handleAnswer(index);
  });

  // кнопку «Далее» прячем до ответа
  nextBtn.style.display = 'none';
  nextBtn.onclick = null;
}

function handleAnswer(selectedIndex) {
  const q = questions[currentIndex];
  const correctIndex = q._correctIndexShuffled;

  if (selectedIndex === correctIndex) {
    correctCount++;
    optionButtons[selectedIndex].style.backgroundColor = '#c8e6c9'; // зелёный
  } else {
    optionButtons[selectedIndex].style.backgroundColor = '#ffcdd2'; // красный
    optionButtons[correctIndex].style.backgroundColor = '#c8e6c9';
  }

  optionButtons.forEach(btn => btn.disabled = true);

  // показываем кнопку «Далее»
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
  resultEl.style.display = 'block';

  const total = questions.length;
  const percent = Math.round((correctCount / total) * 100);

  resultTextEl.textContent = `Правильных ответов: ${correctCount} из ${total} (${percent}%).`;
}

restartBtn.addEventListener('click', startQuiz);

// стартуем при загрузке страницы
loadQuestions();
