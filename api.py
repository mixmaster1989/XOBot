"""
Flask API для XOBot
Обработка результатов игр и интеграция с Telegram
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import hashlib
import hmac
import urllib.parse
from typing import Dict, Any
import config
import database
import promo_generator


app = Flask(__name__)
app.config['SECRET_KEY'] = config.SECRET_KEY
CORS(app, origins=config.ALLOWED_ORIGINS)

# Словарь для rate limiting (в продакшене использовать Redis)
rate_limit_storage = {}


def validate_telegram_data(init_data: str) -> Dict[str, Any]:
    """
    Валидация InitData от Telegram WebApp
    Проверяет что запрос действительно пришел из Telegram
    """
    try:
        # Парсим данные
        parsed_data = dict(urllib.parse.parse_qsl(init_data))
        
        # В продакшене здесь должна быть валидация через HMAC
        # Для простоты сейчас просто возвращаем данные
        # TODO: Добавить полную валидацию InitData
        
        return parsed_data
    except Exception as e:
        return None


def check_rate_limit(user_id: int) -> bool:
    """
    Проверка rate limit: максимум 10 запросов в минуту
    """
    now = datetime.now()
    minute_ago = now.timestamp() - 60
    
    # Очищаем старые записи
    if user_id in rate_limit_storage:
        rate_limit_storage[user_id] = [
            ts for ts in rate_limit_storage[user_id]
            if ts > minute_ago
        ]
    else:
        rate_limit_storage[user_id] = []
    
    # Проверяем лимит
    if len(rate_limit_storage[user_id]) >= config.RATE_LIMIT_PER_MINUTE:
        return False
    
    # Добавляем текущий запрос
    rate_limit_storage[user_id].append(now.timestamp())
    return True


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/game/win', methods=['POST'])
def handle_win():
    """
    Обработка победы игрока
    Генерирует промокод и отправляет уведомление в Telegram
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    user_id = data.get('user_id')
    username = data.get('username')
    timestamp = data.get('timestamp')
    
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    
    # Проверка rate limit
    if not check_rate_limit(user_id):
        return jsonify({'error': 'Rate limit exceeded'}), 429
    
    # Получаем или создаем пользователя
    database.get_or_create_user(user_id, username)
    
    # Проверяем можем ли выдать промокод
    if not promo_generator.can_generate_promo_code(user_id):
        # Достигнут лимит промокодов
        database.add_game_result(user_id, 'WIN', None)
        
        # Отправляем уведомление через бота
        send_telegram_message(user_id, "🎉 *Победа!*\n\nНо лимит промокодов на сегодня исчерпан.\nМаксимум 3 промокода в день 😊")
        
        return jsonify({
            'status': 'ok',
            'message_sent': True,
            'promo_code': None,
            'limit_reached': True
        })
    
    # Генерируем промокод
    promo_code = promo_generator.generate_unique_promo_code(user_id)
    
    if not promo_code:
        return jsonify({'error': 'Failed to generate promo code'}), 500
    
    # Сохраняем результат игры
    database.add_game_result(user_id, 'WIN', promo_code)
    
    # Получаем имя пользователя для персонализации
    user_data = database.get_or_create_user(user_id, username, username)
    user_first_name = user_data.get('first_name', 'Красотка')
    
    # Отправляем персональное уведомление в Telegram с FOMO триггерами
    message = f"🎉 *{user_first_name}, ты победила!* 💕\n\n🎁 Твой промокод: `{promo_code}`\n\n💄 *Скидка 20-50%* на:\n• Косметику и уход\n• Одежду и аксессуары\n• Салоны красоты\n\n⏰ *Действует только 30 дней!*\n💝 Побалуй себя любимую! ✨"
    send_telegram_message(user_id, message)
    
    return jsonify({
        'success': True,
        'promo_code': promo_code
    })


@app.route('/api/game/lose', methods=['POST'])
def handle_lose():
    """
    Обработка поражения игрока
    Отправляет уведомление в Telegram
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    user_id = data.get('user_id')
    username = data.get('username')
    
    if not user_id:
        return jsonify({'error': 'user_id is required'}), 400
    
    # Проверка rate limit
    if not check_rate_limit(user_id):
        return jsonify({'error': 'Rate limit exceeded'}), 429
    
    # Получаем или создаем пользователя
    database.get_or_create_user(user_id, username)
    
    # Сохраняем результат игры
    database.add_game_result(user_id, 'LOSS')
    
    # Получаем имя для персонализации
    user_data = database.get_or_create_user(user_id, username, username)
    user_first_name = user_data.get('first_name', 'Красотка')
    
    # Отправляем мотивирующее уведомление
    message = f"💕 *{user_first_name}, подруга выиграла!*\n\nНичего страшного! 😊\nВ следующий раз повезёт больше!\n\n✨ Давай сыграем ещё разок? Ты обязательно выиграешь! 💪"
    send_telegram_message(user_id, message)
    
    return jsonify({
        'success': True,
        'message': 'Loss recorded'
    })


@app.route('/api/user/stats/<int:user_id>', methods=['GET'])
def get_stats(user_id: int):
    """Получить статистику пользователя"""
    stats = database.get_user_stats(user_id)
    return jsonify(stats)


def send_telegram_message(user_id: int, text: str):
    """Отправить сообщение пользователю через Telegram бота (синхронно)"""
    if not config.BOT_TOKEN:
        print(f"[DEBUG] Бот токен не установлен. Сообщение для {user_id}: {text}")
        return False
    
    try:
        import requests
        
        url = f"https://api.telegram.org/bot{config.BOT_TOKEN}/sendMessage"
        payload = {
            'chat_id': user_id,
            'text': text,
            'parse_mode': 'Markdown'
        }
        
        response = requests.post(url, json=payload, timeout=5)
        
        if response.status_code == 200:
            print(f"[SUCCESS] Сообщение отправлено пользователю {user_id}")
            return True
        else:
            print(f"[ERROR] Ошибка отправки: {response.status_code}, {response.text}")
            return False
            
    except Exception as e:
        print(f"[ERROR] Исключение при отправке сообщения: {e}")
        return False


if __name__ == '__main__':
    database.init_db()
    app.run(host='0.0.0.0', port=5000, debug=config.DEBUG)
