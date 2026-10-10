const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const API = '';

let state = {
  balance: 0,
  inventory: [],
  marketFilter: 'All',
  spinning: false,
  upgradeInvId: null,
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
  try {
    const data = await apiGet('/me');
    state.balance   = data.tcoins || 0;
    state.inventory = data.inventory || [];
  } catch(e) {
    state.balance = 0;
    state.inventory = [];
  }
  renderHome();
  renderInventory();
  renderUpgrade();
}

// ── SCREEN ────────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
  document.querySelector(`[data-screen="${name}"]`).classList.add('active');
  if (name === 'market') renderMarket();
}

// ── TOAST ─────────────────────────────────────────────
let _tt;
function toast(msg, type = '') {
  let el = document.getElementById('_toast');
  if (!el) {
    el = document.createElement('div');
    el.id = '_toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = `toast ${type}`;
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.remove('show'), 2600);
}

// ── MODAL ─────────────────────────────────────────────
function openModal(html) {
  let ov = document.getElementById('_modal_ov');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = '_modal_ov';
    ov.className = 'modal-overlay';
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

// ── NFT IMAGE ─────────────────────────────────────────
function nftImgHtml(nft, cls = '', size = '') {
  const s = size ? `style="width:${size};height:${size}"` : '';
  if (nft.img) {
    return `<img src="${nft.img}" class="nft-img ${cls}" ${s} onerror="this.parentNode.innerHTML=imgPlaceholder()" loading="lazy">`;
  }
  return imgPlaceholder();
}
function imgPlaceholder() {
  return `<div class="nft-img-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg></div>`;
}

// ── HOME ──────────────────────────────────────────────
function renderHome() {
  const el = document.getElementById('screen-home');
  const legendary = Object.entries(NFTS).filter(([,n]) => n.rarity === 'Legendary');
  const commons   = Object.entries(NFTS).filter(([,n]) => n.rarity === 'Common').slice(0, 8);
  const rares     = Object.entries(NFTS).filter(([,n]) => n.rarity === 'Rare').slice(0, 8);

  el.innerHTML = `
    <div class="home-header">
      <div class="home-title">TIDE BOT</div>
      <div class="home-sub">NFT Marketplace</div>
    </div>
    <div class="balance-card">
      <div class="balance-label">Твой баланс</div>
      <div class="balance-amount">${state.balance.toLocaleString()}</div>
      <div class="balance-currency">T COINS</div>
    </div>
    <button class="btn-deposit" onclick="openDepositModal()">Пополнить через Stars</button>

    <div class="section-label">Legendary</div>
    <div class="nft-row">${legendary.map(([id,n]) => nftCardHtml(id,n)).join('')}</div>
    <div style="height:14px"></div>

    <div class="section-label">Rare</div>
    <div class="nft-row">${rares.map(([id,n]) => nftCardHtml(id,n)).join('')}</div>
    <div style="height:14px"></div>

    <div class="section-label">Common</div>
    <div class="nft-row">${commons.map(([id,n]) => nftCardHtml(id,n)).join('')}</div>
    <div style="height:16px"></div>
  `;
}

function nftCardHtml(id, n) {
  return `
    <div class="nft-card rarity-${n.rarity}" onclick="openNftModal(${id})">
      ${nftImgHtml(n)}
      <div class="nft-body">
        <div class="nft-name">${n.name}</div>
        <div class="nft-rarity">${n.rarity}</div>
        <div class="nft-price">${n.price.toLocaleString()} TC</div>
      </div>
    </div>`;
}

// ── MARKET ────────────────────────────────────────────
function renderMarket() {
  const el = document.getElementById('screen-market');
  const filters = ['All','Common','Rare','Epic','Legendary'];
  const list = Object.entries(NFTS).filter(([,n]) =>
    state.marketFilter === 'All' || n.rarity === state.marketFilter
  );
  el.innerHTML = `
    <div class="screen-header">Маркет</div>
    <div class="filter-row">
      ${filters.map(f => `
        <div class="chip ${state.marketFilter===f?'active-'+f:''}" onclick="setFilter('${f}')">
          ${f === 'All' ? 'Все' : f}
        </div>`).join('')}
    </div>
    <div class="nft-grid">
      ${list.map(([id,n]) => nftCardHtml(id,n)).join('')}
    </div>`;
}
function setFilter(f) { state.marketFilter = f; renderMarket(); }

// ── NFT MODAL ─────────────────────────────────────────
function openNftModal(id) {
  const n = NFTS[id];
  const upgHtml = n.upgTo ? `
    <div class="upg-info">
      <div class="upg-info-title">Апгрейд до</div>
      <div class="upg-info-name">${NFTS[n.upgTo]?.name}</div>
      <div class="upg-info-cost">${n.upgCost.toLocaleString()} TC</div>
    </div>` : '';
  openModal(`
    ${nftImgHtml(n, 'modal-nft-img', '120px')}
    <div class="modal-title">${n.name}</div>
    <div class="modal-center"><span class="rarity-tag tag-${n.rarity}">${n.rarity}</span></div>
    <div class="modal-desc">${n.desc}</div>
    <div class="stat-row">
      <div class="stat-box">
        <div class="stat-val">${n.price.toLocaleString()}</div>
        <div class="stat-lbl">TC цена</div>
      </div>
      <div class="stat-box">
        <div class="stat-val">${n.sell}</div>
        <div class="stat-lbl">Stars вывод</div>
      </div>
    </div>
    ${upgHtml}
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
      state.balance = res.balance;
      state.inventory = res.inventory;
      renderHome(); renderInventory(); renderUpgrade();
      closeModal();
      toast(`${n.name} куплен!`, 'success');
    } else { toast(res.error || 'Ошибка', 'error'); }
  } catch {
    state.balance -= n.price;
    state.inventory.push({ inv_id: Date.now(), nft_id: parseInt(id) });
    renderHome(); renderInventory(); renderUpgrade();
    closeModal();
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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
        <div class="inv-empty-text">Инвентарь пустой<br>Купи NFT в маркете</div>
      </div>`;
    return;
  }
  el.innerHTML = `
    <div class="screen-header">Инвентарь (${state.inventory.length})</div>
    <div class="nft-grid">
      ${state.inventory.map(item => {
        const n = NFTS[item.nft_id];
        if (!n) return '';
        return `
          <div class="nft-card rarity-${n.rarity}" onclick="openInvModal(${item.inv_id},${item.nft_id})">
            ${nftImgHtml(n)}
            <div class="nft-body">
              <div class="nft-name">${n.name}</div>
              <div class="nft-rarity">${n.rarity}</div>
              <div class="nft-price">${n.sell} Stars</div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

function openInvModal(invId, nftId) {
  const n = NFTS[nftId];
  const upgHtml = n.upgTo ? `
    <button class="btn-primary" onclick="goUpgrade(${invId})">Апгрейд до ${NFTS[n.upgTo]?.name}</button>` : '';
  openModal(`
    ${nftImgHtml(n, 'modal-nft-img', '120px')}
    <div class="modal-title">${n.name}</div>
    <div class="modal-center"><span class="rarity-tag tag-${n.rarity}">${n.rarity}</span></div>
    <div class="modal-desc">${n.desc}</div>
    <div class="stat-row">
      <div class="stat-box">
        <div class="stat-val">${n.sell}</div>
        <div class="stat-lbl">Stars вывод</div>
      </div>
      ${n.upgTo ? `<div class="stat-box">
        <div class="stat-val">${n.upgCost.toLocaleString()}</div>
        <div class="stat-lbl">TC апгрейд</div>
      </div>` : ''}
    </div>
    ${upgHtml}
    <button class="btn-danger" onclick="sellNft(${invId},${nftId})">Вывести за ${n.sell} Stars</button>
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
      state.balance = res.balance;
      state.inventory = res.inventory;
      renderHome(); renderInventory(); renderUpgrade();
      closeModal();
      toast(`Получено ${n.sell} Stars!`, 'success');
    } else if (res.no_stars) {
      closeModal();
      toast('Нет звёзд в боте. Ожидайте пополнения.', 'error');
    } else { toast(res.error || 'Ошибка', 'error'); }
  } catch {
    state.inventory = state.inventory.filter(i => i.inv_id !== invId);
    renderHome(); renderInventory(); renderUpgrade();
    closeModal();
    toast(`Получено ${n.sell} Stars!`, 'success');
  }
}

// ── UPGRADE ───────────────────────────────────────────
function renderUpgrade() {
  const el = document.getElementById('screen-upgrade');
  const upgradeable = state.inventory.filter(i => NFTS[i.nft_id]?.upgTo);

  if (!upgradeable.length) {
    el.innerHTML = `
      <div class="upgrade-wrap">
        <div class="upgrade-title">Апгрейд</div>
        <div class="upgrade-sub">Нет NFT для апгрейда. Купи Common или Rare в маркете!</div>
      </div>`;
    return;
  }

  const selItem = upgradeable.find(i => i.inv_id === state.upgradeInvId) || upgradeable[0];
  const fromNft = NFTS[selItem.nft_id];
  const toNft   = NFTS[fromNft.upgTo];

  el.innerHTML = `
    <div class="upgrade-wrap">
      <div class="upgrade-title">Апгрейд</div>
      <div class="upgrade-sub">Прокачай NFT до более редкого!</div>

      <select class="upgrade-select" id="_upg_sel" onchange="onUpgSel()">
        ${upgradeable.map(i => {
          const n = NFTS[i.nft_id];
          return `<option value="${i.inv_id}" ${i.inv_id===selItem.inv_id?'selected':''}>${n.name} (${n.rarity})</option>`;
        }).join('')}
      </select>

      <div class="upgrade-preview">
        <div class="upg-box">
          <img src="${fromNft.img}" onerror="this.style.display='none'" loading="lazy">
          <div class="upg-box-name">${fromNft.name}</div>
          <div class="upg-box-rarity" style="color:var(--${fromNft.rarity.toLowerCase()})">${fromNft.rarity}</div>
        </div>
        <div class="upg-arrow">→</div>
        <div class="upg-box target">
          <img src="${toNft.img}" onerror="this.style.display='none'" loading="lazy">
          <div class="upg-box-name">${toNft.name}</div>
          <div class="upg-box-rarity" style="color:var(--${toNft.rarity.toLowerCase()})">${toNft.rarity}</div>
        </div>
      </div>

      <div class="spin-area">
        <div class="spin-bar-wrap">
          <div class="spin-track" id="_spin_track"></div>
          <div class="spin-pointer"></div>
        </div>
        <div class="spin-result" id="_spin_res">Нажми апгрейд — испытай удачу!</div>
      </div>

      <button class="btn-primary" id="_upg_btn" onclick="doUpgrade()">
        Апгрейд за ${fromNft.upgCost.toLocaleString()} TC
      </button>
    </div>`;

  buildTrack(fromNft, toNft);
}

function onUpgSel() {
  const v = document.getElementById('_upg_sel')?.value;
  if (v) { state.upgradeInvId = parseInt(v); renderUpgrade(); }
}

function buildTrack(fromNft, toNft) {
  const track = document.getElementById('_spin_track');
  if (!track) return;
  const segs = Array.from({length: 40}, () => Math.random() < 0.25 ? 'win' : 'lose');
  track.innerHTML = segs.map(s => `
    <div class="spin-seg ${s==='win'?'win-seg':'lose-seg'}">
      <img src="${s==='win'?toNft.img:fromNft.img}" loading="lazy" onerror="this.style.opacity='.2'">
    </div>`).join('');
  track._segs = segs;
}

async function doUpgrade() {
  if (state.spinning) return;
  const sel  = document.getElementById('_upg_sel');
  const invId = sel ? parseInt(sel.value) : state.upgradeInvId;
  const item  = state.inventory.find(i => i.inv_id === invId);
  if (!item) return;
  const fromNft = NFTS[item.nft_id];
  if (!fromNft?.upgTo) return;
  if (state.balance < fromNft.upgCost) { toast('Недостаточно T Coins', 'error'); return; }

  state.spinning = true;
  const btn = document.getElementById('_upg_btn');
  if (btn) btn.disabled = true;

  let won = false;
  try {
    const res = await apiPost('/upgrade', { inv_id: invId });
    won = res.ok === true;
    if (res.balance !== undefined) state.balance = res.balance;
    if (res.inventory) state.inventory = res.inventory;
  } catch {
    won = Math.random() < 0.25;
    state.balance -= fromNft.upgCost;
    state.inventory = state.inventory.filter(i => i.inv_id !== invId);
    if (won) state.inventory.push({ inv_id: Date.now(), nft_id: fromNft.upgTo });
  }

  const track  = document.getElementById('_spin_track');
  const result = document.getElementById('_spin_res');
  const segs   = track?._segs || [];
  const segW   = 60;
  const total  = segs.length * segW;
  const cw     = document.getElementById('screen-upgrade')?.offsetWidth / 2 || 180;
  const pool   = won ? segs.reduce((a,s,i)=>s==='win'?[...a,i]:a,[])
                     : segs.reduce((a,s,i)=>s==='lose'?[...a,i]:a,[]);
  const stopIdx = pool[Math.floor(Math.random()*pool.length)] ?? 20;
  const finalX  = -(stopIdx * segW - cw + segW / 2);

  const t0 = performance.now();
  const dur = 2800;
  function animate(now) {
    const p = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    const x = -(e * (3 * total + Math.abs(finalX))) + (finalX + 3 * total);
    track.style.transform = `translateX(${x % (-total)}px)`;
    if (p < 1) { requestAnimationFrame(animate); return; }
    track.style.transform = `translateX(${finalX}px)`;
    if (won) {
      result.textContent = `Успех! Получен ${NFTS[fromNft.upgTo].name}!`;
      result.className = 'spin-result win';
      toast('Апгрейд успешен!', 'success');
    } else {
      result.textContent = 'Неудача... NFT потерян';
      result.className = 'spin-result lose';
      toast('Апгрейд не удался', 'error');
    }
    state.spinning = false;
    renderHome();
    renderInventory();
    setTimeout(() => renderUpgrade(), 1800);
  }
  requestAnimationFrame(animate);
}

// ── DEPOSIT ───────────────────────────────────────────
function openDepositModal() {
  openModal(`
    <div class="modal-title" style="margin-bottom:6px">Пополнение</div>
    <div class="modal-desc">1 Star = 10 T Coins</div>
    <div class="deposit-grid">
      ${[10,50,100,250,500,1000].map(s => `
        <div class="dep-opt" onclick="depositStars(${s})">
          <div class="dep-stars">${s} Stars</div>
          <div class="dep-coins">${s*10} T Coins</div>
        </div>`).join('')}
    </div>
    <button class="btn-secondary" onclick="closeModal()">Отмена</button>
  `);
}

function depositStars(stars) {
  closeModal();
  if (tg) { tg.sendData(JSON.stringify({ action: 'deposit', stars })); }
  else { toast('Открой в Telegram', 'error'); }
}

// ── INIT ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderHome();
  renderMarket();
  renderInventory();
  renderUpgrade();
  loadUser();
});
