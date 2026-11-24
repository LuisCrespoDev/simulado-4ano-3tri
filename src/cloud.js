/* Ranking compartilhado via Firebase Firestore (plano Spark, gratuito, sem login).
   Qualquer falha de rede/Firebase é isolada aqui com try/catch: o jogo continua
   funcionando 100% offline mesmo se a nuvem estiver indisponível. */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBT9lGYMVODn4W2mhky7GBgQtLQJs85sAU",
  authDomain: "simulado-4ano-ranking.firebaseapp.com",
  projectId: "simulado-4ano-ranking",
  storageBucket: "simulado-4ano-ranking.firebasestorage.app",
  messagingSenderId: "13551801863",
  appId: "1:13551801863:web:7fa89538422e67ab483ca2",
};

let _db = null;
let _dbFailed = false;
function getDb(){
  if (_db) return _db;
  if (_dbFailed) return null;
  try{
    if (typeof firebase === 'undefined' || !firebase.initializeApp){ _dbFailed = true; return null; }
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    _db = firebase.firestore();
    return _db;
  }catch(e){
    console.warn('[ranking] Firebase indisponível:', e);
    _dbFailed = true;
    return null;
  }
}

// ---------- Enviar minha pontuação para o ranking ----------
let _syncTimer = null;
function syncScoreToCloud(){
  try{
    const db = getDb();
    if (!db) return;
    const id = ensurePlayerId();
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(()=>{
      // Antes de escrever, junta com o que já está na nuvem (outro aparelho com o mesmo
      // código pode ter avançado). Assim a nuvem nunca recebe menos progresso do que tem.
      // Exceção: logo depois de "Reiniciar progresso" o jogador quer mesmo zerar.
      const ref = db.collection('scores').doc(id);
      const pull = STATE.pendingReset ? Promise.resolve(null) : ref.get().then(d => d.exists ? d.data() : null).catch(()=>null);
      pull.then(cloud => {
        if (cloud && !cloud.hidden){
          const cp = cloud.progress || {};
          const merged = mergeProgress(STATE, { xp: cloud.xp, coins: cp.coins, streak: cp.streak, badges: cp.badges, phaseResults: cp.phaseResults, studied: cp.studied, firstTry: cp.firstTry });
          const changed = JSON.stringify([merged.xp, merged.coins, merged.badges, merged.phaseResults, merged.studied]) !== JSON.stringify([STATE.xp, STATE.coins, STATE.badges, STATE.phaseResults, STATE.studied]);
          if (changed){ Object.assign(STATE, merged); saveGame(); if (typeof onCloudMerged === 'function') onCloudMerged(); }
        }
        writeScore(db, id);
      });
    }, 350);
  }catch(e){ console.warn('[ranking] syncScoreToCloud falhou:', e); }
}

function writeScore(db, id){
      try{
        const avatarEmoji = (AVATARS.find(a=>a.id===STATE.avatar)||{}).emoji || '🦸';
        const data = {
          name: String(STATE.playerName || 'Explorador(a)').slice(0, 30),
          avatar: String(avatarEmoji),
          color: String(STATE.avatarColor || '#FF6B6B'),
          xp: Math.max(0, Math.min(200000, Math.round(STATE.xp || 0))),
          stars: Math.max(0, Math.round(totalStarsEarned())),
          updatedAt: (firebase.firestore && firebase.firestore.FieldValue)
            ? firebase.firestore.FieldValue.serverTimestamp() : Date.now(),
        };
        // Sobrenome e turma são opcionais (jogadores antigos podem não ter preenchido
        // ainda) -- só inclui a chave no documento quando há valor, pra não mandar um
        // null que as regras do Firestore possam rejeitar.
        if (STATE.lastName) data.lastName = String(STATE.lastName).slice(0, 30);
        if (STATE.turma === 'A' || STATE.turma === 'B') data.turma = STATE.turma;
        // Cópia de segurança do progresso + código de recuperação. Campos extras: as regras
        // atuais do Firestore já aceitam (só validam nome/xp/estrelas/avatar/cor).
        data.code = ensureRecoveryCode();
        data.progress = {
          v: 1,
          phaseResults: STATE.phaseResults || {},
          coins: Math.max(0, Math.round(STATE.coins || 0)),
          badges: STATE.badges || [],
          streak: STATE.streak || 0,
          lastPlayedDate: STATE.lastPlayedDate || null,
          createdAt: STATE.createdAt || null,
          avatarId: STATE.avatar || 'hero',
          studied: STATE.studied || {},
          firstTry: STATE.firstTry || {},
        };
        db.collection('scores').doc(id).set(data, { merge: true })
          .then(()=>{ if (STATE.pendingReset){ STATE.pendingReset = false; saveGame(); } })
          .catch(e=> console.warn('[ranking] falha ao enviar pontuação:', e));
      }catch(e){ console.warn('[ranking] erro ao montar dados de sincronização:', e); }
}

// ---------- Buscar o ranking (tempo real, com fallback de leitura única) ----------
function loadRanking(onData, onError){
  let unsub = () => {};
  try{
    const db = getDb();
    if (!db){ onError && onError(new Error('Firebase indisponível')); return unsub; }
    // Sem o antigo limite de 50: com duas turmas, alunos sumiam das abas Turma A/B.
    const q = db.collection('scores').orderBy('xp', 'desc').limit(500);
    try{
      const stop = q.onSnapshot(
        snap => {
          const rows = [];
          snap.forEach(doc => rows.push(Object.assign({ id: doc.id }, doc.data())));
          onData(rows);
        },
        err => {
          console.warn('[ranking] onSnapshot falhou, tentando leitura única:', err);
          q.get().then(snap=>{
            const rows = [];
            snap.forEach(doc => rows.push(Object.assign({ id: doc.id }, doc.data())));
            onData(rows);
          }).catch(e2 => onError && onError(e2));
        }
      );
      unsub = stop;
    }catch(e){
      // navegador/SDK sem suporte a onSnapshot: faz leitura única
      q.get().then(snap=>{
        const rows = [];
        snap.forEach(doc => rows.push(Object.assign({ id: doc.id }, doc.data())));
        onData(rows);
      }).catch(e2 => onError && onError(e2));
    }
  }catch(e){
    onError && onError(e);
  }
  return unsub;
}

// ---------- Recuperar progresso com código ----------
// Devolve { id, data } do jogador com esse código, ou null. Rejeita se a nuvem estiver fora.
function findPlayerByCode(code){
  const db = getDb();
  if (!db) return Promise.reject(new Error('offline'));
  return db.collection('scores').where('code', '==', code).limit(5).get().then(snap=>{
    const rows = [];
    snap.forEach(doc => rows.push({ id: doc.id, data: doc.data() }));
    if (!rows.length) return null;
    rows.sort((a,b)=> (b.data.xp||0) - (a.data.xp||0));
    return rows[0];
  });
}
// O registro antigo deste aparelho deixa de aparecer no ranking (não apaga nada).
function markMergedInto(oldId, newId){
  try{
    const db = getDb();
    if (!db || !oldId || oldId === newId) return Promise.resolve();
    return db.collection('scores').doc(oldId).get().then(d=>{
      if (!d.exists) return;
      return db.collection('scores').doc(oldId).set({ mergedInto: newId, hidden: true }, { merge: true });
    }).catch(e=> console.warn('[ranking] não foi possível esconder o registro antigo:', e));
  }catch(e){ return Promise.resolve(); }
}

if (typeof module !== 'undefined') {
  module.exports = { FIREBASE_CONFIG, getDb, syncScoreToCloud, loadRanking, findPlayerByCode, markMergedInto };
}
