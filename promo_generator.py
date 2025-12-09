"""
Генератор промокодов для XOBot
"""
import random
import string
from typing import Optional
import config
import database


def generate_promo_code() -> str:
    """
    Генерирует случайный промокод формата: 5 символов, A-Z, 0-9
    Пример: K7M2X, B3C9Q
    """
    characters = string.ascii_uppercase + string.digits
    code = ''.join(random.choices(characters, k=config.PROMO_CODE_LENGTH))
    return code


def generate_unique_promo_code(user_id: int, max_attempts: int = 10) -> Optional[str]:
    """
    Генерирует уникальный промокод для пользователя
    Проверяет что промокод еще не существует в базе
    """
    for _ in range(max_attempts):
        code = generate_promo_code()
        
        # Пытаемся добавить в базу
        if database.add_promo_code(code, user_id):
            return code
    
    # Если за max_attempts попыток не смогли создать уникальный код
    return None


def can_generate_promo_code(user_id: int) -> bool:
    """
    Проверяет может ли пользователь получить промокод
    Лимит: 3 промокода в день
    """
    codes_today = database.get_promo_codes_today(user_id)
    return codes_today < config.MAX_PROMO_CODES_PER_DAY


def validate_promo_code(code: str) -> bool:
    """
    Валидация формата промокода
    Должен быть ровно 5 символов, только A-Z и 0-9
    """
    if len(code) != config.PROMO_CODE_LENGTH:
        return False
    
    return all(c in string.ascii_uppercase + string.digits for c in code)


if __name__ == '__main__':
    # Тестирование генератора
    print("Тестирование генератора промокодов...")
    
    for i in range(10):
        code = generate_promo_code()
        is_valid = validate_promo_code(code)
        print(f"Промокод #{i+1}: {code} - {'✓ Валиден' if is_valid else '✗ Не валиден'}")
