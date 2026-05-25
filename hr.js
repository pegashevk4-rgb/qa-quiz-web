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
  // ----- Модалка авторизации -----
  const authModal = document.getElementById('auth-modal');
  const authOverlay = document.getElementById('auth-overlay');
  const authClose = document.getElementById('auth-close');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabs = document.querySelectorAll('.modal-tab');

  // Кнопки в шапке и hero
  const btnLogin = document.getElementById('open-auth-btn');   // "Войти"
  const btnCta = document.getElementById('cta-btn');           // "Получить доступ"
  

  function openAuthModal(initialTab = 'login') {
    if (!authModal || !authOverlay) return;

    authModal.classList.add('open');
    authOverlay.classList.add('open');

    tabs.forEach(tab => {
      const isActive = tab.dataset.tab === initialTab;
      tab.classList.toggle('active', isActive);
    });

    if (loginForm && registerForm) {
      loginForm.classList.toggle('active', initialTab === 'login');
      registerForm.classList.toggle('active', initialTab === 'register');
    }
  }

  function closeAuthModal() {
    if (!authModal || !authOverlay) return;
    authModal.classList.remove('open');
    authOverlay.classList.remove('open');
  }

  // Открытие модалки авторизации
  if (btnLogin) {
    btnLogin.addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal('login');
    });
  }

  if (btnCta) {
    btnCta.addEventListener('click', (e) => {
      e.preventDefault();
      // РАНЬШЕ было 'register' – теперь тоже открываем авторизацию
      openAuthModal('login');
    });
  }

  // Закрытие
  if (authClose) {
    authClose.addEventListener('click', closeAuthModal);
  }
  if (authOverlay) {
    authOverlay.addEventListener('click', closeAuthModal);
  }

  // Переключение вкладок
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.toggle('active', t === tab));
      if (loginForm && registerForm) {
        loginForm.classList.toggle('active', target === 'login');
        registerForm.classList.toggle('active', target === 'register');
      }
    });
  });

    // ----- Модалка кандидата -----
  const candidateOverlay = document.getElementById('candidate-overlay');
  const candidateModal = document.getElementById('candidate-modal');
  const candidateClose = document.getElementById('candidate-close');

  const candNameEl = document.getElementById('cand-name');
  const candTestEl = document.getElementById('cand-test');
  const candScoreEl = document.getElementById('cand-score');
  const candVerdictEl = document.getElementById('cand-verdict');
  const candDateEl = document.getElementById('cand-date');
  const candTestShortEl = document.getElementById('cand-test-short');
  const candTopicsBody = document.getElementById('cand-topics-body');
  const tableBody = document.getElementById('results-table-body');

  // Временный пример данных — позже сюда поставишь реальные из бэкенда
  const demoTopics = [
    { name: 'Теория тестирования', score: 85 },
    { name: 'SQL', score: 70 },
    { name: 'API', score: 60 },
    { name: 'Инструменты QA', score: 90 }
  ];

  function openCandidateModal(candidateData) {
    if (!candidateModal || !candidateOverlay) return;

    const fullName = `${candidateData.firstName} ${candidateData.lastName}`.trim();

    if (candNameEl) {
      candNameEl.textContent = fullName || 'Кандидат';
    }

    if (candTestEl) {
      candTestEl.textContent = candidateData.test
        ? `Тест: ${candidateData.test}`
        : 'Тест';
    }

    if (candScoreEl) {
      candScoreEl.textContent = `${candidateData.score}%`;
    }

    if (candVerdictEl) {
      candVerdictEl.textContent = candidateData.verdict || '';
    }

    if (candDateEl) {
      candDateEl.textContent = candidateData.date || '';
    }

    if (candTestShortEl) {
      candTestShortEl.textContent = candidateData.test || '';
    }

    if (candTopicsBody) {
      candTopicsBody.innerHTML = '';

      candidateData.topics.forEach(topic => {
        const row = document.createElement('div');
        row.className = 'topic-row';

        row.innerHTML = `
          <div class="topic-name">${topic.name}</div>
          <div class="topic-score">${topic.score}%</div>
        `;

        candTopicsBody.appendChild(row);
      });
    }

    candidateModal.classList.add('open');
    candidateOverlay.classList.add('open');
  }

  function closeCandidateModal() {
    if (!candidateModal || !candidateOverlay) return;
    candidateModal.classList.remove('open');
    candidateOverlay.classList.remove('open');
  }

  if (candidateClose) {
    candidateClose.addEventListener('click', closeCandidateModal);
  }

  if (candidateOverlay) {
    candidateOverlay.addEventListener('click', closeCandidateModal);
  }

  // Клик по строке таблицы → открыть модалку кандидата
  if (tableBody) {
    tableBody.querySelectorAll('tr').forEach(row => {
      row.addEventListener('click', () => {
        const cells = row.querySelectorAll('td');

        const candidateData = {
          firstName: cells[0]?.textContent.trim() || '',
          lastName: cells[1]?.textContent.trim() || '',
          test: cells[3]?.textContent.trim() || '',
          score: parseInt(cells[4]?.innerText, 10) || 0,
          verdict: cells[5]?.textContent.trim() || '',
          date: cells[6]?.textContent.trim() || '',
          topics: demoTopics
        };

        openCandidateModal(candidateData);
      });
    });
  }

  // ----- Простая валидация форм авторизации -----
  function attachRequiredValidation(form) {
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const inputs = form.querySelectorAll('input[required]');
      let valid = true;

      inputs.forEach(input => {
        const value = input.value.trim();

        if (!value) {
          valid = false;
          input.classList.add('input-error');
          return;
        }

        if (!input.checkValidity()) {
          valid = false;
          input.classList.add('input-error');
        } else {
          input.classList.remove('input-error');
        }
      });

      if (!valid) return;

      // TODO: здесь будет реальный запрос к бэкенду

      // помечаем, что пользователь "залогинен"
      localStorage.setItem('qa_is_logged_in', '1');

      // закрываем модалку (по желанию — можно вообще не закрывать, сразу уходить)
      closeAuthModal();

      // редирект на дашборд
      window.location.href = 'hr-dashboard.html';

    });
  }

  attachRequiredValidation(loginForm);
  attachRequiredValidation(registerForm);
});

// ----- Переключение светлой и темной темы -----
const THEME_KEY = 'qa_theme';

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '🌙' : '☀';
    btn.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'
    );
  }
}

// Инициализация темы при загрузке
(function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  const initialTheme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);
})();

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });
});
