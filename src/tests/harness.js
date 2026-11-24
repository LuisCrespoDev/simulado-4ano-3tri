// Utilitários compartilhados pelos testes: servidor local, Firebase falso e respostas automáticas.
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const MOCK = fs.readFileSync(path.join(__dirname, 'mock-firebase.js'), 'utf8');
let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '  ✔ ' : '  ✘ ') + msg); if (!cond) failures++; return cond; };
const section = (t) => console.log('\n● ' + t);

function serve(files) {
  const server = http.createServer((req, res) => {
    const key = req.url.split('?')[0].replace(/^\//, '').replace(/\.html$/, '');
    const file = files[key];
    if (!file) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(file));
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)));
}

async function open(ctx, server, which, opts = {}) {
  const page = await ctx.newPage();
  page.__errors = [];
  page.on('pageerror', (e) => page.__errors.push(e.message));
  page.on('dialog', (d) => (opts.dismissDialogs ? d.dismiss() : d.accept()));
  await page.route(/gstatic\.com\/firebasejs\/.*app-compat/, (r) => (opts.offline ? r.abort() : r.fulfill({ contentType: 'text/javascript', body: MOCK })));
  await page.route(/gstatic\.com\/firebasejs\/.*firestore-compat/, (r) => (opts.offline ? r.abort() : r.fulfill({ contentType: 'text/javascript', body: '' })));
  await page.goto(`http://127.0.0.1:${server.address().port}/${which}.html`);
  await page.waitForFunction(() => typeof NAV !== 'undefined' && NAV && NAV.screen && NAV.screen !== 'boot');
  await page.waitForTimeout(500);
  return page;
}

// Responde a questão atual: certo (true) ou errado (false). Funciona com alternativas embaralhadas,
// porque lê o índice original de cada botão (data-i / data-opt).
async function answer(page, right) {
  return page.evaluate((right) => {
    const q = QUIZ.questions[QUIZ.index];
    const card = document.querySelector('.q-card');
    if (q.type === 'choice') {
      const btn = (i) => card.querySelector(`.option-btn[data-i="${i}"]`);
      if (right) q.correct.forEach((i) => btn(i).click());
      else {
        const wrong = q.options.map((_, i) => i).filter((i) => !q.correct.includes(i));
        btn(wrong[0]).click();
        if (q.multi) btn(wrong[1] !== undefined ? wrong[1] : q.correct[0]).click();
      }
    } else if (q.type === 'items') {
      q.items.forEach((it, idx) => card.querySelector(`.mini-opt[data-item="${idx}"][data-opt="${right ? it.correct : (it.correct + 1) % it.options.length}"]`).click());
    }
    const sub = card.querySelector('#qSubmit');
    sub.click();
    document.querySelector('.next-btn').click();
    return q.type;
  }, right);
}

// Joga uma fase inteira acertando `nCorrect` questões que valem ponto.
async function play(page, subj, phase, nCorrect) {
  await page.evaluate(([s, p]) => goTo('phaseIntro', { subjectId: s, phaseId: p }), [subj, phase]);
  await page.waitForSelector('#playBtn');
  await page.click('#playBtn');
  await page.waitForSelector('.q-card');
  const total = await page.evaluate(() => QUIZ.total);
  let made = 0;
  for (let i = 0; i < total; i++) {
    const t = await page.evaluate(() => QUIZ.questions[QUIZ.index].type);
    const right = t === 'reflection' ? true : made < nCorrect;
    await answer(page, right);
    if (t !== 'reflection' && right) made++;
  }
  await page.waitForSelector('.result-screen');
  return page.evaluate(() => Object.assign({ xp: STATE.xp, coins: STATE.coins, score: document.querySelector('.result-score').textContent }, QUIZ.resultData));
}

async function newPlayer(page, name = 'Ana', last = 'Souza', turma = 'A') {
  await page.fill('#nameInput', name);
  await page.fill('#lastNameInput', last);
  await page.click(`.turma-pick[data-turma="${turma}"]`);
  await page.click('#startBtn');
  await page.waitForSelector('.map-screen');
}

module.exports = { chromium, ok, section, serve, open, answer, play, newPlayer, failures: () => failures };
