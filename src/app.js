/* App / UI - Simulado Gamificado 3º Trimestre - 4º Ano
   Telas: onboarding -> mapa -> ilha -> intro da fase -> quiz -> resultado */

const root = document.getElementById('app');
const toastEl = document.getElementById('toast');
let NAV = { screen:'boot' };
let QUIZ = null; // {subject, phase, index, answers:[], correctCount, selected:[]}
let _rankingUnsub = null;

function el(html){ const t=document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function esc(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
// rich(): usado SÓ para conteúdo autoral nosso (prompt/opções/explicação das questões),
// nunca para texto digitado pelo usuário. Permite marcadores HTML de apresentação como
// <span class="frac">...</span> (fração empilhada) sem escapar a tag. Não há risco de XSS
// aqui porque esse texto vem exclusivamente de questions.js, nunca de input do jogador.
function rich(s){ return String(s); }
// Embaralha uma cópia (Fisher-Yates). Usado nas alternativas e na ordem das questões.
function shuffled(arr){
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function findSubject(id){ return SUBJECTS.find(s=>s.id===id); }
function findPhase(subject, id){ return subject.phases.find(p=>p.id===id); }

function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toastEl.classList.remove('show'), 2200);
}

// ---------------------------- BOOT ----------------------------
function boot(){
  registerPlayToday();
  ensurePlayerId();
  ensureRecoveryCode();
  if (location.hash === '#painel') { goTo('panel'); return; }
  if (!STATE.playerName) { goTo('onboarding'); }
  else { goTo('map'); syncScoreToCloud(); }
}

function goTo(screen, params){
  if (NAV.screen === 'ranking' && screen !== 'ranking' && _rankingUnsub){ _rankingUnsub(); _rankingUnsub = null; }
  NAV = Object.assign({ screen }, params||{});
  syncHistory();
  render();
  window.scrollTo(0,0);
}

// ---------------------------- BOTÃO "VOLTAR" DO CELULAR ----------------------------
// Antes, o gesto de voltar fechava o site. Agora mantemos uma entrada extra no histórico
// sempre que a criança está fora do mapa: o "voltar" leva para a tela anterior do jogo.
const ROOT_SCREENS = ['map', 'onboarding', 'boot', 'panel'];
function syncHistory(){
  try{
    const away = !ROOT_SCREENS.includes(NAV.screen) || (NAV.screen === 'onboarding' && NAV.edit);
    if (away && !(history.state && history.state.app)) history.pushState({ app: true }, '');
  }catch(e){}
}
function parentOf(nav){
  switch (nav.screen){
    case 'island': return { screen:'map' };
    case 'phaseIntro': return { screen:'island', subjectId: nav.subjectId };
    case 'lesson': return { screen:'phaseIntro', subjectId: nav.subjectId, phaseId: nav.phaseId };
    case 'result': return nav.review ? { screen:'map' } : { screen:'island', subjectId: nav.subjectId };
    case 'ranking': return { screen:'map' };
    case 'onboarding': return nav.edit ? { screen:'map' } : null;
    default: return { screen:'map' };
  }
}
window.addEventListener('popstate', ()=>{
  if (ROOT_SCREENS.includes(NAV.screen) && !NAV.edit) return; // no mapa, o "voltar" sai do site normalmente
  if (NAV.screen === 'quiz'){
    if (!confirm('Sair do quiz? Seu progresso nessa fase será perdido.')){
      try{ history.pushState({ app: true }, ''); }catch(e){}
      return;
    }
    if (NAV.review){ goTo('map'); return; }
    const p = { screen:'phaseIntro', subjectId: NAV.subjectId, phaseId: NAV.phaseId };
    goTo(p.screen, p);
    return;
  }
  const p = parentOf(NAV);
  if (p) goTo(p.screen, p);
});

function render(){
  root.classList.add('fade');
  requestAnimationFrame(()=> root.classList.remove('fade'));
  if (NAV.screen === 'onboarding') return renderOnboarding();
  if (NAV.screen === 'map') return renderMap();
  if (NAV.screen === 'island') return renderIsland();
  if (NAV.screen === 'phaseIntro') return renderPhaseIntro();
  if (NAV.screen === 'lesson') return renderLessonScreen();
  if (NAV.screen === 'panel') return renderPanel();
  if (NAV.screen === 'quiz') return renderQuiz();
  if (NAV.screen === 'result') return renderResult();
  if (NAV.screen === 'ranking') return renderRanking();
}

// ---------------------------- ONBOARDING ----------------------------
let pendingAvatar = STATE.avatar || 'hero';
let pendingColor = STATE.avatarColor || AVATAR_COLORS[0];
let pendingTurma = (STATE.turma === 'A' || STATE.turma === 'B') ? STATE.turma : null;

function renderOnboarding(){
  root.innerHTML = '';
  const editing = !!NAV.edit;
  const avatarsHtml = AVATARS.map(a => `
    <button class="avatar-pick ${a.id===pendingAvatar?'selected':''}" data-avatar="${a.id}" aria-label="Avatar ${a.id}">
      <span class="avatar-emoji">${a.emoji}</span>
    </button>`).join('');
  const colorsHtml = AVATAR_COLORS.map(c => `
    <button class="color-pick ${c===pendingColor?'selected':''}" data-color="${c}" style="background:${c}" aria-label="Cor ${c}"></button>`).join('');

  const card = el(`
    <div class="screen onboarding-screen">
      <div class="onboarding-card">
        <div class="mascot-big">${MASCOT}</div>
        ${editing
          ? `<h1 class="title-xl">Editar <span class="accent">perfil</span></h1>
             <p class="subtitle">Seu progresso continua salvo. Mude o que quiser e toque em Salvar.</p>`
          : `<h1 class="title-xl">Bem-vindo(a) à<br/><span class="accent">Ilha do Conhecimento</span>!</h1>
             <p class="subtitle">Crie seu explorador para começar a aventura do 3º trimestre!</p>`}

        <div class="avatar-preview" id="avatarPreview" style="background:${pendingColor}">
          <span>${AVATARS.find(a=>a.id===pendingAvatar).emoji}</span>
        </div>

        <div class="section-label">Escolha seu avatar</div>
        <div class="avatar-grid">${avatarsHtml}</div>

        <div class="section-label">Escolha sua cor</div>
        <div class="color-grid">${colorsHtml}</div>

        <div class="section-label">Como podemos te chamar?</div>
        <input id="nameInput" class="name-input" maxlength="18" placeholder="Digite seu nome..." value="${esc(STATE.playerName||'')}" />

        <div class="section-label">Sobrenome <span class="label-optional">(opcional, ajuda a diferenciar colegas com o mesmo nome)</span></div>
        <input id="lastNameInput" class="name-input" maxlength="24" placeholder="ex: Silva" value="${esc(STATE.lastName||'')}" />

        <div class="section-label">Qual é a sua turma?</div>
        <div class="turma-grid">
          <button class="turma-pick ${pendingTurma==='A'?'selected':''}" data-turma="A">Turma A</button>
          <button class="turma-pick ${pendingTurma==='B'?'selected':''}" data-turma="B">Turma B</button>
        </div>

        <div class="field-hint" id="startHint"></div>
        <button id="startBtn" class="btn-primary btn-big" disabled>${editing ? 'Salvar ✅' : 'Começar aventura 🚀'}</button>
        ${editing
          ? `<button class="btn-secondary" id="cancelEdit">Cancelar</button>`
          : `<button class="link-btn" id="restoreLink">🔑 Já jogou em outro celular? Recuperar com código</button>`}
      </div>
    </div>`);
  root.appendChild(card);

  card.querySelectorAll('.avatar-pick').forEach(b => b.addEventListener('click', ()=>{
    SFX.unlock(); SFX.click();
    pendingAvatar = b.dataset.avatar;
    card.querySelectorAll('.avatar-pick').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected');
    document.getElementById('avatarPreview').querySelector('span').textContent = AVATARS.find(a=>a.id===pendingAvatar).emoji;
  }));
  card.querySelectorAll('.color-pick').forEach(b => b.addEventListener('click', ()=>{
    SFX.unlock(); SFX.click();
    pendingColor = b.dataset.color;
    card.querySelectorAll('.color-pick').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected');
    document.getElementById('avatarPreview').style.background = pendingColor;
  }));
  card.querySelectorAll('.turma-pick').forEach(b => b.addEventListener('click', ()=>{
    SFX.unlock(); SFX.click();
    pendingTurma = b.dataset.turma;
    card.querySelectorAll('.turma-pick').forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected');
    updateStart();
  }));
  // O botão só libera com nome e turma: antes dava para entrar sem nome e virar "Explorador(a)".
  function updateStart(){
    const hasName = card.querySelector('#nameInput').value.trim().length > 0;
    card.querySelector('#startBtn').disabled = !(hasName && pendingTurma);
    card.querySelector('#startHint').textContent = !hasName ? 'Digite seu nome para continuar' : (!pendingTurma ? 'Escolha sua turma para continuar' : '');
  }
  card.querySelector('#nameInput').addEventListener('input', updateStart);
  updateStart();
  card.querySelector('#startBtn').addEventListener('click', ()=>{
    if (card.querySelector('#startBtn').disabled) return;
    SFX.unlock();
    STATE.playerName = normalizeName(card.querySelector('#nameInput').value).slice(0, 18);
    STATE.lastName = normalizeName(card.querySelector('#lastNameInput').value, true).slice(0, 24);
    STATE.avatar = pendingAvatar; STATE.avatarColor = pendingColor;
    STATE.turma = pendingTurma;
    if(!STATE.createdAt) STATE.createdAt = Date.now();
    saveGame();
    syncScoreToCloud();
    SFX.whoosh();
    showToast(editing ? 'Perfil salvo!' : pick(MASCOT_LINES.welcome));
    goTo('map');
  });
  card.querySelector('#cancelEdit')?.addEventListener('click', ()=>{ SFX.click(); goTo('map'); });
  card.querySelector('#restoreLink')?.addEventListener('click', ()=>{ SFX.click(); openRestore(); });
}

// ---------------------------- PAINEL DOS PAIS/PROFESSORA (#painel) ----------------------------
// Não aparece para as crianças: abre só pelo link .../#painel. Mostra, a partir da 1ª tentativa
// de cada aluno, quais questões a turma mais erra e quantos estudaram os cartões de cada fase.
function renderPanel(){
  root.innerHTML = '';
  const wrap = el(`
    <div class="screen panel-screen">
      <h1 class="panel-title">📊 Painel da turma</h1>
      <p class="panel-sub">Questões que a turma mais erra na primeira tentativa. Use para saber o que revisar antes da prova.</p>
      <div class="ranking-tabs" id="panelTabs">
        <button class="ranking-tab selected" data-filter="all">Geral</button>
        <button class="ranking-tab" data-filter="A">Turma A</button>
        <button class="ranking-tab" data-filter="B">Turma B</button>
      </div>
      <div id="panelBody"><div class="ranking-loading">⏳ Carregando dados...</div></div>
      <button class="link-btn" id="panelExit">Ir para o jogo</button>
    </div>`);
  root.appendChild(wrap);
  wrap.querySelector('#panelExit').addEventListener('click', ()=>{ history.replaceState(null, '', location.pathname); boot(); });
  const qIndex = {};
  SUBJECTS.forEach(s => s.phases.forEach(p => p.questions.forEach(q => { qIndex[q.id] = { q, phase: p, subject: s }; })));
  let rows = [], filter = 'all';
  function paint(){
    const body = document.getElementById('panelBody'); if (!body) return;
    const players = rows.filter(r => !r.hidden && !r.mergedInto && (filter === 'all' || r.turma === filter));
    const withData = players.filter(r => r.progress && r.progress.firstTry && Object.keys(r.progress.firstTry).length);
    const stat = {};
    withData.forEach(r => Object.entries(r.progress.firstTry).forEach(([id, ok]) => {
      if (!qIndex[id]) return;
      stat[id] = stat[id] || { n: 0, wrong: 0 }; stat[id].n++; if (!ok) stat[id].wrong++;
    }));
    const MIN = 3;
    const list = Object.entries(stat).filter(([, v]) => v.n >= MIN).map(([id, v]) => ({ id, ...v, rate: v.wrong / v.n })).sort((a, b) => b.rate - a.rate || b.n - a.n).slice(0, 15);
    const studiedBy = {};
    players.forEach(r => Object.keys((r.progress && r.progress.studied) || {}).forEach(ph => { studiedBy[ph] = (studiedBy[ph] || 0) + 1; }));
    const plain = (h) => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent; };
    body.innerHTML = `
      <div class="panel-kpis">
        <div class="kpi"><b>${players.filter(r => (r.xp || 0) > 0).length}</b><span>alunos jogando</span></div>
        <div class="kpi"><b>${withData.length}</b><span>com respostas registradas</span></div>
      </div>
      <h2 class="panel-h2">Questões mais erradas</h2>
      ${list.length ? list.map(x => {
        const info = qIndex[x.id];
        return `<div class="panel-row">
          <div class="panel-rate ${x.rate >= .5 ? 'hot' : ''}">${Math.round(x.rate * 100)}%</div>
          <div class="panel-q"><div class="panel-meta">${info.subject.icon} ${esc(info.subject.subtitle)} · ${esc(info.phase.name)}</div>
            <div class="panel-prompt">${esc(plain(info.q.prompt))}</div>
            <div class="panel-meta">${x.wrong} de ${x.n} erraram na 1ª tentativa</div></div>
        </div>`;
      }).join('') : `<div class="ranking-empty">Ainda há poucos dados. As respostas começam a aparecer aqui conforme os alunos jogam (cada questão precisa de pelo menos ${MIN} alunos).</div>`}
      <h2 class="panel-h2">Quem estudou os cartões de cada fase</h2>
      <div class="panel-study">${SUBJECTS.map(s => s.phases.map(p => `<div class="panel-study-row"><span>${s.icon} ${esc(p.name)}</span><b>${studiedBy[p.id] || 0}</b></div>`).join('')).join('')}</div>`;
  }
  wrap.querySelectorAll('.ranking-tab').forEach(b => b.addEventListener('click', ()=>{
    filter = b.dataset.filter;
    wrap.querySelectorAll('.ranking-tab').forEach(x => x.classList.toggle('selected', x === b));
    paint();
  }));
  loadRanking(r => { rows = r || []; paint(); }, () => {
    const body = document.getElementById('panelBody');
    if (body) body.innerHTML = `<div class="ranking-empty">😕 Sem conexão com a nuvem agora. Tente de novo mais tarde.</div>`;
  });
}

// ---------------------------- RECUPERAR PROGRESSO COM CÓDIGO ----------------------------
function openRestore(){
  const modal = el(`
    <div class="modal-backdrop">
      <div class="modal">
        <h2>🔑 Recuperar progresso</h2>
        <p class="modal-text">Digite o código de 6 letras que aparece em ⚙️ Configurações no celular onde você já jogava.</p>
        <input id="codeInput" class="name-input code-input" maxlength="8" autocomplete="off" autocapitalize="characters" placeholder="Ex: K7P2QX" />
        <div class="field-hint" id="codeMsg"></div>
        <div id="codeFound"></div>
        <button class="btn-primary" id="codeSearch" disabled>Procurar</button>
        <button class="btn-secondary" id="codeClose">Cancelar</button>
      </div>
    </div>`);
  document.body.appendChild(modal);
  const input = modal.querySelector('#codeInput'), msg = modal.querySelector('#codeMsg'), btn = modal.querySelector('#codeSearch');
  input.addEventListener('input', ()=>{ btn.disabled = normalizeCode(input.value).length !== 6; msg.textContent=''; });
  modal.querySelector('#codeClose').addEventListener('click', ()=> modal.remove());
  btn.addEventListener('click', ()=>{
    const code = normalizeCode(input.value);
    if (code === STATE.recoveryCode){ msg.textContent = 'Esse já é o código deste celular 🙂'; return; }
    btn.disabled = true; msg.textContent = '⏳ Procurando...';
    findPlayerByCode(code).then(found=>{
      if (!found){ msg.textContent = 'Não achei esse código. Confira as letras e tente de novo.'; btn.disabled = false; return; }
      const d = found.data;
      msg.textContent = '';
      modal.querySelector('#codeFound').innerHTML = `
        <div class="restore-preview">
          <div class="rank-avatar" style="background:${esc(d.color||'#FF6B6B')}">${esc(d.avatar||'🦸')}</div>
          <div><b>${esc(normalizeName(d.name||'') + ' ' + normalizeName(d.lastName||'', true))}</b><br/>⭐ ${d.stars||0} estrelas · ✨ ${d.xp||0} XP</div>
        </div>
        <p class="modal-text">É você? O progresso deste celular também fica guardado: juntamos os dois e fica o melhor de cada fase.</p>`;
      btn.textContent = 'Sim, sou eu! Recuperar';
      btn.disabled = false;
      btn.onclick = (ev)=>{ ev.stopImmediatePropagation(); applyRestore(found); modal.remove(); };
    }).catch(()=>{ msg.textContent = 'Sem internet agora. Tente de novo quando estiver conectado.'; btn.disabled = false; });
  });
}
function applyRestore(found){
  const d = found.data, cp = d.progress || {};
  const oldId = STATE.playerId;
  const merged = mergeProgress(STATE, { xp: d.xp, coins: cp.coins, streak: cp.streak, badges: cp.badges, phaseResults: cp.phaseResults, studied: cp.studied, firstTry: cp.firstTry });
  Object.assign(STATE, merged);
  STATE.playerId = found.id;
  STATE.recoveryCode = d.code;
  STATE.playerName = d.name || STATE.playerName;
  STATE.lastName = d.lastName || STATE.lastName;
  if (d.turma === 'A' || d.turma === 'B') STATE.turma = d.turma;
  if (cp.avatarId && AVATARS.some(a=>a.id===cp.avatarId)) STATE.avatar = cp.avatarId;
  if (d.color) STATE.avatarColor = d.color;
  if (!STATE.createdAt) STATE.createdAt = cp.createdAt || Date.now();
  STATE.pendingReset = false;
  saveGame();
  markMergedInto(oldId, found.id);
  syncScoreToCloud();
  SFX.victory();
  showToast('Progresso recuperado! 🎉');
  pendingAvatar = STATE.avatar; pendingColor = STATE.avatarColor; pendingTurma = STATE.turma;
  goTo('map');
}
// Chamado quando a sincronização trouxe progresso de outro aparelho com o mesmo código.
function onCloudMerged(){
  if (['map','island'].includes(NAV.screen)) render();
}

// ---------------------------- TOP BAR ----------------------------
function topBarHtml(){
  const lvl = levelForXp(STATE.xp);
  const into = xpIntoLevel(STATE.xp);
  const avatarEmoji = AVATARS.find(a=>a.id===STATE.avatar)?.emoji || '🦸';
  return `
  <div class="topbar">
    <div class="tb-avatar" style="background:${STATE.avatarColor}">${avatarEmoji}</div>
    <div class="tb-info">
      <div class="tb-name">${esc(STATE.playerName)} <span class="tb-level">Nv. ${lvl}</span></div>
      <div class="xp-bar"><div class="xp-fill" style="width:${into}%"></div></div>
    </div>
    <div class="tb-stat" title="Moedas">🪙 <b>${STATE.coins}</b></div>
    <div class="tb-stat" title="Sequência de dias">🔥 <b>${STATE.streak}</b></div>
    <button class="tb-settings" id="settingsBtn" aria-label="Configurações">⚙️</button>
  </div>`;
}

function wireTopBar(container){
  container.querySelector('#settingsBtn')?.addEventListener('click', openSettings);
}

function openSettings(){
  SFX.click();
  const modal = el(`
    <div class="modal-backdrop">
      <div class="modal">
        <h2>Configurações</h2>
        <label class="settings-row"><span>Som 🔊</span>
          <input type="checkbox" id="soundToggle" ${STATE.soundOn?'checked':''}/>
        </label>
        <div class="code-box">
          <div class="code-label">🔑 Seu código de recuperação</div>
          <div class="code-value">${esc(ensureRecoveryCode())}</div>
          <div class="code-help">Anote ou tire um print. Se trocar de celular ou o app apagar, use esse código para recuperar seu progresso.</div>
        </div>
        <button class="btn-secondary" id="editAvatarBtn">Editar perfil</button>
        <button class="btn-secondary" id="restoreBtn">Recuperar progresso com código</button>
        <button class="btn-danger" id="resetBtn">Reiniciar progresso</button>
        <button class="btn-primary" id="closeModal">Fechar</button>
      </div>
    </div>`);
  document.body.appendChild(modal);
  modal.querySelector('#soundToggle').addEventListener('change', (e)=>{
    STATE.soundOn = e.target.checked; SFX.enabled = STATE.soundOn; saveGame();
  });
  modal.querySelector('#editAvatarBtn').addEventListener('click', ()=>{
    modal.remove();
    pendingAvatar = STATE.avatar; pendingColor = STATE.avatarColor;
    pendingTurma = (STATE.turma === 'A' || STATE.turma === 'B') ? STATE.turma : null;
    goTo('onboarding', { edit: true });
  });
  modal.querySelector('#restoreBtn').addEventListener('click', ()=>{ modal.remove(); openRestore(); });
  modal.querySelector('#resetBtn').addEventListener('click', ()=>{
    if(confirm('Tem certeza? Isso vai apagar todo o progresso do jogo.')){
      resetGame(); modal.remove(); pendingTurma = null; goTo('onboarding');
    }
  });
  modal.querySelector('#closeModal').addEventListener('click', ()=> modal.remove());
  modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.remove(); });
}

// ---------------------------- MAPA (ILHAS) ----------------------------
function renderMap(){
  root.innerHTML = '';
  const wrap = el(`<div class="screen map-screen"></div>`);
  wrap.insertAdjacentHTML('beforeend', topBarHtml());

  const mascotMsg = el(`<div class="mascot-banner"><span class="mascot-emoji">${MASCOT}</span><span class="speech">${esc(pick(MASCOT_LINES.welcome))}</span></div>`);
  wrap.appendChild(mascotMsg);

  const nMistakes = mistakeQuestions().length;
  if (nMistakes > 0){
    const reviewCta = el(`<button class="review-cta" id="reviewCta">🔁 Revisar meus erros <span class="btn-badge">${nMistakes}</span></button>`);
    wrap.appendChild(reviewCta);
    reviewCta.addEventListener('click', ()=>{ SFX.click(); startReview(); });
  }
  const rankingCta = el(`<button class="ranking-cta" id="rankingCta">🏆 Ver Ranking da Turma</button>`);
  wrap.appendChild(rankingCta);

  const grid = el(`<div class="island-grid"></div>`);
  SUBJECTS.forEach(subject => {
    const totalStars = subject.phases.length * 3;
    const earned = subjectStars(subject);
    const complete = isSubjectComplete(subject);
    const card = el(`
      <button class="island-card" data-subject="${subject.id}" style="--c:${subject.color}; --cd:${subject.colorDark}">
        ${complete ? '<div class="island-badge">🏆</div>' : ''}
        <div class="island-icon">${subject.icon}</div>
        <div class="island-name">${esc(subject.name)}</div>
        <div class="island-subtitle">${esc(subject.subtitle)}</div>
        <div class="island-stars">⭐ ${earned}/${totalStars}</div>
        <div class="island-progress-bar"><div class="island-progress-fill" style="width:${Math.round(earned/totalStars*100)}%"></div></div>
      </button>`);
    grid.appendChild(card);
  });
  wrap.appendChild(grid);

  if (allSubjectsComplete()){
    wrap.appendChild(el(`<div class="trophy-banner">🏆 Você é o <b>Mestre do 3º Trimestre</b>! Todas as ilhas concluídas! 🏆</div>`));
  }

  const badgesSection = renderBadgesSection();
  wrap.appendChild(badgesSection);

  root.appendChild(wrap);
  wireTopBar(wrap);
  wrap.querySelectorAll('.island-card').forEach(c => c.addEventListener('click', ()=>{
    SFX.click();
    goTo('island', { subjectId: c.dataset.subject });
  }));
  wrap.querySelector('#rankingCta').addEventListener('click', ()=>{
    SFX.click();
    goTo('ranking');
  });
}

// ---------------------------- RANKING (compartilhado via Firebase) ----------------------------
function renderRanking(){
  root.innerHTML = '';
  const wrap = el(`<div class="screen ranking-screen"></div>`);
  wrap.insertAdjacentHTML('beforeend', topBarHtml());

  wrap.appendChild(el(`
    <div class="island-header">
      <button class="back-btn" id="backToMap">⬅ Mapa</button>
      <div class="island-header-title">🏆 Ranking da Turma</div>
    </div>`));

  wrap.appendChild(el(`<div class="mascot-banner"><span class="mascot-emoji">${MASCOT}</span><span class="speech">Veja como você está em relação aos seus colegas! O ranking é o mesmo pra todo mundo, em qualquer celular.</span></div>`));

  const tabsWrap = el(`
    <div class="ranking-tabs" id="rankingTabs">
      <button class="ranking-tab selected" data-filter="all">Geral</button>
      <button class="ranking-tab" data-filter="A">Turma A</button>
      <button class="ranking-tab" data-filter="B">Turma B</button>
    </div>`);
  wrap.appendChild(tabsWrap);

  const listWrap = el(`<div class="ranking-list" id="rankingList"><div class="ranking-loading">⏳ Carregando ranking...</div></div>`);
  wrap.appendChild(listWrap);

  root.appendChild(wrap);
  wireTopBar(wrap);
  wrap.querySelector('#backToMap').addEventListener('click', ()=>{
    SFX.click();
    if (_rankingUnsub){ _rankingUnsub(); _rankingUnsub = null; }
    goTo('map');
  });

  let allRows = [];
  let currentFilter = 'all';

  function paintRanking(){
    const list = document.getElementById('rankingList');
    if (!list) return; // tela já trocou
    // Some do ranking: registros que foram juntados com outro (recuperação por código) e
    // cadastros que nunca jogaram nenhuma fase. O seu sempre aparece.
    let rows = allRows.filter(r => r.id === STATE.playerId || (!r.hidden && !r.mergedInto && ((r.xp||0) > 0 || (r.stars||0) > 0)));
    if (currentFilter === 'A') rows = allRows.filter(r => r.turma === 'A');
    else if (currentFilter === 'B') rows = allRows.filter(r => r.turma === 'B');
    if (!rows.length){
      list.innerHTML = currentFilter === 'all'
        ? `<div class="ranking-empty">🌱 Ainda não há ninguém no ranking. Jogue uma fase para ser o primeiro a aparecer aqui!</div>`
        : `<div class="ranking-empty">🌱 Ainda não há ninguém da Turma ${currentFilter} no ranking.</div>`;
      return;
    }
    list.innerHTML = rows.map((r, i)=>{
      const mine = r.id === STATE.playerId;
      const pos = i===0?'🥇':i===1?'🥈':i===2?'🥉':(i+1)+'º';
      const first = normalizeName(r.name || 'Explorador(a)');
      const fullName = esc(r.lastName ? (first + ' ' + normalizeName(r.lastName, true)) : first);
      const turmaBadge = (r.turma === 'A' || r.turma === 'B')
        ? `<span class="turma-badge">Turma ${r.turma}</span>`
        : (currentFilter === 'all' ? `<span class="turma-badge turma-unknown">turma não informada</span>` : '');
      return `<div class="ranking-row ${mine?'mine':''}">
        <div class="rank-pos">${pos}</div>
        <div class="rank-avatar" style="background:${esc(r.color||'#FF6B6B')}">${esc(r.avatar||'🦸')}</div>
        <div class="rank-info">
          <div class="rank-name">${fullName}${mine?' <span class="you-tag">você</span>':''}</div>
          <div class="rank-meta">
            <span class="rank-stats">⭐ ${r.stars||0} estrelas · ✨ ${r.xp||0} XP</span>
            ${turmaBadge}
          </div>
        </div>
      </div>`;
    }).join('');
  }

  tabsWrap.querySelectorAll('.ranking-tab').forEach(btn => btn.addEventListener('click', ()=>{
    SFX.click();
    currentFilter = btn.dataset.filter;
    tabsWrap.querySelectorAll('.ranking-tab').forEach(x=>x.classList.remove('selected'));
    btn.classList.add('selected');
    paintRanking();
  }));

  ensurePlayerId();
  if (_rankingUnsub){ _rankingUnsub(); _rankingUnsub = null; }
  _rankingUnsub = loadRanking((rows)=>{
    allRows = rows || [];
    paintRanking();
  }, (err)=>{
    const list = document.getElementById('rankingList');
    if (!list) return;
    list.innerHTML = `<div class="ranking-empty">😕 Não foi possível carregar o ranking agora.<br/>Verifique sua internet e tente novamente mais tarde.</div>`;
  });
}

function renderBadgesSection(){
  const defs = Object.assign({}, BADGE_DEFS);
  SUBJECTS.forEach(s => { defs[subjectBadgeId(s.id)] = { icon:s.icon, name:'Ilha completa: '+s.subtitle, desc:'Completou todas as fases de '+s.subtitle }; });
  const items = Object.keys(defs).map(id => {
    const owned = STATE.badges.includes(id) || (id.startsWith('island_') && isSubjectComplete(findSubject(id.replace('island_',''))));
    const d = defs[id];
    return `<div class="badge-chip ${owned?'owned':'locked'}" title="${esc(d.desc)}">
      <span class="badge-icon">${owned?d.icon:'🔒'}</span><span class="badge-name">${esc(d.name)}</span></div>`;
  }).join('');
  return el(`<div class="badges-section"><div class="section-label">Suas conquistas</div><div class="badge-row">${items}</div></div>`);
}

// ---------------------------- ILHA (TRILHA DE FASES) ----------------------------
function renderIsland(){
  const subject = findSubject(NAV.subjectId);
  root.innerHTML = '';
  const wrap = el(`<div class="screen island-screen" style="--c:${subject.color}; --cd:${subject.colorDark}"></div>`);
  wrap.insertAdjacentHTML('beforeend', topBarHtml());

  wrap.appendChild(el(`
    <div class="island-header">
      <button class="back-btn" id="backToMap">⬅ Mapa</button>
      <div class="island-header-title">${subject.icon} ${esc(subject.name)}</div>
      ${subject.phases.some(p => LESSONS[p.id]) ? `<button class="study-btn" id="studyBtn">📚 Estudar</button>` : ''}
    </div>`));

  wrap.appendChild(el(`<div class="mascot-banner"><span class="mascot-emoji">${MASCOT}</span><span class="speech">${esc(pick(MASCOT_LINES.islandIntro))}</span></div>`));

  const trail = el(`<div class="trail"></div>`);
  subject.phases.forEach((phase, idx) => {
    const unlocked = isPhaseUnlocked(subject, idx);
    const result = STATE.phaseResults[phase.id];
    const stars = result ? result.stars : 0;
    const node = el(`
      <div class="trail-node-wrap ${idx%2===0?'left':'right'}">
        <button class="trail-node ${unlocked?'unlocked':'locked'} ${stars===3?'maxed':''}" data-phase="${phase.id}" ${unlocked?'':'disabled'}>
          <span class="trail-node-num">${unlocked ? (idx+1) : '🔒'}</span>
        </button>
        <div class="trail-node-label">${esc(phase.name)}</div>
        <div class="trail-node-stars">${renderStarsInline(stars)}</div>
      </div>`);
    trail.appendChild(node);
  });
  wrap.appendChild(trail);

  root.appendChild(wrap);
  wireTopBar(wrap);
  wrap.querySelector('#backToMap').addEventListener('click', ()=>{ SFX.click(); goTo('map'); });
  wrap.querySelector('#studyBtn')?.addEventListener('click', ()=>{ SFX.click(); openStudyList(subject); });
  wrap.querySelectorAll('.trail-node.unlocked').forEach(b => b.addEventListener('click', ()=>{
    SFX.click();
    goTo('phaseIntro', { subjectId: subject.id, phaseId: b.dataset.phase });
  }));
}

function renderStarsInline(stars){
  let s = '';
  for(let i=0;i<3;i++) s += `<span class="star ${i<stars?'filled':''}">★</span>`;
  return s;
}

// ---------------------------- INTRO DA FASE ----------------------------
function renderPhaseIntro(){
  const subject = findSubject(NAV.subjectId);
  const phase = findPhase(subject, NAV.phaseId);
  const result = STATE.phaseResults[phase.id];
  const lesson = (typeof LESSONS !== 'undefined') ? LESSONS[phase.id] : null;
  const studied = !!(STATE.studied && STATE.studied[phase.id]);
  root.innerHTML = '';
  const wrap = el(`
    <div class="screen phase-intro-screen" style="--c:${subject.color}; --cd:${subject.colorDark}">
      <div class="phase-intro-card">
        <div class="phase-intro-icon">${subject.icon}</div>
        <div class="phase-intro-cap">${esc(phase.cap)}</div>
        <h2 class="phase-intro-title">${esc(phase.name)}</h2>
        <div class="phase-intro-stars">${renderStarsInline(result?result.stars:0)}</div>
        <div class="mascot-banner small"><span class="mascot-emoji">${MASCOT}</span><span class="speech">${esc(pick(MASCOT_LINES.phaseIntro))}</span></div>
        <p class="phase-intro-sub">${phase.questions.length} perguntas • responda com calma!</p>
        ${lesson && !studied
          ? `<button class="btn-primary btn-big" id="learnBtn">📚 Aprender primeiro <span class="btn-badge">+10 XP</span></button>
             <button class="btn-secondary" id="playBtn">Já sei, quero jogar ▶️</button>`
          : `<button class="btn-primary btn-big" id="playBtn">${result?'Jogar de novo':'Jogar'} ▶️</button>
             ${lesson ? `<button class="btn-secondary" id="learnBtn">📚 Rever a lição</button>` : ''}`}
        <button class="back-btn" id="backToIsland">⬅ Voltar para a ilha</button>
      </div>
    </div>`);
  root.appendChild(wrap);
  wrap.querySelector('#backToIsland').addEventListener('click', ()=>{ SFX.click(); goTo('island', { subjectId: subject.id }); });
  wrap.querySelector('#learnBtn')?.addEventListener('click', ()=>{ SFX.click(); goTo('lesson', { subjectId: subject.id, phaseId: phase.id }); });
  wrap.querySelector('#playBtn').addEventListener('click', ()=>{ SFX.whoosh(); startPhase(subject, phase); });
}

// ---------------------------- REVISAR MEUS ERROS ----------------------------
const REVIEW_SUBJECT = { id:'review', name:'Revisão', icon:'🔁', color:'#5AC8FA', colorDark:'#2C9AD1' };
function mistakeQuestions(){
  const ids = Object.keys(STATE.mistakes || {});
  const out = [];
  SUBJECTS.forEach(s => s.phases.forEach(p => p.questions.forEach(q => {
    if (ids.includes(q.id) && q.type !== 'reflection') out.push(Object.assign({}, q, { __phaseId: p.id }));
  })));
  return out;
}
function startReview(){
  const qs = shuffled(mistakeQuestions()).slice(0, 8);
  if (!qs.length) return;
  const phase = { id:'review', name:'Revisar meus erros', cap:'Revisão', questions: qs };
  QUIZ = { subject: REVIEW_SUBJECT, phase, questions: qs, index:0, correctCount:0, total: qs.length, scorable: qs.length, review: true };
  goTo('quiz', { review: true });
}

function startPhase(subject, phase){
  const result = STATE.phaseResults[phase.id];
  const scorable = phase.questions.filter(q => q.type !== 'reflection').length;
  const questions = result
    ? shuffled(phase.questions.filter(q => q.type !== 'reflection')).concat(phase.questions.filter(q => q.type === 'reflection'))
    : phase.questions.slice();
  QUIZ = { subject, phase, questions, index:0, correctCount:0, total: phase.questions.length, scorable, selected:null };
  goTo('quiz', { subjectId: subject.id, phaseId: phase.id });
}

// ---------------------------- APRENDER (cartões antes da fase) ----------------------------
// Cartões curtos que a criança passa com o dedo (ou botões), com "Ouvir" em voz alta e uma
// pergunta-relâmpago no fim que não vale ponto. Na 1ª vez que termina a lição: +10 XP (só 1 vez).
const TTS = {
  ok: typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined',
  speak(text, lang){
    if (!this.ok) return false;
    try{
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'en' ? 'en-US' : 'pt-BR';
      const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith(lang === 'en' ? 'en' : 'pt'));
      if (v) u.voice = v;
      u.rate = 0.95;
      speechSynthesis.speak(u);
      return true;
    }catch(e){ return false; }
  },
  stop(){ try{ if (this.ok) speechSynthesis.cancel(); }catch(e){} },
};
function plainText(html){ const d = document.createElement('div'); d.innerHTML = html; return d.textContent.replace(/\s+/g,' ').trim(); }

// Monta o leitor de cartões dentro de `host`. opts.onFinish(firstTime) é chamado ao concluir.
function mountLesson(host, phaseId, opts){
  opts = opts || {};
  const lesson = LESSONS[phaseId];
  const cards = lesson.cards;
  const total = cards.length + (opts.skipCheck ? 0 : 1);
  let i = 0, answered = false;
  host.innerHTML = `
    <div class="lesson">
      <div class="lesson-dots">${Array.from({length: total}, (_, k)=>`<span class="dot" data-k="${k}"></span>`).join('')}</div>
      <div class="lesson-stage" id="lessonStage"></div>
      <div class="lesson-nav">
        <button class="btn-secondary lesson-prev" id="lessonPrev">⬅ Voltar</button>
        <button class="btn-primary lesson-next" id="lessonNext">Próximo ➡</button>
      </div>
    </div>`;
  const stage = host.querySelector('#lessonStage');
  const prev = host.querySelector('#lessonPrev'), next = host.querySelector('#lessonNext');
  function paint(){
    TTS.stop();
    host.querySelectorAll('.dot').forEach((d, k)=> d.classList.toggle('on', k <= i));
    prev.style.visibility = i === 0 ? 'hidden' : 'visible';
    if (i < cards.length){
      const c = cards[i];
      stage.innerHTML = `
        <div class="lesson-card">
          <div class="lesson-icon">${c.icon}</div>
          <div class="lesson-count">${i+1} de ${cards.length}</div>
          <h3 class="lesson-title">${rich(c.title)}</h3>
          <p class="lesson-text">${rich(c.text)}</p>
          ${c.ex ? `<div class="lesson-ex">${rich(c.ex)}</div>` : ''}
          ${TTS.ok ? `<button class="listen-btn" id="listenBtn">🔊 Ouvir</button>` : ''}
        </div>`;
      stage.querySelector('#listenBtn')?.addEventListener('click', ()=>{
        SFX.click();
        const txt = lesson.lang === 'en' && c.say ? c.say : plainText(c.title + '. ' + c.text + (c.ex ? '. ' + c.ex : ''));
        TTS.speak(txt, lesson.lang === 'en' && c.say ? 'en' : 'pt');
      });
      next.textContent = (i === cards.length - 1) ? (opts.skipCheck ? 'Concluir ✅' : 'Pergunta-relâmpago ⚡') : 'Próximo ➡';
      next.disabled = false;
    } else {
      const q = lesson.check;
      answered = false;
      stage.innerHTML = `
        <div class="lesson-card check">
          <div class="lesson-icon">⚡</div>
          <div class="lesson-count">Pergunta-relâmpago · não vale ponto</div>
          <h3 class="lesson-title">${rich(q.prompt)}</h3>
          <div class="check-opts">${shuffled(q.options.map((o,k)=>k)).map(k=>`<button class="option-btn" data-k="${k}">${rich(q.options[k])}</button>`).join('')}</div>
          <div id="checkFeedback"></div>
        </div>`;
      stage.querySelectorAll('.option-btn').forEach(b => b.addEventListener('click', ()=>{
        if (answered) return;
        answered = true;
        const right = +b.dataset.k === q.correct;
        right ? SFX.correct() : SFX.wrong();
        stage.querySelectorAll('.option-btn').forEach(x => { if (+x.dataset.k === q.correct) x.classList.add('correct'); else if (x === b) x.classList.add('incorrect'); });
        stage.querySelector('#checkFeedback').innerHTML = `<div class="explain-box"><div class="explain-icon">${right?'✅':'💡'}</div><div class="explain-text"><b>${right?'Isso!':'Quase!'}</b>${rich(q.explain)}</div></div>`;
        next.disabled = false;
      }));
      next.textContent = opts.finishLabel || 'Jogar agora ▶️';
      next.disabled = true;
    }
  }
  function finish(){
    TTS.stop();
    if (!STATE.studied) STATE.studied = {};
    const firstTime = !STATE.studied[phaseId];
    if (firstTime){
      STATE.studied[phaseId] = true;
      STATE.xp += 10;
      saveGame();
      syncScoreToCloud();
    }
    opts.onFinish && opts.onFinish(firstTime);
  }
  next.addEventListener('click', ()=>{
    SFX.click();
    if (i < total - 1){ i++; paint(); }
    else finish();
  });
  prev.addEventListener('click', ()=>{ SFX.click(); if (i > 0){ i--; paint(); } });
  // deslizar com o dedo
  let x0 = null;
  stage.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0 && !next.disabled && i < total - 1){ i++; paint(); }
    else if (dx > 0 && i > 0){ i--; paint(); }
  });
  paint();
}

function renderLessonScreen(){
  const subject = findSubject(NAV.subjectId);
  const phase = findPhase(subject, NAV.phaseId);
  root.innerHTML = '';
  const wrap = el(`
    <div class="screen lesson-screen" style="--c:${subject.color}; --cd:${subject.colorDark}">
      <div class="quiz-top">
        <button class="back-btn" id="quitLesson" aria-label="Fechar lição">✕</button>
        <div class="lesson-head">📚 ${esc(phase.name)}</div>
      </div>
      <div id="lessonHost"></div>
    </div>`);
  root.appendChild(wrap);
  wrap.querySelector('#quitLesson').addEventListener('click', ()=>{ TTS.stop(); goTo('phaseIntro', { subjectId: subject.id, phaseId: phase.id }); });
  mountLesson(wrap.querySelector('#lessonHost'), phase.id, {
    onFinish(firstTime){
      if (firstTime) showToast('+10 XP por estudar! 📚');
      startPhase(subject, phase);
    },
  });
}

// Lição em janela por cima do quiz (botão "Rever a lição" na explicação), sem perder a questão.
function openLessonModal(phaseId){
  const modal = el(`<div class="modal-backdrop lesson-modal"><div class="modal modal-lesson"><button class="modal-close" aria-label="Fechar">✕</button><div id="lessonModalHost"></div></div></div>`);
  document.body.appendChild(modal);
  const close = ()=>{ TTS.stop(); modal.remove(); };
  modal.querySelector('.modal-close').addEventListener('click', close);
  modal.addEventListener('click', (e)=>{ if (e.target === modal) close(); });
  mountLesson(modal.querySelector('#lessonModalHost'), phaseId, { skipCheck: true, onFinish: close });
}

// Lista das lições da ilha (botão "Estudar" na ilha)
function openStudyList(subject){
  const items = subject.phases.filter(p => LESSONS[p.id]).map(p => `
    <button class="study-item" data-phase="${p.id}">
      <span>${(STATE.studied && STATE.studied[p.id]) ? '✅' : '📚'}</span><span>${esc(p.name)}</span>
    </button>`).join('');
  const modal = el(`<div class="modal-backdrop"><div class="modal"><h2>📚 Estudar</h2><p class="modal-text">Escolha um assunto para rever os cartões.</p>${items || '<p class="modal-text">Ainda não há lições nesta ilha.</p>'}<button class="btn-primary" id="studyClose">Fechar</button></div></div>`);
  document.body.appendChild(modal);
  modal.querySelector('#studyClose').addEventListener('click', ()=> modal.remove());
  modal.querySelectorAll('.study-item').forEach(b => b.addEventListener('click', ()=>{ modal.remove(); openLessonModal(b.dataset.phase); }));
}

// ---------------------------- QUIZ ----------------------------
function renderQuiz(){
  const { subject, phase } = QUIZ;
  const q = QUIZ.questions[QUIZ.index];
  root.innerHTML = '';
  const progressPct = Math.round((QUIZ.index)/QUIZ.total*100);
  const wrap = el(`
    <div class="screen quiz-screen" style="--c:${subject.color}; --cd:${subject.colorDark}">
      <div class="quiz-top">
        <button class="back-btn" id="quitQuiz">✕</button>
        <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${progressPct}%"></div></div>
        <div class="quiz-counter">${QUIZ.index+1}/${QUIZ.total}</div>
      </div>
      <div class="quiz-card-area" id="quizCardArea"></div>
    </div>`);
  root.appendChild(wrap);
  wrap.querySelector('#quitQuiz').addEventListener('click', ()=>{
    if(confirm('Sair do quiz? Seu progresso nessa fase será perdido.')){
      if (QUIZ.review) goTo('map'); else goTo('phaseIntro', { subjectId: subject.id, phaseId: phase.id });
    }
  });

  const area = wrap.querySelector('#quizCardArea');
  area.appendChild(renderQuestionCard(q));
}

function renderQuestionCard(q){
  if (q.type === 'choice') return renderChoiceCard(q);
  if (q.type === 'items') return renderItemsCard(q);
  if (q.type === 'reflection') return renderReflectionCard(q);
}

function renderChoiceCard(q){
  const card = el(`
    <div class="q-card">
      <div class="q-part">${esc(q.part)}</div>
      <div class="q-prompt">${rich(q.prompt)}</div>
      ${q.multi ? '<div class="q-multi-badge">🔢 ESCOLHA VÁRIAS</div>' : ''}
      <div class="q-options" id="qOptions"></div>
      <button class="btn-primary btn-big q-submit" id="qSubmit" disabled>Confirmar</button>
    </div>`);
  const optsWrap = card.querySelector('#qOptions');
  const minNeeded = q.multi ? 2 : 1;
  let selected = new Set();
  shuffled(q.options.map((opt, i) => i)).forEach(i => {
    const opt = q.options[i];
    const b = el(`<button class="option-btn" data-i="${i}">${rich(opt)}</button>`);
    b.addEventListener('click', ()=>{
      if (card.classList.contains('answered')) return;
      SFX.click();
      if (q.multi){
        if (selected.has(i)){ selected.delete(i); b.classList.remove('selected'); }
        else { selected.add(i); b.classList.add('selected'); }
      } else {
        optsWrap.querySelectorAll('.option-btn').forEach(x=>x.classList.remove('selected'));
        selected = new Set([i]);
        b.classList.add('selected');
      }
      card.querySelector('#qSubmit').disabled = selected.size<minNeeded;
    });
    optsWrap.appendChild(b);
  });
  card.querySelector('#qSubmit').addEventListener('click', ()=>{
    if (card.classList.contains('answered')) return;
    card.classList.add('answered');
    const correctSet = new Set(q.correct);
    const isCorrect = selected.size===correctSet.size && [...selected].every(i=>correctSet.has(i));
    optsWrap.querySelectorAll('.option-btn').forEach((b)=>{
      const i = +b.dataset.i;
      if (correctSet.has(i)) b.classList.add('correct');
      else if (selected.has(i)) b.classList.add('incorrect');
    });
    finishAnswer(isCorrect, card, false, q);
  });
  return card;
}

function renderItemsCard(q){
  const card = el(`
    <div class="q-card">
      <div class="q-part">${esc(q.part)}</div>
      <div class="q-prompt">${rich(q.prompt)}</div>
      <div class="q-items" id="qItems"></div>
      <button class="btn-primary btn-big q-submit" id="qSubmit" disabled>Confirmar</button>
    </div>`);
  const itemsWrap = card.querySelector('#qItems');
  const answers = new Array(q.items.length).fill(null);
  q.items.forEach((item, idx) => {
    const row = el(`
      <div class="q-item-row">
        <div class="q-item-label">${rich(item.label)}</div>
        <div class="q-item-opts">
          ${shuffled(item.options.map((o,oi)=>oi)).map(oi=>`<button class="mini-opt" data-item="${idx}" data-opt="${oi}">${rich(item.options[oi])}</button>`).join('')}
        </div>
      </div>`);
    itemsWrap.appendChild(row);
  });
  itemsWrap.querySelectorAll('.mini-opt').forEach(b => b.addEventListener('click', ()=>{
    if (card.classList.contains('answered')) return;
    SFX.click();
    const itemIdx = +b.dataset.item;
    answers[itemIdx] = +b.dataset.opt;
    itemsWrap.querySelectorAll(`.mini-opt[data-item="${itemIdx}"]`).forEach(x=>x.classList.remove('selected'));
    b.classList.add('selected');
    card.querySelector('#qSubmit').disabled = answers.some(a=>a===null);
  }));
  card.querySelector('#qSubmit').addEventListener('click', ()=>{
    if (card.classList.contains('answered')) return;
    card.classList.add('answered');
    let allCorrect = true;
    q.items.forEach((item, idx) => {
      const correct = item.correct === answers[idx];
      if (!correct) allCorrect = false;
      itemsWrap.querySelectorAll(`.mini-opt[data-item="${idx}"]`).forEach((b)=>{
        const oi = +b.dataset.opt;
        if (oi === item.correct) b.classList.add('correct');
        else if (oi === answers[idx]) b.classList.add('incorrect');
      });
    });
    finishAnswer(allCorrect, card, false, q);
  });
  return card;
}

function renderReflectionCard(q){
  const card = el(`
    <div class="q-card">
      <div class="q-part">${esc(q.part)}</div>
      <div class="q-prompt">${rich(q.prompt)}</div>
      <div class="q-hint">Pergunta aberta — não vale ponto, é só para você refletir!</div>
      <textarea id="qText" class="q-textarea" rows="4" placeholder="Escreva aqui o que você pensa..."></textarea>
      <button class="btn-primary btn-big q-submit" id="qSubmit">Enviar</button>
    </div>`);
  card.querySelector('#qSubmit').addEventListener('click', ()=>{
    if (card.classList.contains('answered')) return;
    card.classList.add('answered');
    finishAnswer(true, card, true);
  });
  return card;
}

// Guarda o que a criança errou (para "Revisar meus erros") e o resultado da 1ª tentativa de cada
// questão (para o painel de questões mais erradas). Nada disso altera estrelas ou XP.
function recordAnswer(q, isCorrect){
  if (!STATE.mistakes) STATE.mistakes = {};
  if (!STATE.firstTry) STATE.firstTry = {};
  if (STATE.firstTry[q.id] === undefined) STATE.firstTry[q.id] = isCorrect ? 1 : 0;
  if (isCorrect) delete STATE.mistakes[q.id];
  else STATE.mistakes[q.id] = 1;
  saveGame();
}

function finishAnswer(isCorrect, card, isReflection, q){
  if (!isReflection){
    if (isCorrect){ SFX.correct(); QUIZ.correctCount++; }
    else { SFX.wrong(); }
    card.classList.add(isCorrect ? 'flash-correct' : 'flash-incorrect');
    const banner = el(`<div class="feedback-banner ${isCorrect?'good':'bad'}">${isCorrect ? '✅ '+esc(pick(MASCOT_LINES.correct)) : '❌ '+esc(pick(MASCOT_LINES.wrong))}</div>`);
    card.appendChild(banner);
    if (q && q.explain){
      const lessonId = q.__phaseId || (QUIZ.phase && QUIZ.phase.id);
      const canReview = typeof LESSONS !== 'undefined' && LESSONS[lessonId];
      const explainBox = el(`<div class="explain-box"><div class="explain-icon">💡</div><div class="explain-text"><b>Por quê?</b>${rich(q.explain)}${canReview ? `<button class="review-lesson-link">📚 Rever a lição</button>` : ''}</div></div>`);
      explainBox.querySelector('.review-lesson-link')?.addEventListener('click', ()=>{ SFX.click(); openLessonModal(lessonId); });
      card.appendChild(explainBox);
    }
    if (q) recordAnswer(q, isCorrect);
  } else {
    const banner = el(`<div class="feedback-banner good">💬 Obrigado por compartilhar!</div>`);
    card.appendChild(banner);
  }
  const nextBtn = el(`<button class="btn-primary btn-big next-btn">${QUIZ.index+1 < QUIZ.total ? 'Próxima' : 'Ver resultado'} ➡</button>`);
  card.appendChild(nextBtn);
  card.querySelector('.q-submit')?.remove();
  nextBtn.addEventListener('click', ()=>{
    SFX.click();
    QUIZ.index++;
    if (QUIZ.index >= QUIZ.total){ finishQuiz(); }
    else { render(); }
  });
  nextBtn.scrollIntoView({behavior:'smooth', block:'end'});
}

function finishQuiz(){
  if (QUIZ.review){
    // Revisão: +5 XP e +5 moedas por questão corrigida. Não mexe em estrelas nem fases.
    const { correctCount, total } = QUIZ;
    const xpGained = correctCount*5, coinsGained = correctCount*5;
    STATE.xp += xpGained; STATE.coins += coinsGained;
    saveGame(); syncScoreToCloud();
    QUIZ.resultData = { stars: starsFor(correctCount, total), correctCount, total, xpGained, coinsGained, review: true, left: mistakeQuestions().length };
    goTo('result', { review: true });
    return;
  }
  const { subject, phase, correctCount, total, scorable } = QUIZ;
  const stars = starsFor(correctCount, scorable || total);
  const prev = STATE.phaseResults[phase.id];
  const prevStars = prev ? prev.stars : 0;
  const isFirstTime = !prev;
  const improved = stars > prevStars;

  // Regra de XP (comparando com o MELHOR resultado que a criança já teve nesta fase):
  //   1ª vez ou acertou mais que o recorde -> XP completo
  //   igualou o recorde -> metade do XP
  //   acertou menos -> sem XP (as moedas continuam)
  const fullXp = correctCount*10 + (stars===3?20:stars===2?10:0);
  const prevBest = prev ? (prev.bestCorrect || 0) : -1;
  let xpRule;
  if (isFirstTime || correctCount > prevBest) xpRule = isFirstTime ? 'first' : 'record';
  else if (correctCount === prevBest) xpRule = 'same';
  else xpRule = 'less';
  const xpGained = xpRule === 'same' ? Math.round(fullXp/2) : xpRule === 'less' ? 0 : fullXp;
  const coinsGained = correctCount*5;
  STATE.xp += xpGained;
  STATE.coins += coinsGained;
  STATE.phaseResults[phase.id] = {
    stars: Math.max(stars, prevStars),
    bestCorrect: Math.max(correctCount, prev?prev.bestCorrect:0),
    total, attempts: (prev?prev.attempts:0)+1,
  };
  if (isFirstTime) awardBadge('firstPhase');
  if (stars===3) awardBadge('allStars');

  let subjectJustCompleted = false, gameJustCompleted = false;
  if (isSubjectComplete(subject)) {
    subjectJustCompleted = awardBadge(subjectBadgeId(subject.id));
  }
  if (allSubjectsComplete()) {
    gameJustCompleted = awardBadge('gameComplete');
  }
  saveGame();
  syncScoreToCloud();

  QUIZ.resultData = { stars, prevStars, correctCount, total, xpGained, coinsGained, subjectJustCompleted, gameJustCompleted, improved, xpRule, prevBest, scorable };
  goTo('result', { subjectId: subject.id, phaseId: phase.id });
}

// ---------------------------- RESULTADO ----------------------------
function renderResult(){
  const { subject, phase, resultData } = QUIZ;
  const { stars, correctCount, total, xpGained, coinsGained, subjectJustCompleted, gameJustCompleted, xpRule, prevBest, scorable } = resultData;
  const maxScore = scorable || total;
  let xpNote = '';
  if (resultData.review) xpNote = resultData.left
    ? `Você corrigiu ${correctCount} de ${total}. Ainda faltam ${resultData.left} para revisar.`
    : `Parabéns! Você corrigiu todos os seus erros! 🎉`;
  if (xpRule === 'record') xpNote = `🏅 Novo recorde nesta fase! XP completo.`;
  else if (xpRule === 'same') xpNote = prevBest >= maxScore
    ? `Você igualou seu recorde (${prevBest}/${maxScore}): metade do XP.`
    : `Você igualou seu recorde (${prevBest}/${maxScore}): metade do XP. Acerte ${prevBest+1} para ganhar XP completo!`;
  else if (xpRule === 'less') xpNote = `Seu recorde é ${prevBest}/${maxScore}. Acerte ${prevBest} para ganhar XP de novo. As moedas você ganhou!`;
  root.innerHTML = '';
  const wrap = el(`
    <div class="screen result-screen" style="--c:${subject.color}; --cd:${subject.colorDark}">
      <div class="result-card">
        <div class="result-stars" id="resultStars">
          <span class="big-star s1">★</span><span class="big-star s2">★</span><span class="big-star s3">★</span>
        </div>
        <h2 class="result-title">${esc(phase.name)}</h2>
        <div class="result-score">${correctCount}/${QUIZ.scorable || total} corretas</div>
        <div class="mascot-banner"><span class="mascot-emoji">${MASCOT}</span><span class="speech">${esc(mascotResultLine(stars))}</span></div>
        <div class="result-rewards">
          <div class="reward-chip">✨ +${xpGained} XP</div>
          <div class="reward-chip">🪙 +${coinsGained} moedas</div>
        </div>
        ${xpNote ? `<div class="xp-note">${esc(xpNote)}</div>` : ''}
        <button class="btn-primary btn-big" id="continueBtn">Continuar ➡</button>
        <button class="btn-secondary btn-map" id="mapBtn">🗺️ Voltar ao mapa</button>
        <button class="btn-secondary" id="retryBtn">Jogar de novo 🔁</button>
      </div>
      <canvas id="confettiCanvas"></canvas>
    </div>`);
  root.appendChild(wrap);

  // Anima as estrelas em sequência
  const starEls = wrap.querySelectorAll('.big-star');
  starEls.forEach((s,i)=>{ s.classList.remove('filled'); });
  setTimeout(()=>{
    for(let i=0;i<stars;i++){
      setTimeout(()=>{ starEls[i].classList.add('filled','pop'); SFX.star(); }, i*350);
    }
    if (stars>0) setTimeout(()=> SFX.coin(), stars*350+150);
  }, 300);

  if (stars >= 2) burstConfetti(wrap.querySelector('#confettiCanvas'));
  if (stars === 3) SFX.victory();

  if (resultData.review){
    wrap.querySelector('#continueBtn').textContent = resultData.left ? 'Revisar mais 🔁' : 'Voltar ao mapa 🗺️';
    wrap.querySelector('#retryBtn').remove();
    if (!resultData.left) wrap.querySelector('#mapBtn').remove();
  }
  wrap.querySelector('#continueBtn').addEventListener('click', ()=>{
    SFX.click();
    if (resultData.review){ if (resultData.left) startReview(); else goTo('map'); return; }
    if (gameJustCompleted){ showToast(pick(MASCOT_LINES.gameComplete)); }
    else if (subjectJustCompleted){ showToast(pick(MASCOT_LINES.islandComplete)); }
    goTo('island', { subjectId: subject.id });
  });
  wrap.querySelector('#retryBtn')?.addEventListener('click', ()=>{
    SFX.click();
    goTo('phaseIntro', { subjectId: subject.id, phaseId: phase.id });
  });
  wrap.querySelector('#mapBtn')?.addEventListener('click', ()=>{
    SFX.click();
    if (gameJustCompleted){ showToast(pick(MASCOT_LINES.gameComplete)); }
    else if (subjectJustCompleted){ showToast(pick(MASCOT_LINES.islandComplete)); }
    goTo('map');
  });
}

function mascotResultLine(stars){
  if (stars===3) return pick(MASCOT_LINES.threeStars);
  if (stars===2) return pick(MASCOT_LINES.twoStars);
  if (stars===1) return pick(MASCOT_LINES.oneStar);
  return pick(MASCOT_LINES.zeroStars);
}

// ---------------------------- CONFETE (canvas) ----------------------------
function burstConfetti(canvas){
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  const colors = ['#FF6B6B','#4ECDC4','#FFD93D','#6BCB77','#A78BFA','#FF8FAB','#5AC8FA'];
  const particles = [];
  const count = Math.min(140, Math.floor(window.innerWidth/4));
  for(let i=0;i<count;i++){
    particles.push({
      x: Math.random()*canvas.width, y: -20 - Math.random()*canvas.height*0.5,
      vx: (Math.random()-0.5)*3, vy: 2+Math.random()*4,
      size: 4+Math.random()*6, color: colors[Math.floor(Math.random()*colors.length)],
      rot: Math.random()*360, vr: (Math.random()-0.5)*10,
      shape: Math.random()<0.5?'rect':'circle',
    });
  }
  let frame = 0;
  const maxFrames = 220;
  function tick(){
    frame++;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{
      p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
      ctx.fillStyle = p.color;
      if (p.shape==='rect') ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*0.6);
      else { ctx.beginPath(); ctx.arc(0,0,p.size/2,0,Math.PI*2); ctx.fill(); }
      ctx.restore();
    });
    if (frame < maxFrames) requestAnimationFrame(tick);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  tick();
}

// ---------------------------- INIT ----------------------------
window.addEventListener('DOMContentLoaded', ()=>{
  SFX.enabled = STATE.soundOn !== false;
  boot();
});
window.addEventListener('resize', ()=>{
  const c = document.getElementById('confettiCanvas');
  if (c){ c.width = window.innerWidth; c.height = window.innerHeight; }
});
