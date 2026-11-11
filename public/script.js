
// ================================
// 1. MBTI 16가지 유형
// ================================

const mbtiTypes = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
];

// 선택한 MBTI와 대화 기록
let selectedMBTI = null;
let conversationHistory = [];
let isLoading = false;

// HTML 요소 가져오기
const mbtiGrid = document.getElementById('mbtiGrid');
const selectedMessage = document.getElementById('selectedMessage');
const messageInput = document.getElementById('messageInput');
const chatForm = document.getElementById('chatForm');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chatMessages');
const charCount = document.getElementById('charCount');


// ================================
// 2. MBTI 선택 버튼 생성
// ================================

function createMBTIButtons() {
  mbtiTypes.forEach(type => {
    const button = document.createElement('button');

    button.type = 'button';
    button.textContent = type;
    button.classList.add('mbti-button');
    button.setAttribute('aria-pressed', 'false');

    button.addEventListener('click', () => {
      selectMBTI(type, button);
    });

    mbtiGrid.appendChild(button);
  });
}


// ================================
// 3. MBTI 선택 기능
// ================================

function selectMBTI(type, selectedButton) {
  selectedMBTI = type;

  // 모든 버튼의 선택 상태 초기화
  document.querySelectorAll('.mbti-button').forEach(button => {
    button.classList.remove('active');
    button.setAttribute('aria-pressed', 'false');
  });

  // 선택한 버튼에 active 적용
  selectedButton.classList.add('active');
  selectedButton.setAttribute('aria-pressed', 'true');

  // 선택 안내 문구 변경
  selectedMessage.textContent =
    `현재 ${type} 모드로 이야기할게요. 편하게 고민을 들려주세요!`;

  // 입력창 활성화
  messageInput.disabled = false;
  sendButton.disabled = false;

  messageInput.placeholder =
    `${type} 유형으로서 요즘 어떤 고민이 있으신가요?`;

  messageInput.focus();
}


// ================================
// 4. 채팅 메시지 화면에 표시
// ================================

function appendMessage(role, text) {
  const message = document.createElement('div');
  message.classList.add('chat-message', role);

  const avatar = document.createElement('div');
  avatar.classList.add('message-avatar');
  avatar.textContent = role === 'user' ? '나' : '♡';

  const content = document.createElement('div');
  content.classList.add('message-content');

  const name = document.createElement('strong');
  name.textContent = role === 'user' ? '나' : '맘모드';

  const paragraph = document.createElement('p');
  paragraph.textContent = text;

  content.appendChild(name);
  content.appendChild(paragraph);

  message.appendChild(avatar);
  message.appendChild(content);

  chatMessages.appendChild(message);

  // 최신 메시지가 보이도록 자동 스크롤
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return message;
}


// ================================
// 5. AI 답변 대기 표시
// ================================

function showLoading() {
  const message = document.createElement('div');
  message.classList.add('chat-message', 'assistant');

  const avatar = document.createElement('div');
  avatar.classList.add('message-avatar');
  avatar.textContent = '♡';

  const content = document.createElement('div');
  content.classList.add('message-content');

  const name = document.createElement('strong');
  name.textContent = '맘모드';

  const paragraph = document.createElement('p');
  paragraph.classList.add('loading-text');
  paragraph.textContent = '맘모드가 이야기를 듣고 있어요...';

  content.appendChild(name);
  content.appendChild(paragraph);
  message.appendChild(avatar);
  message.appendChild(content);

  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return message;
}


// ================================
// 6. OpenAI API와 연결
// ================================

async function sendMessage(message) {
  const previousHistory = [...conversationHistory];

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        mbti: selectedMBTI,
        message: message,
        history: previousHistory
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '답변을 불러오지 못했습니다.');
    }

    if (typeof data.reply !== 'string' || !data.reply.trim()) {
      throw new Error('AI 답변이 비어 있습니다. 다시 시도해 주세요.');
    }

    // 대화 기록 저장
    conversationHistory.push(
      { role: 'user', content: message },
      { role: 'assistant', content: data.reply }
    );

    // 최근 대화 10개만 유지
    conversationHistory = conversationHistory.slice(-10);

    // AI 답변 출력
    appendMessage('assistant', data.reply);

  } catch (error) {
    console.error('채팅 오류:', error);

    appendMessage(
      'assistant',
      `죄송해요. 답변을 생성하지 못했어요.\n${error.message}`
    );
  }
}


// ================================
// 7. 메시지 전송
// ================================

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const message = messageInput.value.trim();

  // 입력값 확인
  if (!selectedMBTI) {
    alert('먼저 MBTI를 선택해 주세요.');
    return;
  }

  if (!message || isLoading) {
    return;
  }

  isLoading = true;

  // 사용자 메시지 표시
  appendMessage('user', message);

  // 입력창 초기화
  messageInput.value = '';
  charCount.textContent = '0 / 2000';

  // 대기 상태 표시
  const loadingMessage = showLoading();

  sendButton.disabled = true;
  messageInput.disabled = true;

  try {
    await sendMessage(message);
  } finally {
    loadingMessage.remove();

    isLoading = false;

    messageInput.disabled = !selectedMBTI;
    sendButton.disabled = !selectedMBTI;

    messageInput.focus();
  }
});


// ================================
// 8. 글자 수 표시 및 키보드 기능
// ================================

messageInput.addEventListener('input', () => {
  charCount.textContent =
    `${messageInput.value.length} / 2000`;
});

// Enter: 전송
// Shift + Enter: 줄바꿈
messageInput.addEventListener('keydown', (event) => {
  if (
    event.key === 'Enter' &&
    !event.shiftKey &&
    !event.isComposing
  ) {
    event.preventDefault();

    if (!sendButton.disabled) {
      chatForm.requestSubmit();
    }
  }
});


// ================================
// 9. 프로그램 시작
// ================================

createMBTIButtons();

console.log('맘모드가 준비되었습니다!');
