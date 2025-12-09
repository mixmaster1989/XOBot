"""
Работа с базой данных SQLite для XOBot
"""
import sqlite3
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import config


def get_connection():
    """Получить подключение к БД"""
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Инициализация базы данных и создание таблиц"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Таблица пользователей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            first_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0
        )
    ''')
    
    # Таблица промокодов
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS promo_codes (
            code_id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            used BOOLEAN DEFAULT 0,
            used_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    ''')
    
    # Таблица истории игр
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS game_history (
            game_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            result TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            promo_code TEXT,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    ''')
    
    # Индексы для производительности
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_id ON game_history(user_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_generated_at ON promo_codes(generated_at)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_codes ON promo_codes(user_id, generated_at)')
    
    conn.commit()
    conn.close()


def get_or_create_user(user_id: int, username: str = None, first_name: str = None) -> Dict[str, Any]:
    """Получить пользователя или создать если не существует"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
    user = cursor.fetchone()
    
    if user:
        conn.close()
        return dict(user)
    
    # Создаем нового пользователя
    cursor.execute('''
        INSERT INTO users (user_id, username, first_name)
        VALUES (?, ?, ?)
    ''', (user_id, username, first_name))
    
    conn.commit()
    
    cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
    user = dict(cursor.fetchone())
    
    conn.close()
    return user


def add_promo_code(code: str, user_id: int) -> bool:
    """Добавить промокод в базу"""
    conn = get_connection()
    cursor = conn.cursor()
    
    expires_at = datetime.now() + timedelta(days=config.PROMO_CODE_EXPIRY_DAYS)
    
    try:
        cursor.execute('''
            INSERT INTO promo_codes (code, user_id, expires_at)
            VALUES (?, ?, ?)
        ''', (code, user_id, expires_at))
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        conn.close()
        return False


def get_promo_codes_today(user_id: int) -> int:
    """Получить количество промокодов сгенерированных сегодня"""
    conn = get_connection()
    cursor = conn.cursor()
    
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    cursor.execute('''
        SELECT COUNT(*) as count
        FROM promo_codes
        WHERE user_id = ? AND generated_at >= ?
    ''', (user_id, today_start))
    
    count = cursor.fetchone()['count']
    conn.close()
    
    return count


def add_game_result(user_id: int, result: str, promo_code: str = None):
    """Добавить результат игры"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO game_history (user_id, result, promo_code)
        VALUES (?, ?, ?)
    ''', (user_id, result, promo_code))
    
    # Обновляем статистику пользователя
    if result == 'WIN':
        cursor.execute('UPDATE users SET wins = wins + 1 WHERE user_id = ?', (user_id,))
    elif result == 'LOSS':
        cursor.execute('UPDATE users SET losses = losses + 1 WHERE user_id = ?', (user_id,))
    
    conn.commit()
    conn.close()


def get_user_stats(user_id: int) -> Dict[str, Any]:
    """Получить статистику пользователя"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE user_id = ?', (user_id,))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return {
            'user_id': user_id,
            'total_wins': 0,
            'total_losses': 0,
            'codes_today': 0,
            'codes_remaining_today': config.MAX_PROMO_CODES_PER_DAY
        }
    
    codes_today = get_promo_codes_today(user_id)
    
    stats = {
        'user_id': user_id,
        'total_wins': user['wins'],
        'total_losses': user['losses'],
        'codes_today': codes_today,
        'codes_remaining_today': max(0, config.MAX_PROMO_CODES_PER_DAY - codes_today)
    }
    
    conn.close()
    return stats


def get_user_recent_games(user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
    """Получить последние игры пользователя"""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM game_history
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
    ''', (user_id, limit))
    
    games = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return games


if __name__ == '__main__':
    # Инициализация БД при запуске
    print("Инициализация базы данных...")
    init_db()
    print("База данных успешно инициализирована!")
