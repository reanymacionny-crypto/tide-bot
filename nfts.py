# NFT коллекция TIDE BOT (патч 7.41f)
# price       — цена покупки в T Coins
# sell_price  — цена вывода в Stars
# upgrade_to  — ID NFT для апгрейда
# upgrade_cost— стоимость апгрейда в T Coins
# rarity      — Common / Rare / Epic / Legendary

CDN = "https://raw.githubusercontent.com/denzyve/cdn-telegram-gifts/main/assets/png"

NFTS = {
    1:  {"name":"Homemade Cake",    "rarity":"Common",    "price":100,  "sell_price":8,   "upgrade_to":21, "upgrade_cost":150,  "image_url":f"{CDN}/gift_5167939598143193218.png", "description":"Домашний торт — один из первых подарков Telegram."},
    2:  {"name":"Jelly Bunny",      "rarity":"Common",    "price":100,  "sell_price":8,   "upgrade_to":22, "upgrade_cost":150,  "image_url":f"{CDN}/gift_5168043875654172773.png", "description":"Желейный кролик."},
    3:  {"name":"Santa Hat",        "rarity":"Common",    "price":120,  "sell_price":10,  "upgrade_to":23, "upgrade_cost":180,  "image_url":f"{CDN}/gift_5168103777563050263.png", "description":"Шапка Санты."},
    4:  {"name":"Spiced Wine",      "rarity":"Common",    "price":120,  "sell_price":10,  "upgrade_to":24, "upgrade_cost":180,  "image_url":f"{CDN}/gift_5170144170496491616.png", "description":"Глинтвейн."},
    5:  {"name":"Precious Peach",   "rarity":"Common",    "price":80,   "sell_price":6,   "upgrade_to":25, "upgrade_cost":120,  "image_url":f"{CDN}/gift_5170145012310081615.png", "description":"Дорогой персик."},
    6:  {"name":"Lol Pop",          "rarity":"Common",    "price":80,   "sell_price":6,   "upgrade_to":26, "upgrade_cost":120,  "image_url":f"{CDN}/gift_5170233102089322756.png", "description":"Леденец."},
    7:  {"name":"Eternal Rose",     "rarity":"Common",    "price":150,  "sell_price":12,  "upgrade_to":27, "upgrade_cost":200,  "image_url":f"{CDN}/gift_5170250947678437525.png", "description":"Вечная роза."},
    8:  {"name":"Desk Calendar",    "rarity":"Common",    "price":150,  "sell_price":12,  "upgrade_to":28, "upgrade_cost":200,  "image_url":f"{CDN}/gift_5170314324215857265.png", "description":"Настольный календарь."},
    9:  {"name":"Berry Box",        "rarity":"Common",    "price":100,  "sell_price":8,   "upgrade_to":29, "upgrade_cost":150,  "image_url":f"{CDN}/gift_5170521118301225164.png", "description":"Коробка с ягодами."},
    10: {"name":"Perfume Bottle",   "rarity":"Common",    "price":90,   "sell_price":7,   "upgrade_to":30, "upgrade_cost":140,  "image_url":f"{CDN}/gift_5170564780938756245.png", "description":"Флакон духов."},
    11: {"name":"Cookie Heart",     "rarity":"Common",    "price":200,  "sell_price":18,  "upgrade_to":31, "upgrade_cost":250,  "image_url":f"{CDN}/gift_5170594532177215681.png", "description":"Печенье-сердечко."},
    12: {"name":"Nesting Doll",     "rarity":"Common",    "price":180,  "sell_price":15,  "upgrade_to":32, "upgrade_cost":220,  "image_url":f"{CDN}/gift_5170690322832818290.png", "description":"Матрёшка."},
    13: {"name":"Top Hat",          "rarity":"Common",    "price":180,  "sell_price":15,  "upgrade_to":33, "upgrade_cost":220,  "image_url":f"{CDN}/gift_5773668482394620318.png", "description":"Цилиндр."},
    14: {"name":"Voodoo Doll",      "rarity":"Common",    "price":200,  "sell_price":18,  "upgrade_to":34, "upgrade_cost":250,  "image_url":f"{CDN}/gift_5773725897517433693.png", "description":"Кукла вуду."},
    15: {"name":"Spy Agaric",       "rarity":"Common",    "price":220,  "sell_price":20,  "upgrade_to":35, "upgrade_cost":270,  "image_url":f"{CDN}/gift_5773791997064119815.png", "description":"Мухомор."},
    16: {"name":"Evil Eye",         "rarity":"Common",    "price":250,  "sell_price":22,  "upgrade_to":36, "upgrade_cost":300,  "image_url":f"{CDN}/gift_5775955135867913556.png", "description":"Злой глаз."},
    17: {"name":"Love Candle",      "rarity":"Common",    "price":250,  "sell_price":22,  "upgrade_to":37, "upgrade_cost":300,  "image_url":f"{CDN}/gift_5775966332847654507.png", "description":"Свеча любви."},
    18: {"name":"Snow Globe",       "rarity":"Common",    "price":220,  "sell_price":20,  "upgrade_to":38, "upgrade_cost":270,  "image_url":f"{CDN}/gift_5776227780391864916.png", "description":"Снежный шар."},
    19: {"name":"Hex Pot",          "rarity":"Common",    "price":200,  "sell_price":18,  "upgrade_to":39, "upgrade_cost":250,  "image_url":f"{CDN}/gift_5782984811920491178.png", "description":"Котёл зелий."},
    20: {"name":"Diamond Ring",     "rarity":"Common",    "price":300,  "sell_price":28,  "upgrade_to":40, "upgrade_cost":350,  "image_url":f"{CDN}/gift_5782988952268964995.png", "description":"Кольцо с бриллиантом."},
    21: {"name":"Golden Cake",      "rarity":"Rare",      "price":600,  "sell_price":55,  "upgrade_to":41, "upgrade_cost":700,  "image_url":f"{CDN}/gift_5783075783622787539.png", "description":"Золотой торт."},
    22: {"name":"Crystal Bunny",    "rarity":"Rare",      "price":600,  "sell_price":55,  "upgrade_to":42, "upgrade_cost":700,  "image_url":f"{CDN}/gift_5807641025165919973.png", "description":"Кристальный кролик."},
    23: {"name":"Cosmic Santa",     "rarity":"Rare",      "price":700,  "sell_price":65,  "upgrade_to":43, "upgrade_cost":800,  "image_url":f"{CDN}/gift_5818708013426410448.png", "description":"Космический Санта."},
    24: {"name":"Eternal Wine",     "rarity":"Rare",      "price":700,  "sell_price":65,  "upgrade_to":44, "upgrade_cost":800,  "image_url":f"{CDN}/gift_5821205665758053411.png", "description":"Вечный глинтвейн."},
    25: {"name":"Diamond Peach",    "rarity":"Rare",      "price":800,  "sell_price":75,  "upgrade_to":45, "upgrade_cost":900,  "image_url":f"{CDN}/gift_5821261908354794038.png", "description":"Бриллиантовый персик."},
    26: {"name":"Royal Lol Pop",    "rarity":"Rare",      "price":800,  "sell_price":75,  "upgrade_to":46, "upgrade_cost":900,  "image_url":f"{CDN}/gift_5821384757304362229.png", "description":"Королевский леденец."},
    27: {"name":"Neon Rose",        "rarity":"Rare",      "price":900,  "sell_price":85,  "upgrade_to":47, "upgrade_cost":1000, "image_url":f"{CDN}/gift_5825480571261813595.png", "description":"Неоновая роза."},
    28: {"name":"Infinity Calendar","rarity":"Rare",      "price":950,  "sell_price":90,  "upgrade_to":48, "upgrade_cost":1050, "image_url":f"{CDN}/gift_5825801628657124140.png", "description":"Бесконечный календарь."},
    29: {"name":"Galaxy Berries",   "rarity":"Rare",      "price":900,  "sell_price":85,  "upgrade_to":49, "upgrade_cost":1000, "image_url":f"{CDN}/gift_5825895989088617224.png", "description":"Галактические ягоды."},
    30: {"name":"Gold Perfume",     "rarity":"Rare",      "price":850,  "sell_price":80,  "upgrade_to":50, "upgrade_cost":950,  "image_url":f"{CDN}/gift_5830323722413671504.png", "description":"Золотые духи."},
    31: {"name":"Mystic Cookie",    "rarity":"Rare",      "price":1000, "sell_price":95,  "upgrade_to":51, "upgrade_cost":1200, "image_url":f"{CDN}/gift_5830340739074097859.png", "description":"Мистическое печенье."},
    32: {"name":"Ancient Doll",     "rarity":"Rare",      "price":950,  "sell_price":90,  "upgrade_to":52, "upgrade_cost":1100, "image_url":f"{CDN}/gift_5832279504491381684.png", "description":"Древняя матрёшка."},
    33: {"name":"Shadow Hat",       "rarity":"Rare",      "price":1000, "sell_price":95,  "upgrade_to":53, "upgrade_cost":1200, "image_url":f"{CDN}/gift_5832325860073407546.png", "description":"Шляпа теней."},
    34: {"name":"Dark Voodoo",      "rarity":"Rare",      "price":1100, "sell_price":100, "upgrade_to":54, "upgrade_cost":1300, "image_url":f"{CDN}/gift_5832371318007268701.png", "description":"Тёмная кукла вуду."},
    35: {"name":"Magic Mushroom",   "rarity":"Rare",      "price":1100, "sell_price":100, "upgrade_to":55, "upgrade_cost":1300, "image_url":f"{CDN}/gift_5832497899283415733.png", "description":"Волшебный мухомор."},
    36: {"name":"Cursed Eye",       "rarity":"Rare",      "price":1200, "sell_price":110, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5832644211639321671.png", "description":"Проклятый глаз."},
    37: {"name":"Eternal Flame",    "rarity":"Rare",      "price":1200, "sell_price":110, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5834651202612102354.png", "description":"Вечное пламя."},
    38: {"name":"Blizzard Globe",   "rarity":"Rare",      "price":1100, "sell_price":100, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5834918435477259676.png", "description":"Шар метели."},
    39: {"name":"Chaos Pot",        "rarity":"Rare",      "price":1100, "sell_price":100, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5836780359634649414.png", "description":"Котёл хаоса."},
    40: {"name":"Eternal Diamond",  "rarity":"Rare",      "price":1300, "sell_price":120, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5837059369300132790.png", "description":"Вечный бриллиант."},
    41: {"name":"Epic Cake",        "rarity":"Epic",      "price":3000, "sell_price":300, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5837063436634161765.png", "description":"Эпический торт."},
    42: {"name":"Legendary Bunny",  "rarity":"Epic",      "price":3500, "sell_price":350, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5839038009193792264.png", "description":"Легендарный кролик."},
    43: {"name":"Galactic Santa",   "rarity":"Epic",      "price":4000, "sell_price":400, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5839094187366024301.png", "description":"Галактический Санта."},
    44: {"name":"Divine Wine",      "rarity":"Epic",      "price":4000, "sell_price":400, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5841336413697606412.png", "description":"Божественное вино."},
    45: {"name":"Infinity Peach",   "rarity":"Epic",      "price":5000, "sell_price":500, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5841391256135008713.png", "description":"Бесконечный персик."},
    46: {"name":"Cosmic Pop",       "rarity":"Epic",      "price":5000, "sell_price":500, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5841632504448025405.png", "description":"Космический леденец."},
    47: {"name":"Supernova Rose",   "rarity":"Epic",      "price":6000, "sell_price":600, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5841689550203650524.png", "description":"Роза сверхновой."},
    48: {"name":"Immortal Ring",    "rarity":"Epic",      "price":6000, "sell_price":600, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5843762284240831056.png", "description":"Бессмертное кольцо."},
    49: {"name":"God Eye",          "rarity":"Epic",      "price":5500, "sell_price":550, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5845776576658015084.png", "description":"Глаз бога."},
    50: {"name":"TIDE GOD GIFT",    "rarity":"Legendary", "price":15000,"sell_price":1600,"upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5846192273657692751.png", "description":"Самый редкий подарок TIDE BOT."},
    # ── Дорогие NFT от 1000+ TC ─────────────────────────────────────────────
    51: {"name":"Phantom Cake",     "rarity":"Epic",      "price":1200, "sell_price":110, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5846226946928673709.png", "description":"Торт-призрак из другого измерения."},
    52: {"name":"Storm Doll",       "rarity":"Epic",      "price":1300, "sell_price":120, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5856973938650776169.png", "description":"Матрёшка грозы."},
    53: {"name":"Shadow Crown",     "rarity":"Epic",      "price":1400, "sell_price":130, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5857140566201991735.png", "description":"Корона теней."},
    54: {"name":"Blood Voodoo",     "rarity":"Epic",      "price":1500, "sell_price":145, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5859442703032386168.png", "description":"Кровавая кукла вуду."},
    55: {"name":"Toxic Shroom",     "rarity":"Epic",      "price":1600, "sell_price":155, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5868220813026526561.png", "description":"Токсичный мухомор."},
    56: {"name":"Void Eye",         "rarity":"Legendary", "price":8000, "sell_price":850, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5868348541058942091.png", "description":"Глаз пустоты. Смотрит в твою душу."},
    57: {"name":"Inferno Candle",   "rarity":"Legendary", "price":9000, "sell_price":950, "upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5868455043362980631.png", "description":"Свеча адского огня."},
    58: {"name":"Abyss Globe",      "rarity":"Legendary", "price":10000,"sell_price":1050,"upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5868503709637411929.png", "description":"Шар бездны."},
    59: {"name":"Chaos Diamond",    "rarity":"Legendary", "price":12000,"sell_price":1300,"upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5868561433997870501.png", "description":"Бриллиант хаоса."},
    60: {"name":"GOD RING",         "rarity":"Legendary", "price":20000,"sell_price":2200,"upgrade_to":None,"upgrade_cost":0,   "image_url":f"{CDN}/gift_5868595669182186720.png", "description":"Кольцо бога. Абсолютная редкость TIDE BOT."},
}

RARITY_COLORS = {
    "Common":    "⬜",
    "Rare":      "🟦",
    "Epic":      "🟪",
    "Legendary": "🟨",
}

def get_nft(nft_id: int) -> dict | None:
    return NFTS.get(nft_id)

def get_all_by_rarity(rarity: str) -> list:
    return [(nid, nft) for nid, nft in NFTS.items() if nft["rarity"] == rarity]
