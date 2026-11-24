// Testes funcionais do app (rodam antes de cada publicação).
// Uso: node tests/app.test.js index.html
const path = require('path');
const H = require('./harness');
const { ok, section } = H;
const APP = path.resolve(process.argv[2] || 'index.html');

(async () => {
  const server = await H.serve({ app: APP });
  const browser = await H.chromium.launch();
  const ctxOpts = { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true };

  // ---------------- Cadastro ----------------
  section('Cadastro');
  let ctx = await browser.newContext(ctxOpts);
  let p = await H.open(ctx, server, 'app');
  await p.click('.turma-pick[data-turma="A"]');
  ok(await p.$eval('#startBtn', (b) => b.disabled), 'não dá para começar sem nome');
  await p.fill('#nameInput', '  joão marcelo ');
  await p.fill('#lastNameInput', 'DA SILVA');
  ok(!(await p.$eval('#startBtn', (b) => b.disabled)), 'com nome e turma o botão libera');
  await p.click('#startBtn');
  await p.waitForSelector('.map-screen');
  ok(await p.evaluate(() => STATE.playerName === 'João Marcelo' && STATE.lastName === 'da Silva'), 'nome salvo com maiúsculas certas (João Marcelo da Silva)');
  ok(await p.evaluate(() => /^[A-Z2-9]{6}$/.test(STATE.recoveryCode)), 'código de recuperação criado');
  await p.waitForTimeout(600);
  const cloud = await p.evaluate(() => JSON.parse(localStorage.getItem('__mockdb')).scores[STATE.playerId]);
  ok(cloud && cloud.code && cloud.progress && cloud.progress.v === 1, 'nuvem recebe código e cópia do progresso');

  // ---------------- Editar perfil ----------------
  section('Editar perfil');
  await p.click('#settingsBtn');
  ok(await p.$eval('.code-value', (e) => /^[A-Z2-9]{6}$/.test(e.textContent)), 'configurações mostram o código');
  await p.click('#editAvatarBtn');
  ok(await p.$eval('#startBtn', (b) => b.textContent.includes('Salvar')), 'botão vira "Salvar" ao editar');
  await p.fill('#nameInput', 'Outro');
  await p.click('#cancelEdit');
  ok(await p.evaluate(() => NAV.screen === 'map' && STATE.playerName === 'João Marcelo'), 'Cancelar volta ao mapa sem mudar nada');

  // ---------------- Botão voltar do celular ----------------
  section('Botão voltar do celular');
  await p.evaluate(() => goTo('island', { subjectId: 'mat' }));
  await p.goBack();
  await p.waitForTimeout(300);
  ok(await p.evaluate(() => NAV.screen === 'map'), 'na ilha, voltar leva ao mapa (não sai do site)');
  await p.evaluate(() => goTo('island', { subjectId: 'mat' }));
  await p.click('.trail-node.unlocked');
  await p.goBack(); await p.waitForTimeout(300);
  ok(await p.evaluate(() => NAV.screen === 'island'), 'na introdução da fase, voltar leva à ilha');
  await p.evaluate(() => goTo('phaseIntro', { subjectId: 'mat', phaseId: 'mat-1' }));
  await p.click('#playBtn');
  await p.goBack(); await p.waitForTimeout(300);
  ok(await p.evaluate(() => NAV.screen === 'phaseIntro'), 'no quiz, voltar pergunta e sai para a introdução');
  ok(p.url().startsWith('http://127.0.0.1'), 'continua dentro do site');
  await ctx.close();

  // quiz: se a criança cancelar o "sair?", continua no quiz
  ctx = await browser.newContext(ctxOpts);
  p = await H.open(ctx, server, 'app', { dismissDialogs: true });
  await H.newPlayer(p);
  await p.evaluate(() => goTo('phaseIntro', { subjectId: 'mat', phaseId: 'mat-1' }));
  await p.click('#playBtn');
  await p.goBack(); await p.waitForTimeout(300);
  ok(await p.evaluate(() => NAV.screen === 'quiz'), 'no quiz, cancelar o "sair?" mantém a criança no quiz');

  // ---------------- Placar com pergunta aberta ----------------
  section('Placar');
  const r = await H.play(p, 'hist', 'hist-1', 99);
  ok(r.score.trim() === '5/5 corretas', `fase com pergunta aberta mostra 5/5 (mostrou "${r.score.trim()}")`);
  await ctx.close();

  // ---------------- Recuperar com código ----------------
  section('Recuperar progresso com código');
  ctx = await browser.newContext(ctxOpts);
  p = await H.open(ctx, server, 'app');
  await p.evaluate(() => {
    const db = { scores: {
      'id-antigo': { name: 'Bia', lastName: 'Lima', turma: 'B', avatar: '🧚', color: '#FF8FAB', xp: 500, stars: 7, code: 'K7P2QX',
        progress: { v: 1, coins: 200, badges: ['firstPhase', 'allStars'], streak: 3, avatarId: 'fairy',
          phaseResults: { 'port-1': { stars: 3, bestCorrect: 6, total: 6, attempts: 2 }, 'mat-1': { stars: 2, bestCorrect: 4, total: 6, attempts: 1 }, 'geo-1': { stars: 2, bestCorrect: 4, total: 6, attempts: 1 } } } },
    } };
    localStorage.setItem('__mockdb', JSON.stringify(db));
  });
  await H.newPlayer(p, 'Bia', 'Lima', 'B');
  await H.play(p, 'mat', 'mat-1', 6); // neste celular ela foi melhor na mat-1
  await p.click('#mapBtn');
  const localIdBefore = await p.evaluate(() => STATE.playerId);
  await p.click('#settingsBtn');
  await p.click('#restoreBtn');
  await p.fill('#codeInput', 'k7p-2qx');
  await p.click('#codeSearch');
  await p.waitForSelector('.restore-preview');
  ok(await p.$eval('.restore-preview', (e) => e.textContent.includes('Bia Lima')), 'mostra de quem é o código antes de recuperar');
  await p.click('#codeSearch');
  await p.waitForTimeout(900);
  const st = await p.evaluate(() => STATE);
  ok(st.playerId === 'id-antigo', 'passa a usar o mesmo registro do outro celular');
  ok(st.phaseResults['port-1'].stars === 3 && st.phaseResults['geo-1'].stars === 2, 'trouxe as fases do outro celular');
  ok(st.phaseResults['mat-1'].stars === 3, 'manteve a fase em que este celular estava melhor');
  ok(st.xp >= 500 && st.badges.includes('allStars'), 'XP e medalhas: fica o maior');
  const db = await p.evaluate(() => JSON.parse(localStorage.getItem('__mockdb')).scores);
  ok(db[localIdBefore] && db[localIdBefore].hidden === true, 'registro antigo deste celular some do ranking (sem apagar)');
  ok(db['id-antigo'].xp === st.xp, 'nuvem atualizada com o progresso juntado');

  // código errado
  await p.click('#settingsBtn');
  await p.click('#restoreBtn');
  await p.fill('#codeInput', 'ZZZZZZ');
  await p.click('#codeSearch');
  await p.waitForTimeout(400);
  ok(await p.$eval('#codeMsg', (e) => e.textContent.includes('Não achei')), 'código inexistente mostra aviso claro');
  await p.click('#codeClose');

  // ---------------- Sincronização nunca diminui a nuvem ----------------
  section('Sincronização segura');
  await p.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('__mockdb'));
    db.scores[STATE.playerId].xp = STATE.xp + 300; // outro celular avançou
    db.scores[STATE.playerId].progress.phaseResults['cien-1'] = { stars: 3, bestCorrect: 6, total: 6, attempts: 1 };
    localStorage.setItem('__mockdb', JSON.stringify(db));
  });
  const xpCloud = await p.evaluate(() => JSON.parse(localStorage.getItem('__mockdb')).scores[STATE.playerId].xp);
  await p.evaluate(() => syncScoreToCloud());
  await p.waitForTimeout(900);
  ok(await p.evaluate((x) => STATE.xp >= x && STATE.phaseResults['cien-1'], xpCloud), 'progresso de outro celular é trazido, não apagado');
  ok(await p.evaluate((x) => JSON.parse(localStorage.getItem('__mockdb')).scores[STATE.playerId].xp >= x, xpCloud), 'XP na nuvem nunca diminui');

  // ---------------- Reiniciar progresso ----------------
  section('Reiniciar progresso');
  const idBeforeReset = await p.evaluate(() => STATE.playerId);
  await p.click('#settingsBtn');
  await p.click('#resetBtn');
  await H.newPlayer(p, 'Bia', 'Lima', 'B');
  await p.waitForTimeout(900);
  const after = await p.evaluate(() => ({ id: STATE.playerId, xp: STATE.xp, cloud: JSON.parse(localStorage.getItem('__mockdb')).scores[STATE.playerId] }));
  ok(after.id === idBeforeReset && after.xp === 0 && after.cloud.xp === 0, 'reiniciar zera de verdade (nuvem não devolve o progresso antigo) e mantém o mesmo registro');

  // ---------------- Ranking ----------------
  section('Ranking');
  await p.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('__mockdb'));
    Object.assign(db.scores, {
      z1: { name: 'Explorador(a)', xp: 0, stars: 0, avatar: '🦸', color: '#fff', turma: 'A' },
      z2: { name: 'leonardo', lastName: 'SICILIANO', xp: 900, stars: 30, avatar: '🧭', color: '#fff', turma: 'B' },
      z3: { name: 'Gui', xp: 400, stars: 10, avatar: '🥷', color: '#fff', turma: 'A', hidden: true, mergedInto: 'x' },
    });
    for (let i = 0; i < 60; i++) db.scores['n' + i] = { name: 'Aluno' + i, xp: 1000 + i, stars: 1, avatar: '🦸', color: '#fff', turma: 'A' };
    localStorage.setItem('__mockdb', JSON.stringify(db));
  });
  await p.evaluate(() => goTo('ranking'));
  await p.waitForTimeout(600);
  const names = await p.$$eval('.rank-name', (els) => els.map((e) => e.textContent));
  ok(!names.some((n) => n.includes('Explorador')), 'cadastro que nunca jogou não aparece');
  ok(!names.some((n) => n.startsWith('Gui')), 'registro juntado com outro não aparece');
  ok(names.some((n) => n.includes('Leonardo Siciliano')), 'nomes aparecem com maiúsculas certas');
  ok(names.some((n) => n.includes('Bia')), 'o próprio jogador aparece mesmo com 0 XP');
  await p.click('.ranking-tab[data-filter="B"]');
  const namesB = await p.$$eval('.rank-name', (els) => els.map((e) => e.textContent));
  ok(namesB.some((n) => n.includes('Leonardo')) && namesB.length >= 2, `com mais de 60 alunos, Turma B continua mostrando todos (${namesB.length})`);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'sem rolagem lateral no ranking');
  ok(p.__errors.length === 0, 'sem erros de JavaScript' + (p.__errors[0] ? ': ' + p.__errors[0] : ''));
  await ctx.close();

  // ---------------- Alternativas embaralhadas ----------------
  section('Alternativas embaralhadas');
  ctx = await browser.newContext(ctxOpts);
  p = await H.open(ctx, server, 'app');
  await H.newPlayer(p);
  const pos = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (let k = 0; k < 12; k++) {
    await p.evaluate(() => goTo('phaseIntro', { subjectId: 'geo', phaseId: 'geo-3' }));
    await p.click('#playBtn');
    const r = await p.evaluate(() => {
      const q = QUIZ.questions[QUIZ.index];
      if (q.type !== 'choice' || q.multi) return null;
      return [...document.querySelectorAll('.option-btn')].findIndex((b) => +b.dataset.i === q.correct[0]);
    });
    if (r !== null) pos[r]++;
  }
  ok(pos[2] + pos[3] > 0, `a resposta certa também aparece em C e D (A:${pos[0]} B:${pos[1]} C:${pos[2]} D:${pos[3]})`);
  const order1 = await p.evaluate(() => QUIZ.questions.map((q) => q.id).join());
  await p.evaluate(() => goTo('map'));

  // ---------------- Regra de XP ----------------
  section('Regra de XP (comparando com o melhor resultado)');
  let r1 = await H.play(p, 'mat', 'mat-2', 4);
  ok(r1.xpRule === 'first' && r1.xpGained === 4 * 10 + 10, `1ª vez: XP completo (+${r1.xpGained})`);
  let r2b = await H.play(p, 'mat', 'mat-2', 4);
  ok(r2b.xpRule === 'same' && r2b.xpGained === 25, `igualou o recorde 4/6: metade (+${r2b.xpGained})`);
  ok(await p.$eval('.xp-note', (e) => e.textContent.includes('Acerte 5')), 'tela explica quanto precisa acertar');
  let r3 = await H.play(p, 'mat', 'mat-2', 5);
  ok(r3.xpRule === 'record' && r3.xpGained === 5 * 10 + 10, `bateu o recorde 5/6: XP completo (+${r3.xpGained})`);
  let r4 = await H.play(p, 'mat', 'mat-2', 2);
  ok(r4.xpRule === 'less' && r4.xpGained === 0 && r4.coinsGained === 10, 'acertou menos: sem XP, mas ganha moedas');
  ok(await p.evaluate(() => STATE.phaseResults['mat-2'].stars === 2 && STATE.phaseResults['mat-2'].bestCorrect === 5), 'estrelas e recorde nunca diminuem');
  let r5 = await H.play(p, 'mat', 'mat-2', 6);
  let r6 = await H.play(p, 'mat', 'mat-2', 6);
  ok(r6.xpRule === 'same' && r6.xpGained === 40, `gabaritou de novo: metade (+${r6.xpGained})`);
  const ordA = await p.evaluate(() => QUIZ.questions.map((q) => q.id).join());
  ok(ordA !== 'mat-2-1,mat-2-2,mat-2-3,mat-2-4,mat-2-5,mat-2-6' || true, 'ordem das questões muda ao repetir (checado abaixo)');
  let changed = false;
  for (let k = 0; k < 5 && !changed; k++) {
    await p.evaluate(() => goTo('phaseIntro', { subjectId: 'mat', phaseId: 'mat-2' }));
    await p.click('#playBtn');
    changed = (await p.evaluate(() => QUIZ.questions.map((q) => q.id).join())) !== 'mat-2-1,mat-2-2,mat-2-3,mat-2-4,mat-2-5,mat-2-6';
  }
  ok(changed, 'ao repetir uma fase, a ordem das questões muda');
  ok(p.__errors.length === 0, 'sem erros de JavaScript' + (p.__errors[0] ? ': ' + p.__errors[0] : ''));
  await ctx.close();

  // ---------------- Aprender (cartões) ----------------
  section('Aprender: cartões antes da fase');
  ctx = await browser.newContext(ctxOpts);
  p = await H.open(ctx, server, 'app');
  await H.newPlayer(p);
  await p.evaluate(() => goTo('phaseIntro', { subjectId: 'mat', phaseId: 'mat-1' }));
  ok(await p.$('#learnBtn') !== null, 'fase com lição mostra "Aprender primeiro"');
  ok(await p.$eval('#playBtn', (b) => b.textContent.includes('Já sei')), 'dá para pular com "Já sei, quero jogar"');
  ok(await p.evaluate(() => SUBJECTS.every((s) => s.phases.every((ph) => LESSONS[ph.id]))), 'todas as 23 fases têm lição');
  await p.evaluate(() => goTo('phaseIntro', { subjectId: 'mat', phaseId: 'mat-1' }));
  await p.click('#learnBtn');
  await p.waitForSelector('.lesson-card');
  ok(await p.$eval('.lesson-card', (e) => e.querySelector('.frac') !== null), 'cartão de Matemática mostra fração empilhada');
  await p.goBack(); await p.waitForTimeout(300);
  ok(await p.evaluate(() => NAV.screen === 'phaseIntro'), 'voltar do celular na lição leva à introdução da fase');
  await p.click('#learnBtn');
  const xp0 = await p.evaluate(() => STATE.xp);
  const nCards = await p.evaluate(() => LESSONS['mat-1'].cards.length);
  for (let k = 0; k < nCards; k++) await p.click('#lessonNext');
  ok(await p.$eval('#lessonNext', (b) => b.disabled), 'pergunta-relâmpago precisa ser respondida antes de jogar');
  await p.click('.lesson-card.check .option-btn');
  ok(await p.$('#checkFeedback .explain-box') !== null, 'pergunta-relâmpago mostra explicação');
  await p.click('#lessonNext');
  await p.waitForSelector('.q-card');
  ok(await p.evaluate((x) => STATE.studied['mat-1'] === true && STATE.xp === x + 10, xp0), 'concluir a lição dá +10 XP e já começa a fase');
  // rever a lição pelo "Por quê?"
  await H.answer(p, false).catch(() => {});
  await p.evaluate(() => goTo('phaseIntro', { subjectId: 'mat', phaseId: 'mat-1' }));
  await p.click('#playBtn');
  await p.evaluate(() => { const q = QUIZ.questions[QUIZ.index]; const c = document.querySelector('.q-card'); if (q.type === 'choice') q.correct.forEach((i) => c.querySelector(`.option-btn[data-i="${i}"]`).click()); else q.items.forEach((it, idx) => c.querySelector(`.mini-opt[data-item="${idx}"][data-opt="${it.correct}"]`).click()); c.querySelector('#qSubmit').click(); });
  ok(await p.$('.review-lesson-link') !== null, 'explicação tem "Rever a lição"');
  await p.click('.review-lesson-link');
  await p.waitForSelector('.modal-lesson .lesson-card');
  await p.click('.modal-close');
  ok(await p.evaluate(() => NAV.screen === 'quiz' && !!document.querySelector('.next-btn')), 'fechar a lição volta para a mesma questão');
  // segunda vez não dá XP de novo
  await p.evaluate(() => goTo('lesson', { subjectId: 'mat', phaseId: 'mat-1' }));
  const xp1 = await p.evaluate(() => STATE.xp);
  for (let k = 0; k < nCards; k++) await p.click('#lessonNext');
  await p.click('.lesson-card.check .option-btn');
  await p.click('#lessonNext');
  ok(await p.evaluate((x) => STATE.xp === x, xp1), 'reler a lição não dá XP de novo');
  // todas as lições renderizam sem estourar a tela
  const lessonIds = await p.evaluate(() => Object.keys(LESSONS));
  let overflowL = [];
  for (const id of lessonIds) {
    const subj = id.split('-')[0];
    await p.evaluate(([s, ph]) => goTo('lesson', { subjectId: s, phaseId: ph }), [subj, id]);
    const n = await p.evaluate((id) => LESSONS[id].cards.length, id);
    for (let k = 0; k <= n; k++) {
      if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) overflowL.push(id + '#' + k);
      if (k < n) await p.click('#lessonNext');
    }
  }
  ok(overflowL.length === 0, `${lessonIds.length} lições sem rolagem lateral` + (overflowL.length ? ': ' + overflowL.join(',') : ''));
  await p.waitForTimeout(600);
  ok(await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('__mockdb')).scores[STATE.playerId]; return d.progress.studied && d.progress.studied['mat-1'] === true; }), 'lições estudadas vão para a cópia na nuvem');

  // ---------------- Revisar meus erros ----------------
  section('Revisar meus erros');
  await H.play(p, 'geo', 'geo-1', 4);
  await p.click('#mapBtn');
  ok(await p.$('#reviewCta') !== null, 'erros da fase aparecem no botão "Revisar meus erros"');
  const nErr = await p.evaluate(() => mistakeQuestions().length);
  ok(nErr >= 2, `erros registrados (${nErr})`);
  const xpR = await p.evaluate(() => STATE.xp);
  await p.click('#reviewCta');
  const nRev = await p.evaluate(() => QUIZ.total);
  for (let k = 0; k < nRev; k++) await H.answer(p, true);
  await p.waitForSelector('.result-screen');
  ok(await p.evaluate((x) => STATE.xp === x + QUIZ.total * 5, xpR), 'cada erro corrigido dá +5 XP');
  ok(await p.evaluate(() => mistakeQuestions().length === 0), 'erros corrigidos saem da lista');
  ok(await p.$eval('.xp-note', (e) => e.textContent.includes('corrigiu todos')), 'tela comemora quando não sobra erro');
  ok(await p.evaluate(() => STATE.phaseResults['geo-1'].stars) === 2, 'revisão não mexe nas estrelas da fase');
  ok(p.__errors.length === 0, 'sem erros de JavaScript' + (p.__errors[0] ? ': ' + p.__errors[0] : ''));
  await ctx.close();

  // ---------------- Painel da turma ----------------
  section('Painel da turma (#painel)');
  ctx = await browser.newContext(ctxOpts);
  p = await H.open(ctx, server, 'app');
  await p.evaluate(() => {
    const ft = (wrongIds) => { const o = {}; ['mat-1-1', 'mat-1-2', 'geo-3-2'].forEach((id) => (o[id] = wrongIds.includes(id) ? 0 : 1)); return o; };
    const db = { scores: {
      a: { name: 'A', xp: 100, stars: 3, turma: 'A', avatar: 'x', color: '#fff', progress: { firstTry: ft(['mat-1-2']), studied: { 'mat-1': true } } },
      b: { name: 'B', xp: 100, stars: 3, turma: 'A', avatar: 'x', color: '#fff', progress: { firstTry: ft(['mat-1-2', 'geo-3-2']), studied: {} } },
      c: { name: 'C', xp: 100, stars: 3, turma: 'B', avatar: 'x', color: '#fff', progress: { firstTry: ft(['mat-1-2']), studied: { 'mat-1': true } } },
    } };
    localStorage.setItem('__mockdb', JSON.stringify(db));
  });
  await p.goto(p.url().split('#')[0] + '#painel');
  await p.reload();
  await p.waitForSelector('.panel-row');
  const top = await p.$eval('.panel-row', (e) => e.textContent);
  ok(top.includes('100%') && top.includes('3 de 3'), 'questão que todos erraram aparece no topo (100%)');
  ok(await p.$$eval('.panel-row', (r) => r.length) === 3, 'mostra só questões com pelo menos 3 respostas');
  await p.click('#panelTabs .ranking-tab[data-filter="B"]');
  ok(await p.$eval('#panelBody', (e) => e.textContent.includes('poucos dados')), 'filtro por turma funciona');
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'painel sem rolagem lateral');
  ok(p.__errors.length === 0, 'sem erros de JavaScript no painel');
  await ctx.close();

  // ---------------- Sem internet ----------------
  section('Sem internet');
  ctx = await browser.newContext(ctxOpts);
  p = await H.open(ctx, server, 'app', { offline: true });
  await H.newPlayer(p);
  const r2 = await H.play(p, 'port', 'port-1', 6);
  ok(r2.stars === 3, 'joga normalmente sem internet');
  await p.click('#mapBtn');
  await p.click('#settingsBtn');
  await p.click('#restoreBtn');
  await p.fill('#codeInput', 'K7P2QX');
  await p.click('#codeSearch');
  await p.waitForTimeout(300);
  ok(await p.$eval('#codeMsg', (e) => e.textContent.includes('internet')), 'recuperar sem internet avisa e não trava');
  ok(p.__errors.length === 0, 'sem erros de JavaScript offline');
  await ctx.close();

  await browser.close();
  server.close();
  const f = H.failures();
  console.log(f ? `\n✘ ${f} verificação(ões) falharam` : '\n✔ Todos os testes do app passaram');
  process.exit(f ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
