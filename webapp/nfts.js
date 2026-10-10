// NFT data — картинки как data:SVG (встроенные, не требуют CDN)
function makeSVG(bg1, bg2, icon, label) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'>
    <defs>
      <radialGradient id='g' cx='50%' cy='40%' r='60%'>
        <stop offset='0%' stop-color='${bg1}'/>
        <stop offset='100%' stop-color='${bg2}'/>
      </radialGradient>
    </defs>
    <rect width='200' height='200' fill='url(#g)'/>
    <text x='100' y='115' font-size='80' text-anchor='middle' dominant-baseline='middle'>${icon}</text>
    <text x='100' y='175' font-size='13' fill='rgba(255,255,255,0.5)' text-anchor='middle' font-family='sans-serif'>${label}</text>
  </svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// Цвета по редкости
const C = {
  Common:    ['#1a2035','#0d1020'],
  Rare:      ['#0d1e3a','#061228'],
  Epic:      ['#1a0d35','#100820'],
  Legendary: ['#2a1a05','#150d00'],
};

const NFTS = {
  1:  {name:"Homemade Cake",    rarity:"Common",    price:100,  sell:8,   upgTo:21, upgCost:150,  desc:"Домашний торт — один из первых подарков Telegram.",  img:makeSVG(C.Common[0],    C.Common[1],    '🎂','Common')},
  2:  {name:"Jelly Bunny",      rarity:"Common",    price:100,  sell:8,   upgTo:22, upgCost:150,  desc:"Желейный кролик.",                                   img:makeSVG(C.Common[0],    C.Common[1],    '🐰','Common')},
  3:  {name:"Santa Hat",        rarity:"Common",    price:120,  sell:10,  upgTo:23, upgCost:180,  desc:"Шапка Санты.",                                       img:makeSVG(C.Common[0],    C.Common[1],    '🎅','Common')},
  4:  {name:"Spiced Wine",      rarity:"Common",    price:120,  sell:10,  upgTo:24, upgCost:180,  desc:"Глинтвейн.",                                         img:makeSVG(C.Common[0],    C.Common[1],    '🍷','Common')},
  5:  {name:"Precious Peach",   rarity:"Common",    price:80,   sell:6,   upgTo:25, upgCost:120,  desc:"Дорогой персик.",                                    img:makeSVG(C.Common[0],    C.Common[1],    '🍑','Common')},
  6:  {name:"Lol Pop",          rarity:"Common",    price:80,   sell:6,   upgTo:26, upgCost:120,  desc:"Леденец.",                                           img:makeSVG(C.Common[0],    C.Common[1],    '🍭','Common')},
  7:  {name:"Eternal Rose",     rarity:"Common",    price:150,  sell:12,  upgTo:27, upgCost:200,  desc:"Вечная роза.",                                       img:makeSVG(C.Common[0],    C.Common[1],    '🌹','Common')},
  8:  {name:"Desk Calendar",    rarity:"Common",    price:150,  sell:12,  upgTo:28, upgCost:200,  desc:"Настольный календарь.",                              img:makeSVG(C.Common[0],    C.Common[1],    '📅','Common')},
  9:  {name:"Berry Box",        rarity:"Common",    price:100,  sell:8,   upgTo:29, upgCost:150,  desc:"Коробка с ягодами.",                                 img:makeSVG(C.Common[0],    C.Common[1],    '🍓','Common')},
  10: {name:"Perfume Bottle",   rarity:"Common",    price:90,   sell:7,   upgTo:30, upgCost:140,  desc:"Флакон духов.",                                      img:makeSVG(C.Common[0],    C.Common[1],    '🧴','Common')},
  11: {name:"Cookie Heart",     rarity:"Common",    price:200,  sell:18,  upgTo:31, upgCost:250,  desc:"Печенье-сердечко.",                                  img:makeSVG(C.Common[0],    C.Common[1],    '🍪','Common')},
  12: {name:"Nesting Doll",     rarity:"Common",    price:180,  sell:15,  upgTo:32, upgCost:220,  desc:"Матрёшка.",                                          img:makeSVG(C.Common[0],    C.Common[1],    '🪆','Common')},
  13: {name:"Top Hat",          rarity:"Common",    price:180,  sell:15,  upgTo:33, upgCost:220,  desc:"Цилиндр.",                                           img:makeSVG(C.Common[0],    C.Common[1],    '🎩','Common')},
  14: {name:"Voodoo Doll",      rarity:"Common",    price:200,  sell:18,  upgTo:34, upgCost:250,  desc:"Кукла вуду.",                                        img:makeSVG(C.Common[0],    C.Common[1],    '🪅','Common')},
  15: {name:"Spy Agaric",       rarity:"Common",    price:220,  sell:20,  upgTo:35, upgCost:270,  desc:"Мухомор.",                                           img:makeSVG(C.Common[0],    C.Common[1],    '🍄','Common')},
  16: {name:"Evil Eye",         rarity:"Common",    price:250,  sell:22,  upgTo:36, upgCost:300,  desc:"Злой глаз.",                                         img:makeSVG(C.Common[0],    C.Common[1],    '🧿','Common')},
  17: {name:"Love Candle",      rarity:"Common",    price:250,  sell:22,  upgTo:37, upgCost:300,  desc:"Свеча любви.",                                       img:makeSVG(C.Common[0],    C.Common[1],    '🕯️','Common')},
  18: {name:"Snow Globe",       rarity:"Common",    price:220,  sell:20,  upgTo:38, upgCost:270,  desc:"Снежный шар.",                                       img:makeSVG(C.Common[0],    C.Common[1],    '🔮','Common')},
  19: {name:"Hex Pot",          rarity:"Common",    price:200,  sell:18,  upgTo:39, upgCost:250,  desc:"Котёл зелий.",                                       img:makeSVG(C.Common[0],    C.Common[1],    '🪄','Common')},
  20: {name:"Diamond Ring",     rarity:"Common",    price:300,  sell:28,  upgTo:40, upgCost:350,  desc:"Кольцо с бриллиантом.",                              img:makeSVG(C.Common[0],    C.Common[1],    '💍','Common')},

  21: {name:"Golden Cake",      rarity:"Rare",      price:600,  sell:55,  upgTo:41, upgCost:700,  desc:"Золотой торт.",                                      img:makeSVG(C.Rare[0],      C.Rare[1],      '🎂','Rare')},
  22: {name:"Crystal Bunny",    rarity:"Rare",      price:600,  sell:55,  upgTo:42, upgCost:700,  desc:"Кристальный кролик.",                                img:makeSVG(C.Rare[0],      C.Rare[1],      '🐰','Rare')},
  23: {name:"Cosmic Santa",     rarity:"Rare",      price:700,  sell:65,  upgTo:43, upgCost:800,  desc:"Космический Санта.",                                 img:makeSVG(C.Rare[0],      C.Rare[1],      '🎅','Rare')},
  24: {name:"Eternal Wine",     rarity:"Rare",      price:700,  sell:65,  upgTo:44, upgCost:800,  desc:"Вечный глинтвейн.",                                  img:makeSVG(C.Rare[0],      C.Rare[1],      '🍷','Rare')},
  25: {name:"Diamond Peach",    rarity:"Rare",      price:800,  sell:75,  upgTo:45, upgCost:900,  desc:"Бриллиантовый персик.",                              img:makeSVG(C.Rare[0],      C.Rare[1],      '🍑','Rare')},
  26: {name:"Royal Lol Pop",    rarity:"Rare",      price:800,  sell:75,  upgTo:46, upgCost:900,  desc:"Королевский леденец.",                               img:makeSVG(C.Rare[0],      C.Rare[1],      '🍭','Rare')},
  27: {name:"Neon Rose",        rarity:"Rare",      price:900,  sell:85,  upgTo:47, upgCost:1000, desc:"Неоновая роза.",                                     img:makeSVG(C.Rare[0],      C.Rare[1],      '🌹','Rare')},
  28: {name:"Infinity Cal.",    rarity:"Rare",      price:950,  sell:90,  upgTo:48, upgCost:1050, desc:"Бесконечный календарь.",                             img:makeSVG(C.Rare[0],      C.Rare[1],      '📅','Rare')},
  29: {name:"Galaxy Berries",   rarity:"Rare",      price:900,  sell:85,  upgTo:49, upgCost:1000, desc:"Галактические ягоды.",                               img:makeSVG(C.Rare[0],      C.Rare[1],      '🍓','Rare')},
  30: {name:"Gold Perfume",     rarity:"Rare",      price:850,  sell:80,  upgTo:50, upgCost:950,  desc:"Золотые духи.",                                      img:makeSVG(C.Rare[0],      C.Rare[1],      '🧴','Rare')},
  31: {name:"Mystic Cookie",    rarity:"Rare",      price:1000, sell:95,  upgTo:null,upgCost:0,   desc:"Мистическое печенье.",                               img:makeSVG(C.Rare[0],      C.Rare[1],      '🍪','Rare')},
  32: {name:"Ancient Doll",     rarity:"Rare",      price:950,  sell:90,  upgTo:null,upgCost:0,   desc:"Древняя матрёшка.",                                  img:makeSVG(C.Rare[0],      C.Rare[1],      '🪆','Rare')},
  33: {name:"Shadow Hat",       rarity:"Rare",      price:1000, sell:95,  upgTo:null,upgCost:0,   desc:"Шляпа теней.",                                       img:makeSVG(C.Rare[0],      C.Rare[1],      '🎩','Rare')},
  34: {name:"Dark Voodoo",      rarity:"Rare",      price:1100, sell:100, upgTo:null,upgCost:0,   desc:"Тёмная кукла вуду.",                                 img:makeSVG(C.Rare[0],      C.Rare[1],      '🪅','Rare')},
  35: {name:"Magic Mushroom",   rarity:"Rare",      price:1100, sell:100, upgTo:null,upgCost:0,   desc:"Волшебный мухомор.",                                 img:makeSVG(C.Rare[0],      C.Rare[1],      '🍄','Rare')},
  36: {name:"Cursed Eye",       rarity:"Rare",      price:1200, sell:110, upgTo:null,upgCost:0,   desc:"Проклятый глаз.",                                    img:makeSVG(C.Rare[0],      C.Rare[1],      '🧿','Rare')},
  37: {name:"Eternal Flame",    rarity:"Rare",      price:1200, sell:110, upgTo:null,upgCost:0,   desc:"Вечное пламя.",                                      img:makeSVG(C.Rare[0],      C.Rare[1],      '🔥','Rare')},
  38: {name:"Blizzard Globe",   rarity:"Rare",      price:1100, sell:100, upgTo:null,upgCost:0,   desc:"Шар метели.",                                        img:makeSVG(C.Rare[0],      C.Rare[1],      '🔮','Rare')},
  39: {name:"Chaos Pot",        rarity:"Rare",      price:1100, sell:100, upgTo:null,upgCost:0,   desc:"Котёл хаоса.",                                       img:makeSVG(C.Rare[0],      C.Rare[1],      '🪄','Rare')},
  40: {name:"Eternal Diamond",  rarity:"Rare",      price:1300, sell:120, upgTo:null,upgCost:0,   desc:"Вечный бриллиант.",                                  img:makeSVG(C.Rare[0],      C.Rare[1],      '💎','Rare')},

  41: {name:"Epic Cake",        rarity:"Epic",      price:3000, sell:300, upgTo:null,upgCost:0,   desc:"Эпический торт.",                                    img:makeSVG(C.Epic[0],      C.Epic[1],      '🎂','Epic')},
  42: {name:"Legendary Bunny",  rarity:"Epic",      price:3500, sell:350, upgTo:null,upgCost:0,   desc:"Легендарный кролик.",                                img:makeSVG(C.Epic[0],      C.Epic[1],      '🐰','Epic')},
  43: {name:"Galactic Santa",   rarity:"Epic",      price:4000, sell:400, upgTo:null,upgCost:0,   desc:"Галактический Санта.",                               img:makeSVG(C.Epic[0],      C.Epic[1],      '🎅','Epic')},
  44: {name:"Divine Wine",      rarity:"Epic",      price:4000, sell:400, upgTo:null,upgCost:0,   desc:"Божественное вино.",                                 img:makeSVG(C.Epic[0],      C.Epic[1],      '🍷','Epic')},
  45: {name:"Infinity Peach",   rarity:"Epic",      price:5000, sell:500, upgTo:null,upgCost:0,   desc:"Бесконечный персик.",                                img:makeSVG(C.Epic[0],      C.Epic[1],      '🍑','Epic')},
  46: {name:"Cosmic Pop",       rarity:"Epic",      price:5000, sell:500, upgTo:null,upgCost:0,   desc:"Космический леденец.",                               img:makeSVG(C.Epic[0],      C.Epic[1],      '🍭','Epic')},
  47: {name:"Supernova Rose",   rarity:"Epic",      price:6000, sell:600, upgTo:null,upgCost:0,   desc:"Роза сверхновой.",                                   img:makeSVG(C.Epic[0],      C.Epic[1],      '🌹','Epic')},
  48: {name:"Immortal Ring",    rarity:"Epic",      price:6000, sell:600, upgTo:null,upgCost:0,   desc:"Бессмертное кольцо.",                                img:makeSVG(C.Epic[0],      C.Epic[1],      '💍','Epic')},
  49: {name:"God Eye",          rarity:"Epic",      price:5500, sell:550, upgTo:null,upgCost:0,   desc:"Глаз бога.",                                         img:makeSVG(C.Epic[0],      C.Epic[1],      '🧿','Epic')},
  50: {name:"TIDE GOD GIFT",    rarity:"Legendary", price:15000,sell:1600,upgTo:null,upgCost:0,   desc:"Самый редкий подарок TIDE BOT.",                     img:makeSVG(C.Legendary[0], C.Legendary[1], '👑','Legendary')},
};
