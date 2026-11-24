// Teste de migração: cria progresso com a versão PUBLICADA (old.html) e abre com a
// versão NOVA (new.html) no mesmo navegador. Falha se qualquer progresso sumir,
// se o XP diminuir, se o ID do jogador mudar ou se a nuvem receber dado menor.
// Depois abre a versão antiga de novo (caso uma criança ainda esteja com ela em cache).
//
// Uso: node tests/migration.test.js <old.html> <new.html>
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const [OLD, NEW] = process.argv.slice(2).map((p) => path.resolve(p));
const MOCK = fs.readFileSync(path.join(__dirname, 'mock-firebase.js'), 'utf8');
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✔ ' : '  ✘ ') + msg); if (!cond) failures++; };

const server = http.createServer((req, res) => {
  const file = req.url.startsWith('/old') ? OLD : req.url.startsWith('/new') ? NEW : null;
  if (!file) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(fs.readFileSync(file));
});

async function open(ctx, which) {
  const page = await ctx.newPage();
  page.__errors = [];
  page.on('pageerror', (e) => page.__errors.push(e.message));
  page.on('dialog', (d) => d.accept());
  await page.route(/gstatic\.com\/firebasejs\/.*app-compat/, (r) => r.fulfill({ contentType: 'text/javascript', body: MOCK }));
  await page.route(/gstatic\.com\/firebasejs\/.*firestore-compat/, (r) => r.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.goto(`http://127.0.0.1:${server.address().port}/${which}.html`);
  await page.waitForFunction(() => typeof NAV !== 'undefined' && NAV && NAV.screen);
  await page.waitForTimeout(800); // deixa o debounce de sincronização rodar
  return page;
}

// Joga uma fase na versão antiga acertando exatamente `nCorrect` questões pontuáveis.
async function playOld(page, subj, phase, nCorrect) {
  await page.evaluate(([s, p]) => goTo('phaseIntro', { subjectId: s, phaseId: p }), [subj, phase]);
  await page.click('#playBtn');
  const total = await page.evaluate(() => QUIZ.total);
  let made = 0;
  for (let i = 0; i < total; i++) {
    const wantRight = made < nCorrect;
    const r = await page.evaluate((wantRight) => {
      const q = (QUIZ.questions || QUIZ.phase.questions)[QUIZ.index];
      const card = document.querySelector('.q-card');
      if (q.type === 'choice') {
        const right = q.correct; const wrong = [0, 1, 2, 3].filter((i) => !right.includes(i)).slice(0, Math.max(1, right.length));
        const btn = (i) => card.querySelector(`.option-btn[data-i="${i}"]`);
        (wantRight ? right : wrong).forEach((i) => btn(i).click());
        if (!wantRight && q.multi && wrong.length < 2) btn(right[0]).click();
      } else if (q.type === 'items') {
        q.items.forEach((it, idx) => card.querySelector(`.mini-opt[data-item="${idx}"][data-opt="${wantRight ? it.correct : 1 - it.correct}"]`).click());
      }
      card.querySelector('#qSubmit').click();
      document.querySelector('.next-btn').click();
      return q.type;
    }, wantRight);
    if (r !== 'reflection' && wantRight) made++;
  }
  await page.waitForSelector('.result-screen');
}

const KEYS = ['playerName', 'lastName', 'turma', 'avatar', 'avatarColor', 'xp', 'coins', 'streak', 'lastPlayedDate', 'createdAt', 'soundOn', 'playerId'];

async function scenario(browser, title, setup) {
  console.log('\n● ' + title);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const oldPage = await open(ctx, 'old');
  await setup(oldPage);
  await oldPage.waitForTimeout(800);
  await oldPage.reload();
  await oldPage.waitForFunction(() => typeof NAV !== 'undefined' && NAV && NAV.screen);
  await oldPage.waitForTimeout(800);
  const before = await oldPage.evaluate(() => JSON.parse(JSON.stringify(STATE)));
  await oldPage.close();

  const newPage = await open(ctx, 'new');
  const after = await newPage.evaluate(() => JSON.parse(JSON.stringify(STATE)));
  const screen = await newPage.evaluate(() => NAV.screen);
  const writes = await newPage.evaluate(() => window.__writes);
  const cloud = await newPage.evaluate(() => JSON.parse(localStorage.getItem('__mockdb') || '{}'));

  ok(newPage.__errors.length === 0, 'versão nova abre sem erro de JavaScript' + (newPage.__errors.length ? ': ' + newPage.__errors[0] : ''));
  if (before.playerName) ok(screen !== 'onboarding', `quem já jogava não volta para o cadastro (tela: ${screen})`);
  for (const k of KEYS) {
    if (k === 'playerId' && !before.playerId) { ok(!!after.playerId, 'jogador antigo sem ID ganha um ID'); continue; }
    ok(JSON.stringify(before[k]) === JSON.stringify(after[k]), `${k} preservado (${JSON.stringify(before[k])} → ${JSON.stringify(after[k])})`);
  }
  const ph = Object.keys(before.phaseResults || {});
  ok(ph.every((id) => after.phaseResults[id] && after.phaseResults[id].stars === before.phaseResults[id].stars && after.phaseResults[id].bestCorrect === before.phaseResults[id].bestCorrect && after.phaseResults[id].attempts === before.phaseResults[id].attempts), `estrelas e tentativas das ${ph.length} fases preservadas`);
  ok((before.badges || []).every((b) => (after.badges || []).includes(b)), `medalhas preservadas (${(before.badges || []).length})`);
  const myWrites = writes.filter((w) => w.col === 'scores');
  ok(myWrites.every((w) => w.id === after.playerId), 'a nuvem só recebe escrita no documento deste jogador');
  ok(myWrites.every((w) => w.data.xp === undefined || w.data.xp >= (before.xp || 0)), 'nenhuma escrita na nuvem com XP menor que o anterior');
  const doc = (cloud.scores || {})[after.playerId];
  if (before.playerName) ok(doc && doc.xp === after.xp && doc.name, `ranking na nuvem bate com o celular (xp ${doc && doc.xp})`);
  const docsOfPlayer = Object.values(cloud.scores || {}).length;
  ok(docsOfPlayer <= 1, `nenhum registro duplicado criado no ranking (${docsOfPlayer})`);
  await newPage.close();

  // Volta para a versão antiga (criança com a página antiga em cache)
  const back = await open(ctx, 'old');
  const again = await back.evaluate(() => JSON.parse(JSON.stringify(STATE)));
  ok(back.__errors.length === 0, 'versão antiga continua abrindo depois da nova');
  ok(KEYS.every((k) => JSON.stringify(again[k]) === JSON.stringify(after[k])), 'versão antiga lê o progresso salvo pela nova sem perder nada');
  await ctx.close();
  return { before, after };
}

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch();

  await scenario(browser, 'Jogador novo na versão publicada, com progresso misto', async (p) => {
    await p.fill('#nameInput', 'Ana');
    await p.fill('#lastNameInput', 'Souza');
    await p.click('.turma-pick[data-turma="B"]');
    await p.click('#startBtn');
    await playOld(p, 'port', 'port-1', 6);
    await playOld(p, 'mat', 'mat-1', 4);
    await playOld(p, 'mat', 'mat-2', 2);
    await playOld(p, 'hist', 'hist-1', 5);
    await playOld(p, 'port', 'port-1', 6); // replay
  });

  await scenario(browser, 'Save antigo (antes do ranking): sem ID, sem turma, sem sobrenome', async (p) => {
    await p.evaluate(() => {
      const y = new Date(); y.setDate(y.getDate() - 1);
      localStorage.setItem('quiz3tri_save_v1', JSON.stringify({
        playerName: 'Bia', avatar: 'fairy', avatarColor: '#FF8FAB', xp: 300, coins: 150, streak: 2,
        lastPlayedDate: y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate(),
        phaseResults: { 'port-1': { stars: 3, bestCorrect: 6, total: 6, attempts: 2 }, 'cien-1': { stars: 1, bestCorrect: 2, total: 6, attempts: 1 } },
        badges: ['firstPhase', 'allStars'], soundOn: false, createdAt: 1731000000000,
      }));
    });
  });

  await scenario(browser, 'Jogador com XP acima do máximo (repetiu fases muitas vezes)', async (p) => {
    await p.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('quiz3tri_save_v1'));
      const pr = {}; SUBJECTS.forEach((sub) => sub.phases.forEach((ph, i) => { if (i < 3) pr[ph.id] = { stars: 3, bestCorrect: 6, total: 6, attempts: 4 }; }));
      Object.assign(s, { playerName: 'Gui', lastName: 'Teste', turma: 'A', xp: 2540, coins: 999, phaseResults: pr, badges: ['firstPhase', 'allStars', 'island_port'], playerId: 'id-gui-123' });
      localStorage.setItem('quiz3tri_save_v1', JSON.stringify(s));
    });
  });

  await browser.close();
  server.close();
  console.log(failures ? `\n✘ ${failures} verificação(ões) falharam` : '\n✔ Migração segura: nenhum progresso perdido');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
