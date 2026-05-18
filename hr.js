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

  // Загрузка данных в таблицу из API
const tbody = document.getElementById('results-table-body');
if (!tbody) return;

fetch('https://qa-quiz-web.vercel.app/api/company/1/results')
  .then((res) => res.json())
  .then((data) => {
    // Подстраховка структуры ответа
    const results = Array.isArray(data)
      ? data                         // если API вернёт массив
      : Array.isArray(data?.results)
      ? data.results                 // если API вернёт { results: [...] }
      : [];

    if (!results.length) {
      console.warn('Пустые результаты или неожиданная структура ответа', data);
      // Можно либо оставить статические строки из HTML,
      // либо показать короткую заглушку:
      // tbody.innerHTML = '<tr><td colspan="7">Пока нет результатов</td></tr>';
      return;
    }

    tbody.innerHTML = '';

    results.forEach((row) => {
      const tr = document.createElement('tr');

      const created = row.created_at ? new Date(row.created_at) : new Date();
      const dateStr = created.toLocaleDateString('ru-RU');

      const percent = Math.round(row.score_percent ?? 0);
      const verdict = row.verdict; // 'pass' | 'fail' | 'review'

      const verdictMap = {
        pass:  { class: 'verdict--pass',   text: '✓ Прошёл' },
        fail:  { class: 'verdict--fail',   text: '✕ Не прошёл' },
        review:{ class: 'verdict--review', text: '⚠ На ревью' }
      };

      const verdictConf = verdictMap[verdict] || verdictMap.review;

      tr.innerHTML = `
        <td>${row.first_name || ''}</td>
        <td>${row.last_name  || ''}</td>
        <td>${row.email      || ''}</td>
        <td>${row.test_name  || ''}</td>
        <td>
          <div class="pct-bar">
            <div class="pct-track">
              <div class="pct-fill" style="width:${percent}%"></div>
            </div>
            ${percent}%
          </div>
        </td>
        <td><span class="verdict ${verdictConf.class}">${verdictConf.text}</span></td>
        <td>${dateStr}</td>
      `;

      tbody.appendChild(tr);
    });
  })
  .catch((err) => {
    console.error('Ошибка загрузки результатов', err);
    // Здесь тоже можно оставить статику из HTML
  });
});