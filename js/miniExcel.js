export const normalizeFormula = (input = '') => {
  return String(input)
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\$/g, '')
    .replace(/;/g, ',');
};

export const buildMiniGrid = (level) => {
  const letters = level.heads ?? ['A', 'B', 'C', 'D'];
  const rows = [1, 2, 3];
  const target = level.targetCell || 'D2';
  let html = '<div class="cell header">◎</div>';

  for (const letter of letters) {
    html += `<div class="cell header">${letter}</div>`;
  }

  for (const row of rows) {
    html += `<div class="cell header">${row}</div>`;
    for (const letter of letters) {
      const ref = `${letter}${row}`;
      const value = level.values[letters.indexOf(letter)] ?? '';
      const isTarget = ref === target;
      const display = ref === 'B2' || ref === 'C2' || ref === 'D2' || ref === 'E2' ? value : '';
      html += `<button type="button" class="cell cell-button ${isTarget ? 'target' : 'empty'}" data-cell="${ref}">${display === '' ? '' : display}</button>`;
    }
  }

  return html;
};

export const isFormulaAccepted = (level, formula) => {
  if (!level || !formula) return false;
  const normalizedInput = normalizeFormula(formula);
  const accepted = (level.valid || []).map(normalizeFormula);
  return accepted.includes(normalizedInput);
};

export const computeResult = (level, formula) => {
  const normalized = normalizeFormula(formula);
  const values = {};
  const letters = level.heads || ['A', 'B', 'C', 'D'];

  for (let index = 0; index < level.values.length; index += 1) {
    values[`${letters[index + 1]}2`] = Number(level.values[index]) || 0;
  }

  if (normalized === '=B2+C2') return values.B2 + values.C2;
  if (normalized === '=B2-C2') return values.B2 - values.C2;
  if (normalized === '=B2*C2' || normalized === '=PRODUTO(B2,C2)' || normalized === '=PRODUTO(B2,C2)') return values.B2 * values.C2;
  if (normalized === '=SOMA(B2:C2)' || normalized === '=SUMA(B2:C2)') return values.B2 + values.C2;
  if (normalized === '=MEDIA(B2:D2)' || normalized === '=MÉDIA(B2:D2)' || normalized === '=AVERAGE(B2:D2)') return (values.B2 + values.C2 + values.D2) / 3;
  if (normalized === '=(B2+C2+D2)/3') return (values.B2 + values.C2 + values.D2) / 3;
  if (normalized === '=B2*(1-C2)' || normalized === '=B2-B2*C2') return values.B2 * (1 - values.C2 / 100);
  if (normalized === '=B2*(1-C2/100)') return values.B2 * (1 - values.C2 / 100);

  return null;
};
