import os

# Читается из переменных окружения Railway
# В Railway → Variables добавь: BOT_TOKEN и ADMIN_ID
BOT_TOKEN = os.getenv("BOT_TOKEN", "ВСТАВЬ_ТОКЕН_СЮДА")
ADMIN_ID  = int(os.getenv("ADMIN_ID", "123456789"))

# Курс: 1 Telegram Star = сколько T Coins
STARS_TO_TCOINS = 10

# Минимальное пополнение в Stars
MIN_DEPOSIT_STARS = 1

# Название валюты
COIN_NAME  = "T Coins"
COIN_EMOJI = "🪙"
