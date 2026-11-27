# 토닥토닥 마음 동네

학부모와 중학생이 각자 속상한 마음을 털어놓고 위로받는 연수용 웹앱이에요.
아기 수달 '토닥이'가 비 오는 밤의 작은 동네에서 맞아 줘요.

- **얘기 좀 들어줘**: 위로의 방 · 공감의 방 · 같이 편들어 주는 방
- **마음 쓰레기통**: 구기기 · 날리기 · 찢기 (쓴 글은 어디에도 저장·전송하지 않음)
- **오늘을 4컷으로**: 털어놓은 이야기를 4컷 만화로 정리하고, 하고 싶던 말을 연습
- **회전식당**: 떡볶이 · 마라탕 · 호떡에 토핑을 얹어 한 입씩 먹으면 마음 온도가 1도 내려감
- 들어올 때와 나갈 때의 마음 온도 비교, 오늘의 위로 카드(이미지 저장)
- 위험한 말('죽고 싶다', '맞았다' 등)이 나오면 멈추고 청소년상담 1388 · 자살예방 상담전화 109 안내

그림은 모두 Higgsfield로 만들었어요. AI 답변은 Google Gemini API를 써요.

## 폴더 구조

```
index.html          앱 전체 (화면 · 스타일 · 동작)
assets/*.webp       그림
api/gemini.js       Vercel 서버 함수: 브라우저 → /api/gemini → Gemini (키는 서버에만)
tools/serve.js      내 컴퓨터에서 미리보기
tools/build-single.js  그림을 넣은 단일 HTML 만들기 (AI 없이 준비한 말로만 답함)
```

## Vercel로 배포하기

1. 이 저장소를 GitHub에 올려요.
2. [vercel.com](https://vercel.com)에 GitHub 계정으로 로그인 → **Add New… → Project** → 이 저장소를 **Import**.
3. Framework Preset은 **Other** 그대로 두고, Build Command와 Output Directory는 비워 둬요.
4. **Environment Variables**에 아래를 넣고 **Deploy**.

   | 이름 | 값 | 필수 |
   |---|---|---|
   | `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com)에서 받은 키 | 필수 |
   | `GEMINI_MODEL` | 예: `gemini-3.5-flash-lite` (비우면 이 값) | 선택 |
   | `ALLOWED_ORIGIN` | 배포 주소, 예: `https://todak.vercel.app` | 선택(권장) |

5. 배포가 끝나면 나오는 주소(`https://○○○.vercel.app`)를 연수 참가자에게 나눠 주면 돼요.
   시작 화면 안내 문구에 "토닥이의 답은 Google Gemini가 만들어요"가 보이면 연결된 거예요.

환경 변수를 바꾼 뒤에는 **Deployments → Redeploy**를 한 번 눌러야 적용돼요.
GitHub에 새로 올리면(push) Vercel이 자동으로 다시 배포해요.

## 내 컴퓨터에서 미리보기

```
node tools/serve.js                       # AI 없이 (준비한 말로 답함)
MOCK_GEMINI=1 node tools/serve.js         # 가짜 Gemini로 화면 흐름 확인
GEMINI_API_KEY=키 node tools/serve.js     # 실제 Gemini로 확인
```

브라우저에서 http://localhost:5173 을 열어요. (Node 18 이상)

## 꼭 지켜 주세요

- **성인 연수용으로만** 써 주세요. Gemini API 약관상 만 18세 이상만 쓸 수 있고, 18세 미만이 쓰는 앱에는 쓸 수 없어요.
  '학생이에요' 역할은 선생님이 학생 입장이 되어 체험하는 용도예요.
- **무료 Gemini는 Google 검토자가 입력과 답변을 볼 수 있어요.** 실제 고민 대신 예시 사례로 연습해 주세요.
- **키는 Vercel 환경 변수에만** 넣어요. `index.html`이나 GitHub에 키를 적지 마세요.
- 배포 주소를 아는 사람은 누구나 이 앱(=진행자 키)을 쓸 수 있어요. 무료 사용량은 모두가 나눠 써요.
  연수가 끝나면 Vercel에서 프로젝트를 잠시 멈추거나, `GEMINI_API_KEY`를 지우고 Redeploy 하세요.
- 앱은 쓴 글을 저장하지 않아요. 서버 함수도 글을 로그에 남기지 않아요.

## 위기 상황 안내

- 청소년상담 **1388** (24시간, 전화 · 문자 #1388 · 카카오톡)
- 자살예방 상담전화 **109** (24시간)
- 지금 위험하면 **112** · **119**
