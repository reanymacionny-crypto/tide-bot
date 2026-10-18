let caseOpening = false;

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