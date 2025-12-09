/**
 * Main App Controller
 * Главный контроллер приложения
 */

// Текущий пользователь
let currentUser = null;

// Инициализация приложения
function initApp() {
    // Получаем пользователя из Telegram
    currentUser = getTelegramUser();
    console.log(' Приложение запущено для пользователя:', currentUser);

    // Проверяем API
    checkAPIHealth();

    // Показываем стартовый экран
    switchScreen('start');

    // Привязываем обработчики событий
    attachEventListeners();

    // Инициализируем состояние кнопки звука
    initSoundButton();
}

/**
 * Привязка обработчиков событий
 */
function attachEventListeners() {
    // Обработчики кнопок
    document.getElementById('startGameBtn').addEventListener('click', startGame);
    document.getElementById('resetGameBtn').addEventListener('click', resetGame);
    document.getElementById('playAgainFromWin').addEventListener('click', resetGame);
    document.getElementById('playAgainFromLose').addEventListener('click', resetGame);
    document.getElementById('playAgainFromDraw').addEventListener('click', resetGame);

    // Обработчик кнопки звука
    document.getElementById('toggleSoundBtn').addEventListener('click', toggleSound);

    // Кнопка "В главное меню" на экране поражения
    document.getElementById('backToMenu').addEventListener('click', () => {
        switchScreen('start');
    });

    // Кнопка копирования промокода
    document.getElementById('copyPromoBtn').addEventListener('click', async () => {
        const promoCode = elements.promoCodeDisplay.textContent;
        const success = await copyToClipboard(promoCode);

        if (success) {
            showToast('✅ Промокод скопирован!');
            vibrate(50);
        } else {
            showToast('❌ Ошибка копирования');
        }
    });
}

/**
 * Начать новую игру
 */
function startGame() {
    // ВАЖНО: Инициализируем звук сразу при старте игры
    // Это гарантирует что AudioContext создан ДО первого звука
    if (window.soundManager && !window.soundManager.audioContext) {
        try {
            window.soundManager.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioContext force-created on game start');
        } catch (e) {
            console.log('Could not create AudioContext:', e);
        }
    }

    // Инициализируем игру
    initGame();

    // Инициализируем доску
    initGameBoard();

    // Обновляем UI
    updateTurnIndicator(true);
    updateMoveCounter(1);

    // Переключаемся на экран игры
    switchScreen('game');

    // Привязываем клики к клеткам
    attachCellListeners();

    // Разрешаем клики
    setBoardInteractive(true);
}

/**
 * Привязка обработчиков к клеткам доски
 */
function attachCellListeners() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });
}

/**
 * Обработчик клика по клетке
 */
async function handleCellClick(event) {
    const cell = event.currentTarget;
    const position = parseInt(cell.dataset.index);

    // Проверяем можно ли сделать ход
    if (cell.classList.contains('filled')) {
        return;
    }

    // Звук клика
    if (window.soundManager) {
        window.soundManager.playClick();
    }

    // Делаем ход игрока
    const moveSuccess = makeMove(position);
    if (!moveSuccess) return;

    // Обновляем UI
    updateCell(position, PLAYER);
    updateMoveCounter(getMoveCount());

    // Проверяем состояние игры после хода игрока
    let gameState = getGameState();

    if (gameState.status !== 'ONGOING') {
        await handleGameEnd(gameState);
        return;
    }

    // Ход AI
    setBoardInteractive(false);
    updateTurnIndicator(false);

    // Задержка для UX (чтобы пользователь видел что AI "думает")
    setTimeout(async () => {
        const aiPosition = makeAIMove();

        if (aiPosition !== null) {
            updateCell(aiPosition, AI);
            updateMoveCounter(getMoveCount());

            // Проверяем состояние после хода AI
            gameState = getGameState();

            if (gameState.status !== 'ONGOING') {
                await handleGameEnd(gameState);
            } else {
                updateTurnIndicator(true);
                setBoardInteractive(true);
            }
        }
    }, 1000);
}

/**
 * Обработка окончания игры
 */
async function handleGameEnd(gameState) {
    setGameActive(false);
    setBoardInteractive(false);

    // Подсвечиваем выигрышную линию
    if (gameState.line) {
        highlightWinningLine(gameState.line);
    }

    // Задержка перед показом результата
    await new Promise(resolve => setTimeout(resolve, 1000));

    switch (gameState.status) {
        case 'USER_WIN':
            // Отправляем результат на сервер
            const result = await sendWinResult(currentUser.id, currentUser.username);
            // Показываем экран победы с промокодом
            showWinScreen(result.promo_code, result.limit_reached);

            // Звук победы
            if (window.soundManager) {
                window.soundManager.playWin();
            }

            // Конфетти!
            if (window.confetti) {
                window.confetti.start();
                setTimeout(() => window.confetti.stop(), 3000);
            }
            break;
        case 'AI_WIN':
            // Отправляем результат поражения
            await sendLoseResult(currentUser.id, currentUser.username);
            // Показываем экран поражения
            showLoseScreen();

            // Звук проигрыша
            if (window.soundManager) {
                window.soundManager.playLose();
            }
            break;
        case 'DRAW':
            // Ничья (не отправляем на сервер)
            showDrawScreen();

            // Звук ничьи
            if (window.soundManager) {
                window.soundManager.playDraw();
            }
            break;
    }
}

// Запуск приложения при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

/**
 * Переключить звук
 */
function toggleSound() {
    if (!window.soundManager) return;

    const enabled = window.soundManager.toggle();
    const btn = document.getElementById('toggleSoundBtn');
    const icon = btn.querySelector('.sound-icon');
    const text = btn.querySelector('.sound-text');

    if (enabled) {
        icon.textContent = '🔊';
        text.textContent = 'Звук ВКЛ.';
        btn.classList.remove('sound-off');
        btn.classList.add('sound-on');
    } else {
        icon.textContent = '🔇';
        text.textContent = 'Звук ВЫКЛ.';
        btn.classList.remove('sound-on');
        btn.classList.add('sound-off');
    }
}

/**
 * Инициализировать состояние кнопки звука
 */
function initSoundButton() {
    if (!window.soundManager) {
        console.log('soundManager not available');
        return;
    }

    const btn = document.getElementById('toggleSoundBtn');
    if (!btn) return;

    const icon = btn.querySelector('.sound-icon');
    const text = btn.querySelector('.sound-text');
    const enabled = window.soundManager.isEnabled();

    console.log('Sound status:', enabled ? 'enabled' : 'disabled');

    if (enabled) {
        icon.textContent = '🔊';
        text.textContent = 'Звук ВКЛ.';
        btn.classList.remove('sound-off');
        btn.classList.add('sound-on');
    } else {
        icon.textContent = '🔇';
        text.textContent = 'Звук ВЫКЛ.';
        btn.classList.remove('sound-on');
        btn.classList.add('sound-off');
    }
}

/**
 * Перезапустить игру (алиас для startGame)
 */
function resetGame() {
    startGame();
}
