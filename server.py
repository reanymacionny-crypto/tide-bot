"""
Веб-сервер: раздаёт webapp/ и обрабатывает API запросы от Mini App
"""
from aiohttp import web
import json, os, hashlib, hmac
from config import BOT_TOKEN, STARS_TO_TCOINS
from database import (
    get_or_create_user, get_user,
    add_tcoins, spend_tcoins,
    add_nft_to_inventory, remove_nft_from_inventory,
    get_user_inventory, get_inv_item,
    get_bot_stars, spend_bot_stars, init_db
)
from nfts import NFTS, get_nft
import random

WEBAPP_DIR = os.path.join(os.path.dirname(__file__), 'webapp')

# ── VERIFY TELEGRAM INIT DATA ─────────────────────────────────
def verify_init_data(init_data: str) -> dict | None:
    try:
        from urllib.parse import unquote, parse_qsl
        vals  = dict(parse_qsl(unquote(init_data), keep_blank_values=True))
        check = vals.pop('hash', '')
        data_str = '\n'.join(f'{k}={v}' for k, v in sorted(vals.items()))
        secret = hmac.new(b'WebAppData', BOT_TOKEN.encode(), hashlib.sha256).digest()
        calc   = hmac.new(secret, data_str.encode(), hashlib.sha256).hexdigest()
        if hmac.compare_digest(calc, check):
            user = json.loads(vals.get('user', '{}'))
            return user
    except Exception:
        pass
    return None

def get_user_id(request: web.Request) -> int | None:
    init_data = request.headers.get('X-Telegram-Init-Data', '')
    if not init_data:
        return None
    user = verify_init_data(init_data)
    return user.get('id') if user else None

# ── STATIC WEBAPP ─────────────────────────────────────────────
async def handle_static(request):
    rel = str(request.rel_url).lstrip('/')
    if not rel or rel == '/':
        rel = 'index.html'
    # Убираем query string
    rel = rel.split('?')[0]
    file_path = os.path.join(WEBAPP_DIR, rel)
    if not os.path.exists(file_path):
        file_path = os.path.join(WEBAPP_DIR, 'index.html')
    return web.FileResponse(file_path)

# ── API: /api/me ──────────────────────────────────────────────
async def api_me(request):
    uid = get_user_id(request)
    if not uid:
        return web.json_response({'error': 'Unauthorized'}, status=401)
    user = await get_or_create_user(uid, '')
    inv  = await get_user_inventory(uid)
    return web.json_response({
        'tcoins': user['tcoins'],
        'inventory': [{'inv_id': i['id'], 'nft_id': i['nft_id']} for i in inv]
    })

# ── API: /api/buy ─────────────────────────────────────────────
async def api_buy(request):
    uid = get_user_id(request)
    if not uid:
        return web.json_response({'error': 'Unauthorized'}, status=401)
    data   = await request.json()
    nft_id = int(data.get('nft_id', 0))
    nft    = get_nft(nft_id)
    if not nft:
        return web.json_response({'error': 'NFT not found'})
    user = await get_or_create_user(uid, '')
    if user['tcoins'] < nft['price']:
        return web.json_response({'error': f'Недостаточно T Coins. Нужно {nft["price"]}'})
    ok = await spend_tcoins(uid, nft['price'], f'Покупка NFT #{nft_id}')
    if not ok:
        return web.json_response({'error': 'Ошибка списания'})
    await add_nft_to_inventory(uid, nft_id)
    user = await get_user(uid)
    inv  = await get_user_inventory(uid)
    return web.json_response({
        'ok': True,
        'balance': user['tcoins'],
        'inventory': [{'inv_id': i['id'], 'nft_id': i['nft_id']} for i in inv]
    })

# ── API: /api/sell ────────────────────────────────────────────
async def api_sell(request):
    uid = get_user_id(request)
    if not uid:
        return web.json_response({'error': 'Unauthorized'}, status=401)
    data   = await request.json()
    inv_id = int(data.get('inv_id', 0))
    item   = await get_inv_item(inv_id, uid)
    if not item:
        return web.json_response({'error': 'NFT не найден'})
    nft = get_nft(item['nft_id'])
    # Проверяем звёзды бота
    bot_stars = await get_bot_stars()
    if bot_stars < nft['sell_price']:
        return web.json_response({'ok': False, 'no_stars': True})
    ok = await spend_bot_stars(nft['sell_price'])
    if not ok:
        return web.json_response({'ok': False, 'no_stars': True})
    await remove_nft_from_inventory(inv_id, uid)
    user = await get_user(uid)
    inv  = await get_user_inventory(uid)
    return web.json_response({
        'ok': True,
        'stars': nft['sell_price'],
        'balance': user['tcoins'],
        'inventory': [{'inv_id': i['id'], 'nft_id': i['nft_id']} for i in inv]
    })

# ── API: /api/upgrade ─────────────────────────────────────────
async def api_upgrade(request):
    uid = get_user_id(request)
    if not uid:
        return web.json_response({'error': 'Unauthorized'}, status=401)
    data   = await request.json()
    inv_id = int(data.get('inv_id', 0))
    item   = await get_inv_item(inv_id, uid)
    if not item:
        return web.json_response({'error': 'NFT не найден'})
    nft = get_nft(item['nft_id'])
    if not nft.get('upgrade_to'):
        return web.json_response({'error': 'Нельзя апгрейдить'})
    user = await get_user(uid)
    if user['tcoins'] < nft['upgrade_cost']:
        return web.json_response({'error': 'Недостаточно T Coins'})
    await spend_tcoins(uid, nft['upgrade_cost'], f'Апгрейд NFT #{item["nft_id"]}')
    await remove_nft_from_inventory(inv_id, uid)
    # 25% шанс успеха
    won = random.random() < 0.25
    if won:
        await add_nft_to_inventory(uid, nft['upgrade_to'])
    user = await get_user(uid)
    inv  = await get_user_inventory(uid)
    return web.json_response({
        'ok': won,
        'balance': user['tcoins'],
        'inventory': [{'inv_id': i['id'], 'nft_id': i['nft_id']} for i in inv]
    })

# ── APP ───────────────────────────────────────────────────────
async def create_app():
    await init_db()
    app = web.Application()
    app.router.add_get('/api/me',       api_me)
    app.router.add_post('/api/buy',     api_buy)
    app.router.add_post('/api/sell',    api_sell)
    app.router.add_post('/api/upgrade', api_upgrade)
    app.router.add_static('/', WEBAPP_DIR, show_index=False, follow_symlinks=True, append_version=False)
    app.router.add_get('/', lambda r: web.FileResponse(os.path.join(WEBAPP_DIR, 'index.html')))
    return app

if __name__ == '__main__':
    import asyncio
    async def main():
        app = await create_app()
        runner = web.AppRunner(app)
        await runner.setup()
        port = int(os.getenv('PORT', 8080))
        site = web.TCPSite(runner, '0.0.0.0', port)
        await site.start()
        print(f'✅ Server running on port {port}')
        await asyncio.Event().wait()
    asyncio.run(main())
