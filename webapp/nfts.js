// Генератор красивых SVG карточек с градиентами и иконками
function makeCard(bg1, bg2, em, glowColor) {
  var glow = glowColor || bg1;
  var s = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">'
    + '<defs>'
    + '<radialGradient id="bg" cx="50%" cy="40%" r="70%">'
    + '<stop offset="0%" stop-color="' + bg1 + '"/>'
    + '<stop offset="100%" stop-color="' + bg2 + '"/>'
    + '</radialGradient>'
    + '<radialGradient id="glow" cx="50%" cy="45%" r="50%">'
    + '<stop offset="0%" stop-color="' + glow + '" stop-opacity="0.4"/>'
    + '<stop offset="100%" stop-color="' + glow + '" stop-opacity="0"/>'
    + '</radialGradient>'
    + '<filter id="blur"><feGaussianBlur stdDeviation="8"/></filter>'
    + '</defs>'
    + '<rect width="200" height="200" rx="24" fill="url(#bg)"/>'
    + '<rect width="200" height="200" rx="24" fill="url(#glow)"/>'
    // Узор точек
    + '<circle cx="30" cy="30" r="1.5" fill="' + glow + '" opacity="0.3"/>'
    + '<circle cx="170" cy="30" r="1.5" fill="' + glow + '" opacity="0.3"/>'
    + '<circle cx="30" cy="170" r="1.5" fill="' + glow + '" opacity="0.3"/>'
    + '<circle cx="170" cy="170" r="1.5" fill="' + glow + '" opacity="0.3"/>'
    + '<circle cx="100" cy="20" r="1" fill="' + glow + '" opacity="0.2"/>'
    + '<circle cx="20" cy="100" r="1" fill="' + glow + '" opacity="0.2"/>'
    + '<circle cx="180" cy="100" r="1" fill="' + glow + '" opacity="0.2"/>'
    // Светящийся круг под иконкой
    + '<circle cx="100" cy="105" r="55" fill="' + glow + '" opacity="0.08" filter="url(#blur)"/>'
    // Иконка
    + '<text x="100" y="118" font-size="82" text-anchor="middle" dominant-baseline="middle">' + em + '</text>'
    + '</svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(s);
}

// Цветовые темы по редкости
var C = { // Common — тёмно-зелёный
  bg1:'#1a2d1a', bg2:'#0a150a', glow:'#4ade80'
};
var R = { // Rare — тёмно-синий
  bg1:'#0e1e3d', bg2:'#070e1e', glow:'#60a5fa'
};
var E = { // Epic — тёмно-фиолетовый
  bg1:'#1e0d3d', bg2:'#0e0620', glow:'#c084fc'
};
var L = { // Legendary — тёмно-золотой
  bg1:'#2d1e05', bg2:'#150e00', glow:'#fbbf24'
};

var NFTS = {
  // ── COMMON ──────────────────────────────────────────
  1:  { name:"Homemade Cake",    rarity:"Common",    price:100,   sell:8,    desc:"Уютный домашний торт. С него всё начинается.",           img: makeCard(C.bg1,C.bg2,'🎂',C.glow) },
  2:  { name:"Jelly Bunny",      rarity:"Common",    price:100,   sell:8,    desc:"Мягкий желейный кролик. Первый друг коллекционера.",      img: makeCard(C.bg1,C.bg2,'🐰',C.glow) },
  3:  { name:"Santa Hat",        rarity:"Common",    price:120,   sell:10,   desc:"Красная шапка Санты. Дух праздника в твоих руках.",       img: makeCard(C.bg1,C.bg2,'🎅',C.glow) },
  4:  { name:"Spiced Wine",      rarity:"Common",    price:120,   sell:10,   desc:"Пряный глинтвейн. Согревает даже в самый холодный день.", img: makeCard(C.bg1,C.bg2,'🍷',C.glow) },
  5:  { name:"Precious Peach",   rarity:"Common",    price:80,    sell:6,    desc:"Спелый персик. Маленькое сокровище природы.",             img: makeCard(C.bg1,C.bg2,'🍑',C.glow) },
  6:  { name:"Lol Pop",          rarity:"Common",    price:80,    sell:6,    desc:"Яркий леденец на палочке. Сладкий старт.",                img: makeCard(C.bg1,C.bg2,'🍭',C.glow) },
  7:  { name:"Eternal Rose",     rarity:"Common",    price:150,   sell:12,   desc:"Роза, которая никогда не вянет. Классика навсегда.",      img: makeCard(C.bg1,C.bg2,'🌹',C.glow) },
  8:  { name:"Desk Calendar",    rarity:"Common",    price:150,   sell:12,   desc:"Настольный календарь. Каждый день — новая возможность.",  img: makeCard(C.bg1,C.bg2,'📅',C.glow) },
  9:  { name:"Berry Box",        rarity:"Common",    price:100,   sell:8,    desc:"Коробочка свежих ягод. Природный подарок.",               img: makeCard(C.bg1,C.bg2,'🍓',C.glow) },
  10: { name:"Perfume Bottle",   rarity:"Common",    price:90,    sell:7,    desc:"Флакон изысканных духов. Лёгкий аромат успеха.",          img: makeCard(C.bg1,C.bg2,'🧴',C.glow) },
  11: { name:"Cookie Heart",     rarity:"Common",    price:200,   sell:18,   desc:"Печенье в форме сердца. Сделано с любовью.",              img: makeCard(C.bg1,C.bg2,'🍪',C.glow) },
  12: { name:"Nesting Doll",     rarity:"Common",    price:180,   sell:15,   desc:"Расписная матрёшка. Секрет внутри секрета.",              img: makeCard(C.bg1,C.bg2,'🪆',C.glow) },
  13: { name:"Top Hat",          rarity:"Common",    price:180,   sell:15,   desc:"Элегантный цилиндр. Стиль вне времени.",                  img: makeCard(C.bg1,C.bg2,'🎩',C.glow) },
  14: { name:"Voodoo Doll",      rarity:"Common",    price:200,   sell:18,   desc:"Загадочная кукла вуду. Следи за своими желаниями.",       img: makeCard(C.bg1,C.bg2,'🧸',C.glow) },
  15: { name:"Spy Agaric",       rarity:"Common",    price:220,   sell:20,   desc:"Мухомор из волшебного леса. Не всё то яд, что красно.",   img: makeCard(C.bg1,C.bg2,'🍄',C.glow) },
  16: { name:"Evil Eye",         rarity:"Common",    price:250,   sell:22,   desc:"Злой глаз-оберег. Защищает от недоброго взгляда.",        img: makeCard(C.bg1,C.bg2,'🧿',C.glow) },
  17: { name:"Love Candle",      rarity:"Common",    price:250,   sell:22,   desc:"Свеча любви. Её огонь не гаснет от ветра.",               img: makeCard(C.bg1,C.bg2,'🕯️',C.glow) },
  18: { name:"Snow Globe",       rarity:"Common",    price:220,   sell:20,   desc:"Хрустальный шар со снегопадом внутри.",                   img: makeCard(C.bg1,C.bg2,'🔮',C.glow) },
  19: { name:"Hex Pot",          rarity:"Common",    price:200,   sell:18,   desc:"Котёл зелий. Бурлит загадочными пузырями.",               img: makeCard(C.bg1,C.bg2,'🫧',C.glow) },
  20: { name:"Diamond Ring",     rarity:"Common",    price:300,   sell:28,   desc:"Кольцо с бриллиантом. Символ вечности.",                  img: makeCard(C.bg1,C.bg2,'💍',C.glow) },

  // ── RARE ────────────────────────────────────────────
  21: { name:"Golden Cake",      rarity:"Rare",      price:600,   sell:55,   desc:"Торт покрытый листовым золотом. Только для избранных.",   img: makeCard(R.bg1,R.bg2,'🎂',R.glow) },
  22: { name:"Crystal Bunny",    rarity:"Rare",      price:600,   sell:55,   desc:"Кролик из чистого кристалла. Преломляет свет удачи.",     img: makeCard(R.bg1,R.bg2,'🐰',R.glow) },
  23: { name:"Cosmic Santa",     rarity:"Rare",      price:700,   sell:65,   desc:"Санта прибыл из глубин космоса с подарками.",             img: makeCard(R.bg1,R.bg2,'🎅',R.glow) },
  24: { name:"Eternal Wine",     rarity:"Rare",      price:700,   sell:65,   desc:"Глинтвейн из лозы, которой тысяча лет.",                  img: makeCard(R.bg1,R.bg2,'🍷',R.glow) },
  25: { name:"Diamond Peach",    rarity:"Rare",      price:800,   sell:75,   desc:"Персик с бриллиантовой кожурой. Редкий деликатес.",       img: makeCard(R.bg1,R.bg2,'🍑',R.glow) },
  26: { name:"Royal Lol Pop",    rarity:"Rare",      price:800,   sell:75,   desc:"Королевский леденец из сахара высшего сорта.",            img: makeCard(R.bg1,R.bg2,'🍭',R.glow) },
  27: { name:"Neon Rose",        rarity:"Rare",      price:900,   sell:85,   desc:"Роза пронизана неоновым светом. Светится в темноте.",     img: makeCard(R.bg1,R.bg2,'🌹',R.glow) },
  28: { name:"Infinity Cal.",    rarity:"Rare",      price:950,   sell:90,   desc:"Бесконечный календарь. Время не властно над ним.",        img: makeCard(R.bg1,R.bg2,'📅',R.glow) },
  29: { name:"Galaxy Berries",   rarity:"Rare",      price:900,   sell:85,   desc:"Ягоды с орбиты Сатурна. Вкус межзвёздного пространства.", img: makeCard(R.bg1,R.bg2,'🍓',R.glow) },
  30: { name:"Gold Perfume",     rarity:"Rare",      price:850,   sell:80,   desc:"Духи в золотом флаконе. Аромат богатства.",               img: makeCard(R.bg1,R.bg2,'🧴',R.glow) },
  31: { name:"Mystic Cookie",    rarity:"Rare",      price:1000,  sell:95,   desc:"Печенье с предсказанием из другого измерения.",           img: makeCard(R.bg1,R.bg2,'🍪',R.glow) },
  32: { name:"Ancient Doll",     rarity:"Rare",      price:950,   sell:90,   desc:"Матрёшка из древней мастерской. Каждый слой — история.",  img: makeCard(R.bg1,R.bg2,'🪆',R.glow) },
  33: { name:"Shadow Hat",       rarity:"Rare",      price:1000,  sell:95,   desc:"Цилиндр, сотканный из теней ночного города.",             img: makeCard(R.bg1,R.bg2,'🎩',R.glow) },
  34: { name:"Dark Voodoo",      rarity:"Rare",      price:1100,  sell:100,  desc:"Кукла вуду с тёмной силой. Обращайся осторожно.",         img: makeCard(R.bg1,R.bg2,'🧸',R.glow) },
  35: { name:"Magic Mushroom",   rarity:"Rare",      price:1100,  sell:100,  desc:"Мухомор наделён магической силой лесных духов.",          img: makeCard(R.bg1,R.bg2,'🍄',R.glow) },
  36: { name:"Cursed Eye",       rarity:"Rare",      price:1200,  sell:110,  desc:"Проклятый глаз видит то, что скрыто от других.",          img: makeCard(R.bg1,R.bg2,'🧿',R.glow) },
  37: { name:"Eternal Flame",    rarity:"Rare",      price:1200,  sell:110,  desc:"Пламя, которое горит без топлива уже 100 лет.",           img: makeCard(R.bg1,R.bg2,'🔥',R.glow) },
  38: { name:"Blizzard Globe",   rarity:"Rare",      price:1100,  sell:100,  desc:"Хрустальный шар с настоящей снежной бурей внутри.",       img: makeCard(R.bg1,R.bg2,'🔮',R.glow) },
  39: { name:"Chaos Pot",        rarity:"Rare",      price:1100,  sell:100,  desc:"Котёл хаоса. Что в нём варится — неизвестно никому.",     img: makeCard(R.bg1,R.bg2,'🫧',R.glow) },
  40: { name:"Eternal Diamond",  rarity:"Rare",      price:1300,  sell:120,  desc:"Бриллиант, не тускнеющий миллиарды лет.",                 img: makeCard(R.bg1,R.bg2,'💎',R.glow) },

  // ── EPIC ────────────────────────────────────────────
  41: { name:"Epic Cake",        rarity:"Epic",      price:3000,  sell:300,  desc:"Торт размером с мечту. Семь слоёв, семь секретов.",       img: makeCard(E.bg1,E.bg2,'🎂',E.glow) },
  42: { name:"Phantom Bunny",    rarity:"Epic",      price:3500,  sell:350,  desc:"Кролик-призрак. Появляется только в полнолуние.",         img: makeCard(E.bg1,E.bg2,'🐰',E.glow) },
  43: { name:"Galactic Santa",   rarity:"Epic",      price:4000,  sell:400,  desc:"Санта покоривший всю галактику. Его сани — звездолёт.",   img: makeCard(E.bg1,E.bg2,'🎅',E.glow) },
  44: { name:"Divine Wine",      rarity:"Epic",      price:4000,  sell:400,  desc:"Вино богов. Один глоток — и ты на вершине мира.",         img: makeCard(E.bg1,E.bg2,'🍷',E.glow) },
  45: { name:"Infinity Peach",   rarity:"Epic",      price:5000,  sell:500,  desc:"Персик бессмертия. Из древних китайских легенд.",         img: makeCard(E.bg1,E.bg2,'🍑',E.glow) },
  46: { name:"Cosmic Pop",       rarity:"Epic",      price:5000,  sell:500,  desc:"Леденец из звёздной пыли. Вкус невесомости.",             img: makeCard(E.bg1,E.bg2,'🍭',E.glow) },
  47: { name:"Supernova Rose",   rarity:"Epic",      price:6000,  sell:600,  desc:"Роза расцветшая во взрыве сверхновой звезды.",            img: makeCard(E.bg1,E.bg2,'🌹',E.glow) },
  48: { name:"Immortal Ring",    rarity:"Epic",      price:6000,  sell:600,  desc:"Кольцо бессмертия. Его носили императоры древности.",     img: makeCard(E.bg1,E.bg2,'💍',E.glow) },
  49: { name:"God Eye",          rarity:"Epic",      price:5500,  sell:550,  desc:"Глаз бога наблюдает за каждым твоим шагом.",              img: makeCard(E.bg1,E.bg2,'🧿',E.glow) },
  50: { name:"Storm Doll",       rarity:"Epic",      price:4500,  sell:450,  desc:"Матрёшка грозы. Внутри — маленькая буря.",                img: makeCard(E.bg1,E.bg2,'⚡',E.glow) },
  51: { name:"Shadow Crown",     rarity:"Epic",      price:5200,  sell:520,  desc:"Корона из тени. Надевший её видит скрытое.",              img: makeCard(E.bg1,E.bg2,'👑',E.glow) },
  52: { name:"Toxic Shroom",     rarity:"Epic",      price:4800,  sell:480,  desc:"Мухомор с токсичным свечением. Опасная красота.",         img: makeCard(E.bg1,E.bg2,'🍄',E.glow) },
  53: { name:"Phantom Cake",     rarity:"Epic",      price:3800,  sell:380,  desc:"Торт-призрак. Исчезает когда тянешься за куском.",        img: makeCard(E.bg1,E.bg2,'👻',E.glow) },
  54: { name:"Blood Voodoo",     rarity:"Epic",      price:5800,  sell:580,  desc:"Кровавая кукла. Обладает силой древней магии.",           img: makeCard(E.bg1,E.bg2,'🩸',E.glow) },
  55: { name:"Chaos Cookie",     rarity:"Epic",      price:4200,  sell:420,  desc:"Печенье хаоса. Откусил — и мир изменился навсегда.",      img: makeCard(E.bg1,E.bg2,'☠️',E.glow) },

  // ── LEGENDARY ───────────────────────────────────────
  56: { name:"Void Eye",         rarity:"Legendary", price:8000,  sell:850,  desc:"Глаз пустоты. Смотрит в бездну — бездна смотрит в него.", img: makeCard(L.bg1,L.bg2,'👁️',L.glow) },
  57: { name:"Inferno Candle",   rarity:"Legendary", price:9000,  sell:950,  desc:"Свеча адского огня. Горит даже в воде.",                  img: makeCard(L.bg1,L.bg2,'🔥',L.glow) },
  58: { name:"Abyss Globe",      rarity:"Legendary", price:10000, sell:1050, desc:"Шар бездны. Внутри — бесконечная тьма.",                  img: makeCard(L.bg1,L.bg2,'🌑',L.glow) },
  59: { name:"Chaos Diamond",    rarity:"Legendary", price:12000, sell:1300, desc:"Бриллиант хаоса. Преломляет реальность.",                 img: makeCard(L.bg1,L.bg2,'💠',L.glow) },
  60: { name:"GOD RING",         rarity:"Legendary", price:20000, sell:2200, desc:"Кольцо бога. Абсолютная власть. Абсолютная редкость.",    img: makeCard(L.bg1,L.bg2,'💫',L.glow) },
  61: { name:"TIDE GOD GIFT",    rarity:"Legendary", price:15000, sell:1600, desc:"Дар самого TIDE. Самый желанный подарок в коллекции.",    img: makeCard(L.bg1,L.bg2,'👑',L.glow) },
  62: { name:"Eclipse Crown",    rarity:"Legendary", price:18000, sell:1900, desc:"Корона затмения. Носивший её повелевал солнцем.",         img: makeCard(L.bg1,L.bg2,'🌒',L.glow) },
};
