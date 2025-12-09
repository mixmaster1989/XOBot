/**
 * Telegram WebApp Initialization
 * Инициализация и настройка Telegram Web App SDK
 */

// Получаем Telegram WebApp объект
const tg = window.Telegram.WebApp;

// Инициализация
function initTelegramWebApp() {
    // Раскрываем WebApp на весь экран
    tg.expand();

    // Включаем кнопку закрытия
    tg.enableClosingConfirmation();

    // Готовность к показу
    tg.ready();

    // Устанавливаем цвет заголовка
    tg.setHeaderColor('#FFE5F1');

    // Устанавливаем цвет фона
    tg.setBackgroundColor('#FFF8FC');

    console.log('Telegram WebApp инициализирован');
    console.log('User ID:', tg.initDataUnsafe?.user?.id);
    console.log('Username:', tg.initDataUnsafe?.user?.username);
}

// Получить данные пользователя
function getTelegramUser() {
    const user = tg.initDataUnsafe?.user;
    if (user) {
        return {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            language_code: user.language_code
        };
    }

    // Для тестирования без Telegram
    return {
        id: 123456789,
        first_name: 'Test',
        username: 'testuser'
    };
}

// Получить InitData для валидации на backend
function getTelegramInitData() {
    return tg.initData || '';
}

// Вибрация (если поддерживается)
function vibrate(duration = 50) {
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    } else if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

// Показать главную кнопку (опционально)
function showMainButton(text, onClick) {
    tg.MainButton.text = text;
    tg.MainButton.show();
    tg.MainButton.onClick(onClick);
}

// Скрыть главную кнопку
function hideMainButton() {
    tg.MainButton.hide();
}

// Инициализируем при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTelegramWebApp);
} else {
    initTelegramWebApp();
}
