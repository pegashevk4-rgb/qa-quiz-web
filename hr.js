// Показать панель
function showDashboard() {
  const dash = document.getElementById('dashboard');
  if (!dash) return;
  dash.classList.add('visible');
}

// Переключить панель (кнопка "Войти")
function toggleDashboard() {
  const dash = document.getElementById('dashboard');
  if (!dash) return;
  dash.classList.toggle('visible');
  if (dash.classList.contains('visible')) {
    setTimeout(() => {
      dash.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }
}

// Навешиваем обработчики после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  const ctaBtn = document.getElementById('cta-btn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showDashboard();
      setTimeout(() => {
        const dash = document.getElementById('dashboard');
        if (dash) {
          dash.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    });
  }

  // Никакой загрузки результатов из API здесь нет —
  // таблица остаётся такой, как в HTML.
});