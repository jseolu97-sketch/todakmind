// Vercel 서버 함수: 브라우저 → /api/gemini → Google Gemini
//
// Vercel 프로젝트의 Settings → Environment Variables 에 넣어요.
//   GEMINI_API_KEY  (필수) Google AI Studio에서 받은 키. 브라우저에는 절대 보내지 않아요.
//   GEMINI_MODEL    (선택) 기본값 gemini-3.5-flash-lite
//   ALLOWED_ORIGIN  (선택) 예: https://todak.vercel.app  — 다른 사이트에서 이 함수를 부르지 못하게 막아요.
//
// 사용자가 쓴 글은 Gemini에 전달만 하고 저장하거나 로그에 남기지 않아요.

const MODEL_DEFAULT = 'gemini-3.5-flash-lite';
const MAX_PROMPT = 8000; // 글자 수

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
  const prompt = body && typeof body.prompt === 'string' ? body.prompt : '';
  if (!prompt || prompt.length > MAX_PROMPT) return res.status(400).json({ code: 'bad_request' });

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: body.json ? { responseMimeType: 'application/json' } : {},
        }),
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
