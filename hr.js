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

// Открытие модалки по кнопкам
const authModal = document.getElementById('auth-modal');
const authOverlay = document.getElementById('auth-overlay');
const authClose = document.getElementById('auth-close');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const tabs = document.querySelectorAll('.modal-tab');

// Кнопки в шапке и hero
const btnLogin = document.querySelector('nav .btn-outline');
const btnCta = document.getElementById('cta-btn');

function openAuthModal(initialTab = 'login') {
  authModal.classList.add('open');
  authOverlay.classList.add('open');

  tabs.forEach(tab => {
    const isActive = tab.dataset.tab === initialTab;
    tab.classList.toggle('active', isActive);
  });

  loginForm.classList.toggle('active', initialTab === 'login');
  registerForm.classList.toggle('active', initialTab === 'register');
}

function closeAuthModal() {
  authModal.classList.remove('open');
  authOverlay.classList.remove('open');
}

// Открытие
if (btnLogin) {
  btnLogin.addEventListener('click', () => openAuthModal('login'));
}
if (btnCta) {
  btnCta.addEventListener('click', (e) => {
    e.preventDefault();
    openAuthModal('register');
  });
}

// Закрытие
authClose.addEventListener('click', closeAuthModal);
authOverlay.addEventListener('click', closeAuthModal);

// Переключение вкладок
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;

    tabs.forEach(t => t.classList.toggle('active', t === tab));
    loginForm.classList.toggle('active', target === 'login');
    registerForm.classList.toggle('active', target === 'register');
  });
});

// Простая валидация: не отправлять с пустыми полями
function attachRequiredValidation(form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const inputs = form.querySelectorAll('input[required]');
    let valid = true;

    inputs.forEach(input => {
      const value = input.value.trim();

      // базовая проверка на пустоту
      if (!value) {
        valid = false;
        input.classList.add('input-error');
        return;
      }

      // HTML5-валидация (type, minlength, pattern и т.д.)
      if (!input.checkValidity()) {
        valid = false;
        input.classList.add('input-error');
      } else {
        input.classList.remove('input-error');
      }
    });

    if (!valid) {
      return;
    }

    // позже вместо этого здесь будет реальный запрос/редирект
    closeAuthModal();
  });
}

attachRequiredValidation(loginForm);
attachRequiredValidation(registerForm);
});