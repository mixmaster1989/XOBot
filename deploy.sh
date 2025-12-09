#!/bin/bash

# Скрипт деплоя XOBot на сервер контентбот.рф

set -e

echo "🚀 Начинаем деплой XOBot..."

# Переходим в директорию проекта
cd /home/user1/XOBot

# Создаем виртуальное окружение если его нет
if [ ! -d "venv" ]; then
    echo "📦 Создаем виртуальное окружение..."
    python3 -m venv venv
fi

# Активируем виртуальное окружение
source venv/bin/activate

# Устанавливаем зависимости
echo "📚 Устанавливаем зависимости..."
pip install -r requirements.txt

# Инициализируем базу данных
echo "💾 Инициализируем базу данных..."
python database.py

# Копируем nginx конфигурацию
echo "⚙️  Настраиваем Nginx..."
sudo cp nginx.conf /etc/nginx/sites-available/xobot
sudo ln -sf /etc/nginx/sites-available/xobot /etc/nginx/sites-enabled/xobot
sudo nginx -t
sudo systemctl reload nginx

# Копируем systemd service
echo "🔧 Настраиваем systemd service..."
sudo cp systemd/xobot.service /etc/systemd/system/
sudo systemctl daemon-reload

# Перезапускаем сервис
echo "🔄 Перезапускаем XOBot..."
sudo systemctl restart xobot
sudo systemctl enable xobot

# Проверяем статус
echo "✅ Проверяем статус..."
sudo systemctl status xobot --no-pager

echo ""
echo "✨ Деплой завершен!"
echo "📱 WebApp доступен по адресу: https://контентбот.рф/webapp"
echo "🔍 Логи: sudo journalctl -u xobot -f"
echo ""
