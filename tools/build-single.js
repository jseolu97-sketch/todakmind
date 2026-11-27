// 연수용 단일 파일 만들기: index.html + assets/*.webp → dist/토닥토닥-마음동네.html
// 실행: node tools/build-single.js
// 그림을 모두 파일 안에 넣어서, 이 HTML 파일 하나만 나눠 주면 브라우저에서 바로 열려요.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
let page = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

let count = 0;
page = page.replace(/assets\/([\w-]+)\.webp/g, (m, name) => {
  const f = path.join(ROOT, 'assets', name + '.webp');
  if (!fs.existsSync(f)) throw new Error('그림 파일이 없어요: ' + f);
  count++;
  return 'data:image/webp;base64,' + fs.readFileSync(f).toString('base64');
});

// <title>…</style> 까지는 head, 나머지는 body
const cut = page.indexOf('</style>') + '</style>'.length;
const head = page.slice(0, cut), body = page.slice(cut);
const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
${head.replace('<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">', '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">')}
<style>body{margin:0}</style>
</head>
<body>${body}
</body>
</html>
`;
fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
const out = path.join(ROOT, 'dist', '토닥토닥-마음동네.html');
fs.writeFileSync(out, html);
console.log(`만들었어요: ${out} (그림 ${count}곳, ${(html.length / 1024).toFixed(0)}KB)`);
