"""
Веб-сервер: раздаёт webapp/ и обрабатывает API запросы от Mini App
"""
from aiohttp import web
import json, os, hashlib, hmac, mimetypes
from config import BOT_TOKEN, ADMIN_ID, STARS_TO_TCOINS
from database import (
    get_or_create_user, get_user,
    add_tcoins, spend_tcoins,
    add_nft_to_inventory, remove_nft_from_inventory,
    get_user_inventory, get_inv_item,
    get_bot_stars, spend_bot_stars, add_bot_stars, set_bot_stars, init_db,
    get_all_users_count, get_total_nfts_issued, get_all_users,
    create_listing, cancel_listing, get_user_listings,
    add_stock, get_stock, remove_stock
)
from nfts import NFTS, get_nft
import random

WEBAPP_DIR = os.path.join(os.path.dirname(__file__), 'webapp')

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

def get_tg_user(request: web.Request) -> dict | None:
    init_data = request.headers.get('X-Telegram-Init-Data', '')
    if not init_data:
        return None
    return verify_init_data(init_data)

def get_user_id(request: web.Request) -> int | None:
    user = get_tg_user(request)
    return user.get('id') if user else None

# ── STATIC ────────────────────────────────────────────────────
async def handle_index(request):
    return web.FileResponse(os.path.join(WEBAPP_DIR, 'index.html'))

async def handle_file(request):
    filename = os.path.basename(request.match_info['filename'])
    path = os.path.join(WEBAPP_DIR, filename)
    if not os.path.exists(path):
        return web.Response(status=404, text='Not Found')
    mime = mimetypes.guess_type(path)[0] or 'application/octet-stream'
    with open(path, 'rb') as f:
        content = f.read()
    return web.Response(body=content, content_type=mime)

# ── /api/me ───────────────────────────────────────────────────
async def api_me(request):
    uid = get_user_id(request)
    if not uid:
        return web.json_response({'error': 'Unauthorized'}, status=401)
    user  = await get_or_create_user(uid, '')
    inv   = await get_user_inventory(uid)
    ls    = await get_user_listings(uid)
    stars = await get_bot_stars()
    return web.json_response({
        'tcoins':    user['tcoins'],
        'is_admin':  uid == ADMIN_ID,
        'inventory': [{'inv_id': i['id'], 'nft_id': i['nft_id']} for i in inv],
        'listings':  ls,
        'bot_stars': stars,
    })

# ── /api/buy ──────────────────────────────────────────────────
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
        'balance':   user['tcoins'],
        'inventory': [{'inv_id': i['id'], 'nft_id': i['nft_id']} for i in inv]
    })

# ── /api/sell ─────────────────────────────────────────────────
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
        'stars':     nft['sell_price'],
        'balance':   user['tcoins'],
        'inventory': [{'inv_id': i['id'], 'nft_id': i['nft_id']} for i in inv]
    })

# ── /api/upgrade ─────────────────────────────────────────────
async def api_upgrade(request):
    uid = get_user_id(request)
    if not uid:
        return web.json_response({'error': 'Unauthorized'}, status=401)
    data   = await request.json()
    inv_id = int(data.get('inv_id', 0))
    to_id  = int(data.get('to_id', 0))
    chance = max(5, min(95, int(data.get('chance', 50))))
    cost   = max(0, int(data.get('cost', 0)))

    item = await get_inv_item(inv_id, uid)
    if not item:
        return web.json_response({'error': 'NFT не найден'})
    to_nft = get_nft(to_id)
    if not to_nft:
        return web.json_response({'error': 'Целевой NFT не найден'})

    if cost > 0:
        user = await get_user(uid)
        if not user or user['tcoins'] < cost:
            return web.json_response({'error': 'Недостаточно T Coins'})
        await spend_tcoins(uid, cost, f'Апгрейд до NFT #{to_id}')

    await remove_nft_from_inventory(inv_id, uid)
    won = random.random() * 100 < chance
    if won:
        await add_nft_to_inventory(uid, to_id)
    user = await get_user(uid)
    inv  = await get_user_inventory(uid)
    return web.json_response({
        'ok':        won,
        'balance':   user['tcoins'],
        'inventory': [{'inv_id': i['id'], 'nft_id': i['nft_id']} for i in inv]
    })

# ── /api/list — выставить NFT на продажу ─────────────────────
async def api_list(request):
    uid = get_user_id(request)
    if not uid:
        return web.json_response({'error': 'Unauthorized'}, status=401)
    data   = await request.json()
    inv_id = int(data.get('inv_id', 0))
    price  = int(data.get('price', 0))
    if price < 1:
        return web.json_response({'error': 'Неверная цена'})
    item = await get_inv_item(inv_id, uid)
    if not item:
        return web.json_response({'error': 'NFT не найден'})
    # Проверяем лимит активных листингов
    ls = await get_user_listings(uid)
    active_count = sum(1 for l in ls if l['status'] == 'active')
    if active_count >= 5:
        return web.json_response({'error': 'Максимум 5 активных объявлений'})
    lid = await create_listing(uid, inv_id, item['nft_id'], price)
    return web.json_response({'ok': True, 'listing_id': lid})

# ── /api/unlist — снять с продажи ────────────────────────────
async def api_unlist(request):
    uid = get_user_id(request)
    if not uid:
        return web.json_response({'error': 'Unauthorized'}, status=401)
    data       = await request.json()
    listing_id = int(data.get('listing_id', 0))
    ok = await cancel_listing(listing_id, uid)
    return web.json_response({'ok': ok})

# ── /api/listings — все активные листинги ────────────────────
async def api_listings(request):
    from database import get_all_listings
    ls = await get_all_listings()
    return web.json_response({'listings': ls})

# ── /api/buy_stock — купить из стока ─────────────────────────
async def api_buy_stock(request):
    uid = get_user_id(request)
    if not uid:
        return web.json_response({'error': 'Unauthorized'}, status=401)
    data     = await request.json()
    stock_id = int(data.get('stock_id', 0))
    stock    = await get_stock()
    item     = next((s for s in stock if s['id'] == stock_id), None)
    if not item:
        return web.json_response({'error': 'NFT не найден в стоке'})
    nft = get_nft(item['nft_id'])
    if not nft:
        return web.json_response({'error': 'NFT не найден'})
    user = await get_or_create_user(uid, '')
    if user['tcoins'] < item['price']:
        return web.json_response({'error': f'Недостаточно TC. Нужно {item["price"]}'})
    ok = await spend_tcoins(uid, item['price'], f'Покупка стока NFT #{item["nft_id"]}')
    if not ok:
        return web.json_response({'error': 'Ошибка списания'})
    await remove_stock(stock_id)
    await add_nft_to_inventory(uid, item['nft_id'])
    user = await get_user(uid)
    inv  = await get_user_inventory(uid)
    return web.json_response({
        'ok': True,
        'balance':   user['tcoins'],
        'inventory': [{'inv_id': i['id'], 'nft_id': i['nft_id']} for i in inv]
    })


    stock = await get_stock()
    return web.json_response({'stock': stock})

# ── /api/withdraw_request — запросить вывод ──────────────────
async def api_withdraw_request(request):
    uid = get_user_id(request)
    if not uid:
        return web.json_response({'error': 'Unauthorized'}, status=401)
    data   = await request.json()
    inv_id = int(data.get('inv_id', 0))
    item   = await get_inv_item(inv_id, uid)
    if not item:
        return web.json_response({'error': 'NFT не найден'})
    # Помечаем в БД как pending_withdraw
    async with __import__('aiosqlite').connect('tide_bot.db') as db:
        await db.execute(
            "UPDATE inventory SET pending_withdraw=1 WHERE id=? AND user_id=?",
            (inv_id, uid)
        )
        await db.commit()
    # Уведомляем admin
    try:
        from nfts import get_nft
        nft = get_nft(item['nft_id'])
        bot_token = BOT_TOKEN
        import aiohttp as ah
        async with ah.ClientSession() as sess:
            await sess.post(
                f'https://api.telegram.org/bot{bot_token}/sendMessage',
                json={
                    'chat_id': ADMIN_ID,
                    'text': f'⭐ Запрос на вывод!\n\nПользователь: {uid}\nNFT: {nft["name"]} ({nft["rarity"]})\nStars: {nft["sell_price"]} ⭐\n\nОтправь Stars вручную!',
                    'parse_mode': 'HTML'
                }
            )
    except Exception:
        pass
    return web.json_response({'ok': True})

# ── /api/withdraw_cancel — отменить вывод ────────────────────
async def api_withdraw_cancel(request):
    uid = get_user_id(request)
    if not uid:
        return web.json_response({'error': 'Unauthorized'}, status=401)
    data   = await request.json()
    inv_id = int(data.get('inv_id', 0))
    async with __import__('aiosqlite').connect('tide_bot.db') as db:
        await db.execute(
            "UPDATE inventory SET pending_withdraw=0 WHERE id=? AND user_id=?",
            (inv_id, uid)
        )
        await db.commit()
    return web.json_response({'ok': True})


async def api_deposit_invoice(request):
    uid = get_user_id(request)
    if not uid:
        return web.json_response({'error': 'Unauthorized'}, status=401)
    data  = await request.json()
    stars = int(data.get('stars', 0))
    if stars < 1:
        return web.json_response({'error': 'Неверное количество'})

    bot_token = BOT_TOKEN
    tcoins    = stars * STARS_TO_TCOINS

    # Создаём инвойс через Telegram Bot API
    import aiohttp as ahttp
    payload = {
        'chat_id':     uid,
        'title':       f'Пополнение {tcoins} T Coins',
        'description': f'Пополнение баланса TIDE BOT на {tcoins} T Coins',
        'payload':     f'deposit_{stars}_{uid}',
        'currency':    'XTR',
        'prices':      json.dumps([{'label': f'{tcoins} T Coins', 'amount': stars}]),
    }
    async with ahttp.ClientSession() as session:
        async with session.post(
            f'https://api.telegram.org/bot{bot_token}/sendInvoice',
            json=payload
        ) as resp:
            result = await resp.json()

    if result.get('ok'):
        return web.json_response({'ok': True, 'message': 'Инвойс отправлен в чат с ботом'})
    else:
        return web.json_response({'ok': False, 'error': result.get('description', 'Ошибка')})

# ── ADMIN API ─────────────────────────────────────────────────

def require_admin(request: web.Request) -> int | None:
    uid = get_user_id(request)
    if uid != ADMIN_ID:
        return None
    return uid

async def api_admin_stats(request):
    if not require_admin(request):
        return web.json_response({'error': 'Forbidden'}, status=403)
    users    = await get_all_users_count()
    nfts_out = await get_total_nfts_issued()
    stars    = await get_bot_stars()
    return web.json_response({
        'users':    users,
        'nfts_out': nfts_out,
        'stars':    stars,
    })

async def api_admin_users(request):
    if not require_admin(request):
        return web.json_response({'error': 'Forbidden'}, status=403)
    users = await get_all_users()
    return web.json_response({'users': users})

async def api_admin_give_nft(request):
    if not require_admin(request):
        return web.json_response({'error': 'Forbidden'}, status=403)
    data   = await request.json()
    uid    = int(data.get('user_id', 0))
    nft_id = int(data.get('nft_id', 0))
    nft    = get_nft(nft_id)
    if not nft:
        return web.json_response({'error': 'NFT не найден'})
    user = await get_user(uid)
    if not user:
        return web.json_response({'error': 'Пользователь не найден'})
    await add_nft_to_inventory(uid, nft_id)
    return web.json_response({'ok': True, 'message': f'NFT {nft["name"]} выдан пользователю {uid}'})

async def api_admin_give_coins(request):
    if not require_admin(request):
        return web.json_response({'error': 'Forbidden'}, status=403)
    data   = await request.json()
    uid    = int(data.get('user_id', 0))
    amount = int(data.get('amount', 0))
    if amount < 1:
        return web.json_response({'error': 'Неверная сумма'})
    user = await get_user(uid)
    if not user:
        return web.json_response({'error': 'Пользователь не найден'})
    await add_tcoins(uid, amount, 'Подарок от администратора')
    user = await get_user(uid)
    return web.json_response({'ok': True, 'new_balance': user['tcoins']})

async def api_admin_set_stars(request):
    if not require_admin(request):
        return web.json_response({'error': 'Forbidden'}, status=403)
    data   = await request.json()
    amount = int(data.get('amount', 0))
    await set_bot_stars(amount)
    return web.json_response({'ok': True, 'stars': amount})

async def api_admin_add_stock(request):
    if not require_admin(request):
        return web.json_response({'error': 'Forbidden'}, status=403)
    data        = await request.json()
    nft_id      = int(data.get('nft_id', 0))
    price       = int(data.get('price', 0))
    seller_name = str(data.get('seller_name', 'STOCK'))
    nft = get_nft(nft_id)
    if not nft:
        return web.json_response({'error': 'NFT не найден'})
    if price < 1:
        return web.json_response({'error': 'Укажи цену'})
    sid = await add_stock(nft_id, price, seller_name)
    return web.json_response({'ok': True, 'stock_id': sid})

async def api_admin_remove_stock(request):
    if not require_admin(request):
        return web.json_response({'error': 'Forbidden'}, status=403)
    data     = await request.json()
    stock_id = int(data.get('stock_id', 0))
    ok = await remove_stock(stock_id)
    return web.json_response({'ok': ok})

# ── APP ───────────────────────────────────────────────────────
async def create_app():
    await init_db()
    app = web.Application()
    app.router.add_get('/',                          handle_index)
    # Публичные API
    app.router.add_get('/api/me',                    api_me)
    app.router.add_post('/api/buy',                  api_buy)
    app.router.add_post('/api/buy_stock',            api_buy_stock)
    app.router.add_post('/api/sell',                 api_sell)
    app.router.add_post('/api/upgrade',              api_upgrade)
    app.router.add_post('/api/list',                 api_list)
    app.router.add_post('/api/unlist',               api_unlist)
    app.router.add_get('/api/stock',                 api_stock_get)
    app.router.add_post('/api/withdraw_request',     api_withdraw_request)
    app.router.add_post('/api/withdraw_cancel',      api_withdraw_cancel)
    app.router.add_post('/api/deposit/invoice',      api_deposit_invoice)
    # Админ API
    app.router.add_get('/api/admin/stats',           api_admin_stats)
    app.router.add_get('/api/admin/users',           api_admin_users)
    app.router.add_post('/api/admin/give_nft',       api_admin_give_nft)
    app.router.add_post('/api/admin/give_coins',     api_admin_give_coins)
    app.router.add_post('/api/admin/set_stars',      api_admin_set_stars)
    app.router.add_post('/api/admin/add_stock',      api_admin_add_stock)
    app.router.add_post('/api/admin/remove_stock',   api_admin_remove_stock)
    app.router.add_get('/{filename}',                handle_file)
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
