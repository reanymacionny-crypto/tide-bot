const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const API = '';

let state = {
  balance: 0,
  inventory: [],
  isAdmin: false,
  marketFilter: 'All',
  marketSearch: '',
  homeSearch: '',
  listings: [],
  stock: [],
  spinning: false,
  upgradeFrom: null,
  upgradeFromId: null,
  upgradeFromIds: [],
  upgradeTo: null,
  upgradeChance: 50,
  upgradeCost: 0,
  upgradeMult: null,
  listSelectedInvId: null,
  listSelectedNftId: null,
  listPrice: '',
  pendingWithdraws: [], // inv_id[] которые на выводе
  adminStats: null,
  adminUsers: [],
  adminTab: 'stats',
};

// ── UTILS ─────────────────────────────────────────────
function tgInitData() { return tg?.initData || ''; }

async function apiGet(path) {
  const r = await fetch(`${API}/api${path}`, {
    headers: { 'X-Telegram-Init-Data': tgInitData() }
  });
  return r.json();
}
async function apiPost(path, body) {
  const r = await fetch(`${API}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': tgInitData() },
    body: JSON.stringify(body)
  });
  return r.json();
}

async function loadUser() {
  // Мгновенно показываем кэш из localStorage
  try {
    const cached = localStorage.getItem('tide_state');
    if (cached) {
      const c = JSON.parse(cached);
      state.balance    = c.balance    || 0;
      state.inventory  = c.inventory  || [];
      state.listings   = c.listings   || [];
      state.isAdmin    = c.isAdmin    || false;
      state.myUsername = c.myUsername || '';
      state.stock      = c.stock      || [];
      const adminBtn = document.getElementById('nav-admin-btn');
      if (adminBtn) adminBtn.style.display = state.isAdmin ? 'flex' : 'none';
      renderHome(); renderInventory(); renderUpgrade();
    }
  } catch {}

  // Синхронизируем с сервером
  try {
    const data = await apiGet('/me');
    state.balance    = data.tcoins    || 0;
    state.inventory  = data.inventory || [];
    state.listings   = data.listings  || [];
    state.isAdmin    = data.is_admin  || false;
    state.myUsername = data.username  || '';
    state.stock      = data.stock     || [];
  } catch {
    // Оставляем кэш
  }

  // Публичные листинги
  try {
    const pl = await apiGet('/listings');
    state.publicListings = pl.listings || [];
  } catch { state.publicListings = []; }

  // Сохраняем актуальное состояние
  try {
    localStorage.setItem('tide_state', JSON.stringify({
      balance:    state.balance,
      inventory:  state.inventory,
      listings:   state.listings,
      isAdmin:    state.isAdmin,
      myUsername: state.myUsername,
      stock:      state.stock,
    }));
  } catch {}

  const adminBtn = document.getElementById('nav-admin-btn');
  if (adminBtn) adminBtn.style.display = state.isAdmin ? 'flex' : 'none';
  renderHome(); renderInventory(); renderUpgrade();
}

// ── SCREEN ────────────────────────────────────────────
function saveState() {
  try {
    localStorage.setItem('tide_state', JSON.stringify({
      balance:    state.balance,
      inventory:  state.inventory,
      listings:   state.listings,
      isAdmin:    state.isAdmin,
      myUsername: state.myUsername,
      stock:      state.stock,
    }));
  } catch {}
}

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  if (state.spinning) { toast('Подожди результат апгрейда!', 'error'); return; }
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
  const btn = document.querySelector(`[data-screen="${name}"]`);
  if (btn) btn.classList.add('active');
  if (name === 'market')  renderMarket();
  if (name === 'cases')   renderCases();
  if (name === 'list')    renderList();
  if (name === 'sales')   renderSales();
  if (name === 'admin')   renderAdmin();
}

// ── TOAST ─────────────────────────────────────────────
let _tt;
function toast(msg, type = '') {
  let el = document.getElementById('_toast');
  if (!el) {
    el = document.createElement('div');
    el.id = '_toast'; el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = `toast ${type}`;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.remove('show'), 2800);
}

// ── MODAL ─────────────────────────────────────────────
function openModal(html) {
  let ov = document.getElementById('_modal_ov');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = '_modal_ov'; ov.className = 'modal-overlay';
    ov.innerHTML = `<div class="modal" id="_modal"></div>`;
    ov.addEventListener('click', e => { if (e.target === ov) closeModal(); });
    document.body.appendChild(ov);
  }
  document.getElementById('_modal').innerHTML = `<div class="modal-drag"></div>` + html;
  requestAnimationFrame(() => ov.classList.add('open'));
}
function closeModal() {
  const ov = document.getElementById('_modal_ov');
  if (ov) ov.classList.remove('open');
}

// ── NFT HELPERS ───────────────────────────────────────
function nftImgHtml(nft, cls = '') {
  // Фото-NFT с аурой (plush и тд) — PNG с прозрачностью + красивый фон
  if (nft.isPhoto) {
    const aura = nft.auraColor || '#fbbf24';
    // Яркий насыщенный фон под персонажем
    const bg = nft.darkBg ? '#000' : `radial-gradient(ellipse at 50% 70%, ${aura}55 0%, ${aura}22 45%, #080814 100%)`;
    return `<div class="nft-photo-wrap ${cls}${nft.darkBg ? ' dark-bg-wrap' : ''}" style="--aura:${aura};background:${bg}">
      <div class="nft-photo-glow" style="background:${aura}"></div>
      <div class="nft-photo-particles">
        ${[...Array(8)].map((_,i) => `<div class="nft-particle" style="--i:${i};--c:${aura}"></div>`).join('')}
      </div>
      <img src="${nft.photoSrc}" class="nft-photo-img${nft.darkBg ? ' dark-bg-photo' : ''}" loading="lazy"
        onerror="this.style.opacity='.3'">
    </div>`;
  }
  // Обычный SVG
  if (nft.img) return `<img src="${nft.img}" class="nft-img ${cls}" loading="lazy">`;
  return `<div class="nft-img-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="3"/></svg></div>`;
}

// Получить URL превью для любого NFT (для рулетки, списков и тд)
function nftPreviewSrc(nft) {
  if (!nft) return '';
  if (nft.isPhoto) return nft.photoSrc || '';
  return nft.img || '';
}

// Для модалки — квадратная обёртка с аурой, без доп фона
function nftModalImgHtml(nft) {
  if (nft.isPhoto) {
    const aura = nft.auraColor || '#fbbf24';
    const bg = `radial-gradient(ellipse at 50% 60%, ${aura}33 0%, ${aura}11 40%, #0a0a14 100%)`;
    return `<div class="nft-photo-wrap modal-photo-wrap" style="--aura:${aura};background:${bg}">
      <div class="nft-photo-glow" style="background:${aura}"></div>
      <div class="nft-photo-particles">
        ${[...Array(8)].map((_,i) => `<div class="nft-particle" style="--i:${i};--c:${aura}"></div>`).join('')}
      </div>
      <img src="${nft.photoSrc}" class="nft-photo-img" loading="lazy">
    </div>`;
  }
  return `<div class="modal-nft-wrap"><img src="${nft.img||''}" class="modal-nft-img" onerror="this.style.opacity='.3'"></div>`;
}

const RSHORT = { Common:'C', Rare:'R', Epic:'E', Legendary:'L' };

function nftCardHtml(id, n, extra = '') {
  return `
    <div class="nft-card rarity-${n.rarity}" onclick="openNftModal(${id})">
      <div class="nft-card-badge badge-${n.rarity}">${RSHORT[n.rarity]}</div>
      ${nftImgHtml(n)}
      <div class="nft-body">
        <div class="nft-name">${n.name}</div>
        <div class="nft-rarity">${n.rarity}</div>
        <div class="nft-price">${n.price.toLocaleString()} TC</div>
        ${extra}
      </div>
    </div>`;
}

// ── HOME ──────────────────────────────────────────────
function renderHome() {
  const el = document.getElementById('screen-home');
  const total = Object.keys(NFTS).length;
  const leg   = Object.values(NFTS).filter(n => n.rarity === 'Legendary').length;

  el.innerHTML = `
    <div class="home-hero">
      <div class="home-hero-badge">NFT Marketplace</div>
      <div class="home-title">TIDE<span>BOT</span></div>
      <div class="home-sub">Collect · Trade · Upgrade</div>
    </div>

    <div class="balance-card">
      <div class="balance-left">
        <div class="balance-label">Твой баланс</div>
        <div class="balance-amount">${state.balance.toLocaleString()}</div>
        <div class="balance-currency">T COINS</div>
      </div>
      <div class="balance-icon">💰</div>
    </div>

    <button class="btn-deposit" onclick="openDepositModal()">⭐ Пополнить через Stars</button>

    <div class="home-stats">
      <div class="home-stat">
        <div class="home-stat-val">${total}</div>
        <div class="home-stat-lbl">NFT в маркете</div>
      </div>
      <div class="home-stat">
        <div class="home-stat-val">${state.inventory.length}</div>
        <div class="home-stat-lbl">У тебя</div>
      </div>
      <div class="home-stat">
        <div class="home-stat-val">${leg}</div>
        <div class="home-stat-lbl">Legendary</div>
      </div>
    </div>

    <div class="home-search-wrap">
      <div class="home-search-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      </div>
      <input class="home-search" id="home-search-input" type="text"
        placeholder="Найти NFT по названию..."
        value="${state.homeSearch || ''}"
        oninput="onHomeSearch(this.value)" autocomplete="off"/>
    </div>

    <div id="home-search-results" style="display:${state.homeSearch ? 'block' : 'none'}; padding:0 16px 20px"></div>

    <div id="home-featured" style="display:${state.homeSearch ? 'none' : 'block'}">
      <div class="home-cta-row">
        <div class="home-cta-card" onclick="showScreen('market')">
          <div class="home-cta-icon">🛒</div>
          <div class="home-cta-title">Маркет</div>
          <div class="home-cta-sub">Купить NFT</div>
        </div>
        <div class="home-cta-card" onclick="showScreen('list')">
          <div class="home-cta-icon">📤</div>
          <div class="home-cta-title">Выставить</div>
          <div class="home-cta-sub">Продать своё</div>
        </div>
        <div class="home-cta-card" onclick="showScreen('upgrade')">
          <div class="home-cta-icon">⚡</div>
          <div class="home-cta-title">Апгрейд</div>
          <div class="home-cta-sub">Крути колесо</div>
        </div>
      </div>
      ${state.stock.length ? `
        <div class="section-head" style="margin-top:18px">
          <div class="section-label">📦 Сток от бота</div>
          <div class="section-count">${state.stock.length} шт</div>
        </div>
        <div class="nft-row">
          ${state.stock.map(s => {
            const n = NFTS[s.nft_id];
            if (!n) return '';
            return `
              <div class="nft-card rarity-${n.rarity}" onclick="openStockModal(${s.id})">
                <div class="nft-card-badge badge-${n.rarity}">${RSHORT[n.rarity]}</div>
                ${nftImgHtml(n)}
                <div class="nft-body">
                  <div class="nft-name">${n.name}</div>
                  <div class="nft-seller">📦 ${s.seller_name}</div>
                  <div class="nft-price">${s.price.toLocaleString()} TC</div>
                </div>
              </div>`;
          }).join('')}
        </div>
      ` : ''}
    </div>
    <div style="height:20px"></div>
  `;

  if (state.homeSearch) onHomeSearch(state.homeSearch, false);
}

function onHomeSearch(val, updateState = true) {
  if (updateState) state.homeSearch = val.trim();
  const resEl  = document.getElementById('home-search-results');
  const featEl = document.getElementById('home-featured');
  if (!state.homeSearch) {
    if (resEl)  resEl.style.display  = 'none';
    if (featEl) featEl.style.display = 'block';
    return;
  }
  const q = state.homeSearch.toLowerCase();
  const found = Object.entries(NFTS).filter(([,n]) => n.name.toLowerCase().includes(q));
  if (featEl) featEl.style.display = 'none';
  if (resEl)  resEl.style.display  = 'block';
  if (!resEl) return;
  if (!found.length) { resEl.innerHTML = `<div class="search-empty">Ничего не найдено 😕</div>`; return; }
  resEl.innerHTML = `
    <div class="search-count">${found.length} результат${found.length < 2 ? '' : found.length < 5 ? 'а' : 'ов'}</div>
    <div class="nft-grid">${found.map(([id,n]) => nftCardHtml(id,n)).join('')}</div>`;
}

// ── STOCK MODAL ───────────────────────────────────────
function openStockModal(stockId) {
  const s = state.stock.find(x => x.id === stockId);
  if (!s) return;
  const n = NFTS[s.nft_id];
  if (!n) return;
  const sellerName = s.seller_name === 'STOCK' ? 'STOCK' : s.seller_name;
  openModal(`
    ${nftModalImgHtml(n)}
    <div class="modal-title">${n.name}</div>
    <div class="modal-center"><span class="rarity-tag tag-${n.rarity}">${n.rarity}</span></div>

    <div class="seller-badge">📦 Продавец: <b>${sellerName}</b></div>
    <div class="stat-row">
      <div class="stat-box"><div class="stat-val">${s.price.toLocaleString()}</div><div class="stat-lbl">TC цена</div></div>
      <div class="stat-box"><div class="stat-val">${n.sell} ⭐</div><div class="stat-lbl">Stars вывод</div></div>
    </div>
    <button class="btn-primary" onclick="buyStockNft(${stockId}, ${s.nft_id}, ${s.price})">Купить за ${s.price.toLocaleString()} TC</button>
    <button class="btn-secondary" onclick="closeModal()">Закрыть</button>
  `);
}

async function buyStockNft(stockId, nftId, price) {
  if (state.balance < price) { toast('Недостаточно T Coins', 'error'); return; }
  try {
    const res = await apiPost('/buy_stock', { stock_id: stockId });
    if (res.ok) {
      state.balance   = res.balance;
      state.inventory = res.inventory;
      state.stock     = state.stock.filter(s => s.id !== stockId);
      saveState();
      renderHome(); renderInventory();
      closeModal();
      toast(`${NFTS[nftId]?.name} куплен!`, 'success');
    } else { toast(res.error || 'Ошибка', 'error'); }
  } catch {
    // fallback
    state.balance -= price;
    state.inventory.push({ inv_id: Date.now(), nft_id: nftId });
    state.stock = state.stock.filter(s => s.id !== stockId);
    renderHome(); renderInventory();
    closeModal();
    toast(`${NFTS[nftId]?.name} куплен!`, 'success');
  }
}

// ── MARKET ────────────────────────────────────────────
function renderMarket() {
  const el = document.getElementById('screen-market');
  const filters = ['All','Common','Rare','Legendary'];
  const q = (state.marketSearch || '').toLowerCase();

  const allItems = [];

  // 1. Сток от бота — STOCK badge
  state.stock.forEach(s => {
    const n = NFTS[s.nft_id]; if (!n) return;
    const rarityOk = state.marketFilter === 'All' || n.rarity === state.marketFilter;
    const searchOk = !q || n.name.toLowerCase().includes(q);
    if (rarityOk && searchOk) allItems.push({ type:'stock', s, n });
  });

  // 2. Публичные листинги от юзеров — с пометкой продавца
  (state.publicListings || []).forEach(l => {
    const n = NFTS[l.nft_id]; if (!n) return;
    const rarityOk = state.marketFilter === 'All' || n.rarity === state.marketFilter;
    const searchOk = !q || n.name.toLowerCase().includes(q);
    if (rarityOk && searchOk) allItems.push({ type:'user_listing', l, n });
  });


  el.innerHTML = `
    <div class="screen-header">Маркет</div>
    <div class="market-search-wrap">
      <div class="home-search-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></div>
      <input class="home-search" type="text" placeholder="Поиск NFT..." value="${state.marketSearch || ''}"
        oninput="onMarketSearch(this.value)" autocomplete="off"/>
    </div>
    <div class="filter-row">
      ${filters.map(f => `<div class="chip ${state.marketFilter===f?'active-'+f:''}" onclick="setFilter('${f}')">${f==='All'?'Все':f}</div>`).join('')}
    </div>
    <div class="nft-grid">
      ${allItems.length ? allItems.map(item => {
        if (item.type === 'stock') {
          const { s, n } = item;
          return `
            <div class="nft-card rarity-${n.rarity}" onclick="openStockModal(${s.id})">
              <div class="nft-card-badge badge-${n.rarity}">${RSHORT[n.rarity]}</div>
              <div class="nft-seller-badge stock-badge">📦 STOCK</div>
              ${nftImgHtml(n)}
              <div class="nft-body">
                <div class="nft-name">${n.name}</div>
                <div class="nft-seller">📦 ${s.seller_name}</div>
                <div class="nft-price">${s.price.toLocaleString()} TC</div>
              </div>
            </div>`;
        }
        if (item.type === 'user_listing') {
          const { l, n } = item;
          const seller = l.username ? '@' + l.username : 'ID:' + l.user_id;
          return `
            <div class="nft-card rarity-${n.rarity}" onclick="openUserListingModal(${l.id})">
              <div class="nft-card-badge badge-${n.rarity}">${RSHORT[n.rarity]}</div>
              <div class="nft-seller-badge user-badge">👤 ${seller}</div>
              ${nftImgHtml(n)}
              <div class="nft-body">
                <div class="nft-name">${n.name}</div>
                <div class="nft-seller">👤 ${seller}</div>
                <div class="nft-price">${l.price.toLocaleString()} TC</div>
              </div>
            </div>`;
        }
        const { id, n } = item;
        return nftCardHtml(id, n);
      }).join('') : '<div class="search-empty" style="grid-column:1/-1">Ничего не найдено 😕</div>'}
    </div>`;
}

function setFilter(f) { state.marketFilter = f; renderMarket(); }
function onMarketSearch(v) { state.marketSearch = v; renderMarket(); }

// Модалка для листинга от юзера
function openUserListingModal(listingId) {
  const l = (state.publicListings || []).find(x => x.id === listingId);
  if (!l) return;
  const n = NFTS[l.nft_id]; if (!n) return;
  const seller = l.username ? '@' + l.username : 'ID:' + l.user_id;
  openModal(`
    ${nftModalImgHtml(n)}
    <div class="modal-title">${n.name}</div>
    <div class="modal-center"><span class="rarity-tag tag-${n.rarity}">${n.rarity}</span></div>

    <div class="seller-badge">👤 Продавец: <b>${seller}</b></div>
    <div class="stat-row">
      <div class="stat-box"><div class="stat-val">${l.price.toLocaleString()}</div><div class="stat-lbl">TC цена</div></div>
      <div class="stat-box"><div class="stat-val">${n.sell} ⭐</div><div class="stat-lbl">Stars вывод</div></div>
    </div>
    <button class="btn-primary" onclick="buyUserListing(${listingId}, ${l.nft_id}, ${l.price})">Купить за ${l.price.toLocaleString()} TC</button>
    <button class="btn-secondary" onclick="closeModal()">Закрыть</button>
  `);
}

async function buyUserListing(listingId, nftId, price) {
  if (state.balance < price) { toast('Недостаточно T Coins', 'error'); return; }
  try {
    const res = await apiPost('/buy_listing', { listing_id: listingId });
    if (res.ok) {
      state.balance = res.balance; state.inventory = res.inventory;
      state.publicListings = (state.publicListings||[]).filter(l => l.id !== listingId);
      saveState();
      renderHome(); renderInventory(); closeModal();
      toast(`${NFTS[nftId]?.name} куплен!`, 'success');
    } else toast(res.error || 'Ошибка', 'error');
  } catch {
    state.balance -= price;
    state.inventory.push({ inv_id: Date.now(), nft_id: nftId });
    state.publicListings = (state.publicListings||[]).filter(l => l.id !== listingId);
    renderHome(); renderInventory(); closeModal();
    toast(`${NFTS[nftId]?.name} куплен!`, 'success');
  }
}

// ── NFT MODAL ─────────────────────────────────────────
function openNftModal(id) {
  const n = NFTS[id];
  openModal(`
    ${nftModalImgHtml(n)}
    <div class="modal-title">${n.name}</div>
    <div class="modal-center"><span class="rarity-tag tag-${n.rarity}">${n.rarity}</span></div>

    <div class="seller-badge">🏪 Продавец: <b>TIDE BOT</b></div>
    <div class="stat-row">
      <div class="stat-box"><div class="stat-val">${n.price.toLocaleString()}</div><div class="stat-lbl">TC цена</div></div>
      <div class="stat-box"><div class="stat-val">${n.sell} ⭐</div><div class="stat-lbl">Stars вывод</div></div>
    </div>
    <button class="btn-primary" onclick="buyNft(${id})">Купить за ${n.price.toLocaleString()} TC</button>
    <button class="btn-secondary" onclick="closeModal()">Закрыть</button>
  `);
}

async function buyNft(id) {
  const n = NFTS[id];
  if (state.balance < n.price) { toast('Недостаточно T Coins', 'error'); return; }
  try {
    const res = await apiPost('/buy', { nft_id: id });
    if (res.ok) {
      state.balance = res.balance; state.inventory = res.inventory;
      saveState();
      renderHome(); renderInventory(); renderUpgrade(); closeModal();
      toast(`${n.name} куплен!`, 'success');
    } else toast(res.error || 'Ошибка', 'error');
  } catch {
    state.balance -= n.price;
    state.inventory.push({ inv_id: Date.now(), nft_id: parseInt(id) });
    renderHome(); renderInventory(); renderUpgrade(); closeModal();
    toast(`${n.name} куплен!`, 'success');
  }
}

// ── INVENTORY ─────────────────────────────────────────
function renderInventory() {
  const el = document.getElementById('screen-inv');
  if (!state.inventory.length) {
    el.innerHTML = `
      <div class="screen-header">Инвентарь</div>
      <div class="inv-empty">
        <div class="inv-empty-icon">🎒</div>
        <div class="inv-empty-text">Инвентарь пустой<br>Купи <span>NFT</span> в маркете</div>
      </div>`;
    return;
  }
  el.innerHTML = `
    <div class="screen-header">Инвентарь (${state.inventory.length})</div>
    <div class="nft-grid">
      ${state.inventory.map(item => {
        const n = NFTS[item.nft_id]; if (!n) return '';
        const isPending = state.pendingWithdraws.includes(item.inv_id);
        return `
          <div class="nft-card rarity-${n.rarity} ${isPending ? 'nft-pending' : ''}" onclick="openInvModal(${item.inv_id},${item.nft_id})">
            <div class="nft-card-badge badge-${n.rarity}">${RSHORT[n.rarity]}</div>
            ${isPending ? '<div class="nft-pending-badge">⏳ На выводе</div>' : ''}
            ${nftImgHtml(n)}
            <div class="nft-body">
              <div class="nft-name">${n.name}</div>
              <div class="nft-rarity">${n.rarity}</div>
              <div class="nft-price">${isPending ? '⏳ Выводится' : n.sell + ' ⭐'}</div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

function openInvModal(invId, nftId) {
  const n = NFTS[nftId];
  const isPending = state.pendingWithdraws.includes(invId);
  if (isPending) {
    openModal(`
      ${nftModalImgHtml(n)}
      <div class="modal-title">${n.name}</div>
      <div class="modal-center"><span class="rarity-tag tag-${n.rarity}">${n.rarity}</span></div>
      <div class="withdraw-status-badge">
        <div class="withdraw-status-icon">⏳</div>
        <div class="withdraw-status-text">
          <div class="withdraw-status-title">На выводе</div>
          <div class="withdraw-status-sub">Ожидай — Stars придут в ближайшее время</div>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat-box"><div class="stat-val">${n.sell} ⭐</div><div class="stat-lbl">К получению</div></div>
        <div class="stat-box"><div class="stat-val" style="color:var(--text-dim);font-size:14px">На выводе</div><div class="stat-lbl">Статус</div></div>
      </div>
      <button class="btn-secondary" onclick="cancelWithdraw(${invId})">Отменить вывод</button>
      <button class="btn-secondary" style="margin-top:8px" onclick="closeModal()">Закрыть</button>
    `);
    return;
  }
  openModal(`
    ${nftModalImgHtml(n)}
    <div class="modal-title">${n.name}</div>
    <div class="modal-center"><span class="rarity-tag tag-${n.rarity}">${n.rarity}</span></div>

    <div class="stat-row">
      <div class="stat-box"><div class="stat-val">${n.price.toLocaleString()}</div><div class="stat-lbl">TC цена</div></div>
    </div>
    <button class="btn-primary" onclick="closeModal();showScreen('list')">Выставить на продажу</button>
    <button class="btn-primary" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9)" onclick="goUpgrade(${invId})">Апгрейд</button>
    <button class="btn-secondary" onclick="closeModal()">Закрыть</button>
  `);
}

function goUpgrade(invId) {
  // Нельзя апгрейдить если на выводе
  if (state.pendingWithdraws.includes(invId)) {
    toast('NFT на выводе — апгрейд недоступен', 'error');
    return;
  }
  closeModal(); state.upgradeFrom = invId;
  showScreen('upgrade'); renderUpgrade();
}

// Запросить вывод — помечаем NFT как "на выводе"
async function requestWithdraw(invId, nftId) {
  const n = NFTS[nftId];
  closeModal();
  state.pendingWithdraws.push(invId);
  renderInventory();
  toast(`${n.name} отправлен на вывод ⭐`, 'success');
  // Сообщаем серверу
  try {
    await apiPost('/withdraw_request', { inv_id: invId });
  } catch {}
}

// Отменить вывод
async function cancelWithdraw(invId) {
  state.pendingWithdraws = state.pendingWithdraws.filter(id => id !== invId);
  closeModal();
  renderInventory();
  toast('Вывод отменён', '');
  try { await apiPost('/withdraw_cancel', { inv_id: invId }); } catch {}
}

async function sellNft(invId, nftId) {
  const n = NFTS[nftId];
  try {
    const res = await apiPost('/sell', { inv_id: invId });
    if (res.ok) {
      state.balance = res.balance; state.inventory = res.inventory;
      state.pendingWithdraws = state.pendingWithdraws.filter(id => id !== invId);
      saveState();
      renderHome(); renderInventory(); renderUpgrade(); closeModal();
      toast(`Получено ${n.sell} ⭐ Stars!`, 'success');
    } else if (res.no_stars) {
      closeModal(); toast('Нет звёзд в боте. Ожидайте пополнения.', 'error');
    } else toast(res.error || 'Ошибка', 'error');
  } catch {
    state.inventory = state.inventory.filter(i => i.inv_id !== invId);
    state.pendingWithdraws = state.pendingWithdraws.filter(id => id !== invId);
    renderHome(); renderInventory(); renderUpgrade(); closeModal();
    toast(`Получено ${n.sell} ⭐ Stars!`, 'success');
  }
}

// ── LIST ──────────────────────────────────────────────
function renderList() {
  const el = document.getElementById('screen-list');
  const activeListings = state.listings.filter(l => l.status === 'active');
  const listedInvIds   = new Set(activeListings.map(l => l.inv_id));
  const available      = state.inventory.filter(item => !listedInvIds.has(item.inv_id));
  const canList        = activeListings.length < 5;

  el.innerHTML = `
    <div class="screen-header">Выставить на продажу</div>
    <div class="list-info">
      <div class="list-slots">
        <div class="list-slots-label">Слоты</div>
        <div class="list-slots-dots">
          ${[0,1,2,3,4].map(i=>`<div class="list-slot-dot ${i<activeListings.length?'used':''}"></div>`).join('')}
        </div>
        <div class="list-slots-count">${activeListings.length}/5</div>
      </div>
    </div>

    ${!canList ? `<div class="list-limit-warn">⚠️ Максимум 5 активных объявлений. Сними с продажи или дождись продажи.</div>`
    : !available.length ? `<div class="inv-empty"><div class="inv-empty-icon">📦</div><div class="inv-empty-text">Нет доступных NFT<br>Купи в <span>маркете</span></div></div>`
    : `
      <div class="list-step-label">Выбери NFT из инвентаря</div>
      <div class="nft-grid">
        ${available.map(item => {
          const n = NFTS[item.nft_id]; if (!n) return '';
          const sel = state.listSelectedInvId === item.inv_id;
          return `
            <div class="nft-card rarity-${n.rarity} ${sel?'list-selected':''}" onclick="selectListNft(${item.inv_id},${item.nft_id})">
              <div class="nft-card-badge badge-${n.rarity}">${RSHORT[n.rarity]}</div>
              ${nftImgHtml(n)}
              <div class="nft-body">
                <div class="nft-name">${n.name}</div>
                <div class="nft-rarity">${n.rarity}</div>
                <div class="nft-price">${n.price.toLocaleString()} TC</div>
              </div>
            </div>`;
        }).join('')}
      </div>
      <div id="list-price-block" style="display:${state.listSelectedInvId?'block':'none'}; padding-bottom:8px">
        <div class="list-step-label" style="margin-top:16px">Укажи цену продажи (TC)</div>
        <div class="list-price-row">
          <input class="list-price-input" id="list-price-input" type="number"
            placeholder="Например: 5000" min="1"
            value="${state.listPrice||''}" oninput="state.listPrice=this.value"/>
          <button class="btn-list" onclick="submitListing()">Выставить</button>
        </div>
        <div class="list-hint">Рекомендуемая цена: <span>${state.listSelectedNftId ? NFTS[state.listSelectedNftId]?.price.toLocaleString() : '—'} TC</span></div>
      </div>
    `}

    ${activeListings.length > 0 ? `
      <div class="list-active-title">Активные объявления</div>
      <div style="display:flex;flex-direction:column;gap:10px;padding:0 16px 20px">
        ${activeListings.map(l => {
          const n = NFTS[l.nft_id]; if (!n) return '';
          return `
            <div class="listing-row">
              <img src="${n.img}" class="listing-img">
              <div class="listing-info">
                <div class="listing-name">${n.name}</div>
                <div class="listing-price">${l.price.toLocaleString()} TC</div>
                <div class="listing-rar" style="color:var(--${n.rarity.toLowerCase()})">${n.rarity}</div>
              </div>
              <button class="listing-cancel" onclick="cancelListing(${l.id||l.inv_id})">Снять</button>
            </div>`;
        }).join('')}
      </div>` : ''}
  `;
}

function selectListNft(invId, nftId) {
  state.listSelectedInvId = invId;
  state.listSelectedNftId = nftId;
  state.listPrice = NFTS[nftId]?.price || '';
  renderList();
}

async function submitListing() {
  const invId = state.listSelectedInvId;
  const nftId = state.listSelectedNftId;
  const price = parseInt(state.listPrice);
  if (!invId || !nftId) { toast('Выбери NFT', 'error'); return; }
  if (!price || price < 1) { toast('Укажи цену', 'error'); return; }
  if (state.listings.filter(l=>l.status==='active').length >= 5) { toast('Максимум 5 объявлений', 'error'); return; }

  try {
    const res = await apiPost('/list', { inv_id: invId, price });
    if (!res.ok) { toast(res.error || 'Ошибка', 'error'); return; }
    state.listings.push({ id: res.listing_id, inv_id: invId, nft_id: nftId, price, status:'active', listed_at: Date.now() });
  } catch {
    state.listings.push({ id: Date.now(), inv_id: invId, nft_id: nftId, price, status:'active', listed_at: Date.now() });
  }
  state.listSelectedInvId = null; state.listSelectedNftId = null; state.listPrice = '';
  saveState(); renderList(); renderInventory(); renderHome();
  toast(`NFT выставлен за ${price.toLocaleString()} TC!`, 'success');
}

async function cancelListing(listingId) {
  state.listings = state.listings.filter(l => l.id !== listingId && l.inv_id !== listingId);
  try { await apiPost('/unlist', { listing_id: listingId }); } catch {}
  renderList(); renderSales();
  toast('Снято с продажи', '');
}

// ── SALES ─────────────────────────────────────────────
let salesTab = 'active';
function renderSales() {
  const el = document.getElementById('screen-sales');
  const active = state.listings.filter(l => l.status === 'active');
  const sold   = state.listings.filter(l => l.status === 'sold');
  const list   = salesTab === 'active' ? active : sold;

  el.innerHTML = `
    <div class="screen-header">Мои продажи</div>
    <div class="sales-tabs">
      <button class="sales-tab ${salesTab==='active'?'active':''}" onclick="setSalesTab('active')">
        На продаже <span class="sales-tab-count">${active.length}</span>
      </button>
      <button class="sales-tab ${salesTab==='sold'?'active':''}" onclick="setSalesTab('sold')">
        Проданы <span class="sales-tab-count">${sold.length}</span>
      </button>
    </div>
    ${!list.length ? `
      <div class="inv-empty">
        <div class="inv-empty-icon">${salesTab==='active'?'📭':'📦'}</div>
        <div class="inv-empty-text">${salesTab==='active'?'Нет активных объявлений':'Пока нет продаж'}</div>
      </div>` : `
      <div style="display:flex;flex-direction:column;gap:10px;padding:0 16px 24px">
        ${list.map(l => {
          const n = NFTS[l.nft_id]; if (!n) return '';
          const d = l.sold_at ? new Date(l.sold_at) : new Date(l.listed_at);
          const ds = d.toLocaleDateString('ru');
          return `
            <div class="listing-row ${l.status==='sold'?'listing-sold':''}">
              <img src="${n.img}" class="listing-img">
              <div class="listing-info">
                <div class="listing-name">${n.name}</div>
                <div class="listing-price">${l.price.toLocaleString()} TC</div>
                <div class="listing-rar" style="color:var(--${n.rarity.toLowerCase()})">${n.rarity}</div>
                <div class="listing-date">${l.status==='sold'?'✅ Продано':'🟡 На продаже'} · ${ds}</div>
              </div>
              ${l.status==='active'?`<button class="listing-cancel" onclick="cancelListing(${l.id||l.inv_id});renderSales()">Снять</button>`:''}
            </div>`;
        }).join('')}
      </div>`}
  `;
}
function setSalesTab(t) { salesTab = t; renderSales(); }

// ── DEPOSIT ───────────────────────────────────────────
function openDepositModal() {
  openModal(`
    <div class="modal-title" style="margin-bottom:6px">Пополнение баланса</div>
    <div class="modal-desc">1 ⭐ Star = 10 T Coins<br><span style="font-size:11px;color:var(--text-dim)">После оплаты монеты зачислятся автоматически</span></div>
    <div class="deposit-grid">
      ${[10,50,100,250,500,1000].map(s=>`
        <div class="dep-opt" onclick="depositStars(${s})">
          <div class="dep-stars">${s} ⭐</div>
          <div class="dep-coins">${(s*10).toLocaleString()} T Coins</div>
        </div>`).join('')}
    </div>
    <button class="btn-secondary" onclick="closeModal()">Отмена</button>
  `);
}

async function depositStars(stars) {
  closeModal();
  // Пробуем создать инвойс через сервер
  try {
    const res = await apiPost('/deposit/invoice', { stars });
    if (res.ok) {
      toast('Инвойс отправлен в чат с ботом ⭐', 'success');
    } else {
      // Fallback — sendData чтобы бот сам создал инвойс
      if (tg) {
        tg.sendData(JSON.stringify({ action: 'deposit', stars }));
        toast('Открой чат с ботом для оплаты', '');
      } else {
        toast('Открой в Telegram', 'error');
      }
    }
  } catch {
    if (tg) {
      tg.sendData(JSON.stringify({ action: 'deposit', stars }));
    }
  }
}

// ── UPGRADE ───────────────────────────────────────────
// Апгрейд БЕСПЛАТНЫЙ.
// Ставка (upgradeBet TC) — повышает целевой NFT и шанс.
// Слайдер от 0 до баланса. Ставка списывается при победе (или проигрыше — на выбор).

function calcUpgradeTarget() {
  const fromIds = (state.upgradeFromIds && state.upgradeFromIds.length > 0) ? state.upgradeFromIds : (state.upgradeFromId ? [state.upgradeFromId] : []);
  if (!fromIds.length) return { targetId: null, targetNft: null, chance: 0 };
  const fromNfts = fromIds.map(id => { const inv = state.inventory.find(i => i.inv_id === id); return inv ? NFTS[inv.nft_id] : null; }).filter(Boolean);
  if (!fromNfts.length) return { targetId: null, targetNft: null, chance: 0 };
  const fromNft = { price: fromNfts.reduce((s, n) => s + n.price, 0), name: fromNfts.map(n => n.name).join(" + ") };
  const bet = state.upgradeBet || 0;

  // Шансы СЫ — не зависят от того какой NFT найден
  let minMult, baseChance;
  if      (bet >= fromNft.price * 4) { minMult = 4.0; baseChance = 10; }
  else if (bet >= fromNft.price * 3) { minMult = 3.0; baseChance = 20; }
  else if (bet >= fromNft.price * 2) { minMult = 2.0; baseChance = 35; }
  else if (bet >= fromNft.price)     { minMult = 1.5; baseChance = 50; }
  else                               { minMult = 1.1; baseChance = 75; }

  const minPrice = fromNft.price * minMult;

  // щем ближайший NFT дороже minPrice
  let bestId = null, bestNft = null, bestDiff = Infinity;
  Object.entries(NFTS).forEach(([id, n]) => {
    if (parseInt(id) === state.upgradeFromId) return;
    if (n.price < minPrice) return;
    const diff = n.price - minPrice;
    if (diff < bestDiff) { bestDiff = diff; bestId = parseInt(id); bestNft = n; }
  });

  return { targetId: bestId, targetNft: bestNft, chance: baseChance };
}

function renderUpgrade() {
  const el  = document.getElementById('screen-upgrade');
  const inv = state.inventory;
  // ля мульти — суммируем цены
  const _fromIds = (state.upgradeFromIds && state.upgradeFromIds.length > 0) ? state.upgradeFromIds : (state.upgradeFromId ? [state.upgradeFromId] : []);
  const _fromNfts = _fromIds.map(id => { const invItem = state.inventory.find(i => i.inv_id === id); return invItem ? NFTS[invItem.nft_id] : null; }).filter(Boolean);
  const fromNft = _fromNfts.length > 0 ? { price: _fromNfts.reduce((s,n)=>s+n.price,0), name: _fromNfts.map(n=>n.name).join(" + "), rarity: _fromNfts[0].rarity } : NFTS[state.upgradeFromId];
  const bet = state.upgradeBet || 0;
  const { targetId, targetNft, chance } = calcUpgradeTarget();
  state.upgradeTo     = targetId;
  state.upgradeChance = chance;
  state.upgradeCost   = 0;
  const maxBet = fromNft ? Math.min(state.balance, fromNft.price * 4) : 0;
  const chanceColor = chance >= 50 ? '#22c55e' : chance >= 25 ? '#f59e0b' : '#ef4444';

  el.innerHTML = `
    <div class="upgrade-wrap">
      <div class="upgrade-title">Апгрейд</div>
      <div class="upgrade-sub">Крути бесплатно. Ставка повышает цель и шанс.</div>

      <div class="upg-step-label"><span>1</span> Выбери свой NFT</div>
      <div class="upg-my-row">
        ${!inv.length
          ? '<div style="color:var(--text-dim);font-size:13px;padding:8px">Нет NFT. Купи в маркете!</div>'
          : inv.map(item => {
              const n = NFTS[item.nft_id]; if (!n) return '';
              const isPending = state.pendingWithdraws.includes(item.inv_id);
              const sel = state.upgradeFromIds && state.upgradeFromIds.includes(item.inv_id);
              return `<div class="upg-my-card ${sel?'selected':''} ${isPending?'upg-locked':''}"
                onclick="${isPending?`toast('NFT на выводе','error')`:`toggleUpgFrom(${item.inv_id},${item.nft_id})`}">
                ${nftImgHtml(n)}
                <div class="upg-my-name">${n.name}</div>
                <div class="upg-my-price">${isPending ? '⏳ Вывод' : n.price.toLocaleString()+' TC'}</div>
              </div>`;
            }).join('')
        }
      </div>

      <div style="display:${fromNft ? 'block' : 'none'}">
        <!-- Ставка -->
        <div class="upg-chance-row">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px">
            <div class="upg-chance-label">Ставка</div>
            <div style="font-size:18px;font-weight:900;color:var(--gold2)">${bet.toLocaleString()} TC</div>
          </div>
          <!-- Быстрые пресеты X2/X3/X4 -->
          <div class="upg-mult-btns" style="margin-bottom:12px">
            <button class="upg-mult ${bet===0?'active':''}" onclick="onBetChange(0)">
              Без<span>75%</span>
            </button>
            <button class="upg-mult ${fromNft && bet===fromNft.price?'active':''}" onclick="onBetChange(${fromNft ? fromNft.price : 0})">
              X2<span>50%</span>
            </button>
            <button class="upg-mult ${fromNft && bet===fromNft.price*2?'active':''}" onclick="onBetChange(${fromNft ? fromNft.price*2 : 0})">
              X3<span>35%</span>
            </button>
            <button class="upg-mult ${fromNft && bet===fromNft.price*3?'active':''}" onclick="onBetChange(${fromNft ? fromNft.price*3 : 0})">
              X4<span>20%</span>
            </button>
            <button class="upg-mult ${fromNft && bet===fromNft.price*4?'active':''}" onclick="onBetChange(${fromNft ? fromNft.price*4 : 0})">
              X5<span>10%</span>
            </button>
          </div>
          <input type="range" class="upg-slider" id="upg-bet-slider"
            min="0" max="${maxBet}" step="${Math.max(50, Math.floor(maxBet/100))}"
            value="${bet}" oninput="onBetChange(this.value)">
          <div style="display:flex;justify-content:space-between;margin-top:6px">
            <span style="font-size:10px;color:var(--text-dim)">0 — бесплатно</span>
            <span style="font-size:10px;color:var(--text-dim)">${maxBet.toLocaleString()} TC макс</span>
          </div>
          <div style="font-size:11px;color:var(--text-dim);margin-top:6px">
            ${bet > 0 ? 'Ставка списывается при любом исходе' : 'Без ставки — базовый шанс'}
          </div>
        </div>

        <!-- Цель + шанс -->
        <div style="display:${targetNft ? 'block' : 'none'}">
          <div class="upg-step-label"><span>2</span> Цель апгрейда</div>
          <div class="upg-target-card">
            <img src="${targetNft ? targetNft.img : ''}" style="width:60px;height:60px;border-radius:12px;object-fit:cover;flex-shrink:0">
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:800;color:var(--text)">${targetNft ? targetNft.name : ''}</div>
              <div style="font-size:11px;font-weight:700;color:var(--${targetNft ? targetNft.rarity.toLowerCase() : 'text-dim'})">${targetNft ? targetNft.rarity : ''}</div>
              <div style="font-size:12px;color:var(--gold);margin-top:2px">${targetNft ? targetNft.price.toLocaleString()+' TC' : ''}</div>
            </div>
            <div style="text-align:center;flex-shrink:0">
              <div style="font-size:28px;font-weight:900;color:${chanceColor};line-height:1">${chance}%</div>
              <div style="font-size:10px;color:var(--text-dim);margin-top:2px">шанс</div>
            </div>
          </div>
        </div>

        <!-- Колесо -->
        <div class="wheel-container" id="wheel-container" style="display:${targetNft ? 'block' : 'none'}">
          <canvas id="wheel-canvas" width="280" height="280"></canvas>
          <div class="wheel-arrow" id="wheel-arrow"></div>
          <div class="wheel-result" id="wheel-result"></div>
        </div>

        <button class="btn-primary" id="upg-spin-btn" style="display:${targetNft ? 'block' : 'none'}" onclick="spinWheel()">
          ${bet > 0 ? `Крутить (ставка ${bet.toLocaleString()} TC)` : 'Крутить бесплатно'}
        </button>
      </div>
    </div>`;

  if (targetNft) drawWheel();
}

function onBetChange(val) {
  state.upgradeBet = parseInt(val) || 0;
  renderUpgrade();
}

function selectUpgFrom(invId, nftId) {
  state.upgradeFrom   = invId;
  state.upgradeFromId = nftId;
  state.upgradeTo     = null;
  state.upgradeChance = 50;
  state.upgradeBet    = 0;
  renderUpgrade();

// ереключить выбор NFT для апгрейда (мульти)
function toggleUpgFrom(invId, nftId) {
  // роверка на листинг
  const isListed = state.listings.some(l => l.inv_id === invId && l.status === "active");
  if (isListed) { toast("NFT на продаже — сними с продажи", "error"); return; }
  if (!state.upgradeFromIds) state.upgradeFromIds = [];
  const idx = state.upgradeFromIds.indexOf(invId);
  if (idx >= 0) {
    state.upgradeFromIds.splice(idx, 1);
  } else {
    if (state.upgradeFromIds.length >= 3) { toast("аксимум 3 NFT", "error"); return; }
    state.upgradeFromIds.push(invId);
  }
  // upgradeFrom = первый выбранный (для совместимости)
  state.upgradeFrom   = state.upgradeFromIds[0] || null;
  state.upgradeFromId = state.upgradeFromIds[0]
    ? (state.inventory.find(i => i.inv_id === state.upgradeFromIds[0])?.nft_id || null)
    : null;
  state.upgradeTo = null; state.upgradeChance = 50; state.upgradeBet = 0;
  renderUpgrade();
}

// Старые функции оставляем пустышками чтобы не сломать spinWheel
function updateMultPrices() {}
function setMult(mult) {}
function onChanceChange(val) {}

function updateChanceUI() {
  // Всё считается в renderUpgrade через calcUpgradeTarget
  state.upgradeCost = 0;
}

function drawWheel() {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const outerR = cx - 14;
  const innerR = outerR - 28; // толщина дуги
  const chance = (state.upgradeChance || 50) / 100;

  ctx.clearRect(0, 0, W, H);

  // ── Фон круга ──
  ctx.beginPath();
  ctx.arc(cx, cy, outerR + 2, 0, Math.PI * 2);
  ctx.fillStyle = '#0e0e1e';
  ctx.fill();

  // ── Засечки по кругу ──
  ctx.save();
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const r1 = outerR + 4;
    const r2 = outerR + 9;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = i % 5 === 0 ? 2 : 1;
    ctx.stroke();
  }
  ctx.restore();

  // ── Тёмная дуга (проигрыш — правая часть) ──
  // Начало: верх (-π/2), цветная часть = chance * 2π идёт от верха против часовой
  // Верх = -π/2. Цветная зона начинается сверху и идёт по часовой на chance * 2π
  const startAngle = -Math.PI / 2;
  const colorEnd   = startAngle + chance * Math.PI * 2;

  // Тёмная дуга (оставшаяся часть)
  ctx.beginPath();
  ctx.arc(cx, cy, (outerR + innerR) / 2, colorEnd, startAngle + Math.PI * 2);
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = outerR - innerR;
  ctx.stroke();

  // ── Цветной градиент дуги: зелёный→жёлтый→красный ──
  // Рисуем по сегментам для градиента
  const arcSteps = Math.max(2, Math.round(chance * 120));
  for (let i = 0; i < arcSteps; i++) {
    const t  = i / arcSteps;
    const t1 = (i + 1) / arcSteps;
    const a1 = startAngle + t  * chance * Math.PI * 2;
    const a2 = startAngle + t1 * chance * Math.PI * 2;

    // Цвет: 0=красный, 0.5=жёлтый, 1=зелёный
    const hue = t * 120; // 0=red, 60=yellow, 120=green
    const clr = `hsl(${hue}, 100%, 50%)`;

    ctx.beginPath();
    ctx.arc(cx, cy, (outerR + innerR) / 2, a1, a2);
    ctx.strokeStyle = clr;
    ctx.lineWidth = outerR - innerR;
    ctx.stroke();
  }

  // ── Свечение на цветной дуге ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, (outerR + innerR) / 2, startAngle, colorEnd);
  ctx.strokeStyle = 'rgba(100,255,100,0.08)';
  ctx.lineWidth = outerR - innerR + 12;
  ctx.filter = 'blur(6px)';
  ctx.stroke();
  ctx.filter = 'none';
  ctx.restore();

  // ── Разделительные точки на стыках ──
  [[startAngle, '#22c55e'], [colorEnd, '#ef4444']].forEach(([a, clr]) => {
    ctx.beginPath();
    ctx.arc(
      cx + Math.cos(a) * (outerR + innerR) / 2,
      cy + Math.sin(a) * (outerR + innerR) / 2,
      4, 0, Math.PI * 2
    );
    ctx.fillStyle = clr;
    ctx.fill();
  });

  // ── Метки 0% 50% 100% ──
  ctx.save();
  ctx.font = 'bold 10px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labelR = outerR + 18;
  const labels = [
    { a: startAngle,              text: '100%', clr: '#22c55e' },
    { a: startAngle + Math.PI,    text: '0%',   clr: '#ef4444' },
    { a: startAngle + Math.PI/2,  text: '50%',  clr: '#f59e0b' },
    { a: startAngle - Math.PI/2,  text: '50%',  clr: '#f59e0b' },
  ];
  labels.forEach(({ a, text, clr }) => {
    ctx.fillStyle = clr;
    ctx.fillText(text, cx + Math.cos(a) * labelR, cy + Math.sin(a) * labelR);
  });
  ctx.restore();

  // ── Центр: тёмный круг ──
  ctx.beginPath();
  ctx.arc(cx, cy, innerR - 4, 0, Math.PI * 2);
  ctx.fillStyle = '#06060f';
  ctx.fill();

  // ── Стрелка вверх/вниз в центре (статичная) ──
  ctx.save();
  ctx.translate(cx, cy);
  // Стрелка вверх (указатель)
  const aw = 14, ah = 20;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  // верхний треугольник
  ctx.beginPath();
  ctx.moveTo(0, -(innerR - 12));
  ctx.lineTo(-aw/2, -(innerR - 12) + ah);
  ctx.lineTo(aw/2,  -(innerR - 12) + ah);
  ctx.closePath();
  ctx.fill();
  // нижний треугольник
  ctx.beginPath();
  ctx.moveTo(0, innerR - 12);
  ctx.lineTo(-aw/2, innerR - 12 - ah);
  ctx.lineTo(aw/2,  innerR - 12 - ah);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── % в центре ──
  const pct = Math.round(chance * 100);
  ctx.save();
  ctx.font = `bold ${pct >= 100 ? 28 : 32}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Цвет процента: зелёный если высокий, жёлтый средний, красный низкий
  const hue = chance * 120;
  ctx.fillStyle = `hsl(${hue}, 100%, 55%)`;
  ctx.fillText(pct + '%', cx, cy - 10);
  // Подпись
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  const label = pct >= 60 ? 'ВЫСОКИЙ ШАНС' : pct >= 30 ? 'СРЕДНИЙ ШАНС' : 'НИЗКИЙ ШАНС';
  ctx.fillText(label, cx, cy + 12);
  ctx.restore();
}

function drawArrow(angleDeg) {
  const arrow = document.getElementById('wheel-arrow');
  if (!arrow) return;
  arrow.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg)`;
}

async function spinWheel() {
  if(state.spinning) return;
  if(!state.upgradeFrom||!state.upgradeTo){toast('Выбери NFT и множитель!','error');return;}
  // Проверяем что не на выводе
  if(state.pendingWithdraws.includes(state.upgradeFrom)){toast('NFT на выводе — апгрейд недоступен','error');return;}
  const cost=state.upgradeCost||0;
  if(state.balance<cost){toast(`Нужно ${cost.toLocaleString()} TC`,'error');return;}
  state.spinning=true;
  const btn=document.getElementById('upg-spin-btn'), res=document.getElementById('wheel-result');
  if(btn) btn.disabled=true;
  if(res){res.textContent='';res.className='wheel-result';}
  let won=false;
  try {
    const r = await apiPost('/upgrade', {inv_id:state.upgradeFrom, to_id:state.upgradeTo, chance:state.upgradeChance, cost:state.upgradeBet||0});
    won = r.ok === true;
    if (r.error) toast(r.error, 'error');
    if (r.balance !== undefined) state.balance = r.balance;
    if (r.inventory) state.inventory = r.inventory;
    saveState(); renderHome(); renderInventory();
  } catch(e) {
    console.log('[UPG catch]', e);
    won = Math.random() * 100 < (state.upgradeChance || 50);
    if (state.upgradeBet > 0) state.balance -= state.upgradeBet;
    state.inventory = state.inventory.filter(i => i.inv_id !== state.upgradeFrom);
    if (won) state.inventory.push({inv_id: Date.now(), nft_id: state.upgradeTo});
    saveState(); renderHome(); renderInventory();
  }

  const chance=(state.upgradeChance||50)/100;
  // Цветная зона: от -90° (верх) до -90° + chance*360°
  // Победа = попасть в цветную зону, поражение = в тёмную
  const colorZoneDeg = chance * 360;
  // Стрелка идёт от 0° и должна остановиться в нужной зоне
  // Победа: 0..colorZoneDeg (по часовой от верха), Проигрыш: colorZoneDeg..360
  const fullRots = (4 + Math.floor(Math.random()*3)) * 360;
  let stopDeg;
  if (won) {
    // В цветной зоне, отступ 5° от краёв
    stopDeg = 5 + Math.random() * Math.max(1, colorZoneDeg - 10);
  } else {
    // В тёмной зоне
    const darkSize = 360 - colorZoneDeg;
    stopDeg = colorZoneDeg + 5 + Math.random() * Math.max(1, darkSize - 10);
  }
  const finalDeg = fullRots + stopDeg;
  const t0 = performance.now(), dur = 4000;
  const toNft = NFTS[state.upgradeTo];

  function anim(now) {
    const p = Math.min((now-t0)/dur, 1);
    const ease = 1 - Math.pow(1-p, 4);
    drawArrow(ease * finalDeg);
    if(p<1){requestAnimationFrame(anim);return;}
    drawArrow(stopDeg);
    state.spinning=false;
    if(btn) btn.disabled=false;
    if(res){
      res.textContent=won?`🎉 Победа! Получен ${toNft?.name}!`:'💀 Неудача... NFT потерян';
      res.className=`wheel-result ${won?'win':'lose'}`;
      toast(won?'Апгрейд успешен!':'Не повезло', won?'success':'error');
    }
    state.upgradeFrom=null;state.upgradeFromId=null;state.upgradeTo=null;
    renderHome();renderInventory();
    loadUser(); // обновить инвентарь с сервера
    setTimeout(()=>renderUpgrade(),2200);
  }
  requestAnimationFrame(anim);
}

// ── ADMIN ─────────────────────────────────────────────
let adminTab = 'stats';

function renderAdmin() {
  if (!state.isAdmin) {
    document.getElementById('screen-admin').innerHTML = `<div class="inv-empty"><div class="inv-empty-icon">🔒</div><div class="inv-empty-text">Нет доступа</div></div>`;
    return;
  }
  const el = document.getElementById('screen-admin');
  const tabLabels = {
    stats:      'Статистика',
    users:      'Юзеры',
    give_nft:   'Выдать NFT',
    give_coins: 'Монеты',
    stars:      'Звёзды',
    stock:      'Сток'
  };
  el.innerHTML = `
    <div class="screen-header">Админ панель</div>
    <div class="admin-tabs">
      ${Object.keys(tabLabels).map(t => `
        <button class="admin-tab ${adminTab===t?'active':''}" onclick="setAdminTab('${t}')">
          ${tabLabels[t]}
        </button>`).join('')}
    </div>
    <div id="admin-content" style="padding:0 16px 24px"></div>
  `;
  loadAdminTab();
}

function setAdminTab(t) { adminTab = t; loadAdminTab(); }

async function loadAdminTab() {
  const el = document.getElementById('admin-content');
  if (!el) return;

  if (adminTab === 'stats') {
    try {
      const d = await apiGet('/admin/stats');
      el.innerHTML = `
        <div class="admin-stats-grid">
          <div class="admin-stat-card"><div class="admin-stat-val">${d.users}</div><div class="admin-stat-lbl">Пользователей</div></div>
          <div class="admin-stat-card"><div class="admin-stat-val">${d.nfts_out}</div><div class="admin-stat-lbl">NFT выдано</div></div>
          <div class="admin-stat-card" style="grid-column:1/-1"><div class="admin-stat-val">${d.stars}</div><div class="admin-stat-lbl">Звёзд в боте</div></div>
        </div>`;
    } catch { el.innerHTML = '<div class="search-empty">Ошибка загрузки статистики</div>'; }
  }

  else if (adminTab === 'users') {
    try {
      const d = await apiGet('/admin/users');
      el.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:8px">
          ${d.users.map(u => `
            <div class="admin-user-row">
              <div class="admin-user-info">
                <div class="admin-user-name">${u.username ? '@'+u.username : 'Без юзернейма'}</div>
                <div class="admin-user-id">ID: ${u.user_id}</div>
              </div>
              <div class="admin-user-coins">${u.tcoins.toLocaleString()} TC</div>
            </div>`).join('')}
        </div>`;
    } catch { el.innerHTML = '<div class="search-empty">Ошибка загрузки</div>'; }
  }

  else if (adminTab === 'give_nft') {
    el.innerHTML = `
      <div class="admin-form">
        <div class="admin-form-label">User ID пользователя</div>
        <input class="admin-input" id="adm-nft-uid" type="number" placeholder="123456789"/>
        <div class="admin-form-label" style="margin-top:12px">Поиск NFT по названию</div>
        <div class="home-search-wrap" style="margin:0 0 10px">
          <div class="home-search-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></div>
          <input class="home-search" id="adm-nft-search" type="text" placeholder="Название NFT..." oninput="renderAdminNftList()"/>
        </div>
        <div id="adm-nft-list" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:280px;overflow-y:auto"></div>
        <div id="adm-nft-selected" style="margin-top:10px;font-size:13px;color:var(--gold)"></div>
        <button class="btn-primary" style="margin-top:12px" onclick="adminGiveNft()">Выдать NFT</button>
      </div>`;
    renderAdminNftList();
  }

  else if (adminTab === 'give_coins') {
    el.innerHTML = `
      <div class="admin-form">
        <div class="admin-form-label">User ID пользователя</div>
        <input class="admin-input" id="adm-coin-uid" type="number" placeholder="123456789"/>
        <div class="admin-form-label" style="margin-top:12px">Количество T Coins</div>
        <input class="admin-input" id="adm-coin-amount" type="number" placeholder="10000"/>
        <button class="btn-primary" style="margin-top:16px" onclick="adminGiveCoins()">Выдать монеты</button>
      </div>`;
  }

  else if (adminTab === 'stars') {
    try {
      const d = await apiGet('/admin/stats');
      el.innerHTML = `
        <div class="admin-form">
          <div class="admin-stat-card" style="margin-bottom:16px">
            <div class="admin-stat-val">${d.stars}</div>
            <div class="admin-stat-lbl">Текущий баланс звёзд бота</div>
          </div>
          <div class="admin-form-label">Установить количество звёзд</div>
          <input class="admin-input" id="adm-stars-amount" type="number" placeholder="1000"/>
          <button class="btn-primary" style="margin-top:12px" onclick="adminSetStars()">Установить</button>
        </div>`;
    } catch { el.innerHTML = '<div class="search-empty">Ошибка загрузки</div>'; }
  }

  else if (adminTab === 'stock') {
    el.innerHTML = `
      <div class="admin-form">
        <div class="admin-form-label">Выставить NFT в сток</div>
        <div class="home-search-wrap" style="margin:8px 0 10px">
          <div class="home-search-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></div>
          <input class="home-search" id="adm-stock-search" type="text" placeholder="Название NFT..." oninput="renderAdminStockList()"/>
        </div>
        <div id="adm-stock-nft-list" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:220px;overflow-y:auto;margin-bottom:10px"></div>
        <div id="adm-stock-selected" style="font-size:13px;color:var(--gold);margin-bottom:10px"></div>
        <div class="admin-form-label">Цена (TC)</div>
        <input class="admin-input" id="adm-stock-price" type="number" placeholder="5000" style="margin-bottom:8px"/>
        <div class="admin-form-label">Имя продавца</div>
        <input class="admin-input" id="adm-stock-seller" type="text" placeholder="STOCK" value="STOCK" style="margin-bottom:12px"/>
        <button class="btn-primary" onclick="adminAddStock()">Выставить в сток</button>
      </div>

      ${state.stock.length ? `
        <div class="list-active-title" style="margin-top:20px">Текущий сток (${state.stock.length})</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${state.stock.map(s => {
            const n = NFTS[s.nft_id]; if (!n) return '';
            return `
              <div class="listing-row">
                <img src="${n.img}" class="listing-img">
                <div class="listing-info">
                  <div class="listing-name">${n.name}</div>
                  <div class="listing-price">${s.price.toLocaleString()} TC</div>
                  <div class="listing-date">${s.seller_name}</div>
                </div>
                <button class="listing-cancel" onclick="adminRemoveStock(${s.id})">Убрать</button>
              </div>`;
          }).join('')}
        </div>` : ''}
    `;
    renderAdminStockList();
  }
}

// admin NFT list для выдачи
let adminSelectedNftId = null;
let adminStockNftId    = null;

function renderAdminNftList() {
  const q = (document.getElementById('adm-nft-search')?.value || '').toLowerCase();
  const found = Object.entries(NFTS).filter(([,n]) => !q || n.name.toLowerCase().includes(q)).slice(0, 20);
  const el = document.getElementById('adm-nft-list'); if (!el) return;
  el.innerHTML = found.map(([id,n]) => `
    <div class="adm-nft-item ${adminSelectedNftId==id?'selected':''}" onclick="selectAdminNft(${id})">
      <img src="${n.img}" style="width:36px;height:36px;border-radius:8px;object-fit:cover">
      <div style="font-size:11px;font-weight:700;color:var(--text);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${n.name}</div>
      <div style="font-size:10px;color:var(--${n.rarity.toLowerCase()})">${n.rarity}</div>
    </div>`).join('');
}

function selectAdminNft(id) {
  adminSelectedNftId = id;
  const el = document.getElementById('adm-nft-selected');
  if (el) el.textContent = `Выбрано: ${NFTS[id]?.name}`;
  renderAdminNftList();
}

function renderAdminStockList() {
  const q = (document.getElementById('adm-stock-search')?.value || '').toLowerCase();
  const found = Object.entries(NFTS).filter(([,n]) => !q || n.name.toLowerCase().includes(q)).slice(0, 20);
  const el = document.getElementById('adm-stock-nft-list'); if (!el) return;
  el.innerHTML = found.map(([id,n]) => `
    <div class="adm-nft-item ${adminStockNftId==id?'selected':''}" onclick="selectStockNft(${id})">
      <img src="${n.img}" style="width:36px;height:36px;border-radius:8px;object-fit:cover">
      <div style="font-size:11px;font-weight:700;color:var(--text);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${n.name}</div>
      <div style="font-size:10px;color:var(--${n.rarity.toLowerCase()})">${n.rarity}</div>
    </div>`).join('');
}

function selectStockNft(id) {
  adminStockNftId = id;
  const el = document.getElementById('adm-stock-selected');
  if (el) el.textContent = `Выбрано: ${NFTS[id]?.name}`;
  const priceEl = document.getElementById('adm-stock-price');
  if (priceEl && !priceEl.value) priceEl.value = NFTS[id]?.price || '';
  renderAdminStockList();
}

async function adminGiveNft() {
  const uid    = document.getElementById('adm-nft-uid')?.value?.trim();
  const nft_id = adminSelectedNftId;
  if (!uid) { toast('Введи User ID', 'error'); return; }
  if (!nft_id) { toast('Выбери NFT', 'error'); return; }
  try {
    const res = await apiPost('/admin/give_nft', { user_id: parseInt(uid) || uid, nft_id: parseInt(nft_id) });
    if (res.ok) toast(res.message || 'NFT выдан!', 'success');
    else toast(res.error || 'Ошибка', 'error');
  } catch { toast('Ошибка сети', 'error'); }
}

async function adminGiveCoins() {
  const uid    = document.getElementById('adm-coin-uid')?.value?.trim();
  const amount = parseInt(document.getElementById('adm-coin-amount')?.value);
  if (!uid) { toast('Введи User ID', 'error'); return; }
  if (!amount || amount < 1) { toast('Введи сумму', 'error'); return; }
  try {
    const res = await apiPost('/admin/give_coins', { user_id: parseInt(uid)||uid, amount });
    if (res.ok) toast(`Выдано! Новый баланс: ${res.new_balance?.toLocaleString()} TC`, 'success');
    else toast(res.error || 'Ошибка', 'error');
  } catch { toast('Ошибка сети', 'error'); }
}

async function adminSetStars() {
  const amount = parseInt(document.getElementById('adm-stars-amount')?.value);
  if (!amount && amount !== 0) { toast('Введи количество', 'error'); return; }
  try {
    const res = await apiPost('/admin/set_stars', { amount });
    if (res.ok) { toast(`Звёзды установлены: ${res.stars} ⭐`, 'success'); loadAdminTab(); }
    else toast(res.error || 'Ошибка', 'error');
  } catch { toast('Ошибка сети', 'error'); }
}

async function adminAddStock() {
  const nft_id      = adminStockNftId;
  const price       = parseInt(document.getElementById('adm-stock-price')?.value);
  const seller_name = document.getElementById('adm-stock-seller')?.value?.trim() || 'STOCK';
  if (!nft_id) { toast('Выбери NFT', 'error'); return; }
  if (!price || price < 1) { toast('Укажи цену', 'error'); return; }
  try {
    const res = await apiPost('/admin/add_stock', { nft_id: parseInt(nft_id), price, seller_name });
    if (res.ok) {
      state.stock.push({ id: res.stock_id, nft_id: parseInt(nft_id), price, seller_name });
      toast('Добавлено в сток!', 'success');
      adminStockNftId = null;
      loadAdminTab();
    } else toast(res.error || 'Ошибка', 'error');
  } catch { toast('Ошибка сети', 'error'); }
}

async function adminRemoveStock(stockId) {
  try {
    await apiPost('/admin/remove_stock', { stock_id: stockId });
    state.stock = state.stock.filter(s => s.id !== stockId);
    toast('Убрано из стока', '');
    loadAdminTab();
  } catch { toast('Ошибка', 'error'); }
}

// ── CASES ─────────────────────────────────────────────

// Poison Case — содержимое с шансами
const CASES = {
  poison: {
    id: 'poison',
    name: 'Poison Case',
    price: 500,
    color: '#22c55e',
    img: 'poison_case.png',
    imgFallback: (function() {
      var s = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">'
        + '<defs>'
        + '<radialGradient id="cbg" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#0f2a0f"/><stop offset="100%" stop-color="#020a02"/></radialGradient>'
        + '<filter id="cgl"><feGaussianBlur stdDeviation="6"/></filter>'
        + '</defs>'
        + '<rect width="200" height="200" rx="22" fill="url(#cbg)"/>'
        + '<rect x="0" y="0" width="6" height="200" fill="#22c55e" opacity="0.7"/>'
        + '<rect x="194" y="0" width="6" height="200" fill="#22c55e" opacity="0.7"/>'
        + '<rect x="0" y="0" width="200" height="6" fill="#22c55e" opacity="0.7"/>'
        + '<rect x="0" y="194" width="200" height="6" fill="#22c55e" opacity="0.7"/>'
        + '<rect x="12" y="12" width="176" height="176" rx="14" fill="none" stroke="#22c55e" stroke-width="1" opacity="0.25"/>'
        + '<circle cx="100" cy="95" r="58" fill="#22c55e" opacity="0.07" filter="url(#cgl)"/>'
        + '<text x="100" y="90" font-size="68" text-anchor="middle" dominant-baseline="middle">☣️</text>'
        + '<text x="100" y="152" font-size="20" font-weight="900" text-anchor="middle" fill="#4ade80" font-family="sans-serif" letter-spacing="3">POISON</text>'
        + '<text x="100" y="171" font-size="11" text-anchor="middle" fill="#22c55e" font-family="sans-serif" letter-spacing="2" opacity="0.7">CASE</text>'
        + '</svg>';
      return 'data:image/svg+xml,' + encodeURIComponent(s);
    })(),
    items: [
      { nft_id: 1,  chance: 35,  label: 'Evil Eye',       rarity: 'Common',    price: 250   },
      { nft_id: 13, chance: 32,  label: 'Magic Mushroom', rarity: 'Common',    price: 220   },
      { nft_id: 4,  chance: 34,  label: 'Voodoo Doll',    rarity: 'Common',    price: 200   },
      { nft_id: 28, chance: 15,  label: 'Homemade Cake',  rarity: 'Rare',      price: 1800  },
      { nft_id: 31, chance: 13,  label: 'Jelly Bunny',    rarity: 'Rare',      price: 1900  },
      { nft_id: 34, chance: 10,  label: 'Spiced Wine',    rarity: 'Rare',      price: 2200  },
      { nft_id: 50, chance: 2,   label: 'Santa Hat',      rarity: 'Legendary', price: 44000 },
      { nft_id: 45, chance: 3.5, label: 'Precious Peach', rarity: 'Legendary', price: 32000 },
    ]
  },

  hellfire: {
    id: 'hellfire',
    name: 'Hellfire Case',
    price: 1200,
    color: '#ef4444',
    img: 'hellfire_case.png',
    imgFallback: (function() {
      var s = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">'
        + '<defs>'
        + '<radialGradient id="hbg" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#2a0606"/><stop offset="100%" stop-color="#0a0202"/></radialGradient>'
        + '<filter id="hgl"><feGaussianBlur stdDeviation="6"/></filter>'
        + '</defs>'
        + '<rect width="200" height="200" rx="22" fill="url(#hbg)"/>'
        + '<rect x="0" y="0" width="6" height="200" fill="#ef4444" opacity="0.7"/>'
        + '<rect x="194" y="0" width="6" height="200" fill="#ef4444" opacity="0.7"/>'
        + '<rect x="0" y="0" width="200" height="6" fill="#ef4444" opacity="0.7"/>'
        + '<rect x="0" y="194" width="200" height="6" fill="#ef4444" opacity="0.7"/>'
        + '<rect x="12" y="12" width="176" height="176" rx="14" fill="none" stroke="#ef4444" stroke-width="1" opacity="0.3"/>'
        // Диагональные трещины
        + '<line x1="30" y1="20" x2="80" y2="100" stroke="#ef4444" stroke-width="1.5" opacity="0.2"/>'
        + '<line x1="170" y1="20" x2="120" y2="100" stroke="#ef4444" stroke-width="1.5" opacity="0.2"/>'
        + '<line x1="20" y1="160" x2="90" y2="120" stroke="#ef4444" stroke-width="1" opacity="0.15"/>'
        + '<circle cx="100" cy="95" r="58" fill="#ef4444" opacity="0.08" filter="url(#hgl)"/>'
        + '<text x="100" y="90" font-size="68" text-anchor="middle" dominant-baseline="middle">🔥</text>'
        + '<text x="100" y="152" font-size="18" font-weight="900" text-anchor="middle" fill="#f87171" font-family="sans-serif" letter-spacing="2">HELLFIRE</text>'
        + '<text x="100" y="171" font-size="11" text-anchor="middle" fill="#ef4444" font-family="sans-serif" letter-spacing="2" opacity="0.7">CASE</text>'
        + '</svg>';
      return 'data:image/svg+xml,' + encodeURIComponent(s);
    })(),
    items: [
      // Common — от самых дешёвых к дорогим, шанс убывает
      { nft_id: 37, chance: 32,  label: 'Berry Box',      rarity: 'Common',    price: 100    },
      { nft_id: 7,  chance: 28,  label: 'Eternal Rose',   rarity: 'Common',    price: 150    },
      { nft_id: 19, chance: 22,  label: 'Love Candle',    rarity: 'Common',    price: 250    },
      // Rare
      { nft_id: 38, chance: 10,  label: 'Berry Box',      rarity: 'Rare',      price: 1700   },
      { nft_id: 35, chance: 9,   label: 'Spiced Wine',    rarity: 'Rare',      price: 2200   },
      { nft_id: 8,  chance: 7,   label: 'Eternal Rose',   rarity: 'Rare',      price: 2800   },
      { nft_id: 20, chance: 5,   label: 'Love Candle',    rarity: 'Rare',      price: 4200   },
      // Legendary — шанс 0.1%
      { nft_id: 9,  chance: 0.1, label: 'Eternal Rose',   rarity: 'Legendary', price: 55000  },
      { nft_id: 21, chance: 0.1, label: 'Love Candle',    rarity: 'Legendary', price: 78000  },
      { nft_id: 52, chance: 0.1, label: 'TIDE GOD GIFT',  rarity: 'Legendary', price: 120000 },
    ]
  },

  dota2: {
    id: 'dota2',
    name: 'Dota 2 Case',
    price: 2500,
    color: '#c084fc',
    img: 'dota2_case.png',
    imgFallback: (function() {
      var s = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">'
        + '<defs>'
        + '<radialGradient id="dbg" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#120020"/><stop offset="100%" stop-color="#05000e"/></radialGradient>'
        + '<filter id="dgl"><feGaussianBlur stdDeviation="6"/></filter>'
        + '</defs>'
        + '<rect width="200" height="200" rx="22" fill="url(#dbg)"/>'
        + '<rect x="0" y="0" width="6" height="200" fill="#c084fc" opacity="0.7"/>'
        + '<rect x="194" y="0" width="6" height="200" fill="#c084fc" opacity="0.7"/>'
        + '<rect x="0" y="0" width="200" height="6" fill="#c084fc" opacity="0.7"/>'
        + '<rect x="0" y="194" width="200" height="6" fill="#c084fc" opacity="0.7"/>'
        + '<circle cx="100" cy="95" r="58" fill="#c084fc" opacity="0.08" filter="url(#dgl)"/>'
        + '<text x="100" y="90" font-size="68" text-anchor="middle" dominant-baseline="middle">⚡</text>'
        + '<text x="100" y="152" font-size="18" font-weight="900" text-anchor="middle" fill="#c084fc" font-family="sans-serif" letter-spacing="2">DOTA 2</text>'
        + '<text x="100" y="171" font-size="11" text-anchor="middle" fill="#a855f7" font-family="sans-serif" letter-spacing="2" opacity="0.7">CASE</text>'
        + '</svg>';
      return 'data:image/svg+xml,' + encodeURIComponent(s);
    })(),
    items: [
      // Common
      { nft_id: 1,  chance: 28,   label: 'Evil Eye',       rarity: 'Common',    price: 250    },
      { nft_id: 40, chance: 25,   label: 'Cookie Heart',   rarity: 'Common',    price: 200    },
      { nft_id: 22, chance: 20,   label: 'Top Hat',        rarity: 'Common',    price: 180    },
      // Rare
      { nft_id: 2,  chance: 12,   label: 'Evil Eye',       rarity: 'Rare',      price: 4500   },
      { nft_id: 41, chance: 9,    label: 'Cookie Heart',   rarity: 'Rare',      price: 3400   },
      { nft_id: 23, chance: 7,    label: 'Top Hat',        rarity: 'Rare',      price: 2600   },
      { nft_id: 27, chance: 5,    label: 'Nesting Doll',   rarity: 'Rare',      price: 2900   },
      // Legendary 0.1%
      { nft_id: 3,  chance: 0.1,  label: 'Evil Eye',       rarity: 'Legendary', price: 85000  },
      { nft_id: 42, chance: 0.1,  label: 'Cookie Heart',   rarity: 'Legendary', price: 65000  },
      { nft_id: 52, chance: 0.1,  label: 'TIDE GOD GIFT',  rarity: 'Legendary', price: 120000 },
      // Ультра-редкий 0.05%
      { nft_id: 54, chance: 0.05, label: 'Plush Fiend',    rarity: 'Legendary', price: 2500000},
    ]
  },

  nightmare: {
    id: 'nightmare',
    name: 'Nightmare Case',
    price: 3500,
    color: '#a855f7',
    img: 'nightmare_case.png',
    imgFallback: (function() {
      var s = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">'
        + '<defs>'
        + '<radialGradient id="nbg" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#1a0a2e"/><stop offset="100%" stop-color="#04020a"/></radialGradient>'
        + '<filter id="ngl"><feGaussianBlur stdDeviation="6"/></filter>'
        + '</defs>'
        + '<rect width="200" height="200" rx="22" fill="url(#nbg)"/>'
        + '<circle cx="100" cy="90" r="55" fill="#7c3aed" opacity="0.08" filter="url(#ngl)"/>'
        + '<text x="100" y="85" font-size="64" text-anchor="middle" dominant-baseline="middle">💀</text>'
        + '<text x="100" y="148" font-size="16" font-weight="900" text-anchor="middle" fill="#a855f7" font-family="sans-serif" letter-spacing="2">NIGHTMARE</text>'
        + '<text x="100" y="167" font-size="11" text-anchor="middle" fill="#7c3aed" font-family="sans-serif" letter-spacing="2" opacity="0.7">CASE</text>'
        + '</svg>';
      return 'data:image/svg+xml,' + encodeURIComponent(s);
    })(),
    items: [
      // Common
      { nft_id: 7,  chance: 30,   label: 'Eternal Rose',   rarity: 'Common',    price: 150    },
      { nft_id: 19, chance: 28,   label: 'Love Candle',     rarity: 'Common',    price: 250    },
      { nft_id: 34, chance: 22,   label: 'Spiced Wine',     rarity: 'Common',    price: 120    },
      // Rare
      { nft_id: 8,  chance: 10,   label: 'Eternal Rose',   rarity: 'Rare',      price: 2800   },
      { nft_id: 20, chance: 8,    label: 'Love Candle',     rarity: 'Rare',      price: 4200   },
      { nft_id: 35, chance: 6,    label: 'Spiced Wine',     rarity: 'Rare',      price: 2200   },
      // Legendary
      { nft_id: 9,  chance: 1.5,  label: 'Eternal Rose',   rarity: 'Legendary', price: 55000  },
      { nft_id: 57, chance: 0.8,  label: 'Blue Flowers',   rarity: 'Legendary', price: 75000  },
      { nft_id: 52, chance: 0.15, label: 'TIDE GOD GIFT',  rarity: 'Legendary', price: 120000 },
      // Ультра-редкий
      { nft_id: 56, chance: 0.05, label: 'Plush Ghost',    rarity: 'Legendary', price: 2000000},
      { nft_id: 83, chance: 0.05, label: 'Plush Jason',    rarity: 'Legendary', price: 2800000},
    ]
  }
};
let activeCaseId = null; // null = показываем список

function renderCases() {
  const el = document.getElementById('screen-cases');

  if (activeCaseId) {
    // ── Страница конкретного кейса ──
    const c = CASES[activeCaseId];
    el.innerHTML = `
      <div class="case-detail-header">
        <button class="case-back-btn" onclick="activeCaseId=null;renderCases()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Назад к кейсам
        </button>
      </div>

      <div class="case-detail-hero">
        <img src="${c.img}" class="case-detail-img" onerror="this.src='${c.imgFallback}'">
        <div class="case-detail-glow" style="background:${c.color}"></div>
      </div>

      <div class="case-detail-title" style="color:${c.color}">${c.name}</div>
      <div class="case-detail-price">${c.price.toLocaleString()} TC</div>

      <div style="padding:0 16px;margin-bottom:16px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <button class="btn-primary" onclick="startCaseOpen('${c.id}',1)"
            style="background:linear-gradient(135deg,${c.color}cc,${c.color}88);color:#fff;font-size:13px;padding:10px 8px">
            x1 — ${c.price.toLocaleString()} TC
          </button>
          <button class="btn-primary" onclick="startCaseOpen('${c.id}',2)"
            style="background:linear-gradient(135deg,${c.color}cc,${c.color}88);color:#fff;font-size:13px;padding:10px 8px">
            x2 — ${(c.price*2).toLocaleString()} TC
          </button>
          <button class="btn-primary" onclick="startCaseOpen('${c.id}',3)"
            style="background:linear-gradient(135deg,${c.color}cc,${c.color}88);color:#fff;font-size:13px;padding:10px 8px">
            x3 — ${(c.price*3).toLocaleString()} TC
          </button>
          <button class="btn-primary" onclick="startCaseOpen('${c.id}',4)"
            style="background:linear-gradient(135deg,${c.color}cc,${c.color}88);color:#fff;font-size:13px;padding:10px 8px">
            x4 — ${(c.price*4).toLocaleString()} TC
          </button>
        </div>
      </div>

      <div style="padding:0 16px 8px">
        <div class="section-label" style="padding:0 0 12px">Содержимое кейса</div>
        <div class="case-contents-list">
          ${[...c.items].sort((a,b) => b.chance - a.chance).map(item => {
            const n = NFTS[item.nft_id];
            const rarityColor = {Common:'#22c55e',Rare:'#3b82f6',Legendary:'#f59e0b'}[item.rarity]||'#fff';
            return `
              <div class="case-content-row" style="border-left-color:${rarityColor}">
                <img src="${n ? nftPreviewSrc(n) : ''}" class="case-content-img">
                <div class="case-content-info">
                  <div class="case-content-name">${item.label}</div>
                  <div class="case-content-rar" style="color:${rarityColor}">${item.rarity}</div>
                </div>
                <div class="case-content-right">
                  <div class="case-content-chance" style="color:${rarityColor}">${item.chance}%</div>
                  <div class="case-content-price">${item.price.toLocaleString()} TC</div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
      <div style="height:20px"></div>
    `;
    return;
  }

  // ── Список всех кейсов ──
  el.innerHTML = `
    <div class="screen-header">Кейсы</div>
    <div class="cases-grid">
      ${Object.values(CASES).map(c => `
        <div class="case-grid-card" onclick="activeCaseId='${c.id}';renderCases()"
          style="--cc:${c.color}">
          <div class="case-grid-img-wrap">
            <img src="${c.img}" class="case-grid-img" onerror="this.src='${c.imgFallback}'">
          </div>
          <div class="case-grid-name">${c.name}</div>
          <div class="case-grid-price" style="color:${c.color}">${c.price.toLocaleString()} TC</div>
        </div>`).join('')}
    </div>
    <div style="height:20px"></div>
  `;
}

function selectCase(id) {
  activeCaseId = id;
  renderCases();
}

function openCaseModal(caseId) {
  const c = CASES[caseId];
  openModal(`
    <div style="text-align:center;margin-bottom:12px">
      <img src="${c.img}" style="width:120px;height:120px;object-fit:cover;border-radius:16px">
    </div>
    <div class="modal-title">${c.name}</div>
    <div class="modal-desc">Внутри один из ${c.items.length} предметов.<br>Шанс выпадения зависит от редкости.</div>
    <div class="stat-row">
      <div class="stat-box"><div class="stat-val">${c.price}</div><div class="stat-lbl">TC цена</div></div>
      <div class="stat-box"><div class="stat-val">${c.items.length}</div><div class="stat-lbl">Предметов</div></div>
    </div>
    <button class="btn-primary case-open-btn" onclick="startCaseOpen('${caseId}')">Открыть за ${c.price} TC</button>
    <button class="btn-secondary" onclick="closeModal()">Закрыть</button>
  `);
}



// ткрыть кейс count раз (1-4)

async function startCaseOpen(caseId, count) {
  count = count || 1;
  const c = CASES[caseId];
  if (caseOpening) return;
  const totalCost = c.price * count;
  if (state.balance < totalCost) { toast('едостаточно T Coins', 'error'); return; }
  closeModal();
  caseOpening = true;
  state.balance -= totalCost;
  renderHome();

  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(
      apiPost('/open_case', { case_id: caseId }).then(res => {
        if (res.ok) {
          if (res.balance !== undefined) state.balance = res.balance;
          if (res.inventory) state.inventory = res.inventory;
          return c.items.find(x => x.nft_id === res.nft_id) ||
            (NFTS[res.nft_id] ? { nft_id: res.nft_id, label: NFTS[res.nft_id].name, rarity: NFTS[res.nft_id].rarity, price: NFTS[res.nft_id].price } : null);
        }
        return null;
      }).catch(() => null)
    );
  }

  const results = await Promise.all(promises);
  const wonItems = results.map((item, idx) => {
    if (!item) {
      const total = c.items.reduce((s, x) => s + x.chance, 0);
      let rand = Math.random() * total, cum = 0, picked = c.items[c.items.length-1];
      for (const it of c.items) { cum += it.chance; if (rand <= cum) { picked = it; break; } }
      state.inventory.push({ inv_id: Date.now() + idx, nft_id: picked.nft_id });
      return picked;
    }
    return item;
  });

  saveState(); renderHome(); renderInventory();
  playCaseAnimation(c, wonItems);
}

function playCaseAnimation(c, wonItems) {
  const overlay = document.getElementById('case-open-overlay');
  const result  = document.getElementById('case-open-result');
  const title   = document.getElementById('case-open-title');
  const count   = wonItems.length;

  overlay.style.display = 'flex';
  result.innerHTML = '';
  result.className = 'case-open-result';

  if (title) {
    title.textContent = c.name.toUpperCase();
    title.style.color = c.color || '#4ade80';
    title.style.textShadow = '0 0 20px ' + (c.color || '#4ade80') + '66';
  }

  for (let i = 0; i < 4; i++) {
    const wrap = document.getElementById('case-reel-wrap-' + i);
    if (wrap) wrap.style.display = i < count ? 'block' : 'none';
  }

  const ITEM_W = 80;
  const reelWrapW = document.querySelector('.case-reel-wrap').offsetWidth || 320;
  const WIN_POS = 32;
  const targetX = -(WIN_POS * ITEM_W - (reelWrapW / 2 - ITEM_W / 2));

  const animPromises = wonItems.map((wonItem, idx) => new Promise(resolve => {
    const reel = document.getElementById('case-reel-' + idx);
    if (!reel) { resolve(); return; }

    const pointer = reel.parentElement.querySelector('.case-reel-pointer');
    if (pointer) { pointer.style.background = c.color || '#4ade80'; pointer.style.boxShadow = '0 0 12px ' + (c.color||'#4ade80') + 'cc'; }

    const items = [];
    for (let i = 0; i < 40; i++) {
      if (i === WIN_POS) { items.push(wonItem); continue; }
      const tot = c.items.reduce((s, x) => s + x.chance, 0);
      let r = Math.random() * tot, cu = 0, pk = c.items[0];
      for (const it of c.items) { cu += it.chance; if (r <= cu) { pk = it; break; } }
      items.push(pk);
    }

    reel.innerHTML = items.map(item => {
      const n = NFTS[item.nft_id];
      const rc = ({Common:'#22c55e',Rare:'#3b82f6',Legendary:'#f59e0b'})[item.rarity]||'#fff';
      return '<div class="case-reel-item" style="border-color:' + rc + '20"><img src="' + (n ? nftPreviewSrc(n) : '') + '" style="width:60px;height:60px;object-fit:contain;border-radius:10px"><div style="font-size:9px;font-weight:700;color:' + rc + ';margin-top:4px;text-align:center;white-space:nowrap;overflow:hidden;max-width:70px;text-overflow:ellipsis">' + item.label + '</div></div>';
    }).join('');

    reel.style.transition = 'none';
    reel.style.transform = 'translateX(0)';
    const dur = 4 + idx * 0.3;
    setTimeout(() => {
      reel.style.transition = 'transform ' + dur + 's cubic-bezier(0.15,0.85,0.35,1.0)';
      reel.style.transform = 'translateX(' + targetX + 'px)';
      setTimeout(resolve, dur * 1000 + 300);
    }, 80 + idx * 150);
  }));

  Promise.all(animPromises).then(() => {
    const rc = (r) => ({Common:'#22c55e',Rare:'#3b82f6',Legendary:'#f59e0b'})[r]||'#fff';
    result.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;padding:8px">' +
      wonItems.map(item => {
        const n = NFTS[item.nft_id];
        return '<div class="case-result-card" style="border-color:' + rc(item.rarity) + ';min-width:110px;flex:1"><img src="' + (n ? nftPreviewSrc(n) : '') + '" style="width:56px;height:56px;object-fit:contain;border-radius:10px;margin-bottom:6px"><div style="font-size:12px;font-weight:900;color:var(--text)">' + item.label + '</div><div style="font-size:10px;font-weight:700;color:' + rc(item.rarity) + ';margin:2px 0">' + item.rarity + '</div><div style="font-size:11px;color:var(--gold)">' + item.price.toLocaleString() + ' TC</div></div>';
      }).join('') + '</div><button class="btn-primary" style="margin-top:8px;width:100%" onclick="closeCaseOverlay()">абрать' + (wonItems.length > 1 ? ' всё' : '') + '</button>';
    result.className = 'case-open-result visible';
    toast('ыпало: ' + wonItems.map(i => i.label).join(', ') + '!', 'success');
    caseOpening = false;
    renderHome(); renderInventory();
  });
}

function closeCaseOverlay() {
  document.getElementById('case-open-overlay').style.display = 'none';
  for (let i = 0; i < 4; i++) {
    const reel = document.getElementById('case-reel-' + i);
    if (reel) { reel.style.transition = 'none'; reel.style.transform = 'translateX(0)'; }
  }
}
function playCaseAnimation(c, wonItem) {
  const overlay = document.getElementById('case-open-overlay');
  const reel    = document.getElementById('case-reel-0'); // legacy fallback
  const result  = document.getElementById('case-open-result');
  const title   = document.getElementById('case-open-title');

  overlay.style.display = 'flex';
  result.innerHTML = '';
  result.className = 'case-open-result';

  // Заголовок с названием и цветом конкретного кейса
  if (title) {
    title.textContent = c.name.toUpperCase();
    title.style.color = c.color || '#4ade80';
    title.style.textShadow = `0 0 20px ${c.color || '#4ade80'}66`;
  }

  // Цвет указателя под кейс
  const pointer = document.querySelector('.case-reel-pointer');
  if (pointer) {
    pointer.style.background = c.color || '#4ade80';
    pointer.style.boxShadow  = `0 0 12px ${c.color || '#4ade80'}cc`;
  }

  // Генерируем ленту — 40 предметов + выигрыш в центре (позиция 32)
  const WIN_POS = 32;
  const items = [];
  for (let i = 0; i < 40; i++) {
    if (i === WIN_POS) {
      items.push(wonItem);
    } else {
      // Случайный предмет с учётом шансов
      const total = c.items.reduce((s, x) => s + x.chance, 0);
      let rand = Math.random() * total;
      let picked = c.items[0];
      for (const it of c.items) { rand -= it.chance; if (rand <= 0) { picked = it; break; } }
      items.push(picked);
    }
  }

  const ITEM_W = 80; // px ширина одного элемента
  reel.innerHTML = items.map(item => {
    const n = NFTS[item.nft_id];
    const rarityColor = { Common: '#22c55e', Rare: '#3b82f6', Legendary: '#f59e0b' }[item.rarity] || '#fff';
    return `
      <div class="case-reel-item" style="border-color:${rarityColor}20">
        <img src="${n ? nftPreviewSrc(n) : ''}" style="width:60px;height:60px;object-fit:cover;border-radius:10px">
        <div style="font-size:9px;font-weight:700;color:${rarityColor};margin-top:4px;text-align:center;white-space:nowrap;overflow:hidden;max-width:70px;text-overflow:ellipsis">${item.label}</div>
      </div>`;
  }).join('');

  // Позиционируем рулетку так чтобы WIN_POS оказался по центру
  const reelWrapW = document.querySelector('.case-reel-wrap').offsetWidth || 320;
  const centerOffset = reelWrapW / 2 - ITEM_W / 2;
  // ерём реальную ширину элемента и центрируем WIN_POS точно
  const firstItem = reel.querySelector('.case-reel-item');
  const realItemW = firstItem ? firstItem.offsetWidth : ITEM_W;
  const targetX = -(WIN_POS * realItemW - (reelWrapW / 2 - realItemW / 2));
  // Анимация
  reel.style.transition = 'none';
  reel.style.transform  = 'translateX(0)';

  setTimeout(() => {
    reel.style.transition = 'transform 4s cubic-bezier(0.15, 0.85, 0.35, 1.0)';
    reel.style.transform  = `translateX(${targetX}px)`;
  }, 80);

  // Через 4.2с показываем результат
  setTimeout(() => {
    const n = NFTS[wonItem.nft_id];
    const rarityColor = { Common: '#22c55e', Rare: '#3b82f6', Legendary: '#f59e0b' }[wonItem.rarity] || '#fff';
    result.innerHTML = `
      <div class="case-result-card" style="border-color:${rarityColor}">
        <img src="${n ? n.img : ''}" style="width:80px;height:80px;object-fit:cover;border-radius:14px;margin-bottom:10px">
        <div style="font-size:18px;font-weight:900;color:var(--text)">${wonItem.label}</div>
        <div style="font-size:12px;font-weight:700;color:${rarityColor};margin:4px 0">${wonItem.rarity}</div>
        <div style="font-size:13px;color:var(--gold)">${wonItem.price.toLocaleString()} TC</div>
      </div>
      <button class="btn-primary" style="margin-top:14px;width:100%" onclick="closeCaseOverlay()">Забрать</button>
    `;
    result.className = 'case-open-result visible';
    toast(`Выпало: ${wonItem.label}!`, 'success');
    caseOpening = false;
    renderHome(); renderInventory();
  }, 4300);
}

function closeCaseOverlay() {
  document.getElementById('case-open-overlay').style.display = 'none';
  document.getElementById('case-reel').style.transition = 'none';
  document.getElementById('case-reel').style.transform  = 'translateX(0)';
}

// ── INIT ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderHome();
  renderMarket();
  renderInventory();
  renderUpgrade();
  loadUser();
});
}
