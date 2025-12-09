/**
 * API Client
 * Взаимодействие с backend API
 */

// API URL из конфига (в продакшене будет https://контентбот.рф/api)
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://контентбот.рф/api';

/**
 * Отправить результат победы
 */
async function sendWinResult(userId, username) {
    try {
        const response = await fetch(`${API_URL}/game/win`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                username: username,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка отправки результата победы:', error);

        // Fallback: генерируем промокод локально если API недоступен
        return {
            status: 'ok',
            promo_code: generateFallbackPromoCode(),
            limit_reached: false,
            message_sent: false
        };
    }
}

/**
 * Отправить результат поражения
 */
async function sendLoseResult(userId, username) {
    try {
        const response = await fetch(`${API_URL}/game/lose`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                username: username,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка отправки результата поражения:', error);
        return { status: 'error', message_sent: false };
    }
}

/**
 * Получить статистику пользователя
 */
async function getUserStats(userId) {
    try {
        const response = await fetch(`${API_URL}/user/stats/${userId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        return null;
    }
}

/**
 * Проверка здоровья API
 */
async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        console.log('API Health:', data);
        return data.status === 'ok';
    } catch (error) {
        console.error('API недоступен:', error);
        return false;
    }
}

/**
 * Fallback генератор промокодов (если API недоступен)
 */
function generateFallbackPromoCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
