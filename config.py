"""
Конфигурация приложения XOBot
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Telegram Bot
BOT_TOKEN = os.getenv('BOT_TOKEN', '')
WEBAPP_URL = os.getenv('WEBAPP_URL', 'https://контентбот.рф/webapp')
API_URL = os.getenv('API_URL', 'https://контентбот.рф/api')

# Flask
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
FLASK_ENV = os.getenv('FLASK_ENV', 'development')
DEBUG = FLASK_ENV == 'development'

# Database
DB_PATH = os.path.join(os.path.dirname(__file__), 'xobot.db')

# Promo Code Settings
PROMO_CODE_LENGTH = 5
PROMO_CODE_EXPIRY_DAYS = 30
MAX_PROMO_CODES_PER_DAY = 3

# API Settings
RATE_LIMIT_PER_MINUTE = 10
ALLOWED_ORIGINS = [
    'https://контентбот.рф',
    'https://web.telegram.org',
]

# Game Settings
AI_THINKING_DELAY = 1.0  # секунды (для UX)
