"""
Main Entry Point для XOBot
Запускает Flask API и Telegram Bot одновременно
"""
import threading
import logging
from api import app
from bot import create_bot_application
import database
import config

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


def run_flask():
    """Запуск Flask API"""
    logger.info(f"Запуск Flask API на порту 5000...")
    app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)


def run_bot():
    """Запуск Telegram бота"""
    logger.info("Запуск Telegram бота...")
    application = create_bot_application()
    
    # Запускаем polling
    application.run_polling(allowed_updates=['message', 'callback_query'])


if __name__ == '__main__':
    # Инициализируем базу данных
    logger.info("Инициализация базы данных...")
    database.init_db()
    
    # Проверяем наличие токена
    if not config.BOT_TOKEN:
        logger.error("❌ BOT_TOKEN не установлен! Создайте .env файл с токеном бота.")
        exit(1)
    
    logger.info("✅ Конфигурация загружена")
    logger.info(f"WebApp URL: {config.WEBAPP_URL}")
    logger.info(f"API URL: {config.API_URL}")
    
    # Запускаем Flask в отдельном потоке
    flask_thread = threading.Thread(target=run_flask, daemon=True)
    flask_thread.start()
    
    # Запускаем бота в главном потоке
    try:
        run_bot()
    except KeyboardInterrupt:
        logger.info("Остановка приложения...")
