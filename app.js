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
const QUESTIONS_PER_RUN = 30;
const categoryTextEl = document.getElementById('category-text');


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

function startQuiz() {
  currentIndex = 0;
  correctCount = 0;
  quizEl.style.display = 'block';
  resultEl.style.display = 'none';
  showQuestion();
}

function showQuestion() {
  const q = questions[currentIndex];

  progressEl.textContent = `Вопрос ${currentIndex + 1} из ${questions.length}`;
  categoryTextEl.textContent = `Категория: ${q.category}`;
  questionTextEl.textContent = q.question;

  optionButtons.forEach((btn, index) => {
    btn.textContent = `${index + 1}. ${q.options[index]}`;
    btn.disabled = false;
    btn.style.backgroundColor = '';
    btn.onclick = () => handleAnswer(index);
  });
}

function handleAnswer(selectedIndex) {
  const q = questions[currentIndex];

  if (selectedIndex === q.correct_index) {
    correctCount++;
    optionButtons[selectedIndex].style.backgroundColor = '#c8e6c9'; // зелёный
  } else {
    optionButtons[selectedIndex].style.backgroundColor = '#ffcdd2'; // красный
    optionButtons[q.correct_index].style.backgroundColor = '#c8e6c9';
  }

  optionButtons.forEach(btn => btn.disabled = true);

  setTimeout(() => {
    currentIndex++;
    if (currentIndex < questions.length) {
      showQuestion();
    } else {
      showResult();
    }
  }, 800);
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
