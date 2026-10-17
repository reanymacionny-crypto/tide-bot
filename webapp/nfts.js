// Генератор SVG карточек с уникальными фонами
function makeCard(bg1, bg2, em, glow, particles) {
  var pts = '';
  var pcolors = particles || [glow];
  var pdata = [
    [30,25,1.5],[170,25,1.5],[30,175,1.5],[170,175,1.5],
    [100,18,1],[18,100,1],[182,100,1],[100,182,1],
    [55,55,1],[145,55,1],[55,145,1],[145,145,1],
    [80,35,0.8],[120,35,0.8],[35,80,0.8],[165,80,0.8]
  ];
  pdata.forEach(function(p, i) {
    pts += '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+p[2]+'" fill="'+pcolors[i%pcolors.length]+'" opacity="0.35"/>';
  });

  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">'
    + '<defs>'
    + '<radialGradient id="bg" cx="50%" cy="38%" r="72%">'
    + '<stop offset="0%" stop-color="'+bg1+'"/>'
    + '<stop offset="100%" stop-color="'+bg2+'"/>'
    + '</radialGradient>'
    + '<radialGradient id="gl" cx="50%" cy="48%" r="45%">'
    + '<stop offset="0%" stop-color="'+glow+'" stop-opacity="0.5"/>'
    + '<stop offset="100%" stop-color="'+glow+'" stop-opacity="0"/>'
    + '</radialGradient>'
    + '<filter id="blur"><feGaussianBlur stdDeviation="10"/></filter>'
    + '<filter id="shadow"><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="'+glow+'" flood-opacity="0.6"/></filter>'
    + '</defs>'
    + '<rect width="200" height="200" rx="22" fill="url(#bg)"/>'
    + '<rect width="200" height="200" rx="22" fill="url(#gl)"/>'
    + pts
    // Свечение под иконкой
    + '<circle cx="100" cy="108" r="52" fill="'+glow+'" opacity="0.12" filter="url(#blur)"/>'
    // Иконка с тенью
    + '<text x="100" y="118" font-size="80" text-anchor="middle" dominant-baseline="middle" filter="url(#shadow)">'+em+'</text>'
    + '</svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(s);
}

// ── ЦВЕТОВЫЕ СХЕМЫ ДЛЯ КАЖДОГО NFT ──────────────────────────
// Common  = зелёный фон  (дешёвый,  ~100-300 TC)
// Rare    = фиолетовый   (средний,  ~600-2000 TC)
// Legendary = чёрный     (дорогой,  ~8000-120000 TC)

var NFTS = {

  // ════════════════════════════════════════════
  //  EVIL EYE
  // ════════════════════════════════════════════
  1: {
    name: "Evil Eye",
    rarity: "Common",
    price: 250, sell: 22,
    desc: "Злой глаз-оберег. Защищает от недоброго взгляда.",
    img: makeCard('#0d2818','#040f09','🧿','#00ff88')
  },
  2: {
    name: "Evil Eye",
    rarity: "Rare",
    price: 4500, sell: 420,
    desc: "Проклятый глаз видит то, что скрыто от других.",
    img: makeCard('#1a0a2e','#08041a','🧿','#a855f7')
  },
  3: {
    name: "Evil Eye",
    rarity: "Legendary",
    price: 85000, sell: 9000,
    desc: "Глаз пустоты. Смотрит в бездну — бездну смотрит в него.",
    img: makeCard('#0a0a14','#020206','🧿','#60a5fa')
  },

  // ════════════════════════════════════════════
  //  VOODOO DOLL
  // ════════════════════════════════════════════
  4: {
    name: "Voodoo Doll",
    rarity: "Common",
    price: 200, sell: 18,
    desc: "Загадочная кукла вуду. Следи за своими желаниями.",
    img: makeCard('#1a1205','#0a0802','🧸','#f59e0b')
  },
  5: {
    name: "Voodoo Doll",
    rarity: "Rare",
    price: 3800, sell: 360,
    desc: "Тёмная кукла вуду обладает силой древней магии.",
    img: makeCard('#1e0a2a','#0c0414','🧸','#c084fc')
  },
  6: {
    name: "Voodoo Doll",
    rarity: "Legendary",
    price: 72000, sell: 7600,
    desc: "Кровавая кукла. Обладает силой абсолютной тьмы.",
    img: makeCard('#100005','#040002','🧸','#f43f5e')
  },

  // ════════════════════════════════════════════
  //  ETERNAL ROSE
  // ════════════════════════════════════════════
  7: {
    name: "Eternal Rose",
    rarity: "Common",
    price: 150, sell: 12,
    desc: "Роза, которая никогда не вянет. Классика навсегда.",
    img: makeCard('#1a0a0a','#0a0404','🌹','#fb7185')
  },
  8: {
    name: "Eternal Rose",
    rarity: "Rare",
    price: 2800, sell: 265,
    desc: "Неоновая роза пронизана светом. Светится в темноте.",
    img: makeCard('#1a0520','#0a0210','🌹','#e879f9')
  },
  9: {
    name: "Eternal Rose",
    rarity: "Legendary",
    price: 55000, sell: 5800,
    desc: "Роза расцветшая во взрыве сверхновой звезды.",
    img: makeCard('#08000e','#030006','🌹','#d946ef')
  },

  // ════════════════════════════════════════════
  //  DIAMOND RING
  // ════════════════════════════════════════════
  10: {
    name: "Diamond Ring",
    rarity: "Common",
    price: 300, sell: 28,
    desc: "Кольцо с бриллиантом. Символ вечности.",
    img: makeCard('#0a1a1a','#040a0a','💍','#67e8f9')
  },
  11: {
    name: "Diamond Ring",
    rarity: "Rare",
    price: 5500, sell: 520,
    desc: "Кольцо бессмертия. Его носили императоры древности.",
    img: makeCard('#0a0a22','#040410','💍','#818cf8')
  },
  12: {
    name: "Diamond Ring",
    rarity: "Legendary",
    price: 110000, sell: 11500,
    desc: "Кольцо бога. Абсолютная власть. Абсолютная редкость.",
    img: makeCard('#080810','#020204','💍','#fbbf24')
  },

  // ════════════════════════════════════════════
  //  MAGIC MUSHROOM
  // ════════════════════════════════════════════
  13: {
    name: "Magic Mushroom",
    rarity: "Common",
    price: 220, sell: 20,
    desc: "Мухомор из волшебного леса. Не всё то яд, что красно.",
    img: makeCard('#0f1a04','#060e02','🍄','#84cc16')
  },
  14: {
    name: "Magic Mushroom",
    rarity: "Rare",
    price: 3200, sell: 300,
    desc: "Волшебный мухомор наделён силой лесных духов.",
    img: makeCard('#150a1a','#090412','🍄','#a78bfa')
  },
  15: {
    name: "Magic Mushroom",
    rarity: "Legendary",
    price: 62000, sell: 6500,
    desc: "Токсичный мухомор со смертоносным свечением.",
    img: makeCard('#04100a','#020806','🍄','#4ade80')
  },

  // ════════════════════════════════════════════
  //  SNOW GLOBE
  // ════════════════════════════════════════════
  16: {
    name: "Snow Globe",
    rarity: "Common",
    price: 220, sell: 20,
    desc: "Хрустальный шар со снегопадом внутри.",
    img: makeCard('#0a1220','#040810','🔮','#7dd3fc')
  },
  17: {
    name: "Snow Globe",
    rarity: "Rare",
    price: 3500, sell: 330,
    desc: "Шар метели — настоящая снежная буря внутри.",
    img: makeCard('#0a0a22','#040412','🔮','#93c5fd')
  },
  18: {
    name: "Snow Globe",
    rarity: "Legendary",
    price: 68000, sell: 7200,
    desc: "Шар бездны. Внутри — бесконечная тьма.",
    img: makeCard('#04040e','#020208','🔮','#6366f1')
  },

  // ════════════════════════════════════════════
  //  LOVE CANDLE
  // ════════════════════════════════════════════
  19: {
    name: "Love Candle",
    rarity: "Common",
    price: 250, sell: 22,
    desc: "Свеча любви. Её огонь не гаснет от ветра.",
    img: makeCard('#1a0c04','#0a0602','🕯️','#fb923c')
  },
  20: {
    name: "Love Candle",
    rarity: "Rare",
    price: 4200, sell: 395,
    desc: "Вечное пламя горит без топлива уже 100 лет.",
    img: makeCard('#1a0808','#0a0404','🕯️','#f87171')
  },
  21: {
    name: "Love Candle",
    rarity: "Legendary",
    price: 78000, sell: 8200,
    desc: "Свеча адского огня. Горит даже в воде.",
    img: makeCard('#0e0404','#060202','🕯️','#ef4444')
  },

  // ════════════════════════════════════════════
  //  TOP HAT
  // ════════════════════════════════════════════
  22: {
    name: "Top Hat",
    rarity: "Common",
    price: 180, sell: 15,
    desc: "Элегантный цилиндр. Стиль вне времени.",
    img: makeCard('#0e0e18','#060610','🎩','#94a3b8')
  },
  23: {
    name: "Top Hat",
    rarity: "Rare",
    price: 2600, sell: 245,
    desc: "Шляпа теней, сотканная из теней ночного города.",
    img: makeCard('#10081e','#080410','🎩','#8b5cf6')
  },
  24: {
    name: "Top Hat",
    rarity: "Legendary",
    price: 50000, sell: 5300,
    desc: "Корона затмения. Носивший её повелевал солнцем.",
    img: makeCard('#080808','#030303','🎩','#fbbf24')
  },

  // ════════════════════════════════════════════
  //  NESTING DOLL
  // ════════════════════════════════════════════
  25: {
    name: "Nesting Doll",
    rarity: "Common",
    price: 180, sell: 15,
    desc: "Расписная матрёшка. Секрет внутри секрета.",
    img: makeCard('#1a0e04','#0a0602','🪆','#fcd34d')
  },
  26: {
    name: "Nesting Doll",
    rarity: "Rare",
    price: 2900, sell: 275,
    desc: "Древняя матрёшка. Каждый слой — отдельная история.",
    img: makeCard('#18060c','#0c0306','🪆','#fb7185')
  },
  27: {
    name: "Nesting Doll",
    rarity: "Legendary",
    price: 58000, sell: 6100,
    desc: "Матрёшка грозы. Внутри — маленькая вселенная.",
    img: makeCard('#060612','#030308','🪆','#818cf8')
  },

  // ════════════════════════════════════════════
  //  HOMEMADE CAKE
  // ════════════════════════════════════════════
  28: {
    name: "Homemade Cake",
    rarity: "Common",
    price: 100, sell: 8,
    desc: "Уютный домашний торт. С него всё начинается.",
    img: makeCard('#1a0808','#0e0404','🎂','#fca5a5')
  },
  29: {
    name: "Homemade Cake",
    rarity: "Rare",
    price: 1800, sell: 168,
    desc: "Торт покрытый листовым золотом. Только для избранных.",
    img: makeCard('#14100a','#0a0806','🎂','#fbbf24')
  },
  30: {
    name: "Homemade Cake",
    rarity: "Legendary",
    price: 38000, sell: 4000,
    desc: "Торт семи небес. Семь слоёв, семь измерений.",
    img: makeCard('#08060e','#040308','🎂','#c084fc')
  },

  // ════════════════════════════════════════════
  //  JELLY BUNNY
  // ════════════════════════════════════════════
  31: {
    name: "Jelly Bunny",
    rarity: "Common",
    price: 100, sell: 8,
    desc: "Мягкий желейный кролик. Первый друг коллекционера.",
    img: makeCard('#0e1a0e','#060e06','🐰','#86efac')
  },
  32: {
    name: "Jelly Bunny",
    rarity: "Rare",
    price: 1900, sell: 178,
    desc: "Кристальный кролик преломляет свет удачи.",
    img: makeCard('#0a1220','#040810','🐰','#7dd3fc')
  },
  33: {
    name: "Jelly Bunny",
    rarity: "Legendary",
    price: 42000, sell: 4400,
    desc: "Кролик-призрак. Появляется только в полнолуние.",
    img: makeCard('#060814','#03040a','🐰','#a5b4fc')
  },

  // ════════════════════════════════════════════
  //  SPICED WINE
  // ════════════════════════════════════════════
  34: {
    name: "Spiced Wine",
    rarity: "Common",
    price: 120, sell: 10,
    desc: "Пряный глинтвейн. Согревает в самый холодный день.",
    img: makeCard('#1a0505','#0e0303','🍷','#fca5a5')
  },
  35: {
    name: "Spiced Wine",
    rarity: "Rare",
    price: 2200, sell: 205,
    desc: "Вечный глинтвейн из лозы которой тысяча лет.",
    img: makeCard('#160418','#0c020e','🍷','#e879f9')
  },
  36: {
    name: "Spiced Wine",
    rarity: "Legendary",
    price: 46000, sell: 4850,
    desc: "Вино богов. Один глоток — и ты на вершине мира.",
    img: makeCard('#080212','#04010a','🍷','#c026d3')
  },

  // ════════════════════════════════════════════
  //  BERRY BOX
  // ════════════════════════════════════════════
  37: {
    name: "Berry Box",
    rarity: "Common",
    price: 100, sell: 8,
    desc: "Коробочка свежих ягод. Природный подарок.",
    img: makeCard('#180808','#0e0404','🍓','#fca5a5')
  },
  38: {
    name: "Berry Box",
    rarity: "Rare",
    price: 1700, sell: 158,
    desc: "Галактические ягоды с орбиты Сатурна.",
    img: makeCard('#0a0c20','#040610','🍓','#818cf8')
  },
  39: {
    name: "Berry Box",
    rarity: "Legendary",
    price: 36000, sell: 3800,
    desc: "Ягоды бессмертия из древних китайских легенд.",
    img: makeCard('#060414','#03020a','🍓','#7c3aed')
  },

  // ════════════════════════════════════════════
  //  COOKIE HEART
  // ════════════════════════════════════════════
  40: {
    name: "Cookie Heart",
    rarity: "Common",
    price: 200, sell: 18,
    desc: "Печенье в форме сердца. Сделано с любовью.",
    img: makeCard('#1a0e04','#0e0802','🍪','#fdba74')
  },
  41: {
    name: "Cookie Heart",
    rarity: "Rare",
    price: 3400, sell: 320,
    desc: "Мистическое печенье с предсказанием из другого мира.",
    img: makeCard('#10081a','#08040e','🍪','#a78bfa')
  },
  42: {
    name: "Cookie Heart",
    rarity: "Legendary",
    price: 65000, sell: 6850,
    desc: "Печенье хаоса. Откусил — мир изменился навсегда.",
    img: makeCard('#060410','#030208','🍪','#7c3aed')
  },

  // ════════════════════════════════════════════
  //  PRECIOUS PEACH
  // ════════════════════════════════════════════
  43: {
    name: "Precious Peach",
    rarity: "Common",
    price: 80, sell: 6,
    desc: "Спелый персик. Маленькое сокровище природы.",
    img: makeCard('#1a1004','#0e0802','🍑','#fdba74')
  },
  44: {
    name: "Precious Peach",
    rarity: "Rare",
    price: 1500, sell: 140,
    desc: "Бриллиантовый персик — редкий деликатес миллионеров.",
    img: makeCard('#141004','#0a0802','🍑','#fbbf24')
  },
  45: {
    name: "Precious Peach",
    rarity: "Legendary",
    price: 32000, sell: 3400,
    desc: "Персик бессмертия из древних китайских легенд.",
    img: makeCard('#0c0606','#060404','🍑','#fb923c')
  },

  // ════════════════════════════════════════════
  //  LOL POP
  // ════════════════════════════════════════════
  46: {
    name: "Lol Pop",
    rarity: "Common",
    price: 80, sell: 6,
    desc: "Яркий леденец на палочке. Сладкий старт.",
    img: makeCard('#0c1a08','#060e04','🍭','#86efac')
  },
  47: {
    name: "Lol Pop",
    rarity: "Rare",
    price: 1600, sell: 150,
    desc: "Королевский леденец из сахара высшего сорта.",
    img: makeCard('#160a18','#0c0510','🍭','#f0abfc')
  },
  48: {
    name: "Lol Pop",
    rarity: "Legendary",
    price: 34000, sell: 3600,
    desc: "Леденец из звёздной пыли. Вкус невесомости.",
    img: makeCard('#060612','#030308','🍭','#818cf8')
  },

  // ════════════════════════════════════════════
  //  SANTA HAT
  // ════════════════════════════════════════════
  49: {
    name: "Santa Hat",
    rarity: "Common",
    price: 120, sell: 10,
    desc: "Красная шапка Санты. Дух праздника в руках.",
    img: makeCard('#1a0505','#0e0303','🎅','#f87171')
  },
  50: {
    name: "Santa Hat",
    rarity: "Rare",
    price: 2100, sell: 198,
    desc: "Космический Санта прибыл из глубин галактики.",
    img: makeCard('#08081a','#040410','🎅','#818cf8')
  },
  51: {
    name: "Santa Hat",
    rarity: "Legendary",
    price: 44000, sell: 4650,
    desc: "Галактический Санта — его сани звездолёт.",
    img: makeCard('#050510','#030308','🎅','#6366f1')
  },

  // ════════════════════════════════════════════
  //  TIDE GOD GIFT — единственный ультра-редкий
  // ════════════════════════════════════════════
  52: {
    name: "TIDE GOD GIFT",
    rarity: "Legendary",
    price: 120000, sell: 12800,
    desc: "Дар самого TIDE. Самый желанный подарок в коллекции. Абсолютная редкость.",
    img: makeCard('#0a0800','#050400','👑','#fbbf24',['#fbbf24','#f59e0b','#fde68a'])
  },

  // ════════════════════════════════════════════
  //  PLUSH VOKE — уникальный, 3.4M TC
  // ════════════════════════════════════════════
  53: {
    name: "Plush Voke",
    rarity: "Legendary",
    price: 3400000, sell: 360000,
    desc: "Единственный в своём роде. Настоящий артефакт коллекционера. Таких больше нет.",
    isPhoto: true,
    photoSrc: 'plush_voke.png',
    auraColor: '#ef4444',
    bg1: '#1a0000', bg2: '#050000'
  },

  // ════════════════════════════════════════════
  //  PLUSH FIEND — уникальный, 2.5M TC
  // ════════════════════════════════════════════
  54: {
    name: "Plush Fiend",
    rarity: "Legendary",
    price: 2500000, sell: 265000,
    desc: "Тёмный демон в мягкой оболочке. Редчайший коллекционный предмет.",
    isPhoto: true,
    photoSrc: 'plush_fiend.png',
    auraColor: '#a855f7',
    bg1: '#12001a', bg2: '#060009'
  },

  // ════════════════════════════════════════════
  //  PLUSH PUDGE — уникальный, 1.9M TC
  // ════════════════════════════════════════════
  55: {
    name: "Plush Pudge",
    rarity: "Legendary",
    price: 1900000, sell: 200000,
    desc: "Мясник в мягкой форме. Знаменитый герой Dota 2 в виде плюшевого коллекционного предмета.",
    isPhoto: true,
    photoSrc: 'plush_pudge.png',
    auraColor: '#f97316',
    bg1: '#1a0800', bg2: '#090400'
  },

  // ════════════════════════════════════════════
  //  PLUSH GHOST — уникальный, 2M TC
  // ════════════════════════════════════════════
  56: {
    name: "Plush Ghost",
    rarity: "Legendary",
    price: 2000000, sell: 212000,
    desc: "ризрачный плюш из потустороннего мира. Светится в темноте и исчезает на рассвете.",
    isPhoto: true,
    photoSrc: 'plush_ghost.png',
    auraColor: '#a5f3fc',
    bg1: '#00101a', bg2: '#000a12'
  },
};
