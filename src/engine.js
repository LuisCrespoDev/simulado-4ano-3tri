/* Motor do jogo - Simulado Gamificado 3º Trimestre
   UX/UI pensado para crianças de 10 anos, mobile-first, estilo "mapa de fases". */

// ---------- Avatares ----------
const AVATARS = [
  { id:'hero',   emoji:'🦸' }, { id:'heroine',emoji:'🦸‍♀️' },
  { id:'astro',  emoji:'🧑‍🚀' }, { id:'wizard', emoji:'🧙' },
  { id:'ninja',  emoji:'🥷' }, { id:'fairy',  emoji:'🧚' },
  { id:'robot',  emoji:'🤖' }, { id:'explorer',emoji:'🧭' },
];
const AVATAR_COLORS = ['#FF6B6B','#4ECDC4','#FFB84D','#6BCB77','#A78BFA','#FF8FAB','#5AC8FA','#FFD93D'];

const MASCOT = '🦉';
const MASCOT_LINES = {
  welcome: ["Oi, eu sou o Sábio! Vamos estudar juntos?","Prontinho pra nossa aventura de hoje?","Bora encarar o 3º trimestre com tudo!"],
  islandIntro: ["Essa ilha tem desafios incríveis te esperando!","Vamos nessa? Cada fase te deixa mais forte!"],
  phaseIntro: ["Vamos ver o que você sabe sobre isso!","Respire fundo e vai com calma, você consegue!"],
  correct: ["Isso aí! Mandou bem!","Show de bola!","Perfeito, continue assim!","Você é demais!","Acertou em cheio!"],
  wrong: ["Quase! Vamos para a próxima.","Não foi dessa vez, mas tudo bem!","Respira e tenta a próxima!","Errar faz parte de aprender!"],
  threeStars: ["UAU! Você mandou muito bem, 3 estrelas!","Perfeito! Você é um craque nessa matéria!"],
  twoStars: ["Muito bem! Quase perfeito!","Ótimo trabalho, duas estrelas!"],
  oneStar: ["Você conseguiu! Pode tentar de novo para melhorar.","Boa! Com um pouco mais de prática você chega nas 3 estrelas!"],
  zeroStars: ["Não desanime! Vamos tentar de novo?","Essa fase é difícil mesmo. Bora de novo?"],
  islandComplete: ["Incrível! Você completou essa ilha inteira!","Parabéns, explorador(a)! Ilha concluída!"],
  gameComplete: ["Você é o MESTRE do 3º trimestre! Parabéns!!","Todas as ilhas concluídas! Você é demais!"],
};
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// ---------- Áudio (Web Audio API, sem arquivos externos) ----------
const SFX = (() => {
  let ctx = null;
  function getCtx(){ if(!ctx){ try{ ctx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ ctx=null; } } return ctx; }
  function tone(freq, start, dur, type='sine', gain=0.18){
    const c = getCtx(); if(!c) return;
    const o = c.createOscillator(); const g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, c.currentTime+start);
    g.gain.setValueAtTime(0, c.currentTime+start);
    g.gain.linearRampToValueAtTime(gain, c.currentTime+start+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime+start+dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime+start); o.stop(c.currentTime+start+dur+0.05);
  }
  return {
    enabled: true,
    unlock(){ const c = getCtx(); if(c && c.state==='suspended'){ c.resume(); } },
    correct(){ if(!this.enabled) return; tone(880,0,0.12,'sine'); tone(1174,0.09,0.18,'sine'); },
    wrong(){ if(!this.enabled) return; tone(220,0,0.22,'sawtooth',0.12); tone(160,0.1,0.22,'sawtooth',0.1); },
    click(){ if(!this.enabled) return; tone(520,0,0.06,'square',0.08); },
    whoosh(){ if(!this.enabled) return; tone(300,0,0.15,'sine',0.08); tone(500,0.05,0.15,'sine',0.08); },
    star(){ if(!this.enabled) return; tone(660,0,0.1,'triangle',0.15); tone(880,0.1,0.1,'triangle',0.15); tone(1320,0.2,0.22,'triangle',0.18); },
    victory(){ if(!this.enabled) return; [523,659,784,1047].forEach((f,i)=> tone(f, i*0.13, 0.25, 'triangle', 0.17)); },
    coin(){ if(!this.enabled) return; tone(988,0,0.07,'square',0.1); tone(1319,0.06,0.12,'square',0.1); },
  };
})();

// ---------- Estado / Persistência ----------
const SAVE_KEY = 'quiz3tri_save_v1';
function todayStr(){ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function defaultSave(){
  return {
    playerName: '', lastName: '', avatar: 'hero', avatarColor: AVATAR_COLORS[0],
    turma: null, // 'A' ou 'B' -- null = ainda não informada (jogador antigo ou pulou)
    xp: 0, coins: 0, streak: 0, lastPlayedDate: null,
    phaseResults: {}, // phaseId -> {stars, bestCorrect, total, attempts}
    badges: [], soundOn: true, createdAt: null,
    playerId: null, // id anônimo estável neste aparelho, usado no ranking compartilhado
    recoveryCode: null, // código curto para recuperar o progresso em outro aparelho
    studied: {},   // phaseId -> true quando a criança concluiu os cartões "Aprender"
    mistakes: {},  // questionId -> 1 enquanto a questão estiver errada (para "Revisar meus erros")
    firstTry: {},  // questionId -> 1/0, resultado da 1ª tentativa (para o painel de questões mais erradas)
  };
}

// ---------- Identidade anônima do jogador (para o ranking compartilhado) ----------
function ensurePlayerId(){
  if (STATE.playerId) return STATE.playerId;
  let id;
  try{ id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : null; }catch(e){ id = null; }
  if (!id) id = 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  STATE.playerId = id;
  saveGame();
  return id;
}

// ---------- Código de recuperação (6 caracteres, sem letras/números que confundem) ----------
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newRecoveryCode(){
  let c = '';
  try{
    const a = new Uint32Array(6); crypto.getRandomValues(a);
    for (let i=0;i<6;i++) c += CODE_ALPHABET[a[i] % CODE_ALPHABET.length];
  }catch(e){
    for (let i=0;i<6;i++) c += CODE_ALPHABET[Math.floor(Math.random()*CODE_ALPHABET.length)];
  }
  return c;
}
function ensureRecoveryCode(){
  if (!STATE.recoveryCode){ STATE.recoveryCode = newRecoveryCode(); saveGame(); }
  return STATE.recoveryCode;
}
function normalizeCode(s){ return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,''); }

// ---------- Nome com letras maiúsculas no lugar certo ("joão da silva" -> "João da Silva") ----------
const NAME_PARTICLES = ['da','de','do','das','dos','e','di','du'];
function normalizeName(s, surname){
  const words = String(s||'').trim().replace(/\s+/g,' ').split(' ');
  return words.map((w,i)=>{
    const lw = w.toLocaleLowerCase('pt-BR');
    if ((i>0 || (surname && words.length>1)) && NAME_PARTICLES.includes(lw)) return lw;
    return lw.charAt(0).toLocaleUpperCase('pt-BR') + lw.slice(1);
  }).join(' ');
}

// ---------- Juntar dois progressos sem perder nada (usado ao recuperar com código) ----------
// Regra: para cada coisa, fica sempre o MAIOR valor. Nunca diminui estrela, XP, moeda ou medalha.
function mergeProgress(local, cloud){
  const out = Object.assign({}, local);
  out.xp = Math.max(local.xp||0, cloud.xp||0);
  out.coins = Math.max(local.coins||0, cloud.coins||0);
  out.streak = Math.max(local.streak||0, cloud.streak||0);
  out.badges = Array.from(new Set([].concat(local.badges||[], cloud.badges||[])));
  out.studied = Object.assign({}, cloud.studied||{}, local.studied||{});
  out.firstTry = Object.assign({}, cloud.firstTry||{}, local.firstTry||{}); // a 1ª tentativa registrada primeiro vale
  out.mistakes = Object.assign({}, local.mistakes||{});
  out.phaseResults = Object.assign({}, local.phaseResults||{});
  Object.keys(cloud.phaseResults||{}).forEach(id=>{
    const a = out.phaseResults[id], b = cloud.phaseResults[id];
    if (!a){ out.phaseResults[id] = Object.assign({}, b); return; }
    out.phaseResults[id] = {
      stars: Math.max(a.stars||0, b.stars||0),
      bestCorrect: Math.max(a.bestCorrect||0, b.bestCorrect||0),
      total: a.total || b.total,
      attempts: Math.max(a.attempts||0, b.attempts||0),
    };
  });
  return out;
}

// ---------- Total de estrelas (para o ranking) ----------
function totalStarsEarned(){
  let t = 0;
  SUBJECTS.forEach(s => s.phases.forEach(p => { const r = STATE.phaseResults[p.id]; if (r) t += r.stars; }));
  return t;
}
let STATE = loadSave();
function loadSave(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return defaultSave();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultSave(), parsed);
  }catch(e){ return defaultSave(); }
}
function saveGame(){
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(STATE)); }catch(e){ /* ignore quota errors */ }
}
function resetGame(){
  // Preserva o playerId através do reset: ele identifica o documento deste
  // aparelho no ranking compartilhado (scores/{playerId}). Se trocasse aqui,
  // o reset criaria um registro novo no Firestore e deixaria o antigo órfão
  // (com dados desatualizados, exibido pra sempre no ranking de todo mundo).
  const keepPlayerId = STATE.playerId;
  try{ localStorage.removeItem(SAVE_KEY); }catch(e){}
  const keepCode = STATE.recoveryCode;
  STATE = defaultSave();
  STATE.playerId = keepPlayerId;
  STATE.recoveryCode = keepCode;
  STATE.pendingReset = true; // a próxima sincronização zera a nuvem em vez de juntar
  saveGame();
}

function registerPlayToday(){
  const t = todayStr();
  if(STATE.lastPlayedDate === t) return; // already counted today
  const y = new Date(); y.setDate(y.getDate()-1);
  const yStr = y.getFullYear()+'-'+(y.getMonth()+1)+'-'+y.getDate();
  if(STATE.lastPlayedDate === yStr){ STATE.streak += 1; } else { STATE.streak = 1; }
  STATE.lastPlayedDate = t;
  checkStreakBadges();
  saveGame();
}

// ---------- Level / XP ----------
function levelForXp(xp){ return Math.floor(xp/100) + 1; }
function xpIntoLevel(xp){ return xp % 100; }

// ---------- Badges ----------
const BADGE_DEFS = {
  streak3: { icon:'🔥', name:'Chama de 3 dias', desc:'Jogou 3 dias seguidos' },
  streak7: { icon:'🔥🔥', name:'Chama de 7 dias', desc:'Jogou 7 dias seguidos' },
  firstPhase: { icon:'🥇', name:'Primeiros passos', desc:'Completou a primeira fase' },
  allStars: { icon:'⭐', name:'Perfeccionista', desc:'Conquistou 3 estrelas em uma fase' },
};
function subjectBadgeId(subjId){ return 'island_'+subjId; }
function awardBadge(id){
  if(!STATE.badges.includes(id)){ STATE.badges.push(id); return true; }
  return false;
}
function checkStreakBadges(){
  if(STATE.streak >= 3) awardBadge('streak3');
  if(STATE.streak >= 7) awardBadge('streak7');
}

// ---------- Cálculo de estrelas ----------
function starsFor(correctCount, total){
  const ratio = correctCount/total;
  if (ratio >= 1) return 3;
  if (ratio >= 0.66) return 2;
  if (ratio >= 0.33) return 1;
  return 0;
}

function isPhaseUnlocked(subject, phaseIndex){
  if (phaseIndex === 0) return true;
  const prevPhase = subject.phases[phaseIndex-1];
  const prevResult = STATE.phaseResults[prevPhase.id];
  return !!(prevResult && prevResult.stars >= 1);
}
// A fase Desafio (challenge) é extra: não entra no "ilha completa" nem na barra da ilha,
// para quem já tinha completado não perder o troféu quando o Desafio foi criado.
function corePhases(subject){ return subject.phases.filter(p => !p.challenge); }
function isSubjectComplete(subject){
  return corePhases(subject).every(p => STATE.phaseResults[p.id] && STATE.phaseResults[p.id].stars >= 1);
}
function subjectStars(subject){
  return corePhases(subject).reduce((a,p)=> a + (STATE.phaseResults[p.id] ? STATE.phaseResults[p.id].stars : 0), 0);
}
function challengePhase(subject){ return subject.phases.find(p => p.challenge) || null; }

// ---------- Sorteio das questões de uma partida ----------
// Fase normal: sorteia PHASE_DRAW questões do banco da fase (se o banco tiver mais que isso).
// Desafio: sorteia CHALLENGE_DRAW questões de todas as fases da ilha.
// Pergunta aberta (reflexão) não é sorteada: entra sempre no fim, quando a fase tem uma.
const PHASE_DRAW = 6, CHALLENGE_DRAW = 8;
function drawQuestions(subject, phase, firstTime){
  if (phase.challenge){
    const pool = [];
    corePhases(subject).forEach(p => p.questions.forEach(q => { if (q.type !== 'reflection') pool.push(Object.assign({}, q, { __phaseId: p.id })); }));
    return shuffleArr(pool).slice(0, CHALLENGE_DRAW);
  }
  const scorable = phase.questions.filter(q => q.type !== 'reflection');
  const refl = phase.questions.filter(q => q.type === 'reflection');
  let picked;
  if (scorable.length <= PHASE_DRAW) picked = firstTime ? scorable.slice() : shuffleArr(scorable);
  else picked = shuffleArr(scorable).slice(0, PHASE_DRAW);
  return picked.concat(refl);
}
function shuffleArr(arr){
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function allSubjectsComplete(){ return SUBJECTS.every(isSubjectComplete); }

if (typeof module !== 'undefined') {
  module.exports = {
    AVATARS, AVATAR_COLORS, MASCOT, MASCOT_LINES, pick, SFX,
    SAVE_KEY, defaultSave, loadSave, saveGame, resetGame, registerPlayToday,
    levelForXp, xpIntoLevel, BADGE_DEFS, subjectBadgeId, awardBadge, checkStreakBadges,
    starsFor, isPhaseUnlocked, isSubjectComplete, subjectStars, allSubjectsComplete,
    corePhases, challengePhase, drawQuestions, PHASE_DRAW, CHALLENGE_DRAW,
    ensurePlayerId, totalStarsEarned, newRecoveryCode, ensureRecoveryCode, normalizeCode,
    normalizeName, mergeProgress,
  };
}
