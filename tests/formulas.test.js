import { LEVELS } from './phases.js';
import { GameEngine } from './engine.js';
import { buildMiniGrid, isFormulaAccepted, computeResult } from './miniExcel.js';
import { loadProgress, saveProgress } from './progress.js';

const canvas = document.getElementById('gameCanvas');
const xpEl = document.getElementById('xpValue');
const coinsEl = document.getElementById('coinsValue');
const livesEl = document.getElementById('livesValue');
const doorEl = document.getElementById('doorState');
const labelEl = document.getElementById('phaseLabel');
const missionEl = document.getElementById('missionText');
const feedbackEl = document.getElementById('feedback');
const formulaInput = document.getElementById('formula');
const miniGridEl = document.getElementById('miniGrid');
const advanceBtn = document.getElementById('advanceBtn');
const downloadBtn = document.getElementById('downloadBtn');
const sendBtn = document.getElementById('sendBtn');
const soundBtn = document.getElementById('soundBtn');
const studentNameEl = document.getElementById('studentName');
const studentClassEl = document.getElementById('studentClass');

const state = loadProgress();

const engine = new GameEngine({
  canvas,
  onStateChange: (next) => {
    xpEl.textContent = `⭐ ${next.xp} XP`;
    coinsEl.textContent = `🪙 ${next.coinsCollected ?? 0}/${LEVELS[next.levelIndex].coins.length}`;
    livesEl.textContent = `❤️`.repeat(Math.max(0, next.life));
    doorEl.textContent = next.correct ? '🔓 Saída aberta' : '🔒 Saída fechada';
  },
  onWin: () => {
    console.log('Win event');
  }
});

engine.state = {
  ...engine.state,
  ...state,
  coinsCollected: 0,
  levelIndex: state.level || 0,
  soundOn: state.soundOn !== false,
  unlocked: state.unlocked || 0,
  completed: state.completed || 0,
  xp: state.xp || 0,
  life: state.life || 3
};

const updateProgressUI = () => {
  const levelCount = LEVELS.length;
  const currentDone = Math.min(levelCount, Math.max(0, engine.state.completed));
  const percent = ((currentDone / levelCount) * 100) || 0;
  document.getElementById('progressFill').style.width = `${percent}%`;
};

const syncFormFields = () => {
  studentNameEl.value = state.studentName || '';
  studentClassEl.value = state.studentClass || '';
};

const renderLevel = () => {
  const level = LEVELS[engine.state.levelIndex];
  labelEl.textContent = `FASE ${engine.state.levelIndex + 1} / ${LEVELS.length}`;
  missionEl.innerHTML = `<strong>${level.title}</strong><div>${level.description}</div>`;
  miniGridEl.innerHTML = buildMiniGrid(level);
  feedbackEl.textContent = 'Resolva a fórmula e destrave a porta.';
  formulaInput.value = '';
  advanceBtn.disabled = !engine.state.correct;
  advanceBtn.textContent = engine.state.levelIndex === LEVELS.length - 1 ? '🏆 Finalizar básico' : '🔓 Próxima fase';
  engine.setupLevel(engine.state.levelIndex);
  updateProgressUI();
};

const persistState = () => {
  saveProgress({
    level: engine.state.levelIndex,
    unlocked: engine.state.unlocked,
    xp: engine.state.xp,
    completed: engine.state.completed,
    life: engine.state.life,
    studentName: studentNameEl.value.trim(),
    studentClass: studentClassEl.value.trim(),
    soundOn: engine.state.soundOn
  });
};

const markCorrect = () => {
  const level = LEVELS[engine.state.levelIndex];
  const current = formulaInput.value.trim();
  if (!isFormulaAccepted(level, current)) {
    feedbackEl.textContent = '❌ Fórmula incorreta. Revise os valores e os sinais.';
    return;
  }

  const result = computeResult(level, current);
  if (result === null) {
    feedbackEl.textContent = '❌ Fórmula válida em sintaxe, mas fora do padrão desta fase.';
    return;
  }

  engine.state.correct = true;
  engine.state.xp += 30;
  engine.state.completed = Math.max(engine.state.completed, engine.state.levelIndex + 1);
  engine.state.unlocked = Math.max(engine.state.unlocked, engine.state.levelIndex + 1);
  advanceBtn.disabled = false;
  feedbackEl.textContent = `✅ Fórmula correta! Resultado do alvo ${level.targetCell}: ${level.answer}`;
  engine.render();
  persistState();
  updateProgressUI();
};

const nextLevel = () => {
  if (!engine.state.correct) {
    feedbackEl.textContent = 'A fórmula correta é necessária antes de continuar.';
    return;
  }

  if (engine.state.levelIndex < LEVELS.length - 1) {
    engine.state.levelIndex += 1;
    engine.state.correct = false;
    renderLevel();
  } else {
    feedbackEl.textContent = '🏆 Nível básico concluído! Você alcançou a vitória.';
  }
  persistState();
};

const appendToken = (token) => {
  if (token === 'AC') {
    formulaInput.value = '';
    return;
  }
  if (token === 'BACK') {
    formulaInput.value = formulaInput.value.slice(0, -1);
    return;
  }
  formulaInput.value += token;
};

miniGridEl.addEventListener('click', (event) => {
  const cell = event.target.closest('[data-cell]');
  if (cell) appendToken(cell.dataset.cell);
});

const toolButtons = document.querySelectorAll('[data-token]');
toolButtons.forEach((button) => {
  button.addEventListener('click', () => appendToken(button.dataset.token));
});

formulaInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') markCorrect();
});

document.getElementById('checkBtn').addEventListener('click', markCorrect);
document.getElementById('hintBtn').addEventListener('click', () => {
  const level = LEVELS[engine.state.levelIndex];
  feedbackEl.textContent = `💡 Dica: ${level.valid[0]}`;
});
advanceBtn.addEventListener('click', nextLevel);

document.getElementById('downloadBtn').addEventListener('click', (event) => {
  event.preventDefault();
  const studentName = studentNameEl.value.trim();
  const studentClass = studentClassEl.value.trim();
  if (!studentName || !studentClass) {
    feedbackEl.textContent = 'Informe nome completo e turma antes de baixar a planilha.';
    return;
  }

  const workbook = [];
  for (const level of LEVELS) {
    workbook.push({
      sheet: level.title,
      data: [
        ['Aluno', studentName],
        ['Turma', studentClass],
        ['Desafio', level.description],
        ['Fórmula sugerida', level.valid[0]],
        ['Resultado esperado', level.answer]
      ]
    });
  }

  const blob = new Blob([JSON.stringify(workbook, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${studentName.replace(/\s+/g, '_')}_excel_quest.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  feedbackEl.textContent = '📄 Planilha de apoio exportada em JSON para o professor.';
});

sendBtn.addEventListener('click', () => {
  const formUrl = 'https://forms.gle/g1E3pyj2e5XSVwBi9';
  window.open(formUrl, '_blank');
  feedbackEl.textContent = '📤 Formulário aberto. Preencha e anexe a planilha final.';
});

soundBtn.addEventListener('click', () => {
  engine.state.soundOn = !engine.state.soundOn;
  soundBtn.textContent = engine.state.soundOn ? '🔊 Som: ligado' : '🔇 Som: desligado';
  persistState();
});

studentNameEl.addEventListener('input', persistState);
studentClassEl.addEventListener('input', persistState);

document.addEventListener('keydown', (event) => {
  const keyMap = {
    ArrowUp: [0, -1],
    w: [0, -1],
    ArrowDown: [0, 1],
    s: [0, 1],
    ArrowLeft: [-1, 0],
    a: [-1, 0],
    ArrowRight: [1, 0],
    d: [1, 0]
  };

  if (event.target === formulaInput) return;
  const move = keyMap[event.key] || keyMap[event.key.toLowerCase()];
  if (move) {
    event.preventDefault();
    engine.move(move[0], move[1]);
  }
});

syncFormFields();
engine.state.coinsCollected = 0;
engine.state.levelIndex = state.level || 0;
engine.setupLevel(engine.state.levelIndex);
renderLevel();
soundBtn.textContent = engine.state.soundOn ? '🔊 Som: ligado' : '🔇 Som: desligado';

setInterval(() => {
  engine.tick();
  const level = LEVELS[engine.state.levelIndex];
  const collected = engine.coins.filter((coin) => coin.collected).length;
  engine.state.coinsCollected = collected;
  xpEl.textContent = `⭐ ${engine.state.xp} XP`;
  coinsEl.textContent = `🪙 ${collected}/${level.coins.length}`;
  livesEl.textContent = `❤️`.repeat(Math.max(0, engine.state.life));
  doorEl.textContent = engine.state.correct ? '🔓 Saída aberta' : '🔒 Saída fechada';
}, 500);
