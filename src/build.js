// Monta o index.html final, com CSS e JS inline em um único arquivo.
//
// Como publicar uma mudança com segurança:
//   1. node build.js                                   -> gera index.html
//   2. node tests/app.test.js index.html               -> testes do app (tem que passar tudo)
//   3. node tests/migration.test.js <versão publicada>.html index.html
//                                                      -> garante que ninguém perde progresso
//   4. Só então subir o index.html para a raiz do repositório (GitHub Pages publica sozinho).
// Os testes precisam do Playwright (npm i playwright).
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
const questionsJs = fs.readFileSync(path.join(__dirname, 'questions.js'), 'utf8');
const engineJs = fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8');
const lessonsJs = fs.readFileSync(path.join(__dirname, 'lessons.js'), 'utf8');
const cloudJs = fs.readFileSync(path.join(__dirname, 'cloud.js'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/>
<title>Aventura do 3º Trimestre — 4º Ano</title>
<meta name="description" content="Jogo educativo gamificado de revisão do 3º trimestre do 4º ano: Língua Portuguesa, Matemática, História, Geografia, Ciências e Inglês."/>
<meta name="theme-color" content="#1B2A4A"/>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🦉</text></svg>"/>
<style>
${css}
</style>
</head>
<body>
<div id="app"></div>
<div id="toast"></div>
<script src="https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore-compat.js"></script>
<script>
${questionsJs}
</script>
<script>
${lessonsJs}
</script>
<script>
${engineJs}
</script>
<script>
${cloudJs}
</script>
<script>
${appJs}
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('index.html gerado:', (html.length/1024).toFixed(1), 'KB');
