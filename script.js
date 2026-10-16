const display = document.querySelector('.contentDisplay');
const themeToggle = document.getElementById('themeToggle');
const historyToggle = document.getElementById('historyToggle');
const optionsToggle = document.getElementById('optionsToggle');
const historyPanel = document.getElementById('historyPanel');
const historyListContainer = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const optionsPanel = document.getElementById('optionsPanel');
const closeOptionsBtn = document.getElementById('closeOptionsBtn');
const optionsDropdownMenu = document.getElementById('optionsDropdownMenu');

let displayValue = '0';
let cursorIndex = 1;
let justEvaluated = false;
let lastExpression = '';
let lastResult = '0';
let historyList = [];

function loadHistoryFromStorage() {
  try {
    const saved = localStorage.getItem('calculator_history');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        historyList = parsed;
      }
    }
  } catch (e) {
    historyList = [];
  }
}

function saveHistoryToStorage() {
  try {
    localStorage.setItem('calculator_history', JSON.stringify(historyList));
  } catch (e) {
    console.error('Failed to save calculator history:', e);
  }
}

function renderHistory() {
  if (!historyListContainer) return;

  if (historyList.length === 0) {
    historyListContainer.innerHTML = '<div class="historyEmpty">No history yet</div>';
    if (clearHistoryBtn) clearHistoryBtn.style.display = 'none';
    return;
  }

  if (clearHistoryBtn) clearHistoryBtn.style.display = 'inline-block';

  historyListContainer.innerHTML = historyList.map((entry, index) => `
    <div class="historyEntry" data-index="${index}" role="button" tabindex="0" title="Click to use this output value">
      <span class="historyExpr">${escapeHtml(entry.expression)}</span>
      <span class="historyEq">=</span>
      <span class="historyResult">${escapeHtml(entry.result)}</span>
    </div>
  `).join('');

  historyListContainer.querySelectorAll('.historyEntry').forEach((entryEl) => {
    const handleSelect = () => {
      const idx = parseInt(entryEl.getAttribute('data-index'), 10);
      const item = historyList[idx];
      if (item) {
        displayValue = item.result;
        cursorIndex = displayValue.length;
        justEvaluated = true;
        lastResult = item.result;
        lastExpression = item.rawExpression || (item.expression ? item.expression.replace(/×/g, '*').replace(/÷/g, '/') : '');
        updateDisplay();
        closeHistory();
      }
    };

    entryEl.addEventListener('click', handleSelect);
    entryEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect();
      }
    });
  });
}

function addToHistory(expression, result) {
  if (!expression || expression === '0' || result === 'Error') {
    return;
  }

  if (!/[+\-*/%]/.test(expression)) {
    return;
  }

  const formattedExpr = formatExpressionForDisplay(expression);

  if (historyList.length > 0 &&
      historyList[0].expression === formattedExpr &&
      historyList[0].result === String(result)) {
    return;
  }

  const entry = {
    rawExpression: expression,
    expression: formattedExpr,
    result: String(result),
    timestamp: Date.now()
  };

  historyList.unshift(entry);
  if (historyList.length > 50) {
    historyList.pop();
  }

  saveHistoryToStorage();
  renderHistory();
}

function openOptionsDropdown() {
  closeHistory();
  if (!optionsDropdownMenu) return;
  optionsDropdownMenu.classList.add('open');
  optionsDropdownMenu.setAttribute('aria-hidden', 'false');
  if (optionsToggle) {
    optionsToggle.setAttribute('aria-expanded', 'true');
    optionsToggle.classList.add('active');
  }
}

function closeOptionsDropdown() {
  if (!optionsDropdownMenu) return;
  optionsDropdownMenu.classList.remove('open');
  optionsDropdownMenu.setAttribute('aria-hidden', 'true');
  if (optionsToggle) {
    optionsToggle.setAttribute('aria-expanded', 'false');
    optionsToggle.classList.remove('active');
  }
}

function toggleOptionsDropdown() {
  if (!optionsDropdownMenu) return;
  if (optionsDropdownMenu.classList.contains('open')) {
    closeOptionsDropdown();
  } else {
    openOptionsDropdown();
  }
}

const toolMeta = {
  unit: { name: 'Unit Converter', icon: '📏' },
  currency: { name: 'Currency Converter', icon: '💱' },
  discount: { name: 'Discount Calculator', icon: '🏷️' },
  tip: { name: 'Tip & Bill Splitter', icon: '🍽️' },
  base: { name: 'Base Converter', icon: '💻' },
  bmi: { name: 'BMI Calculator', icon: '⚖️' },
  age: { name: 'Age Calculator', icon: '📅' }
};

function switchOptionsTab(tabName) {
  const meta = toolMeta[tabName] || { name: 'Tools & Converters', icon: '⚙️' };
  const titleEl = document.getElementById('optionsHeaderTitle');
  const iconEl = document.getElementById('optionsHeaderIcon');
  if (titleEl) titleEl.textContent = meta.name;
  if (iconEl) iconEl.textContent = meta.icon;

  document.querySelectorAll('.optionsTabPane').forEach((pane) => {
    pane.classList.toggle('active', pane.id === `tab-${tabName}`);
  });

  document.querySelectorAll('.optionsDropdownMenu .dropdownItem').forEach((item) => {
    item.classList.toggle('active', item.dataset.tool === tabName);
  });

  setTimeout(() => {
    const activePane = document.getElementById(`tab-${tabName}`);
    if (activePane) {
      const firstInput = activePane.querySelector('input:not([readonly]):not([type="button"]):not([type="submit"])');
      if (firstInput) {
        firstInput.focus();
        if (typeof firstInput.select === 'function' && firstInput.type !== 'date') {
          firstInput.select();
        }
      }
    }
  }, 60);
}

function openHistory() {
  closeOptions();
  closeOptionsDropdown();
  if (!historyPanel) return;
  historyPanel.classList.add('open');
  historyPanel.setAttribute('aria-hidden', 'false');
  if (historyToggle) {
    historyToggle.setAttribute('aria-expanded', 'true');
    historyToggle.classList.add('active');
  }
}

function closeHistory() {
  if (!historyPanel) return;
  historyPanel.classList.remove('open');
  historyPanel.setAttribute('aria-hidden', 'true');
  if (historyToggle) {
    historyToggle.setAttribute('aria-expanded', 'false');
    historyToggle.classList.remove('active');
  }
}

function toggleHistory() {
  if (!historyPanel) return;
  if (historyPanel.classList.contains('open')) {
    closeHistory();
  } else {
    openHistory();
  }
}

function openOptions() {
  closeHistory();
  closeOptionsDropdown();
  if (!optionsPanel) return;
  optionsPanel.classList.add('open');
  optionsPanel.setAttribute('aria-hidden', 'false');

  setTimeout(() => {
    const activePane = optionsPanel.querySelector('.optionsTabPane.active');
    if (activePane) {
      const firstInput = activePane.querySelector('input:not([readonly]):not([type="button"]):not([type="submit"])');
      if (firstInput) {
        firstInput.focus();
        if (typeof firstInput.select === 'function' && firstInput.type !== 'date') {
          firstInput.select();
        }
      }
    }
  }, 80);
}

function closeOptions() {
  if (!optionsPanel) return;
  optionsPanel.classList.remove('open');
  optionsPanel.setAttribute('aria-hidden', 'true');
}

function toggleOptions() {
  if (!optionsPanel) return;
  if (optionsPanel.classList.contains('open')) {
    closeOptions();
  } else {
    openOptions();
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function scrollDisplay(distance) {
  const lineEl = display.querySelector('.cursor')?.closest('.displayLine') ||
                 display.querySelector('.bigSize') ||
                 display.querySelector('.displayLine') ||
                 display;
  const maxScroll = lineEl.scrollWidth - lineEl.clientWidth;
  const nextScroll = Math.max(0, Math.min(maxScroll, lineEl.scrollLeft + distance));
  lineEl.scrollTo({ left: nextScroll, behavior: 'auto' });
}

function scrollCursorIntoView() {
  const cursorEl = display.querySelector('.cursor');
  if (!cursorEl) return;
  const lineEl = cursorEl.closest('.displayLine') || display.querySelector('.displayExpression') || display;

  const cursorRect = cursorEl.getBoundingClientRect();
  const lineRect = lineEl.getBoundingClientRect();

  // Keep values completely in place while moving cursor between visible characters.
  // Only start moving the values when the cursor reaches the last value at the visible edge!
  const buffer = 4;

  if (cursorRect.right > lineRect.right) {
    const overflow = cursorRect.right - lineRect.right + buffer;
    lineEl.scrollLeft += overflow;
  } else if (cursorRect.left < lineRect.left) {
    const underflow = lineRect.left - cursorRect.left + buffer;
    lineEl.scrollLeft -= underflow;
  }
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return 'Error';
  }

  const rounded = Math.round(value * 100000000) / 100000000;
  return String(rounded);
}

function formatNumberForDisplay(valStr) {
  if (valStr === 'Error' || !valStr) return valStr;
  const parts = String(valStr).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

function highlightOperators(htmlStr) {
  return htmlStr.replace(/([+\-×÷%])/g, '<span class="displayOp">$1</span>');
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

  const trimmedExpression = displayValue.replace(/[+\-*/%]+$/, '');
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

function renderInteractiveExpression(valStr, cursorIdx) {
  let html = '';
  const len = valStr ? valStr.length : 0;

  for (let i = 0; i <= len; i++) {
    if (cursorIdx !== undefined && i === cursorIdx) {
      html += '<span class="cursor"></span>';
    }
    if (i < len) {
      const char = valStr[i];
      let displayChar = char;
      let isOp = false;
      if (char === '*') { displayChar = '×'; isOp = true; }
      else if (char === '/') { displayChar = '÷'; isOp = true; }
      else if (['+', '-', '%'].includes(char)) { isOp = true; }

      const opClass = isOp ? ' displayOp' : '';
      html += `<span class="displayChar${opClass}" data-raw-index="${i}">${escapeHtml(displayChar)}</span>`;
    }
  }

  return `<span class="display-inner">${html}</span>`;
}

function renderInteractiveOutput(valStr, cursorIdx) {
  let html = '<span class="displayEq">=</span>';
  if (valStr === 'Error' || !valStr) {
    html += `<span class="displayChar" data-raw-index="0">${escapeHtml(valStr || '0')}</span>`;
    return `<span class="display-inner">${html}</span>`;
  }

  const parts = String(valStr).split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts[1] : null;

  let rawIndexCounter = 0;
  let formattedIntegerHtml = '';

  const intLen = integerPart.length;
  for (let i = 0; i < intLen; i++) {
    const rawIdx = rawIndexCounter++;
    if (cursorIdx !== undefined && rawIdx === cursorIdx) {
      formattedIntegerHtml += '<span class="cursor"></span>';
    }
    formattedIntegerHtml += `<span class="displayChar" data-raw-index="${rawIdx}">${escapeHtml(integerPart[i])}</span>`;
    const remaining = intLen - 1 - i;
    if (remaining > 0 && remaining % 3 === 0) {
      formattedIntegerHtml += '<span class="displaySep">,</span>';
    }
  }

  html += formattedIntegerHtml;

  if (decimalPart !== null) {
    const dotRawIdx = rawIndexCounter++;
    if (cursorIdx !== undefined && dotRawIdx === cursorIdx) {
      html += '<span class="cursor"></span>';
    }
    html += `<span class="displayChar" data-raw-index="${dotRawIdx}">.</span>`;

    for (let j = 0; j < decimalPart.length; j++) {
      const rawIdx = rawIndexCounter++;
      if (cursorIdx !== undefined && rawIdx === cursorIdx) {
        html += '<span class="cursor"></span>';
      }
      html += `<span class="displayChar" data-raw-index="${rawIdx}">${escapeHtml(decimalPart[j])}</span>`;
    }
  }

  if (cursorIdx !== undefined && cursorIdx >= rawIndexCounter) {
    html += '<span class="cursor"></span>';
  }

  return `<span class="display-inner">${html}</span>`;
}

function updateDisplay() {
  cursorIndex = Math.max(0, Math.min(cursorIndex, displayValue.length));
  const previewValue = getLiveResultPreview();

  // Determine if there is an active operation entered with a second value,
  // or if we are continuing from a previously evaluated result (e.g. "51+").
  // Clean initial single value (e.g. "27", "27+", "-5") does not show live preview.
  const hasOperationWithSecondValue = /\d\s*[+\-*/%]\s*\d/.test(displayValue);
  const isContinuingFromPreviousResult = Boolean(
    lastResult && lastResult !== '0' &&
    displayValue.startsWith(lastResult) &&
    /[+\-*/%]/.test(displayValue)
  );

  const shouldShowLivePreview = previewValue !== 'Error' && (hasOperationWithSecondValue || isContinuingFromPreviousResult);

  if (justEvaluated) {
    // When equal sign is clicked: input value becomes smaller, output becomes big
    const exprHtml = renderInteractiveExpression(lastExpression);
    const outputHtml = renderInteractiveOutput(lastResult);
    display.innerHTML = `
      <div class="displayLine displayExpression smallSize">${exprHtml}</div>
      <div class="displayLine displayMain bigSize">${outputHtml}</div>
    `;
  } else {
    const exprHtml = renderInteractiveExpression(displayValue, cursorIndex);

    if (shouldShowLivePreview) {
      // Input value with operation: input is big, live output is smaller
      const previewHtml = renderInteractiveOutput(previewValue);
      display.innerHTML = `
        <div class="displayLine displayExpression bigSize">${exprHtml}</div>
        <div class="displayLine displayMain smallSize">${previewHtml}</div>
      `;
    } else {
      // First value only (or waiting for second value): show first value cleanly as it is without auto output
      display.innerHTML = `
        <div class="displayLine displayExpression bigSize">${exprHtml}</div>
      `;
    }
  }

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
    lastResult = '0';
    updateDisplay();
    return;
  }

  if (justEvaluated) {
    displayValue = digit;
    cursorIndex = digit.length;
    justEvaluated = false;
    lastExpression = '';
    lastResult = '0';
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
    lastExpression = '';
    lastResult = '0';
    updateDisplay();
    return;
  }

  if (justEvaluated) {
    displayValue = '0.';
    cursorIndex = 2;
    justEvaluated = false;
    lastExpression = '';
    lastResult = '0';
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
  const formattedResult = formatNumber(result);

  // Store output value with each digit/expression in history
  addToHistory(displayValue, formattedResult);

  lastExpression = displayValue;
  lastResult = formattedResult;
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

  if (justEvaluated && lastExpression) {
    displayValue = lastExpression;
    cursorIndex = displayValue.length;
    justEvaluated = false;
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

  if (justEvaluated && lastExpression) {
    displayValue = lastExpression;
    cursorIndex = displayValue.length;
    justEvaluated = false;
    backspace();
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
  if (justEvaluated && lastExpression) {
    displayValue = lastExpression;
    cursorIndex = displayValue.length;
    justEvaluated = false;
  }
  if (cursorIndex > 0) {
    cursorIndex -= 1;
    updateDisplay();
  } else {
    scrollDisplay(-80);
  }
}

function moveCursorRight() {
  if (justEvaluated && lastExpression) {
    displayValue = lastExpression;
    cursorIndex = displayValue.length;
    justEvaluated = false;
    updateDisplay();
    return;
  }
  if (cursorIndex < displayValue.length) {
    cursorIndex += 1;
    updateDisplay();
  } else {
    scrollDisplay(80);
  }
}

function moveCursorHome() {
  if (justEvaluated && lastExpression) {
    displayValue = lastExpression;
    justEvaluated = false;
  }
  cursorIndex = 0;
  updateDisplay();
}

function moveCursorEnd() {
  if (justEvaluated && lastExpression) {
    displayValue = lastExpression;
    justEvaluated = false;
  }
  cursorIndex = displayValue.length;
  updateDisplay();
}

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  themeToggle.textContent = isDark ? '☀️ Light' : '🌙 Dark';
  try {
    localStorage.setItem('calculator_theme', isDark ? 'dark' : 'light');
  } catch (e) {}
});

try {
  const savedTheme = localStorage.getItem('calculator_theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    themeToggle.textContent = '☀️ Light';
  } else if (savedTheme === 'light') {
    document.body.classList.remove('dark-theme');
    themeToggle.textContent = '🌙 Dark';
  }
} catch (e) {}

if (historyToggle) {
  historyToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleHistory();
  });
}

if (optionsToggle) {
  optionsToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleOptionsDropdown();
  });
}

document.querySelectorAll('.dropdownItem').forEach((item) => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    closeOptionsDropdown();

    if (item.dataset.tool) {
      switchOptionsTab(item.dataset.tool);
      openOptions();
    } else if (item.dataset.action === 'history') {
      openHistory();
    } else if (item.dataset.action === 'theme') {
      themeToggle.click();
    } else if (item.dataset.action === 'clear') {
      clearAll();
    }
  });
});

if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    historyList = [];
    saveHistoryToStorage();
    renderHistory();
  });
}

if (closeHistoryBtn) {
  closeHistoryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeHistory();
  });
}

if (closeOptionsBtn) {
  closeOptionsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeOptions();
  });
}

document.addEventListener('click', (e) => {
  if (optionsDropdownMenu && optionsDropdownMenu.classList.contains('open')) {
    if (!optionsDropdownMenu.contains(e.target) && !optionsToggle.contains(e.target)) {
      closeOptionsDropdown();
    }
  }
  if (historyPanel && historyPanel.classList.contains('open')) {
    if (!historyPanel.contains(e.target) && !historyToggle.contains(e.target)) {
      closeHistory();
    }
  }
  if (optionsPanel && optionsPanel.classList.contains('open')) {
    if (!optionsPanel.contains(e.target) && !optionsToggle.contains(e.target)) {
      closeOptions();
    }
  }
});

// Calculator keypad button handler
document.querySelectorAll('.keyboardContent button').forEach((button) => {
  button.addEventListener('click', () => handleButtonInput(button.id));
});

display.addEventListener('wheel', (event) => {
  event.preventDefault();
  const lineEl = display.querySelector('.cursor')?.closest('.displayLine') ||
                 display.querySelector('.bigSize') ||
                 display.querySelector('.displayLine') ||
                 display;
  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  const maxScroll = lineEl.scrollWidth - lineEl.clientWidth;
  lineEl.scrollLeft = Math.max(0, Math.min(maxScroll, lineEl.scrollLeft + (delta > 0 ? 60 : -60)));
}, { passive: false });

let isPointerDown = false;
let pointerStartX = 0;
let pointerStartY = 0;
let pointerTargetLine = null;
let pointerStartScrollLeft = 0;
let pointerMoved = false;

function handlePointerDown(e) {
  const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

  isPointerDown = true;
  pointerStartX = clientX;
  pointerStartY = clientY;
  pointerMoved = false;

  const hitLine = e.target.closest('.displayLine');
  const activeLine = display.querySelector('.cursor')?.closest('.displayLine') ||
                     display.querySelector('.bigSize') ||
                     display.querySelector('.displayLine');

  pointerTargetLine = (hitLine && hitLine.scrollWidth > hitLine.clientWidth) ? hitLine :
                      (activeLine || hitLine || display.querySelector('.displayExpression') || display);
  pointerStartScrollLeft = pointerTargetLine ? pointerTargetLine.scrollLeft : 0;
}

function handlePointerMove(e) {
  if (!isPointerDown || !pointerTargetLine) return;

  const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
  const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

  const deltaX = pointerStartX - clientX;
  const deltaY = pointerStartY - clientY;

  if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
    pointerMoved = true;
    display.classList.add('dragging');
  }

  if (pointerMoved) {
    const maxScroll = pointerTargetLine.scrollWidth - pointerTargetLine.clientWidth;
    const targetScroll = Math.max(0, Math.min(maxScroll, pointerStartScrollLeft + deltaX));
    pointerTargetLine.scrollLeft = targetScroll;
  }
}

function handleDisplayCharacterClick(e) {
  const clientX = e.clientX !== undefined ? e.clientX : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0);

  const targetLine = e.target.closest('.displayLine') ||
                     display.querySelector('.cursor')?.closest('.displayLine') ||
                     display.querySelector('.bigSize') ||
                     display.querySelector('.displayLine');
  if (!targetLine) return;

  const isMain = targetLine.classList.contains('displayMain');
  const isExpr = targetLine.classList.contains('displayExpression');

  let activeStr = displayValue;
  if (isMain) {
    if (justEvaluated && lastResult) {
      activeStr = lastResult;
    } else {
      const preview = getLiveResultPreview();
      activeStr = (preview && preview !== 'Error') ? preview : displayValue;
    }
  } else if (isExpr) {
    if (justEvaluated && lastExpression) {
      activeStr = lastExpression;
    } else {
      activeStr = displayValue;
    }
  }

  // Find clicked char span
  const charEl = e.target.closest('.displayChar');
  let targetIdx = activeStr.length;

  if (charEl && charEl.dataset.rawIndex !== undefined) {
    const rawIdx = parseInt(charEl.dataset.rawIndex, 10);
    const rect = charEl.getBoundingClientRect();
    const isRightHalf = (clientX - rect.left) > (rect.width / 2);
    targetIdx = isRightHalf ? rawIdx + 1 : rawIdx;
  } else {
    // Clicked in empty space or equals sign
    const innerEl = targetLine.querySelector('.display-inner');
    if (innerEl) {
      const innerRect = innerEl.getBoundingClientRect();
      if (clientX < innerRect.left) {
        targetIdx = 0;
      } else {
        targetIdx = activeStr.length;
      }
    }
  }

  targetIdx = Math.max(0, Math.min(targetIdx, activeStr.length));

  displayValue = activeStr;
  cursorIndex = targetIdx;
  justEvaluated = false;
  updateDisplay();
}

function handlePointerUp(e) {
  if (!isPointerDown) return;
  isPointerDown = false;
  display.classList.remove('dragging');

  if (pointerMoved) {
    return;
  }

  handleDisplayCharacterClick(e);
}

display.addEventListener('mousedown', handlePointerDown);
document.addEventListener('mousemove', handlePointerMove);
document.addEventListener('mouseup', handlePointerUp);

display.addEventListener('touchstart', handlePointerDown, { passive: true });
document.addEventListener('touchmove', handlePointerMove, { passive: true });
document.addEventListener('touchend', handlePointerUp, { passive: true });
document.addEventListener('touchcancel', handlePointerUp, { passive: true });

document.addEventListener('keydown', (event) => {
  const key = event.key;
  const activeEl = document.activeElement;

  // 1. If user is currently focused on an input, select, textarea, or contenteditable:
  // Allow all native keyboard typing without calculator interception!
  const isInputFocused = activeEl && (
    activeEl.tagName === 'INPUT' ||
    activeEl.tagName === 'SELECT' ||
    activeEl.tagName === 'TEXTAREA' ||
    activeEl.isContentEditable
  );

  if (isInputFocused) {
    if (key === 'Escape') {
      event.preventDefault();
      activeEl.blur();
      if (optionsPanel && optionsPanel.classList.contains('open')) {
        closeOptions();
      }
      if (optionsDropdownMenu && optionsDropdownMenu.classList.contains('open')) {
        closeOptionsDropdown();
      }
    }
    return;
  }

  // 2. If dropdown menu is open, Escape closes it
  if (optionsDropdownMenu && optionsDropdownMenu.classList.contains('open')) {
    if (key === 'Escape') {
      event.preventDefault();
      closeOptionsDropdown();
      return;
    }
  }

  // 3. If options panel is open, redirect number/typing keys to active tool input
  if (optionsPanel && optionsPanel.classList.contains('open')) {
    if (key === 'Escape') {
      event.preventDefault();
      closeOptions();
      return;
    }

    const activePane = optionsPanel.querySelector('.optionsTabPane.active');
    if (activePane) {
      const firstInput = activePane.querySelector('input:not([readonly]):not([type="button"]):not([type="submit"])');
      if (firstInput && /^[0-9.-]$/.test(key)) {
        firstInput.focus();
        return;
      }
    }
    // Prevent typing into calculator under the overlay
    return;
  }

  // 4. If history panel is open, Escape closes it
  if (historyPanel && historyPanel.classList.contains('open')) {
    if (key === 'Escape') {
      event.preventDefault();
      closeHistory();
      return;
    }
    return;
  }

  // 5. Main Calculator Keyboard Controls
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
    return;
  }
});

/* =========================================================
   OPTIONS & CONVERTERS MODULE
   ========================================================= */

function sendValueToCalculator(val) {
  const cleanVal = String(val).replace(/[^0-9.-]/g, '');
  if (cleanVal && !Number.isNaN(parseFloat(cleanVal))) {
    displayValue = cleanVal;
    cursorIndex = displayValue.length;
    justEvaluated = true;
    lastResult = cleanVal;
    lastExpression = '';
    updateDisplay();
    closeOptions();
  }
}

// Switch tool button inside options panel header
const optionsSwitchBtn = document.getElementById('optionsSwitchBtn');
if (optionsSwitchBtn) {
  optionsSwitchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleOptionsDropdown();
  });
}

// 1. Unit Converter
const unitData = {
  speed: {
    units: {
      'km/h': { label: 'km/h (Kilometers/hour)', factor: 1 / 3.6 },
      'm/s': { label: 'm/s (Meters/second)', factor: 1 },
      'mph': { label: 'mph (Miles/hour)', factor: 0.44704 },
      'knot': { label: 'knots (Nautical miles/h)', factor: 0.514444 },
      'ft/s': { label: 'ft/s (Feet/second)', factor: 0.3048 }
    },
    defaultFrom: 'km/h',
    defaultTo: 'mph'
  },
  length: {
    units: {
      'm': { label: 'm (Meters)', factor: 1 },
      'km': { label: 'km (Kilometers)', factor: 1000 },
      'cm': { label: 'cm (Centimeters)', factor: 0.01 },
      'mm': { label: 'mm (Millimeters)', factor: 0.001 },
      'mi': { label: 'mi (Miles)', factor: 1609.344 },
      'yd': { label: 'yd (Yards)', factor: 0.9144 },
      'ft': { label: 'ft (Feet)', factor: 0.3048 },
      'in': { label: 'in (Inches)', factor: 0.0254 }
    },
    defaultFrom: 'm',
    defaultTo: 'ft'
  },
  mass: {
    units: {
      'kg': { label: 'kg (Kilograms)', factor: 1 },
      'g': { label: 'g (Grams)', factor: 0.001 },
      'mg': { label: 'mg (Milligrams)', factor: 0.000001 },
      't': { label: 't (Metric Tons)', factor: 1000 },
      'lb': { label: 'lb (Pounds)', factor: 0.45359237 },
      'oz': { label: 'oz (Ounces)', factor: 0.028349523125 }
    },
    defaultFrom: 'kg',
    defaultTo: 'lb'
  },
  temperature: {
    special: true,
    units: {
      'C': { label: '°C (Celsius)' },
      'F': { label: '°F (Fahrenheit)' },
      'K': { label: 'K (Kelvin)' }
    },
    defaultFrom: 'C',
    defaultTo: 'F'
  },
  digital: {
    units: {
      'B': { label: 'B (Bytes)', factor: 1 },
      'KB': { label: 'KB (Kilobytes)', factor: 1024 },
      'MB': { label: 'MB (Megabytes)', factor: 1024 * 1024 },
      'GB': { label: 'GB (Gigabytes)', factor: 1024 * 1024 * 1024 },
      'TB': { label: 'TB (Terabytes)', factor: 1024 * 1024 * 1024 * 1024 }
    },
    defaultFrom: 'MB',
    defaultTo: 'GB'
  },
  time: {
    units: {
      's': { label: 's (Seconds)', factor: 1 },
      'min': { label: 'min (Minutes)', factor: 60 },
      'h': { label: 'h (Hours)', factor: 3600 },
      'd': { label: 'days (Days)', factor: 86400 },
      'wk': { label: 'weeks (Weeks)', factor: 604800 }
    },
    defaultFrom: 'min',
    defaultTo: 's'
  }
};

function convertTemperature(val, from, to) {
  if (from === to) return val;
  let celsius = val;
  if (from === 'F') celsius = (val - 32) * (5 / 9);
  else if (from === 'K') celsius = val - 273.15;

  if (to === 'C') return celsius;
  if (to === 'F') return (celsius * (9 / 5)) + 32;
  if (to === 'K') return celsius + 273.15;
  return celsius;
}

function calculateUnitConversion() {
  const catKey = document.getElementById('unitCategory').value;
  const fromSelect = document.getElementById('unitFromSelect');
  const toSelect = document.getElementById('unitToSelect');
  const fromInput = document.getElementById('unitFromVal');
  const toInput = document.getElementById('unitToVal');

  const val = parseFloat(fromInput.value);
  if (Number.isNaN(val)) {
    toInput.value = '';
    return;
  }

  const cat = unitData[catKey];
  const fromUnit = fromSelect.value;
  const toUnit = toSelect.value;

  if (cat.special && catKey === 'temperature') {
    const res = convertTemperature(val, fromUnit, toUnit);
    toInput.value = Math.round(res * 10000) / 10000;
    return;
  }

  const fromFactor = cat.units[fromUnit].factor;
  const toFactor = cat.units[toUnit].factor;
  const inBase = val * fromFactor;
  const result = inBase / toFactor;
  toInput.value = Math.round(result * 1000000) / 1000000;
}

function populateUnitCategory(catKey) {
  const cat = unitData[catKey];
  const fromSelect = document.getElementById('unitFromSelect');
  const toSelect = document.getElementById('unitToSelect');

  fromSelect.innerHTML = Object.entries(cat.units)
    .map(([key, u]) => `<option value="${key}">${u.label}</option>`)
    .join('');
  toSelect.innerHTML = Object.entries(cat.units)
    .map(([key, u]) => `<option value="${key}">${u.label}</option>`)
    .join('');

  fromSelect.value = cat.defaultFrom;
  toSelect.value = cat.defaultTo;
  calculateUnitConversion();
}

const unitCategoryEl = document.getElementById('unitCategory');
const unitFromValEl = document.getElementById('unitFromVal');
const unitFromSelectEl = document.getElementById('unitFromSelect');
const unitToSelectEl = document.getElementById('unitToSelect');
const unitSwapBtn = document.getElementById('unitSwapBtn');
const unitUseBtn = document.getElementById('unitUseBtn');

if (unitCategoryEl) {
  unitCategoryEl.addEventListener('change', () => populateUnitCategory(unitCategoryEl.value));
}
if (unitFromValEl) {
  unitFromValEl.addEventListener('input', calculateUnitConversion);
}
if (unitFromSelectEl) {
  unitFromSelectEl.addEventListener('change', calculateUnitConversion);
}
if (unitToSelectEl) {
  unitToSelectEl.addEventListener('change', calculateUnitConversion);
}
if (unitSwapBtn) {
  unitSwapBtn.addEventListener('click', () => {
    const tmp = unitFromSelectEl.value;
    unitFromSelectEl.value = unitToSelectEl.value;
    unitToSelectEl.value = tmp;
    calculateUnitConversion();
  });
}
if (unitUseBtn) {
  unitUseBtn.addEventListener('click', () => {
    const val = document.getElementById('unitToVal').value;
    sendValueToCalculator(val);
  });
}

// 2. Currency Converter (Frankfurter API - Real-Time Exchange Rates)
const defaultCurrencies = {
  USD: 'United States Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  INR: 'Indian Rupee',
  JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  CHF: 'Swiss Franc',
  CNY: 'Chinese Renminbi Yuan',
  BRL: 'Brazilian Real',
  CZK: 'Czech Koruna',
  DKK: 'Danish Krone',
  HKD: 'Hong Kong Dollar',
  HUF: 'Hungarian Forint',
  IDR: 'Indonesian Rupiah',
  ILS: 'Israeli New Shekel',
  ISK: 'Icelandic Króna',
  KRW: 'South Korean Won',
  MXN: 'Mexican Peso',
  MYR: 'Malaysian Ringgit',
  NOK: 'Norwegian Krone',
  NZD: 'New Zealand Dollar',
  PHP: 'Philippine Peso',
  PLN: 'Polish Złoty',
  RON: 'Romanian Leu',
  SEK: 'Swedish Krona',
  SGD: 'Singapore Dollar',
  THB: 'Thai Baht',
  TRY: 'Turkish Lira',
  ZAR: 'South African Rand'
};

let currencyAbortController = null;
let currencyDebounceTimer = null;
const cachedRates = {};

async function fetchRealtimeCurrency() {
  const amountEl = document.getElementById('currencyAmount');
  const fromEl = document.getElementById('currencyFromSelect');
  const toEl = document.getElementById('currencyToSelect');
  const resultEl = document.getElementById('currencyResult');
  const rateInfoEl = document.getElementById('currencyRateInfo');

  const amount = parseFloat(amountEl.value);
  if (Number.isNaN(amount) || amount < 0) {
    resultEl.value = '';
    rateInfoEl.textContent = 'Enter an amount';
    return;
  }

  const fromCurr = fromEl.value;
  const toCurr = toEl.value;

  if (fromCurr === toCurr) {
    resultEl.value = amount.toFixed(2);
    rateInfoEl.innerHTML = `1 ${fromCurr} = 1.0000 ${toCurr} <span style="font-size:0.75rem;opacity:0.8;">• Same currency</span>`;
    return;
  }

  if (currencyAbortController) {
    currencyAbortController.abort();
  }
  currencyAbortController = new AbortController();

  rateInfoEl.innerHTML = `<span style="opacity:0.7;">⚡ Fetching real-time Frankfurter rate...</span>`;

  try {
    const url = `https://api.frankfurter.dev/v1/latest?amount=${encodeURIComponent(amount)}&from=${encodeURIComponent(fromCurr)}&to=${encodeURIComponent(toCurr)}`;
    const response = await fetch(url, { signal: currencyAbortController.signal });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    if (data && data.rates && data.rates[toCurr] !== undefined) {
      const convertedVal = data.rates[toCurr];
      resultEl.value = parseFloat(convertedVal).toFixed(2);
      const unitRate = (convertedVal / amount).toFixed(4);
      cachedRates[`${fromCurr}_${toCurr}`] = unitRate;
      rateInfoEl.innerHTML = `1 ${fromCurr} = ${unitRate} ${toCurr} <span style="font-size:0.75rem;color:#10b981;font-weight:600;">• Live (${data.date}) via Frankfurter API</span>`;
    }
  } catch (err) {
    if (err.name === 'AbortError') return;

    try {
      const fallbackUrl = `https://api.frankfurter.app/latest?amount=${encodeURIComponent(amount)}&from=${encodeURIComponent(fromCurr)}&to=${encodeURIComponent(toCurr)}`;
      const fallbackRes = await fetch(fallbackUrl);
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        if (data && data.rates && data.rates[toCurr] !== undefined) {
          const convertedVal = data.rates[toCurr];
          resultEl.value = parseFloat(convertedVal).toFixed(2);
          const unitRate = (convertedVal / amount).toFixed(4);
          rateInfoEl.innerHTML = `1 ${fromCurr} = ${unitRate} ${toCurr} <span style="font-size:0.75rem;color:#10b981;font-weight:600;">• Live (${data.date})</span>`;
          return;
        }
      }
    } catch (e2) {}

    if (cachedRates[`${fromCurr}_${toCurr}`]) {
      const rate = cachedRates[`${fromCurr}_${toCurr}`];
      resultEl.value = (amount * rate).toFixed(2);
      rateInfoEl.innerHTML = `1 ${fromCurr} = ${rate} ${toCurr} <span style="font-size:0.75rem;color:#f59e0b;">• Cached rate (Offline)</span>`;
    } else {
      rateInfoEl.innerHTML = `<span style="color:#ef4444;font-size:0.78rem;">Could not fetch live rate. Check connection.</span>`;
    }
  }
}

function triggerCurrencyConversion() {
  clearTimeout(currencyDebounceTimer);
  currencyDebounceTimer = setTimeout(fetchRealtimeCurrency, 250);
}

async function initCurrencies() {
  const fromEl = document.getElementById('currencyFromSelect');
  const toEl = document.getElementById('currencyToSelect');
  if (!fromEl || !toEl) return;

  let currencies = defaultCurrencies;

  try {
    const res = await fetch('https://api.frankfurter.dev/v1/currencies');
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        currencies = data;
      }
    }
  } catch (e) {}

  const prevFrom = fromEl.value || 'USD';
  const prevTo = toEl.value || 'INR';

  const optionsHtml = Object.entries(currencies).map(([code, name]) => {
    return `<option value="${code}">${code} - ${name}</option>`;
  }).join('');

  fromEl.innerHTML = optionsHtml;
  toEl.innerHTML = optionsHtml;

  fromEl.value = currencies[prevFrom] ? prevFrom : 'USD';
  toEl.value = currencies[prevTo] ? prevTo : 'INR';

  fetchRealtimeCurrency();
}

const currencyAmountEl = document.getElementById('currencyAmount');
const currencyFromEl = document.getElementById('currencyFromSelect');
const currencyToEl = document.getElementById('currencyToSelect');
const currencySwapBtn = document.getElementById('currencySwapBtn');
const currencyUseBtn = document.getElementById('currencyUseBtn');

if (currencyAmountEl) currencyAmountEl.addEventListener('input', triggerCurrencyConversion);
if (currencyFromEl) currencyFromEl.addEventListener('change', fetchRealtimeCurrency);
if (currencyToEl) currencyToEl.addEventListener('change', fetchRealtimeCurrency);
if (currencySwapBtn) {
  currencySwapBtn.addEventListener('click', () => {
    const tmp = currencyFromEl.value;
    currencyFromEl.value = currencyToEl.value;
    currencyToEl.value = tmp;
    fetchRealtimeCurrency();
  });
}
if (currencyUseBtn) {
  currencyUseBtn.addEventListener('click', () => {
    const val = document.getElementById('currencyResult').value;
    sendValueToCalculator(val);
  });
}

// 3. Discount Calculator
function calculateDiscount() {
  const price = parseFloat(document.getElementById('discountPrice').value);
  const rate = parseFloat(document.getElementById('discountRate').value);
  const finalEl = document.getElementById('discountFinal');
  const savedEl = document.getElementById('discountSaved');

  if (Number.isNaN(price) || Number.isNaN(rate) || price < 0 || rate < 0) {
    finalEl.textContent = '--';
    savedEl.textContent = '--';
    return;
  }

  const saved = price * (rate / 100);
  const finalPrice = Math.max(0, price - saved);
  finalEl.textContent = finalPrice.toFixed(2);
  savedEl.textContent = saved.toFixed(2);
}

const discountPriceEl = document.getElementById('discountPrice');
const discountRateEl = document.getElementById('discountRate');
const discountUseBtn = document.getElementById('discountUseBtn');

if (discountPriceEl) discountPriceEl.addEventListener('input', calculateDiscount);
if (discountRateEl) discountRateEl.addEventListener('input', calculateDiscount);

document.querySelectorAll('.toolPill[data-discount]').forEach((pill) => {
  pill.addEventListener('click', () => {
    if (discountRateEl) {
      discountRateEl.value = pill.dataset.discount;
      calculateDiscount();
    }
  });
});

if (discountUseBtn) {
  discountUseBtn.addEventListener('click', () => {
    const val = document.getElementById('discountFinal').textContent;
    sendValueToCalculator(val);
  });
}

// 4. Tip Calculator
function calculateTip() {
  const bill = parseFloat(document.getElementById('tipBill').value);
  const tipPct = parseFloat(document.getElementById('tipPercent').value);
  const split = parseInt(document.getElementById('tipSplit').value, 10) || 1;

  const tipTotalEl = document.getElementById('tipTotalTip');
  const tipBillEl = document.getElementById('tipTotalBill');
  const tipPerPersonEl = document.getElementById('tipPerPerson');

  if (Number.isNaN(bill) || Number.isNaN(tipPct) || bill < 0) {
    tipTotalEl.textContent = '--';
    tipBillEl.textContent = '--';
    tipPerPersonEl.textContent = '--';
    return;
  }

  const tipAmt = bill * (tipPct / 100);
  const total = bill + tipAmt;
  const perPerson = total / Math.max(1, split);

  tipTotalEl.textContent = `$${tipAmt.toFixed(2)}`;
  tipBillEl.textContent = `$${total.toFixed(2)}`;
  tipPerPersonEl.textContent = `$${perPerson.toFixed(2)}`;
}

const tipBillEl = document.getElementById('tipBill');
const tipPercentEl = document.getElementById('tipPercent');
const tipSplitEl = document.getElementById('tipSplit');
const tipUseBtn = document.getElementById('tipUseBtn');

if (tipBillEl) tipBillEl.addEventListener('input', calculateTip);
if (tipPercentEl) tipPercentEl.addEventListener('input', calculateTip);
if (tipSplitEl) tipSplitEl.addEventListener('input', calculateTip);
if (tipUseBtn) {
  tipUseBtn.addEventListener('click', () => {
    const val = document.getElementById('tipPerPerson').textContent;
    sendValueToCalculator(val);
  });
}

// 5. Base Converter
function calculateBase() {
  const decInput = document.getElementById('baseDecInput').value;
  const dec = parseInt(decInput, 10);
  const binEl = document.getElementById('baseBinVal');
  const hexEl = document.getElementById('baseHexVal');
  const octEl = document.getElementById('baseOctVal');

  if (Number.isNaN(dec)) {
    binEl.textContent = '--';
    hexEl.textContent = '--';
    octEl.textContent = '--';
    return;
  }

  binEl.textContent = (dec >>> 0).toString(2);
  hexEl.textContent = (dec >>> 0).toString(16).toUpperCase();
  octEl.textContent = (dec >>> 0).toString(8);
}

const baseDecInputEl = document.getElementById('baseDecInput');
if (baseDecInputEl) baseDecInputEl.addEventListener('input', calculateBase);

document.querySelectorAll('.toolCopyBtn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetEl = document.getElementById(btn.dataset.target);
    if (targetEl && targetEl.textContent && targetEl.textContent !== '--') {
      navigator.clipboard.writeText(targetEl.textContent).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = orig; }, 1200);
      });
    }
  });
});

// 6. BMI Calculator
function calculateBMI() {
  const weight = parseFloat(document.getElementById('bmiWeight').value);
  const height = parseFloat(document.getElementById('bmiHeight').value);
  const scoreEl = document.getElementById('bmiScore');
  const catEl = document.getElementById('bmiCategory');

  if (Number.isNaN(weight) || Number.isNaN(height) || weight <= 0 || height <= 0) {
    scoreEl.textContent = '--';
    catEl.textContent = '--';
    catEl.className = 'bmiBadge';
    return;
  }

  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  const rounded = Math.round(bmi * 100) / 100;
  scoreEl.textContent = rounded.toFixed(2);

  if (bmi < 18.5) {
    catEl.textContent = 'Underweight';
    catEl.className = 'bmiBadge badgeUnder';
  } else if (bmi < 25) {
    catEl.textContent = 'Normal';
    catEl.className = 'bmiBadge badgeNormal';
  } else if (bmi < 30) {
    catEl.textContent = 'Overweight';
    catEl.className = 'bmiBadge badgeOver';
  } else {
    catEl.textContent = 'Obese';
    catEl.className = 'bmiBadge badgeObese';
  }
}

const bmiWeightEl = document.getElementById('bmiWeight');
const bmiHeightEl = document.getElementById('bmiHeight');
const bmiUseBtn = document.getElementById('bmiUseBtn');

if (bmiWeightEl) bmiWeightEl.addEventListener('input', calculateBMI);
if (bmiHeightEl) bmiHeightEl.addEventListener('input', calculateBMI);
if (bmiUseBtn) {
  bmiUseBtn.addEventListener('click', () => {
    const val = document.getElementById('bmiScore').textContent;
    sendValueToCalculator(val);
  });
}

// 7. Age Calculator
function calculateAge() {
  const birthVal = document.getElementById('birthDateInput').value;
  const ageResult = document.getElementById('ageResult');
  const ageDays = document.getElementById('ageTotalDays');

  if (!birthVal) {
    ageResult.textContent = 'Select birthdate';
    ageDays.textContent = '--';
    return;
  }

  const birthDate = new Date(birthVal);
  const today = new Date();

  if (birthDate > today) {
    ageResult.textContent = 'Date is in the future';
    ageDays.textContent = '--';
    return;
  }

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const prevMonthDays = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    days += prevMonthDays;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const diffTime = Math.abs(today - birthDate);
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  ageResult.textContent = `${years}y ${months}m ${days}d`;
  ageDays.textContent = `${totalDays.toLocaleString()} days`;
}

const birthDateInputEl = document.getElementById('birthDateInput');
if (birthDateInputEl) birthDateInputEl.addEventListener('change', calculateAge);

// Initialization
loadHistoryFromStorage();
renderHistory();
updateDisplay();
populateUnitCategory('speed');
initCurrencies();
calculateDiscount();
calculateTip();
calculateBase();
calculateBMI();