// Базовый URL API твоего бэка
const API_BASE = 'https://qa-quiz-web.vercel.app';

// Порог для вердиктов (можно потом вынести в конфиг)
function getVerdictClass(verdict) {
  if (!verdict) return 'verdict verdict--review';

  const v = verdict.toLowerCase();
  if (v.includes('recommended')) return 'verdict verdict--pass';
  if (v.includes('potential')) return 'verdict verdict--review';
  if (v.includes('requires')) return 'verdict verdict--fail';

  return 'verdict verdict--review';
}

// Показ/скрытие дашборда (логика из исходного скрипта)
function showDashboard() {
  const dash = document.getElementById('dashboard');
  dash.classList.add('visible');
}

function toggleDashboard() {
  const dash = document.getElementById('dashboard');
  dash.classList.toggle('visible');
  if (dash.classList.contains('visible')) {
    setTimeout(
      () => dash.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      50
    );
  }
}

// Навешиваем обработчик на кнопку CTA
document.addEventListener('DOMContentLoaded', () => {
  const cta = document.querySelector('.btn-cta');
  if (cta) {
    cta.addEventListener('click', function (e) {
      e.preventDefault();
      showDashboard();
      setTimeout(() => {
        document
          .getElementById('dashboard')
          .scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    });
  }

  // Стартовая инициализация данных
  loadResults();
  updateSubscriptionInfo();
});

// Подгружаем реальные результаты из API компании 1
async function loadResults() {
  const tbody = document.getElementById('results-table-body');
  if (!tbody) return;

  // Очищаем демо-строки
  tbody.innerHTML = '';

  try {
    const resp = await fetch(`${API_BASE}/api/company/1/results`);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    const data = await resp.json();

    if (!Array.isArray(data) || data.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 7;
      td.textContent = 'Пока нет результатов';
      tbody.appendChild(tr);
      tr.appendChild(td);
      return;
    }

    data.forEach((row) => {
      const tr = document.createElement('tr');

      const firstNameTd = document.createElement('td');
      firstNameTd.textContent = row.first_name || '';
      tr.appendChild(firstNameTd);

      const lastNameTd = document.createElement('td');
      lastNameTd.textContent = row.last_name || '';
      tr.appendChild(lastNameTd);

      const emailTd = document.createElement('td');
      emailTd.textContent = row.email || '';
      tr.appendChild(emailTd);

      const testTd = document.createElement('td');
      testTd.textContent = row.test_id || '';
      tr.appendChild(testTd);

      const percentTd = document.createElement('td');
      const pctBar = document.createElement('div');
      pctBar.className = 'pct-bar';

      const track = document.createElement('div');
      track.className = 'pct-track';
      const fill = document.createElement('div');
      fill.className = 'pct-fill';
      const pct = Number(row.percent) || 0;
      fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
      track.appendChild(fill);

      const pctText = document.createTextNode(`${pct}%`);

      pctBar.appendChild(track);
      pctBar.appendChild(pctText);
      percentTd.appendChild(pctBar);
      tr.appendChild(percentTd);

      const verdictTd = document.createElement('td');
      const verdictSpan = document.createElement('span');
      verdictSpan.className = getVerdictClass(row.verdict);
      verdictSpan.textContent = row.verdict || 'На ревью';
      verdictTd.appendChild(verdictSpan);
      tr.appendChild(verdictTd);

      const createdTd = document.createElement('td');
      // Преобразуем ISO-дату в DD.MM.YYYY
      if (row.created_at) {
        const d = new Date(row.created_at);
        if (!isNaN(d)) {
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          createdTd.textContent = `${dd}.${mm}.${yyyy}`;
        } else {
          createdTd.textContent = row.created_at;
        }
      } else {
        createdTd.textContent = '';
      }
      tr.appendChild(createdTd);

      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Ошибка загрузки результатов:', err);
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.textContent = 'Ошибка загрузки результатов';
    tbody.appendChild(tr);
    tr.appendChild(td);
  }
}

// Временная заглушка для подписки: считаем дни до фиксированной даты
function updateSubscriptionInfo() {
  const subEl = document.getElementById('subscription-info');
  if (!subEl) return;

  const daysSpan = subEl.querySelector('.sub-days');
  if (!daysSpan) return;

  // TODO: потом возьмём дату из БД
  const today = new Date();
  const until = new Date('2026-06-30'); // временная дата конца подписки
  const diffMs = until.getTime() - today.getTime();
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  daysSpan.textContent = `${diffDays} дней`;
}