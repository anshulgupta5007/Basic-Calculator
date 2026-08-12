const display = document.querySelector('.contentDisplay');
const themeToggle = document.getElementById('themeToggle');
let displayValue = '0';
let cursorIndex = 1;
let justEvaluated = false;
let lastExpression = '';
let lastResult = '0';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function scrollDisplay(distance) {
  const maxScroll = display.scrollWidth - display.clientWidth;
  const nextScroll = Math.max(0, Math.min(maxScroll, display.scrollLeft + distance));
  display.scrollTo({ left: nextScroll, behavior: 'smooth' });
}

function scrollCursorIntoView() {
  const cursorEl = display.querySelector('.cursor');
  if (!cursorEl) return;
  const containerLeft = display.scrollLeft;
  const containerRight = containerLeft + display.clientWidth;
  const cursorLeft = cursorEl.offsetLeft;
  const cursorRight = cursorLeft + cursorEl.offsetWidth;
  if (cursorRight > containerRight - 16) {
    display.scrollTo({ left: cursorRight - display.clientWidth + 24, behavior: 'smooth' });
  } else if (cursorLeft < containerLeft + 16) {
    display.scrollTo({ left: Math.max(0, cursorLeft - 24), behavior: 'smooth' });
  }
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return 'Error';
  }

  const rounded = Math.round(value * 100000000) / 100000000;
  return String(rounded);
}

function evaluateExpression(expression) {
  if (!expression || expression === '0') {
    return 0;
  }

  const tokens = expression.match(/\d+(?:\.\d+)?|[+\-*/%]/g);
  if (!tokens || tokens.length === 0) {
    return 0;
  }

  let result = parseFloat(tokens[0]);

  for (let i = 1; i < tokens.length; i += 2) {
    const operator = tokens[i];
    const nextValue = parseFloat(tokens[i + 1]);

    if (!operator || Number.isNaN(nextValue)) {
      break;
    }

    switch (operator) {
      case '+':
        result += nextValue;
        break;
      case '-':
        result -= nextValue;
        break;
      case '*':
        result *= nextValue;
        break;
      case '/':
        result = nextValue === 0 ? 'Error' : result / nextValue;
        break;
      case '%':
        result %= nextValue;
        break;
      default:
        break;
    }
  }

  return result;
}

function formatExpressionForDisplay(expression) {
  return expression.replace(/\*/g, '×').replace(/\//g, '÷');
}

function getLiveResultPreview() {
  if (!displayValue || displayValue === '0' || displayValue === 'Error') {
    return displayValue;
  }

  const trimmedExpression = displayValue.replace(/[+\-*/%]$/, '');
  if (!trimmedExpression || trimmedExpression === '0') {
    return displayValue;
  }

  const hasOperator = /[+\-*/%]/.test(displayValue);
  if (!hasOperator) {
    return displayValue;
  }

  const result = evaluateExpression(trimmedExpression);
  return formatNumber(result);
}

function updateDisplay() {
  cursorIndex = Math.max(0, Math.min(cursorIndex, displayValue.length));
  const previewValue = getLiveResultPreview();
  const mainText = justEvaluated ? lastResult : displayValue;
  const before = escapeHtml(formatExpressionForDisplay(mainText).slice(0, cursorIndex));
  const after = escapeHtml(formatExpressionForDisplay(mainText).slice(cursorIndex));

  const mainContent = justEvaluated
    ? `<span class="display-inner">${escapeHtml(formatExpressionForDisplay(lastResult))}</span>`
    : `<span class="display-inner">${before}<span class="cursor"></span>${after}</span>`;

  const showPreview = !justEvaluated && /[+\-*/%]/.test(displayValue) && !/[+\-*/%]$/.test(displayValue);

  const expressionContent = justEvaluated && lastExpression
    ? `<span class="display-inner">${escapeHtml(formatExpressionForDisplay(lastExpression))}</span>`
    : showPreview
      ? `<span class="display-inner">${escapeHtml(previewValue)}</span>`
      : '';

  const expressionDiv = `<div class="displayExpression">${expressionContent}</div>`;
  const mainDiv = `<div class="displayMain ${!justEvaluated ? 'active' : ''}">${mainContent}</div>`;

  display.innerHTML = justEvaluated
    ? expressionDiv + mainDiv
    : mainDiv + expressionDiv;

  requestAnimationFrame(scrollCursorIntoView);
}

function insertAtCursor(text) {
  displayValue = displayValue.slice(0, cursorIndex) + text + displayValue.slice(cursorIndex);
  cursorIndex += text.length;
}

function inputDigit(digit) {
  if (displayValue === 'Error') {
    displayValue = digit;
    cursorIndex = digit.length;
    justEvaluated = false;
    lastExpression = '';
    updateDisplay();
    return;
  }

  if (justEvaluated) {
    displayValue = digit;
    cursorIndex = digit.length;
    justEvaluated = false;
    lastExpression = '';
  } else if (displayValue === '0') {
    displayValue = digit;
    cursorIndex = digit.length;
  } else {
    insertAtCursor(digit);
  }

  updateDisplay();
}

function inputDecimal() {
  if (displayValue === 'Error') {
    displayValue = '0.';
    cursorIndex = 2;
    updateDisplay();
    return;
  }

  if (justEvaluated) {
    displayValue = '0.';
    cursorIndex = 2;
    justEvaluated = false;
    updateDisplay();
    return;
  }

  if (displayValue === '0' || /[+\-*/%]$/.test(displayValue.slice(0, cursorIndex))) {
    insertAtCursor('0.');
  } else {
    const lastNumberMatch = displayValue.slice(0, cursorIndex).match(/(\d+(?:\.\d*)?)$/);
    const beforeCursorSegment = lastNumberMatch ? lastNumberMatch[1] : '';
    const lastNumberAcross = displayValue.match(/(\d+(?:\.\d*)?)([+\-*/%]?)$/);
    let hasDecimalInCurrentNumber = false;
    if (lastNumberMatch && lastNumberMatch[1].includes('.')) {
      hasDecimalInCurrentNumber = true;
    } else if (beforeCursorSegment && lastNumberAcross && lastNumberAcross[1].includes('.') &&
               displayValue.slice(0, cursorIndex).endsWith(beforeCursorSegment)) {
      hasDecimalInCurrentNumber = lastNumberAcross[1].includes('.');
    }
    if (!hasDecimalInCurrentNumber) {
      insertAtCursor('.');
    }
  }

  updateDisplay();
}

function handleOperator(nextOperator) {
  if (displayValue === 'Error') {
    displayValue = '0';
    cursorIndex = 1;
  }

  const operators = ['+', '-', '*', '/', '%'];
  const lastChar = displayValue.slice(cursorIndex - 1, cursorIndex) || displayValue.slice(-1);

  if (cursorIndex > 0 && operators.includes(displayValue[cursorIndex - 1])) {
    displayValue = displayValue.slice(0, cursorIndex - 1) + nextOperator + displayValue.slice(cursorIndex);
  } else if (cursorIndex === 0 && displayValue === '0') {
    displayValue = '0' + nextOperator;
    cursorIndex = 2;
  } else if (operators.includes(lastChar)) {
    const priorEnd = displayValue.slice(0, cursorIndex);
    const newPrior = priorEnd.slice(0, -1) + nextOperator;
    displayValue = newPrior + displayValue.slice(cursorIndex);
  } else {
    insertAtCursor(nextOperator);
  }

  justEvaluated = false;
  updateDisplay();
}

function handleEquals() {
  const result = evaluateExpression(displayValue);
  lastExpression = displayValue;
  lastResult = formatNumber(result);
  displayValue = lastResult;
  cursorIndex = displayValue.length;
  justEvaluated = true;
  updateDisplay();
}

function clearAll() {
  displayValue = '0';
  cursorIndex = 1;
  justEvaluated = false;
  lastExpression = '';
  lastResult = '0';
  updateDisplay();
}

function backspace() {
  if (displayValue === 'Error') {
    displayValue = '0';
    cursorIndex = 1;
    lastExpression = '';
    lastResult = '0';
    updateDisplay();
    return;
  }

  if (cursorIndex <= 0) {
    return;
  }

  if (displayValue.length <= 1) {
    displayValue = '0';
    cursorIndex = 1;
  } else {
    displayValue = displayValue.slice(0, cursorIndex - 1) + displayValue.slice(cursorIndex);
    cursorIndex -= 1;
    if (displayValue === '' || displayValue === '-') {
      displayValue = '0';
      cursorIndex = 1;
    }
  }

  justEvaluated = false;
  updateDisplay();
}

function handleButtonInput(buttonId) {
  if (buttonId === 'clear') {
    clearAll();
    return;
  }

  if (buttonId === 'del') {
    backspace();
    return;
  }

  if (buttonId === 'decimal') {
    inputDecimal();
    return;
  }

  if (buttonId === 'equals') {
    handleEquals();
    return;
  }

  if (buttonId === 'add') {
    handleOperator('+');
    return;
  }

  if (buttonId === 'subtract') {
    handleOperator('-');
    return;
  }

  if (buttonId === 'multiply') {
    handleOperator('*');
    return;
  }

  if (buttonId === 'divide') {
    handleOperator('/');
    return;
  }

  if (buttonId === 'modulas') {
    handleOperator('%');
    return;
  }

  if (buttonId === '00') {
    inputDigit('00');
    return;
  }

  if (/^\d$/.test(buttonId)) {
    inputDigit(buttonId);
  }
}

function deleteForward() {
  if (displayValue === 'Error') {
    displayValue = '0';
    cursorIndex = 1;
    updateDisplay();
    return;
  }

  if (cursorIndex >= displayValue.length) {
    return;
  }

  if (displayValue.length <= 1) {
    displayValue = '0';
    cursorIndex = 1;
  } else {
    displayValue = displayValue.slice(0, cursorIndex) + displayValue.slice(cursorIndex + 1);
    if (displayValue === '' || displayValue === '-') {
      displayValue = '0';
      cursorIndex = 1;
    }
  }

  justEvaluated = false;
  updateDisplay();
}

function moveCursorLeft() {
  if (cursorIndex > 0) {
    cursorIndex -= 1;
    updateDisplay();
  } else {
    scrollDisplay(-80);
  }
}

function moveCursorRight() {
  if (cursorIndex < displayValue.length) {
    cursorIndex += 1;
    updateDisplay();
  } else {
    scrollDisplay(80);
  }
}

function moveCursorHome() {
  cursorIndex = 0;
  updateDisplay();
}

function moveCursorEnd() {
  cursorIndex = displayValue.length;
  updateDisplay();
}

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  themeToggle.textContent = isDark ? '☀️ Light' : '🌙 Dark';
});

document.querySelectorAll('button').forEach((button) => {
  if (button.id === 'themeToggle' || button.id === 'historyToggle') {
    return;
  }

  button.addEventListener('click', () => handleButtonInput(button.id));
});

display.addEventListener('wheel', (event) => {
  event.preventDefault();
  scrollDisplay(event.deltaY > 0 ? 80 : -80);
}, { passive: false });

let isDragging = false;
let dragStartX = 0;
let dragStartScroll = 0;

display.addEventListener('mousedown', (event) => {
  isDragging = true;
  dragStartX = event.clientX;
  dragStartScroll = display.scrollLeft;
  display.classList.add('dragging');
});

display.addEventListener('mousemove', (event) => {
  if (!isDragging) return;
  const deltaX = dragStartX - event.clientX;
  display.scrollLeft = dragStartScroll + deltaX;
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    display.classList.remove('dragging');
  }
});

document.addEventListener('keydown', (event) => {
  const key = event.key;

  if (key === 'ArrowLeft') {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      moveCursorHome();
    } else {
      moveCursorLeft();
    }
    return;
  }

  if (key === 'ArrowRight') {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      moveCursorEnd();
    } else {
      moveCursorRight();
    }
    return;
  }

  if (key === 'Home') {
    event.preventDefault();
    moveCursorHome();
    return;
  }

  if (key === 'End') {
    event.preventDefault();
    moveCursorEnd();
    return;
  }

  if (/^[0-9]$/.test(key)) {
    event.preventDefault();
    inputDigit(key);
    return;
  }

  if (key === '.') {
    event.preventDefault();
    inputDecimal();
    return;
  }

  if (['+', '-', '*', '/', '%'].includes(key)) {
    event.preventDefault();
    const operatorMap = {
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      '%': '%'
    };
    handleOperator(operatorMap[key]);
    return;
  }

  if (key === 'Enter' || key === '=') {
    event.preventDefault();
    handleEquals();
    return;
  }

  if (key === 'Backspace') {
    event.preventDefault();
    backspace();
    return;
  }

  if (key === 'Delete') {
    event.preventDefault();
    deleteForward();
    return;
  }

  if (key === 'Escape') {
    event.preventDefault();
    clearAll();
  }
});

updateDisplay();