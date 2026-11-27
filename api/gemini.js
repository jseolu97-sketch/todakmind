// Vercel 서버 함수: 브라우저 → /api/gemini → Google Gemini
//
// Vercel 프로젝트의 Settings → Environment Variables 에 넣어요.
//   GEMINI_API_KEY  (필수) Google AI Studio에서 받은 키. 브라우저에는 절대 보내지 않아요.
//   GEMINI_MODEL    (선택) 기본값 gemini-3.5-flash-lite
//   ALLOWED_ORIGIN  (선택) 예: https://todak.vercel.app  — 다른 사이트에서 이 함수를 부르지 못하게 막아요.
//
// 사용자가 쓴 글은 Gemini에 전달만 하고 저장하거나 로그에 남기지 않아요.

const MODEL_DEFAULT = 'gemini-3.5-flash-lite';
const MAX_PROMPT = 12000; // 한 번에 보내는 글자 수 (규칙 + 대화)

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || MODEL_DEFAULT;

  const allowed = process.env.ALLOWED_ORIGIN;
  const origin = req.headers && req.headers.origin;
  if (allowed && origin && origin !== allowed) return res.status(403).json({ code: 'forbidden' });

  // 연결 확인: 키가 설정돼 있는지만 알려 줌 (키 값은 보내지 않음)
  if (req.method === 'GET') return res.status(200).json({ ok: !!key, model: key ? model : '' });
  if (req.method !== 'POST') return res.status(405).json({ code: 'method_not_allowed' });
  if (!key) return res.status(503).json({ code: 'not_configured' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  // 두 가지 모양을 받아요.
  //  1) { prompt, json }                    — 한 번 묻고 답 받기 (4컷, 피드백 등)
  //  2) { system, messages:[{role,text}] }  — 이어지는 대화 (role: 'user' | 'model')
  let contents = [], system = '';
  if (Array.isArray(body.messages)) {
    contents = body.messages.slice(-30)
      .filter(m => m && typeof m.text === 'string' && m.text.trim())
      .map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] }));
    while (contents.length && contents[0].role !== 'user') contents.shift();   // 사용자 말로 시작
    if (!contents.length || contents[contents.length - 1].role !== 'user') return res.status(400).json({ code: 'bad_request' });
    system = typeof body.system === 'string' ? body.system : '';
  } else if (typeof body.prompt === 'string' && body.prompt) {
    contents = [{ role: 'user', parts: [{ text: body.prompt }] }];
  } else {
    return res.status(400).json({ code: 'bad_request' });
  }
  const total = system.length + contents.reduce((n, c) => n + c.parts[0].text.length, 0);
  if (total > MAX_PROMPT) return res.status(400).json({ code: 'too_long' });

  try {
    const payload = { contents, generationConfig: body.json ? { responseMimeType: 'application/json' } : {} };
    if (system) payload.systemInstruction = { parts: [{ text: system }] };
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(payload),
      }
    );
    if (!r.ok) {
      const code = r.status === 429 ? 'rate_limited' : [400, 401, 403, 404].includes(r.status) ? 'bad_key' : 'upstream';
      console.error('Gemini 응답 오류', r.status, model); // 사용자 글은 남기지 않음
      return res.status(r.status === 429 ? 429 : 502).json({ code });
    }
    const d = await r.json();
    const parts = (d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || [];
    const text = parts.map(p => p.text || '').join('').trim();
    if (!text) return res.status(200).json({ code: d.promptFeedback && d.promptFeedback.blockReason ? 'blocked' : 'empty' });
    return res.status(200).json({ text });
  } catch (e) {
    console.error('Gemini 연결 실패');
    return res.status(502).json({ code: 'network' });
  }
};
