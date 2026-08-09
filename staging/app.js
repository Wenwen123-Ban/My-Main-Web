function updateClock() {
  const clockEl = document.getElementById('live-clock');
  if (!clockEl) return;
  const now = new Date();
  clockEl.textContent = now.toLocaleString();
}

function getSubjectColorClass(code) {
  if (!code) return 'subject-pill-default';
  const normalized = code.toUpperCase();
  if (normalized.startsWith('GE')) return 'subject-pill-yellow';
  if (normalized.startsWith('PT')) return 'subject-pill-orange';
  if (normalized.startsWith('JEEP')) return 'subject-pill-pink';
  return 'subject-pill-default';
}

function renderScheduleItems(subjects) {
  const container = document.getElementById('today-schedule');
  const countEl = document.getElementById('today-count');
  const activeDayEl = document.getElementById('summary-active-day');

  if (!container || !countEl || !activeDayEl) return;

  container.innerHTML = '';
  if (!Array.isArray(subjects) || subjects.length === 0) {
    container.innerHTML = '<p style="color:#94a3b8;">No classes found for today.</p>';
    countEl.textContent = '0 Classes Today';
    return;
  }

  countEl.textContent = `${subjects.length} Classes Today`;

  subjects.forEach((subject) => {
    const card = document.createElement('article');
    card.className = 'subject-card';
    card.innerHTML = `
      <div class="subject-row">
        <span class="subject-pill ${getSubjectColorClass(subject.code)}">${subject.code || 'TBA'}</span>
        <p class="subject-time">${subject.startTime || 'TBA'} – ${subject.endTime || 'TBA'}</p>
      </div>
      <h3 class="subject-title">${subject.title || subject.description || 'Untitled Class'}</h3>
      <p class="subject-desc">${subject.description || 'No description available.'}</p>
      <div class="subject-meta">
        <span>Room: ${subject.room || 'TBA'}</span>
        <span>Instructor: ${subject.instructor || 'TBA'}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

async function fetchSubjectsData() {
  try {
    const response = await fetch('subjects.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to load subjects.json');
    const data = await response.json();
    return Array.isArray(data.subjects) ? data.subjects : [];
  } catch (error) {
    console.warn(error);
    return [];
  }
}

async function initDashboard() {
  updateClock();
  setInterval(updateClock, 1000);

  const subjects = await fetchSubjectsData();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const activeDayEl = document.getElementById('active-day-pill');
  const summaryDayEl = document.getElementById('summary-active-day');

  if (activeDayEl) activeDayEl.textContent = `Active: ${today}`;
  if (summaryDayEl) summaryDayEl.textContent = `Active: ${today}`;

  renderScheduleItems(subjects);
}

document.addEventListener('DOMContentLoaded', initDashboard);
