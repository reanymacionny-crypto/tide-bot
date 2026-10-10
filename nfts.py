# 50 NFT коллекция TIDE BOT
# image_url — ссылка на картинку (можно заменить на свои)
# price — цена покупки в T Coins
# sell_price — цена вывода в Stars (сколько звёзд получит пользователь)
# upgrade_to — ID NFT на который можно апгрейдить
# upgrade_cost — стоимость апгрейда в T Coins
# rarity — Common / Rare / Epic / Legendary

NFTS = {
    1:  {"name": "Tide Wave #1",    "emoji": "🌊", "rarity": "Common",    "price": 100,   "sell_price": 8,   "upgrade_to": 11, "upgrade_cost": 150,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Обычная волна прилива. Начало коллекции."},
    2:  {"name": "Tide Wave #2",    "emoji": "🌊", "rarity": "Common",    "price": 100,   "sell_price": 8,   "upgrade_to": 12, "upgrade_cost": 150,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Вторая волна прилива."},
    3:  {"name": "Sea Shell #1",    "emoji": "🐚", "rarity": "Common",    "price": 120,   "sell_price": 10,  "upgrade_to": 13, "upgrade_cost": 180,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Морская ракушка с побережья."},
    4:  {"name": "Sea Shell #2",    "emoji": "🐚", "rarity": "Common",    "price": 120,   "sell_price": 10,  "upgrade_to": 14, "upgrade_cost": 180,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Редкая ракушка."},
    5:  {"name": "Coral #1",        "emoji": "🪸", "rarity": "Common",    "price": 150,   "sell_price": 12,  "upgrade_to": 15, "upgrade_cost": 200,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Кораллы глубокого моря."},
    6:  {"name": "Coral #2",        "emoji": "🪸", "rarity": "Common",    "price": 150,   "sell_price": 12,  "upgrade_to": 16, "upgrade_cost": 200,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Живые кораллы."},
    7:  {"name": "Starfish #1",     "emoji": "⭐", "rarity": "Common",    "price": 180,   "sell_price": 15,  "upgrade_to": 17, "upgrade_cost": 220,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Морская звезда."},
    8:  {"name": "Starfish #2",     "emoji": "⭐", "rarity": "Common",    "price": 180,   "sell_price": 15,  "upgrade_to": 18, "upgrade_cost": 220,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Редкая морская звезда."},
    9:  {"name": "Jellyfish #1",    "emoji": "🪼", "rarity": "Common",    "price": 200,   "sell_price": 18,  "upgrade_to": 19, "upgrade_cost": 250,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Светящаяся медуза."},
    10: {"name": "Jellyfish #2",    "emoji": "🪼", "rarity": "Common",    "price": 200,   "sell_price": 18,  "upgrade_to": 20, "upgrade_cost": 250,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Синяя медуза."},

    11: {"name": "Silver Wave",     "emoji": "🌊", "rarity": "Rare",      "price": 400,   "sell_price": 35,  "upgrade_to": 31, "upgrade_cost": 500,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Серебряная волна. Редкость."},
    12: {"name": "Azure Wave",      "emoji": "🌊", "rarity": "Rare",      "price": 400,   "sell_price": 35,  "upgrade_to": 32, "upgrade_cost": 500,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Лазурная волна."},
    13: {"name": "Golden Shell",    "emoji": "🐚", "rarity": "Rare",      "price": 450,   "sell_price": 40,  "upgrade_to": 33, "upgrade_cost": 550,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Золотая ракушка."},
    14: {"name": "Pearl Shell",     "emoji": "🐚", "rarity": "Rare",      "price": 450,   "sell_price": 40,  "upgrade_to": 34, "upgrade_cost": 550,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Жемчужная ракушка."},
    15: {"name": "Deep Coral",      "emoji": "🪸", "rarity": "Rare",      "price": 500,   "sell_price": 45,  "upgrade_to": 35, "upgrade_cost": 600,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Глубоководный коралл."},
    16: {"name": "Fire Coral",      "emoji": "🪸", "rarity": "Rare",      "price": 500,   "sell_price": 45,  "upgrade_to": 36, "upgrade_cost": 600,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Огненный коралл."},
    17: {"name": "Crystal Star",    "emoji": "💫", "rarity": "Rare",      "price": 550,   "sell_price": 50,  "upgrade_to": 37, "upgrade_cost": 650,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Кристальная звезда."},
    18: {"name": "Neon Star",       "emoji": "🌟", "rarity": "Rare",      "price": 550,   "sell_price": 50,  "upgrade_to": 38, "upgrade_cost": 650,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Неоновая морская звезда."},
    19: {"name": "Moon Jelly",      "emoji": "🪼", "rarity": "Rare",      "price": 600,   "sell_price": 55,  "upgrade_to": 39, "upgrade_cost": 700,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Лунная медуза."},
    20: {"name": "Storm Jelly",     "emoji": "⚡",  "rarity": "Rare",      "price": 600,   "sell_price": 55,  "upgrade_to": 40, "upgrade_cost": 700,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Грозовая медуза."},

    21: {"name": "Tide Shark",      "emoji": "🦈", "rarity": "Rare",      "price": 700,   "sell_price": 65,  "upgrade_to": 41, "upgrade_cost": 800,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Акула прилива."},
    22: {"name": "Deep Whale",      "emoji": "🐋", "rarity": "Rare",      "price": 750,   "sell_price": 70,  "upgrade_to": 42, "upgrade_cost": 850,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Кит из глубин."},
    23: {"name": "Sea Dragon",      "emoji": "🐉", "rarity": "Rare",      "price": 800,   "sell_price": 75,  "upgrade_to": 43, "upgrade_cost": 900,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Морской дракон."},
    24: {"name": "Kraken Baby",     "emoji": "🦑", "rarity": "Rare",      "price": 850,   "sell_price": 80,  "upgrade_to": 44, "upgrade_cost": 950,  "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Маленький кракен."},
    25: {"name": "Sea Turtle",      "emoji": "🐢", "rarity": "Rare",      "price": 900,   "sell_price": 85,  "upgrade_to": 45, "upgrade_cost": 1000, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Морская черепаха."},
    26: {"name": "Manta Ray",       "emoji": "🐟", "rarity": "Rare",      "price": 950,   "sell_price": 90,  "upgrade_to": 46, "upgrade_cost": 1050, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Скат манта."},
    27: {"name": "Sea Horse",       "emoji": "🐠", "rarity": "Rare",      "price": 1000,  "sell_price": 95,  "upgrade_to": 47, "upgrade_cost": 1100, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Морской конёк."},
    28: {"name": "Puffer Fish",     "emoji": "🐡", "rarity": "Rare",      "price": 1000,  "sell_price": 95,  "upgrade_to": 48, "upgrade_cost": 1100, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Рыба-шар."},
    29: {"name": "Lobster King",    "emoji": "🦞", "rarity": "Rare",      "price": 1100,  "sell_price": 100, "upgrade_to": 49, "upgrade_cost": 1200, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Король омаров."},
    30: {"name": "Crab Legend",     "emoji": "🦀", "rarity": "Rare",      "price": 1100,  "sell_price": 100, "upgrade_to": 50, "upgrade_cost": 1200, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Легендарный краб."},

    31: {"name": "Epic Wave",       "emoji": "🌊", "rarity": "Epic",      "price": 2000,  "sell_price": 200, "upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Эпическая волна цунами."},
    32: {"name": "Tsunami",         "emoji": "🌊", "rarity": "Epic",      "price": 2200,  "sell_price": 220, "upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Цунами — разрушительная волна."},
    33: {"name": "Diamond Shell",   "emoji": "💎", "rarity": "Epic",      "price": 2500,  "sell_price": 250, "upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Алмазная ракушка."},
    34: {"name": "Ruby Shell",      "emoji": "♦️", "rarity": "Epic",      "price": 2500,  "sell_price": 250, "upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Рубиновая ракушка."},
    35: {"name": "Ancient Coral",   "emoji": "🪸", "rarity": "Epic",      "price": 3000,  "sell_price": 300, "upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Древний коралл 1000 лет."},
    36: {"name": "Volcano Coral",   "emoji": "🌋", "rarity": "Epic",      "price": 3000,  "sell_price": 300, "upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Вулканический коралл."},
    37: {"name": "Supernova Star",  "emoji": "💥", "rarity": "Epic",      "price": 3500,  "sell_price": 350, "upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Сверхновая морская звезда."},
    38: {"name": "Galaxy Star",     "emoji": "🌌", "rarity": "Epic",      "price": 3500,  "sell_price": 350, "upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Галактическая звезда."},
    39: {"name": "Phantom Jelly",   "emoji": "👻", "rarity": "Epic",      "price": 4000,  "sell_price": 400, "upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Медуза-призрак."},
    40: {"name": "Thunder Jelly",   "emoji": "⚡",  "rarity": "Epic",      "price": 4000,  "sell_price": 400, "upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Громовая медуза."},

    41: {"name": "Mega Shark",      "emoji": "🦈", "rarity": "Legendary", "price": 8000,  "sell_price": 850, "upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Мегалодон — легенда морей."},
    42: {"name": "God Whale",       "emoji": "🐋", "rarity": "Legendary", "price": 9000,  "sell_price": 950, "upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Бог китов."},
    43: {"name": "Sea God Dragon",  "emoji": "🐉", "rarity": "Legendary", "price": 10000, "sell_price": 1100,"upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Морской бог-дракон."},
    44: {"name": "THE KRAKEN",      "emoji": "🦑", "rarity": "Legendary", "price": 12000, "sell_price": 1300,"upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Настоящий Кракен. Ужас морей."},
    45: {"name": "Ancient Turtle",  "emoji": "🐢", "rarity": "Legendary", "price": 11000, "sell_price": 1200,"upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Черепаха-вечность. 10000 лет."},
    46: {"name": "Shadow Manta",    "emoji": "🌑", "rarity": "Legendary", "price": 10000, "sell_price": 1100,"upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Тёмный скат из бездны."},
    47: {"name": "Golden Horse",    "emoji": "🏆", "rarity": "Legendary", "price": 10000, "sell_price": 1100,"upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Золотой морской конёк."},
    48: {"name": "Titan Puffer",    "emoji": "💣", "rarity": "Legendary", "price": 11000, "sell_price": 1200,"upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Рыба-бомба. Легендарная."},
    49: {"name": "Emperor Lobster", "emoji": "👑", "rarity": "Legendary", "price": 13000, "sell_price": 1400,"upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "Император омаров. Самый редкий."},
    50: {"name": "TIDE GOD",        "emoji": "🌊", "rarity": "Legendary", "price": 15000, "sell_price": 1600,"upgrade_to": None, "upgrade_cost": 0, "image_url": "https://i.imgur.com/tide_placeholder.png", "description": "БОГ ПРИЛИВА. Самый редкий NFT коллекции."},
}

RARITY_COLORS = {
    "Common":    "⬜",
    "Rare":      "🟦",
    "Epic":      "🟪",
    "Legendary": "🟨",
}

def get_nft(nft_id: int) -> dict:
    return NFTS.get(nft_id)

def get_all_by_rarity(rarity: str) -> list:
    return [(nid, nft) for nid, nft in NFTS.items() if nft["rarity"] == rarity]
