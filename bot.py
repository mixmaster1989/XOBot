"""
Telegram Bot для XOBot
Обработка команд и запуск WebApp
"""
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
import config
import database


# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /start"""
    user = update.effective_user
    
    # Создаем пользователя в базе если его нет
    database.get_or_create_user(user.id, user.username, user.first_name)
    
    welcome_text = f"""
👋 Привет, {user.first_name}!

Добро пожаловать в игру **Крестики-Нолики**! ✨

🎮 Играй со своей новой подругой и получай промокоды!

**Как играть:**
• Нажми кнопку "🎮 Играть" ниже
• Выигрывай и получай промокоды
• До 3 промокодов в день 🎁

Удачи! 🍀
    """
    
    # Кнопка для запуска WebApp
    keyboard = [
        [InlineKeyboardButton(
            "🎮 Играть",
            web_app=WebAppInfo(url=f"{config.WEBAPP_URL}/")
        )],
        [InlineKeyboardButton("📊 Статистика", callback_data="stats")],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        welcome_text,
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )


async def play_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /play"""
    keyboard = [
        [InlineKeyboardButton(
            "🎮 Запустить игру",
            web_app=WebAppInfo(url=f"{config.WEBAPP_URL}/")
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Нажми кнопку ниже чтобы начать игру! 🎮",
        reply_markup=reply_markup
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /help"""
    help_text = """
📖 **Правила игры Крестики-Нолики**

**Цель игры:**
Первым поставить 3 своих символа в ряд (горизонтально, вертикально или по диагонали)

**Как играть:**
1. Ты играешь за ⭕ (кружочки)
2. AI играет за ❌ (крестики)
3. Ходите по очереди
4. Побеждает тот, кто первым выстроит линию из 3 символов

**Промокоды:**
• При победе получаешь 5-значный промокод на скидку
• Максимум 3 промокода в день
• Промокоды действуют 30 дней

**Команды бота:**
/start - Начать игру
/play - Запустить игру
/history - История твоих игр  
/promo_info - Информация о промокодах
/help - Эта справка

Удачи в игре! 🎯
    """
    
    await update.message.reply_text(help_text, parse_mode='Markdown')


async def history_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /history"""
    user_id = update.effective_user.id
    
    stats = database.get_user_stats(user_id)
    recent_games = database.get_user_recent_games(user_id, limit=5)
    
    history_text = f"""
📊 **Твоя статистика**

🏆 Побед: {stats['total_wins']}
😔 Поражений: {stats['total_losses']}
🎟️ Промокодов сегодня: {stats['codes_today']}/{config.MAX_PROMO_CODES_PER_DAY}

**Последние 5 игр:**
    """
    
    if recent_games:
        for i, game in enumerate(recent_games, 1):
            result_emoji = "🏆" if game['result'] == 'WIN' else "😔" if game['result'] == 'LOSS' else "🤝"
            result_text = "Победа" if game['result'] == 'WIN' else "Поражение" if game['result'] == 'LOSS' else "Ничья"
            promo_text = f" - {game['promo_code']}" if game['promo_code'] else ""
            history_text += f"\n{i}. {result_emoji} {result_text}{promo_text}"
    else:
        history_text += "\nПока нет сыгранных игр. Начни играть! 🎮"
    
    await update.message.reply_text(history_text, parse_mode='Markdown')


async def promo_info_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик команды /promo_info"""
    user_id = update.effective_user.id
    stats = database.get_user_stats(user_id)
    
    promo_text = f"""
🎟️ **Информация о промокодах**

**Лимиты:**
• Максимум {config.MAX_PROMO_CODES_PER_DAY} промокода в день
• Промокоды действуют {config.PROMO_CODE_EXPIRY_DAYS} дней

**Твой статус сегодня:**
• Получено: {stats['codes_today']}/{config.MAX_PROMO_CODES_PER_DAY}
• Осталось: {stats['codes_remaining_today']}

**Как получить промокод:**
1. Запусти игру через /play
2. Победи AI
3. Промокод появится на экране и придет сообщением

Играй и выигрывай! 🎯
    """
    
    await update.message.reply_text(promo_text, parse_mode='Markdown')


async def stats_button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик кнопки Статистика"""
    query = update.callback_query
    await query.answer()
    
    user_id = query.from_user.id
    
    stats = database.get_user_stats(user_id)
    recent_games = database.get_user_recent_games(user_id, limit=5)
    
    stats_text = f"""
📊 **Мои результаты**

🏆 Побед: {stats['total_wins']}
💕 Поражений: {stats['total_losses']}
🎁 Промокодов сегодня: {stats['codes_today']}/{config.MAX_PROMO_CODES_PER_DAY}

**Последние 5 игр:**
    """
    
    if recent_games:
        for i, game in enumerate(recent_games, 1):
            result_emoji = "🏆" if game['result'] == 'WIN' else "💕" if game['result'] == 'LOSS' else "🤝"
            result_text = "Победа" if game['result'] == 'WIN' else "Поражение" if game['result'] == 'LOSS' else "Ничья"
            promo_text = f" - `{game['promo_code']}`" if game['promo_code'] else ""
            stats_text += f"\n{i}. {result_emoji} {result_text}{promo_text}"
    else:
        stats_text += "\nПока нет сыгранных игр. Начни играть! 🎮"
    
    # Кнопка для запуска игры
    keyboard = [
        [InlineKeyboardButton(
            "🎮 Играть",
            web_app=WebAppInfo(url=f"{config.WEBAPP_URL}/")
        )]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(
        stats_text,
        reply_markup=reply_markup,
        parse_mode='Markdown'
    )


async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик ошибок"""
    logger.error(f"Update {update} caused error {context.error}")


def create_bot_application():
    """Создать и настроить приложение бота"""
    if not config.BOT_TOKEN:
        raise ValueError("BOT_TOKEN не установлен в .env файле!")
    
    # Создаем приложение
    application = Application.builder().token(config.BOT_TOKEN).build()
    
    # Регистрируем обработчики команд
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("play", play_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("history", history_command))
    application.add_handler(CommandHandler("promo_info", promo_info_command))
    
    # Регистрируем обработчик callback query
    application.add_handler(CallbackQueryHandler(stats_button_callback, pattern="^stats$"))
    
    # Регистрируем обработчик ошибок
    application.add_error_handler(error_handler)
    
    return application


if __name__ == '__main__':
    # Инициализация БД
    database.init_db()
    
    # Создаем и запускаем приложение
    app = create_bot_application()
    
    logger.info("Бот запущен! Ожидание сообщений...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)
