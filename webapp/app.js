// ── TELEGRAM WEBAPP INIT ─────────────────────────────────────
const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const API = '/api'; // бэкенд

// ── STATE ────────────────────────────────────────────────────
let state = {
  balance: 0,
  inventory: [],       // [{inv_id, nft_id}]
  marketFilter: 'All',
  currentNft: null,    // открытый в модале nft_id
  currentInv: null,    // открытый в модале inv_id
  upgradeInvId: null,
  spinning: false,
};

// ── API CALLS ────────────────────────────────────────────────
function tgUserId() {
  return tg?.initDataUnsafe?.user?.id || 0;
}
function tgInitData() {
  return tg?.initData || '';
}

async function apiGet(path) {
  const r = await fetch(`${API}${path}`, {
    headers: { 'X-Telegram-Init-Data': tgInitData() }
  });
  return r.json();
}
async function apiPost(path, body) {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': tgInitData()
    },
    body: JSON.stringify(body)
  });
  return r.json();
}

// ── LOAD USER ────────────────────────────────────────────────
async function loadUser() {
  try {
    const data = await apiGet('/me');
    state.balance   = data.tcoins || 0;
    state.inventory = data.inventory || [];
    renderHome();
    renderInventory();
    renderUpgrade();
  } catch(e) {
    // fallback для тестирования без бэкенда
    state.balance = 1337;
    state.inventory = [];
    renderHome();
    renderInventory();
    renderUpgrade();
  }
}

// ── SCREEN NAV ───────────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
  document.querySelector(`[data-screen="${name}"]`).classList.add('active');
  if (name === 'market')  renderMarket();
}

// ── TOAST ────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = '') {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = `toast ${type}`;
  requestAnimationFrame(() => { t.classList.add('show'); });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ── MODAL ────────────────────────────────────────────────────
function openModal(html, onOpen) {
  let ov = document.getElementById('modal-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'modal-overlay';
    ov.className = 'modal-overlay';
    ov.innerHTML = `<div class="modal" id="modal-inner"></div>`;
    ov.addEventListener('click', e => { if (e.target === ov) closeModal(); });
    document.body.appendChild(ov);
  }
  document.getElementById('modal-inner').innerHTML =
    `<div class="modal-handle"></div>` + html;
  requestAnimationFrame(() => ov.classList.add('open'));
  if (onOpen) onOpen();
}
function closeModal() {
  const ov = document.getElementById('modal-overlay');
  if (ov) ov.classList.remove('open');
}

// ── HOME ─────────────────────────────────────────────────────
function renderHome() {
  const el = document.getElementById('screen-home');
  // Топ-5 Legendary для горизонтального скролла
  const featured = Object.entries(NFTS)
    .filter(([,n]) => n.rarity === 'Legendary')
    .slice(0, 5);

  el.innerHTML = `
    <div class="home-header">
      <div class="home-logo">🌊</div>
      <div class="home-title">TIDE BOT</div>
      <div class="home-subtitle">NFT Marketplace</div>
    </div>
    <div class="balance-card">
      <div class="balance-label">Твой баланс</div>
      <div class="balance-amount">${state.balance.toLocaleString()}</div>
      <div class="balance-sub">🪙 T Coins</div>
    </div>
    <button class="deposit-btn" onclick="openDepositModal()">
      ⭐ Пополнить через Stars
    </button>
    <div class="section-title">🔥 Топ NFT</div>
    <div class="nft-row">
      ${featured.map(([id,n]) => nftCardHtml(id, n)).join('')}
    </div>
    <div style="height:12px"></div>
    <div class="section-title">⬜ Common</div>
    <div class="nft-row">
      ${Object.entries(NFTS).filter(([,n])=>n.rarity==='Common').slice(0,6).map(([id,n])=>nftCardHtml(id,n)).join('')}
    </div>
    <div style="height:12px"></div>
    <div class="section-title">🟦 Rare</div>
    <div class="nft-row">
      ${Object.entries(NFTS).filter(([,n])=>n.rarity==='Rare').slice(0,6).map(([id,n])=>nftCardHtml(id,n)).join('')}
    </div>
  `;
}

function nftCardHtml(id, n) {
  return `
    <div class="nft-card rarity-${n.rarity}" onclick="openNftModal(${id})">
      <div class="nft-img-wrap">${n.emoji}</div>
      <div class="nft-card-body">
        <div class="nft-card-name">${n.name}</div>
        <div class="nft-card-rarity">${n.rarity}</div>
        <div class="nft-card-price">🪙 ${n.price.toLocaleString()}</div>
      </div>
    </div>`;
}

// ── MARKET ───────────────────────────────────────────────────
function renderMarket() {
  const el = document.getElementById('screen-market');
  const filters = ['All','Common','Rare','Epic','Legendary'];
  const list = Object.entries(NFTS).filter(([,n]) =>
    state.marketFilter === 'All' || n.rarity === state.marketFilter
  );

  el.innerHTML = `
    <div class="screen-header">🛍 Маркет</div>
    <div class="filter-row">
      ${filters.map(f => `
        <div class="filter-chip ${state.marketFilter===f ? 'active-'+f : ''}"
             onclick="setMarketFilter('${f}')">${filterLabel(f)}</div>
      `).join('')}
    </div>
    <div class="nft-grid">
      ${list.map(([id,n]) => nftCardHtml(id,n)).join('')}
    </div>
  `;
}
function filterLabel(f) {
  return {All:'Все',Common:'⬜ Common',Rare:'🟦 Rare',Epic:'🟪 Epic',Legendary:'🟨 Legendary'}[f] || f;
}
function setMarketFilter(f) {
  state.marketFilter = f;
  renderMarket();
}

// ── NFT MODAL (маркет) ───────────────────────────────────────
function openNftModal(id) {
  const n = NFTS[id];
  if (!n) return;
  state.currentNft = id;
  const upgHtml = n.upgTo ? `
    <div style="background:var(--bg3);border-radius:12px;padding:12px;margin-bottom:14px;text-align:center">
      <div style="font-size:12px;color:var(--text-dim);margin-bottom:4px">⬆️ Апгрейд до</div>
      <div style="font-size:15px;font-weight:700">${NFTS[n.upgTo]?.emoji} ${NFTS[n.upgTo]?.name}</div>
      <div style="font-size:12px;color:var(--gold);margin-top:2px">за 🪙 ${n.upgCost.toLocaleString()} T Coins</div>
    </div>` : '';
  openModal(`
    <span class="modal-emoji">${n.emoji}</span>
    <div class="modal-name">${n.name}</div>
    <div class="modal-center">
      <span class="modal-rarity-badge badge-${n.rarity}">${n.rarity}</span>
    </div>
    <div class="modal-desc">${n.desc}</div>
    <div class="modal-stats">
      <div class="stat-item">
        <div class="stat-val">🪙 ${n.price.toLocaleString()}</div>
        <div class="stat-lbl">Цена</div>
      </div>
      <div class="stat-item">
        <div class="stat-val">⭐ ${n.sell}</div>
        <div class="stat-lbl">Вывод Stars</div>
      </div>
    </div>
    ${upgHtml}
    <button class="btn-primary" onclick="buyNft(${id})">
      🛍 Купить за 🪙 ${n.price.toLocaleString()}
    </button>
    <button class="btn-secondary" onclick="closeModal()">Закрыть</button>
  `);
}

async function buyNft(id) {
  const n = NFTS[id];
  if (state.balance < n.price) {
    showToast('❌ Недостаточно T Coins', 'error');
    return;
  }
  try {
    const res = await apiPost('/buy', { nft_id: id });
    if (res.ok) {
      state.balance   = res.balance;
      state.inventory = res.inventory;
      renderHome();
      renderInventory();
      renderUpgrade();
      closeModal();
      showToast(`✅ ${n.name} куплен!`, 'success');
    } else {
      showToast(res.error || '❌ Ошибка', 'error');
    }
  } catch(e) {
    // Оффлайн-демо
    state.balance -= n.price;
    state.inventory.push({inv_id: Date.now(), nft_id: parseInt(id)});
    renderHome(); renderInventory(); renderUpgrade();
    closeModal();
    showToast(`✅ ${n.name} куплен!`, 'success');
  }
}

// ── INVENTORY ────────────────────────────────────────────────
function renderInventory() {
  const el = document.getElementById('screen-inv');
  if (!state.inventory.length) {
    el.innerHTML = `
      <div class="screen-header">🎒 Инвентарь</div>
      <div class="inv-empty">
        <div class="inv-empty-icon">🎒</div>
        <div class="inv-empty-text">Инвентарь пустой<br>Купи NFT в маркете!</div>
      </div>`;
    return;
  }
  el.innerHTML = `
    <div class="screen-header">🎒 Инвентарь (${state.inventory.length})</div>
    <div class="nft-grid">
      ${state.inventory.map(item => {
        const n = NFTS[item.nft_id];
        if (!n) return '';
        return `
          <div class="nft-card rarity-${n.rarity}" onclick="openInvModal(${item.inv_id}, ${item.nft_id})">
            <div class="nft-img-wrap">${n.emoji}</div>
            <div class="nft-card-body">
              <div class="nft-card-name">${n.name}</div>
              <div class="nft-card-rarity">${n.rarity}</div>
              <div class="nft-card-price">⭐ ${n.sell} Stars</div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

function openInvModal(invId, nftId) {
  const n = NFTS[nftId];
  if (!n) return;
  state.currentInv = invId;
  state.currentNft = nftId;
  const upgHtml = n.upgTo ? `
    <button class="btn-primary" onclick="goUpgrade(${invId})">
      ⬆️ Апгрейд до ${NFTS[n.upgTo]?.name}
    </button>` : '';
  openModal(`
    <span class="modal-emoji">${n.emoji}</span>
    <div class="modal-name">${n.name}</div>
    <div class="modal-center">
      <span class="modal-rarity-badge badge-${n.rarity}">${n.rarity}</span>
    </div>
    <div class="modal-desc">${n.desc}</div>
    <div class="modal-stats">
      <div class="stat-item">
        <div class="stat-val">⭐ ${n.sell}</div>
        <div class="stat-lbl">Вывод Stars</div>
      </div>
      ${n.upgTo ? `<div class="stat-item">
        <div class="stat-val">🪙 ${n.upgCost.toLocaleString()}</div>
        <div class="stat-lbl">Апгрейд</div>
      </div>` : ''}
    </div>
    ${upgHtml}
    <button class="btn-danger" onclick="sellNft(${invId}, ${nftId})">
      💸 Вывести за ⭐ ${n.sell} Stars
    </button>
    <button class="btn-secondary" onclick="closeModal()">Закрыть</button>
  `);
}

function goUpgrade(invId) {
  closeModal();
  state.upgradeInvId = invId;
  showScreen('upgrade');
  renderUpgrade();
}

async function sellNft(invId, nftId) {
  const n = NFTS[nftId];
  try {
    const res = await apiPost('/sell', { inv_id: invId });
    if (res.ok) {
      state.balance   = res.balance;
      state.inventory = res.inventory;
      renderHome(); renderInventory(); renderUpgrade();
      closeModal();
      showToast(`💸 Получено ⭐ ${n.sell} Stars!`, 'success');
    } else if (res.no_stars) {
      closeModal();
      showToast('⏳ Нет звёзд в боте. Ожидайте пополнения.', 'error');
    } else {
      showToast(res.error || '❌ Ошибка', 'error');
    }
  } catch(e) {
    // Оффлайн-демо
    state.inventory = state.inventory.filter(i => i.inv_id !== invId);
    renderHome(); renderInventory(); renderUpgrade();
    closeModal();
    showToast(`💸 Получено ⭐ ${n.sell} Stars!`, 'success');
  }
}

// ── UPGRADE SCREEN ───────────────────────────────────────────
function renderUpgrade() {
  const el = document.getElementById('screen-upgrade');
  const upgradeable = state.inventory.filter(i => NFTS[i.nft_id]?.upgTo);

  let selectHtml = '';
  if (upgradeable.length) {
    selectHtml = `
      <div class="upgrade-select-label">Выбери NFT для апгрейда</div>
      <select class="upgrade-select" id="upg-select" onchange="onUpgradeSelect()">
        ${upgradeable.map(i => {
          const n = NFTS[i.nft_id];
          return `<option value="${i.inv_id}" ${state.upgradeInvId===i.inv_id?'selected':''}>${n.emoji} ${n.name} (${n.rarity})</option>`;
        }).join('')}
      </select>`;
  }

  // Текущий выбранный
  let selInvId = state.upgradeInvId || (upgradeable[0]?.inv_id);
  let selItem  = upgradeable.find(i => i.inv_id === selInvId) || upgradeable[0];
  let fromNft  = selItem ? NFTS[selItem.nft_id] : null;
  let toNft    = fromNft?.upgTo ? NFTS[fromNft.upgTo] : null;

  const previewHtml = fromNft && toNft ? `
    <div class="upgrade-preview">
      <div class="upgrade-nft-box">
        <div class="upgrade-box-emoji">${fromNft.emoji}</div>
        <div class="upgrade-box-name">${fromNft.name}</div>
        <div class="upgrade-box-rarity" style="color:var(--${fromNft.rarity.toLowerCase()})">${fromNft.rarity}</div>
      </div>
      <div class="upgrade-arrow">→</div>
      <div class="upgrade-nft-box target">
        <div class="upgrade-box-emoji">${toNft.emoji}</div>
        <div class="upgrade-box-name">${toNft.name}</div>
        <div class="upgrade-box-rarity" style="color:var(--${toNft.rarity.toLowerCase()})">${toNft.rarity}</div>
      </div>
    </div>
    <div class="spin-area">
      <div class="spin-bar-wrap" id="spin-wrap">
        <div class="spin-bar-track" id="spin-track"></div>
        <div class="spin-pointer"></div>
      </div>
      <div class="spin-result" id="spin-result">Нажми апгрейд — испытай удачу!</div>
    </div>
    <button class="btn-primary" id="upg-btn" onclick="doUpgrade()">
      ⬆️ Апгрейд за 🪙 ${fromNft.upgCost.toLocaleString()}
    </button>` : `
    <div style="text-align:center;padding:40px 0;color:var(--text-dim)">
      <div style="font-size:48px;margin-bottom:12px">⬆️</div>
      <div>Нет NFT для апгрейда.<br>Купи Common или Rare в маркете!</div>
    </div>`;

  el.innerHTML = `
    <div class="upgrade-container">
      <div class="upgrade-title">⬆️ Апгрейд NFT</div>
      <div class="upgrade-sub">Прокачай свой NFT до более редкого!</div>
      ${selectHtml}
      ${previewHtml}
    </div>`;

  if (fromNft && toNft) buildSpinTrack(fromNft, toNft);
}

function onUpgradeSelect() {
  const sel = document.getElementById('upg-select');
  if (!sel) return;
  state.upgradeInvId = parseInt(sel.value);
  renderUpgrade();
}

function buildSpinTrack(fromNft, toNft) {
  const track = document.getElementById('spin-track');
  if (!track) return;
  // Генерируем случайную полосу: ~25% шанс победы
  const segments = [];
  for (let i = 0; i < 40; i++) {
    segments.push(Math.random() < 0.25 ? 'win' : 'lose');
  }
  track.innerHTML = segments.map(s => `
    <div class="spin-segment ${s === 'win' ? 'win-seg' : 'lose-seg'}">
      ${s === 'win' ? toNft.emoji : '💀'}
    </div>`).join('');
  track._segments = segments;
  track._fromNft  = fromNft;
  track._toNft    = toNft;
}

async function doUpgrade() {
  if (state.spinning) return;
  const sel = document.getElementById('upg-select');
  const invId = sel ? parseInt(sel.value) : state.upgradeInvId;
  const item  = state.inventory.find(i => i.inv_id === invId);
  if (!item) return;
  const fromNft = NFTS[item.nft_id];
  if (!fromNft?.upgTo) return;

  if (state.balance < fromNft.upgCost) {
    showToast('❌ Недостаточно T Coins', 'error');
    return;
  }

  state.spinning = true;
  const btn = document.getElementById('upg-btn');
  if (btn) btn.disabled = true;

  // Крутим барабан
  const track   = document.getElementById('spin-track');
  const result  = document.getElementById('spin-result');
  const segs    = track?._segments || [];
  const segW    = 60; // px включая margin
  const totalW  = segs.length * segW;
  const centerX = document.getElementById('spin-wrap')?.offsetWidth / 2 || 150;

  // Случайная конечная позиция
  const winIdxs  = segs.reduce((a,s,i) => s==='win' ? [...a,i] : a, []);
  const loseIdxs = segs.reduce((a,s,i) => s==='lose'? [...a,i] : a, []);

  // Запрашиваем результат с сервера (или симулируем)
  let won = false;
  try {
    const res = await apiPost('/upgrade', { inv_id: invId });
    won = res.ok === true;
    if (res.balance !== undefined) state.balance = res.balance;
    if (res.inventory) state.inventory = res.inventory;
  } catch(e) {
    won = Math.random() < 0.25;
    if (won) {
      state.balance -= fromNft.upgCost;
      state.inventory = state.inventory.filter(i => i.inv_id !== invId);
      state.inventory.push({ inv_id: Date.now(), nft_id: fromNft.upgTo });
    } else {
      state.balance -= fromNft.upgCost;
      state.inventory = state.inventory.filter(i => i.inv_id !== invId);
    }
  }

  // Выбираем позицию остановки
  const pool    = won ? winIdxs : loseIdxs;
  const stopIdx = pool[Math.floor(Math.random() * pool.length)] ?? 20;
  const finalX  = -(stopIdx * segW - centerX + segW / 2);

  // Анимация: сначала быстро крутим, потом замедляем
  let startX = 0;
  const fullRounds = 3;
  const animStart = performance.now();
  const duration  = 2800;

  function animate(now) {
    const elapsed = now - animStart;
    const t = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const ease = 1 - Math.pow(1 - t, 3);
    const travel = fullRounds * totalW + Math.abs(finalX);
    const cur = -(ease * travel) + (finalX + fullRounds * totalW);
    track.style.transform = `translateX(${cur % (-totalW)}px)`;
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      track.style.transform = `translateX(${finalX}px)`;
      // Результат
      if (won) {
        const toNft = NFTS[fromNft.upgTo];
        result.textContent = `🎉 УСПЕХ! Получен ${toNft.emoji} ${toNft.name}!`;
        result.className = 'spin-result win';
        showToast(`🎉 Апгрейд успешен! ${toNft.name}`, 'success');
      } else {
        result.textContent = '💀 Неудача... NFT потерян';
        result.className = 'spin-result lose';
        showToast('💀 Апгрейд не удался', 'error');
      }
      state.spinning = false;
      renderHome();
      renderInventory();
      setTimeout(() => renderUpgrade(), 1800);
    }
  }
  requestAnimationFrame(animate);
}

// ── DEPOSIT MODAL ────────────────────────────────────────────
function openDepositModal() {
  const opts = [10, 50, 100, 250, 500, 1000];
  openModal(`
    <div style="font-size:22px;font-weight:800;text-align:center;margin-bottom:6px">
      ⭐ Пополнение баланса
    </div>
    <div style="font-size:13px;color:var(--text-dim);text-align:center;margin-bottom:18px">
      1 ⭐ Star = 10 🪙 T Coins
    </div>
    <div class="deposit-grid">
      ${opts.map(s => `
        <div class="deposit-option" onclick="depositStars(${s})">
          <div class="deposit-stars">⭐ ${s}</div>
          <div class="deposit-coins">= 🪙 ${s*10} T Coins</div>
        </div>`).join('')}
    </div>
    <button class="btn-secondary" onclick="closeModal()">Отмена</button>
  `);
}

function depositStars(stars) {
  closeModal();
  // Отправляем запрос боту через Telegram WebApp
  if (tg) {
    tg.sendData(JSON.stringify({ action: 'deposit', stars }));
  } else {
    showToast('Открой в Telegram для оплаты', 'error');
  }
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderHome();
  renderMarket();
  renderInventory();
  renderUpgrade();
  loadUser();
});
