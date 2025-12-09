/**
 * Game Logic - Tic Tac Toe with AI
 * Крестики-нолики с AI на основе Minimax алгоритма
 */

// Константы
const PLAYER = 'O';
const AI = 'X';
const EMPTY = '';

// Состояние игры
let board = Array(9).fill(EMPTY);
let currentPlayer = PLAYER; // Игрок всегда ходит первым
let gameActive = true;
let moveCount = 0;

// Возможные выигрышные комбинации
const winningCombinations = [
    [0, 1, 2], // Верхняя горизонталь
    [3, 4, 5], // Средняя горизонталь
    [6, 7, 8], // Нижняя горизонталь
    [0, 3, 6], // Левая вертикаль
    [1, 4, 7], // Средняя вертикаль
    [2, 5, 8], // Правая вертикаль
    [0, 4, 8], // Диагональ \
    [2, 4, 6]  // Диагональ /
];

/**
 * Инициализация новой игры
 */
function initGame() {
    board = Array(9).fill(EMPTY);
    currentPlayer = PLAYER;
    gameActive = true;
    moveCount = 0;
}

/**
 * Сделать ход игрока
 */
function makeMove(position) {
    if (!gameActive || board[position] !== EMPTY) {
        return false;
    }

    board[position] = currentPlayer;
    moveCount++;

    return true;
}

/**
 * Проверка победы
 * Возвращает: { winner: 'O'|'X', line: [0,1,2] } или null
 */
function checkWinner() {
    for (let combination of winningCombinations) {
        const [a, b, c] = combination;

        if (board[a] !== EMPTY &&
            board[a] === board[b] &&
            board[a] === board[c]) {
            return {
                winner: board[a],
                line: combination
            };
        }
    }

    return null;
}

/**
 * Проверка ничьи
 */
function checkDraw() {
    return moveCount === 9 && !checkWinner();
}

/**
 * Получить состояние игры
 */
function getGameState() {
    const winnerInfo = checkWinner();

    if (winnerInfo) {
        return {
            status: winnerInfo.winner === PLAYER ? 'USER_WIN' : 'AI_WIN',
            winner: winnerInfo.winner,
            line: winnerInfo.line
        };
    }

    if (checkDraw()) {
        return {
            status: 'DRAW',
            winner: null,
            line: null
        };
    }

    return {
        status: 'ONGOING',
        winner: null,
        line: null
    };
}

/**
 * AI ход - ОЧЕНЬ СЛАБЫЙ AI для женской аудитории
 * 95% времени - полный рандом (почти всегда тупит)
 * 5% времени - умный ход (чтобы иногда было интересно)
 */
function makeAIMove() {
    if (!gameActive) return null;

    // Получаем доступные позиции
    const availablePositions = board
        .map((cell, index) => cell === EMPTY ? index : null)
        .filter(index => index !== null);

    if (availablePositions.length === 0) return null;

    let chosenPosition;

    // 95% времени делаем ТУПОЙ случайный ход (девочки легко выигрывают)
    if (Math.random() < 0.95) {
        // Полностью случайный ход
        chosenPosition = availablePositions[Math.floor(Math.random() * availablePositions.length)];
    } else {
        // Только 5% времени делаем умный ход
        const bestMove = minimax(board, AI, -Infinity, Infinity);
        chosenPosition = bestMove.index !== null ? bestMove.index : availablePositions[0];
    }

    board[chosenPosition] = AI;
    moveCount++;
    return chosenPosition;
}

/**
 * Minimax алгоритм с Alpha-Beta pruning
 * Делает AI непобедимым
 */
function minimax(currentBoard, player, alpha, beta) {
    // Получаем доступные позиции
    const availablePositions = currentBoard
        .map((cell, index) => cell === EMPTY ? index : null)
        .filter(index => index !== null);

    // Проверяем терминальные состояния
    const winner = checkWinnerForBoard(currentBoard);

    if (winner === PLAYER) {
        return { score: -10 };
    } else if (winner === AI) {
        return { score: 10 };
    } else if (availablePositions.length === 0) {
        return { score: 0 };
    }

    // Minimax с alpha-beta pruning
    if (player === AI) {
        let maxEval = { score: -Infinity, index: null };

        for (let i = 0; i < availablePositions.length; i++) {
            const position = availablePositions[i];
            currentBoard[position] = AI;

            const evaluation = minimax(currentBoard, PLAYER, alpha, beta);
            currentBoard[position] = EMPTY;

            if (evaluation.score > maxEval.score) {
                maxEval = { score: evaluation.score, index: position };
            }

            alpha = Math.max(alpha, evaluation.score);
            if (beta <= alpha) {
                break; // Beta cutoff
            }
        }

        return maxEval;
    } else {
        let minEval = { score: Infinity, index: null };

        for (let i = 0; i < availablePositions.length; i++) {
            const position = availablePositions[i];
            currentBoard[position] = PLAYER;

            const evaluation = minimax(currentBoard, AI, alpha, beta);
            currentBoard[position] = EMPTY;

            if (evaluation.score < minEval.score) {
                minEval = { score: evaluation.score, index: position };
            }

            beta = Math.min(beta, evaluation.score);
            if (beta <= alpha) {
                break; // Alpha cutoff
            }
        }

        return minEval;
    }
}

/**
 * Проверка победителя для конкретной доски (для minimax)
 */
function checkWinnerForBoard(boardState) {
    for (let combination of winningCombinations) {
        const [a, b, c] = combination;

        if (boardState[a] !== EMPTY &&
            boardState[a] === boardState[b] &&
            boardState[a] === boardState[c]) {
            return boardState[a];
        }
    }

    return null;
}

/**
 * Получить текущую доску
 */
function getBoard() {
    return [...board];
}

/**
 * Установить активность игры
 */
function setGameActive(active) {
    gameActive = active;
}

/**
 * Получить количество ходов
 */
function getMoveCount() {
    return moveCount;
}
