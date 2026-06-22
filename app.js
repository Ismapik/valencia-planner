let data = null;
let currentDay = 0;
let votes = JSON.parse(localStorage.getItem('valencia_votes') || '{}');

async function init() {
  try {
    const resp = await fetch('activities.json');
    data = await resp.json();
    renderDay(0);
  } catch (e) {
    document.getElementById('content').innerHTML = `<div style="padding:40px;text-align:center;"><p>Data laden mislukt</p><p style="font-size:0.85rem;color:#666;">${e.message}</p></div>`;
  }
}

function switchDay(day) {
  currentDay = day;
  document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.day-btn[data-day="${day}"]`).classList.add('active');
  renderDay(day);
  document.getElementById('content').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderDay(day) {
  const el = document.getElementById('content');
  el.innerHTML = day === 0 ? renderOverview() : renderDayPage(day);
}

function renderOverview() {
  const trip = data.trip;
  const days = data.days;
  const catMap = {};
  data.categories.forEach(c => catMap[c.id] = c);
  let cards = '';
  days.forEach(d => {
    const totalActs = d.activities.length;
    const votedActs = d.activities.filter(a => votes[a.id] && votes[a.id].length > 0).length;
    cards += `<div class="overview-card" onclick="switchDay(${d.day})">
      <div class="day-number">Dag ${d.day}</div>
      <div class="day-date">${d.weekday} ${d.date.slice(8,10)} juli</div>
      <h3>${d.title}</h3>
      <div class="day-theme">${d.theme}</div>
      <div class="activity-count">${votedActs}/${totalActs} gestemd</div>
    </div>`;
  });
  return `<div class="travel-info">
    <h2>Reisinfo</h2>
    <div class="travel-info-grid">
      <div class="travel-info-item"><strong>Bestemming:</strong> ${trip.destination}</div>
      <div class="travel-info-item"><strong>Wijk:</strong> ${trip.neighborhood}</div>
      <div class="travel-info-item"><strong>Data:</strong> 6-13 juli</div>
      <div class="travel-info-item"><strong>Groep:</strong> ${trip.group.join(', ')}</div>
      <div class="travel-info-item"><strong>Aankomst:</strong> ${trip.arrival_time}</div>
      <div class="travel-info-item"><strong>Vertrek:</strong> ${trip.departure_time}</div>
    </div>
  </div>
  <h2>Dagoverzicht</h2>
  <div class="overview-grid">${cards}</div>
  <div style="margin-top:20px;padding:16px;background:var(--cream);border-radius:14px;">
    <strong>Zo werkt het:</strong> Klik op een dag om activiteiten te zien. Klik op een naam om te stemmen.
  </div>`;
}

function renderDayPage(dayNum) {
  const day = data.days.find(d => d.day === dayNum);
  if (!day) return '<p>Dag niet gevonden</p>';
  const catMap = {};
  data.categories.forEach(c => catMap[c.id] = c);
  let activitiesHtml = '';
  day.activities.forEach(a => {
    const cat = catMap[a.category] || { label: a.category, icon: '' };
    const isVoted = votes[a.id] && votes[a.id].length > 0;
    let voteBtns = '';
    data.trip.group.forEach(person => {
      const hasVoted = votes[a.id] && votes[a.id].includes(person);
      voteBtns += `<button class="vote-btn ${hasVoted ? 'voted-yes' : ''}" onclick="toggleVote('${a.id}','${person}')">${person}</button>`;
    });
    activitiesHtml += `<div class="activity-card ${isVoted ? 'voted' : ''}">
      <div class="act-time">${a.time}</div>
      <h3>${a.title}</h3>
      <div class="act-desc">${a.desc}</div>
      <div class="act-meta">
        <span class="act-category">${cat.icon} ${cat.label || a.category}</span>
        <span>${a.location}</span>
        <span>${a.cost || '-'}</span>
      </div>
      <div class="vote-section">${voteBtns}</div>
    </div>`;
  });
  const noteHtml = day.note ? `<div class="day-note">${day.note}</div>` : '';
  return `<div class="day-section">
    <div class="day-header">
      <div class="day-badge">Dag ${day.day} | ${day.weekday} ${day.date.slice(8,10)} juli</div>
      <h2>${day.title}</h2>
      <div class="day-theme">${day.theme}</div>
      ${noteHtml}
    </div>
    ${activitiesHtml}
  </div>`;
}

function toggleVote(activityId, person) {
  if (!votes[activityId]) votes[activityId] = [];
  const idx = votes[activityId].indexOf(person);
  if (idx > -1) {
    votes[activityId].splice(idx, 1);
    if (votes[activityId].length === 0) delete votes[activityId];
  } else {
    votes[activityId].push(person);
  }
  localStorage.setItem('valencia_votes', JSON.stringify(votes));
  renderDay(currentDay);
}

document.addEventListener('DOMContentLoaded', init);