/**
 * UI Controller
 * Управление интерфейсом и анимациями
 */

// Элементы экранов
const screens = {
    start: document.getElementById('startScreen'),
    game: document.getElementById('gameScreen'),
    win: document.getElementById('winScreen'),
    lose: document.getElementById('loseScreen'),
    draw: document.getElementById('drawScreen')
};

// Элементы управления
const elements = {
    gameBoard: document.getElementById('gameBoard'),
    turnIndicator: document.getElementById('turnIndicator'),
    turnText: document.getElementById('turnText'),
    moveCounter: document.getElementById('moveCounter'),
    promoCodeDisplay: document.getElementById('promoCodeDisplay'),
    promoCard: document.getElementById('promoCard'),
    promoLimitWarning: document.getElementById('promoLimitWarning'),
    confettiCanvas: document.getElementById('confettiCanvas'),
    toast: document.getElementById('toast'),
    toastText: document.getElementById('toastText')
};

/**
 * Переключение между экранами
 */
function switchScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });

    if (screens[screenName]) {
        screens[screenName].classList.add('active');
    }
}

/**
 * Создание SVG для сердечка (игрок O)
 */
function createHeartSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M50 85 C30 70, 20 60, 20 45 C20 30, 30 25, 40 30 C45 32, 50 40, 50 40 C50 40, 55 32, 60 30 C70 25, 80 30, 80 45 C80 60, 70 70, 50 85 Z');
    path.setAttribute('fill', '#FFB6D9');
    path.setAttribute('stroke', '#E0A8D8');
    path.setAttribute('stroke-width', '2');

    svg.appendChild(path);
    return svg;
}

/**
 * Создание SVG для звездочки (AI X)
 */
function createStarSVG() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M50 10 L60 40 L90 40 L65 60 L75 90 L50 70 L25 90 L35 60 L10 40 L40 40 Z');
    path.setAttribute('fill', '#D4B5E8');
    path.setAttribute('stroke', '#C9A8DB');
    path.setAttribute('stroke-width', '2');

    svg.appendChild(path);
    return svg;
}

/**
 * Инициализация игровой доски
 */
function initGameBoard() {
    elements.gameBoard.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        elements.gameBoard.appendChild(cell);
    }
}

/**
 * Обновление клетки доски
 */
function updateCell(index, player) {
    console.log('updateCell called:', { index, player });
    const cell = elements.gameBoard.querySelector(`[data-index="${index}"]`);

    if (!cell) {
        console.error('Cell not found for index:', index);
        return;
    }

    if (cell.classList.contains('filled')) {
        console.log('Cell already filled');
        return;
    }

    cell.classList.add('filled');

    const icon = player === 'O' ? createHeartSVG() : createStarSVG();
    console.log('Created icon:', icon, 'for player:', player);

    cell.appendChild(icon);
    console.log('Icon appended to cell');

    // Вибрация при размещении
    vibrate(30);
}

/**
 * Подсветка выигрышной линии
 */
function highlightWinningLine(line) {
    line.forEach(index => {
        const cell = elements.gameBoard.querySelector(`[data-index="${index}"]`);
        if (cell) {
            cell.classList.add('winner');
        }
    });
}

/**
 * Обновление индикатора хода
 */
function updateTurnIndicator(isPlayerTurn) {
    if (isPlayerTurn) {
        elements.turnText.textContent = 'Твой ход';
        elements.turnIndicator.style.background = 'linear-gradient(135deg, #FFB6D9, #E0A8D8)';
        elements.turnIndicator.style.color = '#FFFFFF';
    } else {
        elements.turnText.textContent = 'Подруга думает...';
        elements.turnIndicator.style.background = 'linear-gradient(135deg, #D4B5E8, #C9A8DB)';
        elements.turnIndicator.style.color = '#FFFFFF';
    }
}

/**
 * Обновление счетчика ходов
 */
function updateMoveCounter(count) {
    elements.moveCounter.textContent = count;
}

/**
 * Показать экран победы
 */
function showWinScreen(promoCode, limitReached = false) {
    if (promoCode && !limitReached) {
        elements.promoCodeDisplay.textContent = promoCode;
        elements.promoCard.style.display = 'block';
        elements.promoLimitWarning.style.display = 'none';

        // Запускаем конфетти
        if (typeof startConfetti === 'function') {
            startConfetti();
        }
    } else if (limitReached) {
        elements.promoCard.style.display = 'none';
        elements.promoLimitWarning.style.display = 'block';
    }

    // Вибрация победы
    vibrate([100, 50, 100, 50, 100]);

    switchScreen('win');
}

/**
 * Показать экран поражения
 */
function showLoseScreen() {
    vibrate(200);
    switchScreen('lose');
}

/**
 * Показать экран ничьи
 */
function showDrawScreen() {
    vibrate(100);
    switchScreen('draw');
}

/**
 * Показать toast уведомление
 */
function showToast(message, duration = 2000) {
    elements.toastText.textContent = message;
    elements.toast.classList.add('show');

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, duration);
}

/**
 * Копировать текст в буфер обмена
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback для старых браузеров
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success;
        }
    } catch (err) {
        console.error('Ошибка копирования:', err);
        return false;
    }
}

/**
 * Блокировка/разблокировка кликов по доске
 */
function setBoardInteractive(interactive) {
    const cells = elements.gameBoard.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.style.pointerEvents = interactive ? 'auto' : 'none';
    });
}
