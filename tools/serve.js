// 내 컴퓨터에서 미리보기: node tools/serve.js → http://localhost:5173
// /api/gemini 도 Vercel과 같은 함수(api/gemini.js)로 돌아가요.
//   실제 Gemini로 시험: GEMINI_API_KEY=키 node tools/serve.js
//   가짜 Gemini로 시험: MOCK_GEMINI=1 node tools/serve.js   (키 없이 화면 흐름만 확인)
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' };

if (process.env.MOCK_GEMINI) {
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'mock-key';
  const realFetch = global.fetch;
  global.fetch = async (url, opt) => {
    if (!String(url).includes('generativelanguage.googleapis.com')) return realFetch(url, opt);
    const body = JSON.parse(opt.body); const p = body.contents[0].parts[0].text;
    let text = '그랬구나. 그 일 때문에 정말 속상했겠다. 여기선 천천히 말해도 돼.\n#표정:글썽';
    if (p.includes('panels')) text = JSON.stringify({ panels: ['단톡에서 나만 빼고 약속을 잡았어', '서운하고 외로웠어', '네 잘못이 아니야, 토닥토닥', '그 마음, 친구에게 말해 볼까?'] });
    else if (p.includes('"good"')) text = JSON.stringify({ good: ['"나는"으로 마음을 먼저 꺼냈어'], tip: '마지막에 고맙다는 말도 붙여 봐' });
    else if (p.includes('말 연습 역할극')) text = '…그렇게 말해 주니까 조금 알 것 같아.';
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
}
const gemini = require('../api/gemini.js');

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);

  if (p === '/api/gemini') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    return req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      try { req.body = raw ? JSON.parse(raw) : undefined; } catch { req.body = raw; }
      res.status = code => { res.statusCode = code; return res; };
      res.json = obj => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); };
      gemini(req, res).catch(() => { res.statusCode = 500; res.end('{}'); });
    });
  }

  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  // 개발용: 브라우저에서 줄인 webp 이미지를 assets/에 저장
  if (req.method === 'PUT' && /^\/assets\/[\w-]+\.webp$/.test(p)) {
    const chunks = []; req.on('data', c => chunks.push(c));
    return req.on('end', () => { fs.writeFileSync(f, Buffer.concat(chunks)); res.end('ok'); });
  }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
    res.end(d);
  });
}).listen(5173, () => console.log('http://localhost:5173' + (process.env.MOCK_GEMINI ? ' (가짜 Gemini)' : '')));
