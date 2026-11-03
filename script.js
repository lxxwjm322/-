// script.js —— 消费性格测试网页版逻辑

const state = {
  currentIdx: 0,
  selectedOption: null,
  answers: [],        // [{ qIndex, option, pole }]
  code: ''
};

const TOTAL = QUESTIONS.length;

/* ========== 工具函数 ========== */
function $(id) { return document.getElementById(id); }

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo(0, 0);
}

function toast(msg, duration = 1800) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

/* ========== 首页走马灯 ========== */
function initMarquee() {
  const list = $('marquee-list');
  const items = Object.values(PERSONALITIES).slice(0, 8);
  list.innerHTML = items.map(p =>
    `<div class="marquee-item">
      <div class="m-emoji">${p.emoji}</div>
      <div class="m-name">${p.name}</div>
    </div>`
  ).join('');
}

/* ========== 开始测试 ========== */
function startQuiz() {
  state.currentIdx = 0;
  state.selectedOption = null;
  state.answers = [];
  state.code = '';
  showScreen('screen-quiz');
  renderQuestion();
}

/* ========== 答题 ========== */
function renderQuestion() {
  const q = QUESTIONS[state.currentIdx];
  state.selectedOption = null;

  $('q-dimension').textContent = DIMENSION_LABELS[q.dimension] || '';
  $('q-title').textContent = q.title;

  const optionsEl = $('options');
  optionsEl.innerHTML = q.options.map((opt, i) =>
    `<div class="option" data-index="${i}" onclick="selectOption(${i})">
      <div class="option-circle">${i === 0 ? 'A' : 'B'}</div>
      <div class="option-text">${opt.text}</div>
      <div class="option-check">✓</div>
    </div>`
  ).join('');

  // 进度
  const pct = ((state.currentIdx + 1) / TOTAL) * 100;
  $('progress-inner').style.width = pct + '%';
  $('progress-text').textContent = `${state.currentIdx + 1} / ${TOTAL}`;

  // 按钮
  $('btn-back').style.display = state.currentIdx > 0 ? 'inline-block' : 'none';
  const nextBtn = $('btn-next');
  nextBtn.textContent = state.currentIdx === TOTAL - 1 ? '查看结果 🎉' : '下一题 →';
  nextBtn.disabled = true;
}

function selectOption(index) {
  state.selectedOption = index;
  // 高亮
  document.querySelectorAll('.option').forEach((el, i) => {
    el.classList.toggle('active', i === index);
  });
  $('btn-next').disabled = false;

  // 非最后一题自动进入下一题
  if (state.currentIdx < TOTAL - 1) {
    setTimeout(() => saveAndNext(index), 280);
  }
}

function saveAnswer(optionIndex) {
  const q = QUESTIONS[state.currentIdx];
  const ans = { qIndex: state.currentIdx, option: optionIndex, pole: q.options[optionIndex].pole };
  const existing = state.answers.findIndex(a => a.qIndex === state.currentIdx);
  if (existing >= 0) state.answers[existing] = ans;
  else state.answers.push(ans);
}

function saveAndNext(optionIndex) {
  saveAnswer(optionIndex);
  state.currentIdx++;
  renderQuestion();
}

function nextQuestion() {
  if (state.selectedOption === null) return;
  saveAnswer(state.selectedOption);

  if (state.currentIdx === TOTAL - 1) {
    // 计算结果，直接展示
    state.code = calcPersonality(state.answers);
    renderResult();
    showScreen('screen-result');
  } else {
    state.currentIdx++;
    renderQuestion();
  }
}

function prevQuestion() {
  if (state.currentIdx > 0) {
    state.currentIdx--;
    renderQuestion();
    // 回显
    const prev = state.answers.find(a => a.qIndex === state.currentIdx);
    if (prev !== undefined) {
      state.selectedOption = prev.option;
      document.querySelectorAll('.option').forEach((el, i) => {
        el.classList.toggle('active', i === prev.option);
      });
      $('btn-next').disabled = false;
    }
  }
}

/* ========== 计分 ========== */
function calcPersonality(answers) {
  const counts = {
    decision: { P: 0, I: 0 },
    value: { U: 0, E: 0 },
    time: { F: 0, N: 0 },
    social: { S: 0, M: 0 }
  };
  answers.forEach(a => {
    const q = QUESTIONS[a.qIndex];
    if (!q) return;
    const dim = q.dimension;
    if (counts[dim] && counts[dim][a.pole] !== undefined) counts[dim][a.pole]++;
  });
  const pick = (dim, a, b) => (counts[dim][a] >= counts[dim][b] ? a : b);
  return pick('decision', 'P', 'I') + pick('value', 'U', 'E')
       + pick('time', 'F', 'N') + pick('social', 'S', 'M');
}

function buildPersonalNote(answers) {
  if (!answers || !answers.length) return '';
  const note = [];
  const pCount = answers.filter(a => a.pole === 'P').length;
  const iCount = answers.filter(a => a.pole === 'I').length;
  const eCount = answers.filter(a => a.pole === 'E').length;
  const nCount = answers.filter(a => a.pole === 'N').length;
  const sCount = answers.filter(a => a.pole === 'S').length;
  if (pCount >= 3) note.push(`你在 ${pCount} 道题中选择了"先做攻略"，说明你是个做决定很稳的人`);
  if (iCount >= 3) note.push(`你有 ${iCount} 次选择了"喜欢就买"，行动力拉满`);
  if (eCount >= 3) note.push(`你 ${eCount} 次为"颜值和体验"买单，是懂生活的人`);
  if (nCount >= 3) note.push(`你 ${nCount} 次选择"活在当下"，是不折不扣的及时行乐派`);
  if (sCount >= 3) note.push(`你有 ${sCount} 次倾向于"分享和社交"，朋友圈一定很精彩`);
  return note.slice(0, 2).join('；') + '。';
}

/* ========== 结果页 ========== */
function renderResult() {
  const p = PERSONALITIES[state.code];
  if (!p) { showScreen('screen-home'); return; }

  $('p-emoji').textContent = p.emoji;
  $('p-code').textContent = p.code;
  $('p-name').textContent = p.name;
  $('p-tagline').textContent = p.tagline;
  $('p-tags').innerHTML = p.keywords.map(k => `<span class="tag">${k}</span>`).join('');
  $('p-advice').textContent = (p.deepReport.advice && p.deepReport.advice[0]) || p.tagline;
}

function shareResult() {
  const p = PERSONALITIES[state.code];
  const text = `我是${p.name}${p.emoji}！快来测测你的消费人格～`;
  if (navigator.share) {
    navigator.share({ title: text, text, url: window.location.href })
      .catch(() => copyToClipboard(text));
  } else {
    copyToClipboard(text + ' ' + window.location.href);
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => toast('已复制，去分享吧～'));
  } else {
    toast(text);
  }
}

function retry() {
  showScreen('screen-home');
}

/* ========== 深度报告 ========== */
function goDeepReport() {
  renderDeepContent();
  showScreen('screen-deep');
}

function renderDeepContent() {
  const p = PERSONALITIES[state.code];
  if (!p) return;
  const d = p.deepReport;

  $('rh-emoji').textContent = p.emoji;
  $('rh-code').textContent = p.code;
  $('rh-name').textContent = p.name;

  const note = buildPersonalNote(state.answers);
  if (note) {
    $('note-section').style.display = 'block';
    $('rh-note').textContent = note;
  } else {
    $('note-section').style.display = 'none';
  }

  $('rh-overview').textContent = d.overview;
  $('rh-strengths').innerHTML = d.strengths.map(s => `<div class="list-item"><span class="bullet">🌟</span><span>${s}</span></div>`).join('');
  $('rh-weaknesses').innerHTML = d.weaknesses.map(s => `<div class="list-item"><span class="bullet">⚡</span><span>${s}</span></div>`).join('');
  $('rh-advice').innerHTML = d.advice.map(s => `<div class="list-item"><span class="bullet">💡</span><span>${s}</span></div>`).join('');
  $('rh-financial').innerHTML = d.financial.map(s => `<div class="list-item"><span class="bullet">📈</span><span>${s}</span></div>`).join('');
}

function backToResult() {
  showScreen('screen-result');
}

/* ========== 初始化 ========== */
window.addEventListener('DOMContentLoaded', () => {
  initMarquee();
});
