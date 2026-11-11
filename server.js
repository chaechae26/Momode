
import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3000;

// JSON 형식의 요청을 받을 수 있도록 설정
app.use(express.json());

// 웹사이트 파일을 public 폴더에서 제공
app.use(express.static('public'));

// 16가지 MBTI 확인
const validMBTI = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
];

// AI 고민 상담 API
app.post('/api/chat', async (req, res) => {
  try {
    const { mbti, message, history = [] } = req.body;

    // 입력값 확인
    if (!validMBTI.includes(mbti)) {
      return res.status(400).json({
        error: '올바른 MBTI를 선택해 주세요.'
      });
    }

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: '고민 내용을 입력해 주세요.'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        error: '고민은 2,000자 이내로 입력해 주세요.'
      });
    }

    // 대화 기록 정리
    const safeHistory = Array.isArray(history)
      ? history
          .filter(item =>
            item &&
            ['user', 'assistant'].includes(item.role) &&
            typeof item.content === 'string'
          )
          .slice(-10)
          .map(item => ({
            role: item.role,
            content: item.content.slice(0, 2000)
          }))
      : [];

    // API 키 확인 및 OpenAI 연결
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OpenAI API 키가 설정되지 않았습니다.'
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // MBTI에 따른 맞춤형 상담 지침
    const instructions = `
당신은 '맘모드 (MOMODE)'라는 AI 고민 상담 챗봇입니다.

사용자가 선택한 MBTI는 ${mbti}입니다.

[상담 원칙]
1. 사용자의 고민을 먼저 충분히 공감하고 경청합니다.
2. 사용자의 MBTI 성향을 참고하여 대화 방식을 조절합니다.
3. MBTI를 근거로 사용자의 성격을 단정하지 않습니다.
4. 사용자가 원하는 경우 현실적인 해결 방법을 제안합니다.
5. 무조건적인 긍정이나 형식적인 위로는 피합니다.
6. 자연스럽고 따뜻한 한국어를 사용합니다.
7. 답변은 이해하기 쉽게 작성합니다.
8. 필요하면 추가 질문을 하여 고민을 더 깊이 이해합니다.

[MBTI별 대화 스타일]
- E: 활발하고 적극적으로 대화합니다.
- I: 차분하고 편안하게 대화합니다.
- S: 구체적이고 현실적인 방법을 제안합니다.
- N: 다양한 관점과 가능성을 생각합니다.
- T: 논리적인 분석과 해결책을 제공합니다.
- F: 감정을 이해하고 따뜻하게 공감합니다.
- J: 체계적이고 계획적인 조언을 제공합니다.
- P: 유연하고 자유로운 선택지를 제공합니다.

위 성향은 대화 참고용이며 개인차를 존중합니다.

[주의 사항]
정신건강 전문의를 대신해 진단하지 않습니다.
자해나 자살 등 긴급한 위험이 드러나면
공감하고 안전 확보 및 전문적인 도움을 우선 안내합니다.

가장 중요한 것은 사용자가 편안하게
자신의 고민을 이야기할 수 있도록 하는 것입니다.
`;

    // OpenAI API에 질문 전달
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-6-luna',
      instructions: instructions,
      input: [
        ...safeHistory,
        {
          role: 'user',
          content: message
        }
      ],
      max_output_tokens: 500
    });

    // AI 답변 반환
    res.json({
      reply: response.output_text
    });

  } catch (error) {
    console.error('AI 응답 오류:', error);

    res.status(500).json({
      error: '답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.'
    });
  }
});

// 서버 실행
app.listen(PORT, '0.0.0.0', () => {
  console.log(`맘모드 서버 실행 중: http://localhost:${PORT}`);
});
