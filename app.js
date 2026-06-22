let data = null;
let currentDay = 0;
let votes = JSON.parse(localStorage.getItem('valencia_votes2') || '{}');

async function init() {
  try {
    const resp = await fetch('activities.json');
    data = await resp.json();
    renderDay(0);
  } catch (e) {
    document.getElementById('content').innerHTML = `<div style="padding:40px;text-align:center;"><p>Laden mislukt</p><p style="color:#666;font-size:0.85rem;">${e.message}</p></div>`;
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

function getVotes(id) { return votes[id] || []; }
function voteCount(id) { return getVotes(id).length; }
function isUnanimous(id) { return voteCount(id) === 4; }
function getGroup() { return data.trip.group; }

function renderOverview() {
  const trip = data.trip;
  const days = data.days;
  let cards = '';
  days.forEach(d => {
    const all = [...(d.main_events||[]), ...(d.around||[])];
    const unanimous = all.filter(a => isUnanimous(a.id));
    const confirmed = unanimous.map(a => a.title).join(', ');
    cards += `<div class="overview-card" onclick="switchDay(${d.day})">
      <div class="day-number">Dag ${d.day}</div>
      <div class="day-date">${d.weekday} ${d.date.slice(8,10)} juli</div>
      <h3>${d.title}</h3>
      <div class="day-theme">${d.theme}</div>
      ${confirmed ? `<div class="confirmed-badge">${confirmed}</div>` : '<div class="empty-badge">Nog niets ingepland</div>'}
    </div>`;
  });
  return `<div class="travel-info">
    <h2>Reisinfo</h2>
    <div class="travel-info-grid">
      <div class="travel-info-item"><strong>Bestemming:</strong> ${trip.destination}</div>
      <div class="travel-info-item"><strong>Wijk:</strong> ${trip.neighborhood}</div>
      <div class="travel-info-item"><strong>Groep:</strong> ${trip.group.join(', ')}</div>
      <div class="travel-info-item"><strong>Aankomst:</strong> ${trip.arrival_time}</div>
      <div class="travel-info-item"><strong>Vertrek:</strong> ${trip.departure_time}</div>
    </div>
  </div>
  <h2>Kaart van Valencia</h2>
  <div class="map-container">
    <img src="valencia-map.svg" alt="Kaart" style="max-width:100%;border-radius:10px;">
    <p class="map-caption">La Cabanyal | Malvarrosa | Ciudad de las Artes | Centrum | Albufera</p>
  </div>
  <h2>Kies een dag</h2>
  <div class="overview-grid">${cards}</div>
  <div class="how-it-works">
    <strong>Zo werkt het:</strong> Per dag zie je <strong>Main Events</strong> en <strong>Eromheen</strong>.
    Klik op een naam om te stemmen. 4/4 unaniem = ingepland! Opties met meeste stemmen staan bovenaan.
  </div>`;
}

function renderDayPage(dayNum) {
  const day = data.days.find(d => d.day === dayNum);
  if (!day) return '<p>Dag niet gevonden</p>';
  const mainEvents = day.main_events || [];
  const around = day.around || [];
  const confirmed = [...mainEvents, ...around].filter(a => isUnanimous(a.id));
  const notConfirmed = (items) => items.filter(a => !isUnanimous(a.id)).sort((a,b) => voteCount(b.id)-voteCount(a.id));
  const noteHtml = day.note ? `<div class="day-note">${day.note}</div>` : '';
  let html = `<div class="day-section">
    <div class="day-header">
      <div class="day-badge">Dag ${day.day} | ${day.weekday} ${day.date.slice(8,10)} juli</div>
      <h2>${day.title}</h2>
      <div class="day-theme">${day.theme}</div>
      ${noteHtml}
    </div>`;
  if (confirmed.length > 0) {
    html += `<div class="confirmed-section"><h3 class="confirmed-title">Ingepland (unaniem)</h3>`;
    confirmed.forEach(a => { html += renderActivityCard(a, true); });
    html += `</div>`;
  }
  const sortedMain = notConfirmed(mainEvents);
  if (sortedMain.length > 0) {
    html += `<h3 class="section-title">Main Events</h3>`;
    sortedMain.forEach(a => { html += renderActivityCard(a, false); });
  }
  const sortedAround = notConfirmed(around);
  if (sortedAround.length > 0) {
    html += `<h3 class="section-title">Eromheen</h3>`;
    sortedAround.forEach(a => { html += renderActivityCard(a, false); });
  }
  html += `</div>`;
  return html;
}

function renderActivityCard(a, isConfirmed) {
  const g = getGroup();
  const voterList = getVotes(a.id);
  const count = voterList.length;
  let voteBtns = '';
  g.forEach(person => {
    const hasVoted = voterList.includes(person);
    voteBtns += `<button class="vote-btn ${hasVoted?'voted-yes':''}" onclick="toggleVote('${a.id}','${person}')">${person}${hasVoted?' ':''}</button>`;
  });
  const catMap = {};
  data.categories.forEach(c => catMap[c.id] = c);
  const cat = catMap[a.category] || { icon: '', label: a.category };
  return `<div class="activity-card ${isConfirmed?'confirmed':''} ${count>0?'has-votes':''}">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <h3>${a.title}</h3>
        <div class="act-desc">${a.desc}</div>
        <div class="act-meta">
          <span class="act-category">${cat.icon} ${cat.label}</span>
          <span>${a.location}</span>
          <span>${a.cost||'-'}</span>
          <span>${a.time||'-'}</span>
        </div>
      </div>
      <div class="vote-counter ${isUnanimous(a.id)?'unanimous':''}">
        <span class="vote-num">${count}</span>
        <span class="vote-label">/ 4</span>
      </div>
    </div>
    <div class="vote-section">
      ${voteBtns}
      ${isUnanimous(a.id)?'<span class="unanimous-badge">Unaniem! Ingepland</span>':''}
    </div>
  </div>`;
}

function toggleVote(activityId, person) {
  if (!votes[activityId]) votes[activityId] = [];
  const idx = votes[activityId].indexOf(person);
  if (idx > -1) { votes[activityId].splice(idx, 1); if (votes[activityId].length===0) delete votes[activityId]; }
  else { votes[activityId].push(person); }
  localStorage.setItem('valencia_votes2', JSON.stringify(votes));
  renderDay(currentDay);
}

document.addEventListener('DOMContentLoaded', init);