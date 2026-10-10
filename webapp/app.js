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
  // Все NFT из инвентаря — можно апгрейдить любой
  const inv = state.inventory;

  el.innerHTML = `
    <div class="upgrade-wrap">
      <div class="upgrade-title">Апгрейд</div>
      <div class="upgrade-sub">Выбери свой NFT и цель — крути колесо!</div>

      <div class="upg-panels">
        <!-- Левая: мои NFT -->
        <div class="upg-panel">
          <div class="upg-panel-title">Мой NFT</div>
          <div class="upg-panel-list" id="upg-my-list">
            ${inv.length === 0
              ? '<div class="upg-empty">Нет NFT.<br>Купи в маркете!</div>'
              : inv.map(item => {
                  const n = NFTS[item.nft_id];
                  if (!n) return '';
                  return `<div class="upg-item ${state.upgradeFrom===item.inv_id?'selected':''}"
                    onclick="selectUpgFrom(${item.inv_id}, ${item.nft_id})">
                    <img src="${n.img}" onerror="this.style.opacity='.2'" loading="lazy">
                    <div class="upg-item-name">${n.name}</div>
                    <div class="upg-item-rar" style="color:var(--${n.rarity.toLowerCase()})">${n.rarity}</div>
                  </div>`;
                }).join('')
            }
          </div>
        </div>

        <!-- Правая: цель -->
        <div class="upg-panel">
          <div class="upg-panel-title">Цель</div>
          <div class="upg-panel-list" id="upg-to-list">
            ${Object.entries(NFTS).map(([id,n]) => `
              <div class="upg-item ${state.upgradeTo===parseInt(id)?'selected':''}"
                onclick="selectUpgTo(${id})">
                <img src="${n.img}" onerror="this.style.opacity='.2'" loading="lazy">
                <div class="upg-item-name">${n.name}</div>
                <div class="upg-item-rar" style="color:var(--${n.rarity.toLowerCase()})">${n.rarity}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>

      <!-- Шанс слайдер -->
      <div class="upg-chance-row" id="upg-chance-row" style="display:none">
        <div class="upg-chance-label">Шанс победы</div>
        <div class="upg-chance-val" id="upg-chance-val">50%</div>
        <input type="range" class="upg-slider" id="upg-slider" min="5" max="95" value="50"
          oninput="onChanceChange(this.value)">
        <div class="upg-chance-info" id="upg-chance-info">Цена: —</div>
      </div>

      <!-- Колесо -->
      <div class="wheel-container" id="wheel-container" style="display:none">
        <canvas id="wheel-canvas" width="300" height="300"></canvas>
        <div class="wheel-arrow" id="wheel-arrow"></div>
        <div class="wheel-center-dot"></div>
        <div class="wheel-result" id="wheel-result"></div>
      </div>

      <button class="btn-primary" id="upg-spin-btn" style="display:none"
        onclick="spinWheel()">
        Крутить!
      </button>
    </div>`;

  if (state.upgradeFrom && state.upgradeTo) {
    updateChanceUI();
    showWheelUI();
  }
}

function selectUpgFrom(invId, nftId) {
  state.upgradeFrom   = invId;
  state.upgradeFromId = nftId;
  renderUpgrade();
}

function selectUpgTo(nftId) {
  state.upgradeTo = nftId;
  renderUpgrade();
}

function onChanceChange(val) {
  state.upgradeChance = parseInt(val);
  updateChanceUI();
  drawWheel();
}

function updateChanceUI() {
  const chance = state.upgradeChance || 50;
  const vi = document.getElementById('upg-chance-val');
  const ii = document.getElementById('upg-chance-info');
  const sl = document.getElementById('upg-slider');
  if (vi) vi.textContent = chance + '%';
  if (sl) sl.value = chance;
  if (ii) ii.textContent = 'Апгрейд бесплатный';
  state.upgradeCost = 0;
}

function showWheelUI() {
  const cr = document.getElementById('upg-chance-row');
  const wc = document.getElementById('wheel-container');
  const sb = document.getElementById('upg-spin-btn');
  if (cr) cr.style.display = 'block';
  if (wc) wc.style.display = 'block';
  if (sb) sb.style.display = 'block';
  if (!state.upgradeChance) state.upgradeChance = 50;
  updateChanceUI();
  drawWheel();
}

// ── WHEEL DRAWING ──────────────────────────────────────
function drawWheel() {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx    = canvas.getContext('2d');
  const cx     = canvas.width  / 2;
  const cy     = canvas.height / 2;
  const r      = cx - 10;
  const chance = (state.upgradeChance || 50) / 100;
  const fromNft = NFTS[state.upgradeFromId];
  const toNft   = NFTS[state.upgradeTo];

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Проигрыш (красный) — левая половина по (1-chance)
  const loseAngle = (1 - chance) * Math.PI * 2;
  const winAngle  = chance       * Math.PI * 2;
  const startRot  = -Math.PI / 2; // старт сверху (стрелка указывает вверх)

  // Сегмент проигрыша
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, startRot, startRot + loseAngle);
  ctx.closePath();
  ctx.fillStyle = '#2a0a0a';
  ctx.fill();

  // Сегмент победы
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, r, startRot + loseAngle, startRot + loseAngle + winAngle);
  ctx.closePath();
  ctx.fillStyle = '#0a2a0a';
  ctx.fill();

  // Граница
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#333350';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Разделительная линия
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(0, r);
  ctx.strokeStyle = 'rgba(255,255,255,.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Иконки NFT в сегментах
  const loseAngleMid = startRot + loseAngle / 2;
  const winAngleMid  = startRot + loseAngle + winAngle / 2;
  const dist = r * 0.58;

  function drawSegIcons() {
    // Иконка проигрыша (мой NFT)
    if (fromNft?.img) {
      const fx = cx + Math.cos(loseAngleMid) * dist - 24;
      const fy = cy + Math.sin(loseAngleMid) * dist - 24;
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(fx, fy, 48, 48, 8);
        ctx.clip();
        ctx.drawImage(img, fx, fy, 48, 48);
        ctx.restore();
      };
      img.src = fromNft.img;
    }
    // Иконка победы (цель)
    if (toNft?.img) {
      const tx = cx + Math.cos(winAngleMid) * dist - 24;
      const ty = cy + Math.sin(winAngleMid) * dist - 24;
      const img2 = new Image();
      img2.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(tx, ty, 48, 48, 8);
        ctx.clip();
        ctx.drawImage(img2, tx, ty, 48, 48);
        ctx.restore();
      };
      img2.src = toNft.img;
    }
    // % текст
    ctx.save();
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,100,100,.9)';
    ctx.fillText(
      `${Math.round((1 - chance) * 100)}%`,
      cx + Math.cos(loseAngleMid) * (r * 0.88),
      cy + Math.sin(loseAngleMid) * (r * 0.88) + 4
    );
    ctx.fillStyle = 'rgba(80,220,100,.9)';
    ctx.fillText(
      `${Math.round(chance * 100)}%`,
      cx + Math.cos(winAngleMid) * (r * 0.88),
      cy + Math.sin(winAngleMid) * (r * 0.88) + 4
    );
    ctx.restore();

    // Центральный круг
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a14';
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,168,75,.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawSegIcons();
}

// Рисуем стрелку с вращением
function drawArrow(angle) {
  const arrow = document.getElementById('wheel-arrow');
  if (!arrow) return;
  // transform-origin = left center (центр колеса)
  // angle в радианах — переводим в градусы
  const deg = (angle * 180 / Math.PI) % 360;
  arrow.style.transform = `translateY(-50%) rotate(${deg}deg)`;
}

async function spinWheel() {
  if (state.spinning) return;
  if (!state.upgradeFrom || !state.upgradeTo) {
    toast('Выбери свой NFT и цель!', 'error');
    return;
  }

  state.spinning = true;
  const btn = document.getElementById('upg-spin-btn');
  if (btn) btn.disabled = true;
  const resultEl = document.getElementById('wheel-result');
  if (resultEl) { resultEl.textContent = ''; resultEl.className = 'wheel-result'; }

  // Запрос к серверу
  let won = false;
  try {
    const res = await apiPost('/upgrade', {
      inv_id: state.upgradeFrom,
      to_id:  state.upgradeTo,
      chance: state.upgradeChance || 50,
      cost:   0,
    });
    won = res.ok === true;
    if (res.balance !== undefined) state.balance = res.balance;
    if (res.inventory) state.inventory = res.inventory;
  } catch {
    won = Math.random() * 100 < (state.upgradeChance || 50);
    state.inventory = state.inventory.filter(i => i.inv_id !== state.upgradeFrom);
    if (won) state.inventory.push({ inv_id: Date.now(), nft_id: state.upgradeTo });
  }

  const chance    = (state.upgradeChance || 50) / 100;
  const toNft     = NFTS[state.upgradeTo];
  // Зона победы: от loseAngle до 2π (относительно верха -π/2)
  const loseAngle = (1 - chance) * Math.PI * 2;

  // Стрелка крутится несколько раз + останавливается в нужной зоне
  const fullRots   = (4 + Math.floor(Math.random() * 3)) * Math.PI * 2;
  // Финальный угол в нужной зоне
  const winZoneStart  = loseAngle + 0.15;
  const winZoneEnd    = Math.PI * 2 - 0.15;
  const loseZoneStart = 0.15;
  const loseZoneEnd   = loseAngle - 0.15;

  const stopAngle = won
    ? winZoneStart  + Math.random() * (winZoneEnd  - winZoneStart)
    : loseZoneStart + Math.random() * Math.max(0.01, loseZoneEnd - loseZoneStart);

  const finalAngle = fullRots + stopAngle;
  const t0  = performance.now();
  const dur = 3800;

  function anim(now) {
    const p = Math.min((now - t0) / dur, 1);
    const e = 1 - Math.pow(1 - p, 4);
    drawArrow(e * finalAngle);
    if (p < 1) { requestAnimationFrame(anim); return; }

    drawArrow(stopAngle);
    state.spinning = false;
    if (btn) btn.disabled = false;
    if (resultEl) {
      if (won) {
        resultEl.textContent = `Победа! Получен ${toNft?.name}!`;
        resultEl.className = 'wheel-result win';
        toast('Апгрейд успешен!', 'success');
      } else {
        resultEl.textContent = 'Неудача... NFT потерян';
        resultEl.className = 'wheel-result lose';
        toast('Не повезло', 'error');
      }
    }
    state.upgradeFrom   = null;
    state.upgradeFromId = null;
    state.upgradeTo     = null;
    renderHome();
    renderInventory();
    setTimeout(() => renderUpgrade(), 2200);
  }
  requestAnimationFrame(anim);
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
