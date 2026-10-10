import asyncio
import logging
import os
from aiogram import Bot, Dispatcher, F
from aiogram.types import (
    Message, CallbackQuery,
    LabeledPrice, PreCheckoutQuery, SuccessfulPayment,
    InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
)
from aiogram.filters import Command, CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage

from config import BOT_TOKEN, ADMIN_ID, STARS_TO_TCOINS, COIN_NAME, COIN_EMOJI
from database import (
    init_db, get_or_create_user, get_user,
    add_tcoins, spend_tcoins,
    add_nft_to_inventory, remove_nft_from_inventory,
    get_user_inventory, get_inv_item,
    get_bot_stars, spend_bot_stars, add_bot_stars,
    set_bot_stars, get_all_users_count, get_total_nfts_issued
)
from nfts import NFTS, RARITY_COLORS, get_nft
from keyboards import (
    main_menu_kb, market_filter_kb, nft_buy_kb,
    inventory_item_kb, confirm_kb, deposit_kb, back_main_kb
)

logging.basicConfig(level=logging.INFO)
bot = Bot(token=BOT_TOKEN)
dp  = Dispatcher(storage=MemoryStorage())

WEBAPP_URL = os.getenv('WEBAPP_URL', '')

# ── FSM STATES ────────────────────────────────────────────────
class AdminGift(StatesGroup):
    waiting_nft_id   = State()
    waiting_username = State()

class AdminCoin(StatesGroup):
    waiting_username = State()
    waiting_amount   = State()

# ── HELPERS ──────────────────────────────────────────────────
def rarity_badge(rarity: str) -> str:
    return RARITY_COLORS.get(rarity, "▪️") + " " + rarity

def nft_card(nft: dict) -> str:
    upgrade_text = ""
    if nft.get("upgrade_to"):
        up = get_nft(nft["upgrade_to"])
        if up:
            upgrade_text = f"\n⬆️ <b>Апгрейд</b> → {up['name']} ({up['rarity']}) за {nft['upgrade_cost']} {COIN_EMOJI}"
    return (
        f"<b>{nft['name']}</b>\n"
        f"{rarity_badge(nft['rarity'])}\n\n"
        f"📝 {nft['description']}\n\n"
        f"💰 <b>Цена:</b> {nft['price']} {COIN_EMOJI} {COIN_NAME}\n"
        f"💸 <b>Вывод:</b> {nft['sell_price']} ⭐ Stars"
        f"{upgrade_text}"
    )

async def resolve_user(username_or_id: str) -> int | None:
    """Резолвит username или ID в user_id"""
    txt = username_or_id.strip().lstrip('@')
    if txt.isdigit():
        return int(txt)
    # Ищем по username в БД
    import aiosqlite
    async with aiosqlite.connect("tide_bot.db") as db:
        async with db.execute(
            "SELECT user_id FROM users WHERE LOWER(username)=LOWER(?)", (txt,)
        ) as cur:
            row = await cur.fetchone()
            return row[0] if row else None

# ── START ─────────────────────────────────────────────────────
@dp.message(CommandStart())
async def cmd_start(msg: Message):
    user = await get_or_create_user(msg.from_user.id, msg.from_user.username or "")
    kb = None
    if WEBAPP_URL:
        kb = InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(
                text="🌊 Открыть TIDE BOT",
                web_app=WebAppInfo(url=WEBAPP_URL)
            )
        ]])
    else:
        kb = main_menu_kb()
    await msg.answer(
        f"👋 Добро пожаловать в <b>TIDE BOT</b>!\n\n"
        f"🪙 Баланс: <b>{user['tcoins']} {COIN_NAME}</b>\n\n"
        f"Нажми кнопку ниже чтобы открыть приложение 👇",
        reply_markup=kb,
        parse_mode="HTML"
    )

@dp.callback_query(F.data == "main_menu")
async def cb_main_menu(cb: CallbackQuery):
    user = await get_or_create_user(cb.from_user.id, cb.from_user.username or "")
    kb = None
    if WEBAPP_URL:
        kb = InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(
                text="🌊 Открыть TIDE BOT",
                web_app=WebAppInfo(url=WEBAPP_URL)
            )
        ]])
    else:
        kb = main_menu_kb()
    await cb.message.edit_text(
        f"🏠 <b>TIDE BOT</b>\n\n🪙 Баланс: <b>{user['tcoins']} {COIN_NAME}</b>",
        reply_markup=kb,
        parse_mode="HTML"
    )

# ── ПОПОЛНЕНИЕ ────────────────────────────────────────────────
@dp.callback_query(F.data == "deposit")
async def cb_deposit(cb: CallbackQuery):
    await cb.message.edit_text(
        f"💰 <b>Пополнение баланса</b>\n\n"
        f"Курс: <b>1 ⭐ = {STARS_TO_TCOINS} {COIN_EMOJI} {COIN_NAME}</b>",
        reply_markup=deposit_kb(),
        parse_mode="HTML"
    )

@dp.callback_query(F.data.startswith("deposit_"))
async def cb_deposit_amount(cb: CallbackQuery):
    stars = int(cb.data.split("_")[1])
    tcoins = stars * STARS_TO_TCOINS
    await bot.send_invoice(
        chat_id=cb.from_user.id,
        title=f"Пополнение {tcoins} {COIN_NAME}",
        description=f"Пополнение баланса TIDE BOT на {tcoins} {COIN_NAME}",
        payload=f"deposit_{stars}_{cb.from_user.id}",
        currency="XTR",
        prices=[LabeledPrice(label=f"{tcoins} T Coins", amount=stars)],
    )
    await cb.answer()

# Обработка данных из WebApp (пополнение через Mini App)
@dp.message(F.web_app_data)
async def web_app_data_handler(msg: Message):
    import json
    try:
        data = json.loads(msg.web_app_data.data)
        action = data.get('action')
        if action == 'deposit':
            stars = int(data.get('stars', 0))
            if stars < 1:
                await msg.answer("❌ Неверное количество Stars")
                return
            tcoins = stars * STARS_TO_TCOINS
            await bot.send_invoice(
                chat_id=msg.from_user.id,
                title=f"Пополнение {tcoins} {COIN_NAME}",
                description=f"Пополнение баланса TIDE BOT на {tcoins} {COIN_NAME}",
                payload=f"deposit_{stars}_{msg.from_user.id}",
                currency="XTR",
                prices=[LabeledPrice(label=f"{tcoins} T Coins", amount=stars)],
            )
    except Exception as e:
        logging.error(f"WebApp data error: {e}")

@dp.pre_checkout_query()
async def pre_checkout(pcq: PreCheckoutQuery):
    await pcq.answer(ok=True)

@dp.message(F.successful_payment)
async def successful_payment(msg: Message):
    payload = msg.successful_payment.invoice_payload
    parts   = payload.split("_")
    if parts[0] == "deposit":
        stars  = int(parts[1])
        tcoins = stars * STARS_TO_TCOINS
        await get_or_create_user(msg.from_user.id, msg.from_user.username or "")
        await add_tcoins(msg.from_user.id, tcoins, f"Пополнение {stars} Stars")
        await add_bot_stars(stars)
        user = await get_user(msg.from_user.id)
        kb = InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(
                text="🌊 Открыть TIDE BOT",
                web_app=WebAppInfo(url=WEBAPP_URL)
            )
        ]]) if WEBAPP_URL else main_menu_kb()
        await msg.answer(
            f"✅ <b>Баланс пополнен!</b>\n\n"
            f"Получено: <b>{tcoins} {COIN_EMOJI} {COIN_NAME}</b>\n"
            f"Текущий баланс: <b>{user['tcoins']} {COIN_NAME}</b>",
            reply_markup=kb,
            parse_mode="HTML"
        )

# ── ПРОФИЛЬ ───────────────────────────────────────────────────
@dp.callback_query(F.data == "profile")
async def cb_profile(cb: CallbackQuery):
    user = await get_or_create_user(cb.from_user.id, cb.from_user.username or "")
    inv  = await get_user_inventory(cb.from_user.id)
    await cb.message.edit_text(
        f"👤 <b>Профиль</b>\n\n"
        f"Имя: {cb.from_user.full_name}\n"
        f"ID: <code>{cb.from_user.id}</code>\n\n"
        f"🪙 <b>Баланс:</b> {user['tcoins']} {COIN_NAME}\n"
        f"🎒 <b>NFT в инвентаре:</b> {len(inv)} шт.",
        reply_markup=back_main_kb(),
        parse_mode="HTML"
    )

# ── МАРКЕТ ────────────────────────────────────────────────────
@dp.callback_query(F.data == "market")
async def cb_market(cb: CallbackQuery):
    await cb.message.edit_text(
        "🛍 <b>Маркет NFT</b>\n\nВыбери категорию:",
        reply_markup=market_filter_kb(),
        parse_mode="HTML"
    )

@dp.callback_query(F.data.startswith("market_"))
async def cb_market_filter(cb: CallbackQuery):
    rarity = cb.data.split("_", 1)[1]
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    from aiogram.types import InlineKeyboardButton as IKB

    if rarity == "All":
        items = list(NFTS.items())
    else:
        items = [(nid, nft) for nid, nft in NFTS.items() if nft["rarity"] == rarity]

    kb = InlineKeyboardBuilder()
    for nft_id, nft in items[:20]:
        kb.button(
            text=f"{nft['name']} — {nft['price']} {COIN_EMOJI}",
            callback_data=f"nft_{nft_id}"
        )
    kb.adjust(1)
    kb.row(IKB(text="◀ Назад", callback_data="market"))
    await cb.message.edit_text(
        f"🛍 <b>NFT — {rarity if rarity != 'All' else 'Все'}</b>",
        reply_markup=kb.as_markup(),
        parse_mode="HTML"
    )

@dp.callback_query(F.data.startswith("nft_"))
async def cb_nft_view(cb: CallbackQuery):
    nft_id = int(cb.data.split("_")[1])
    nft    = get_nft(nft_id)
    if not nft:
        await cb.answer("NFT не найден", show_alert=True)
        return
    await cb.message.edit_text(nft_card(nft), reply_markup=nft_buy_kb(nft_id), parse_mode="HTML")

@dp.callback_query(F.data.startswith("buy_"))
async def cb_buy_nft(cb: CallbackQuery):
    nft_id = int(cb.data.split("_")[1])
    nft    = get_nft(nft_id)
    if not nft:
        await cb.answer("NFT не найден", show_alert=True)
        return
    user = await get_or_create_user(cb.from_user.id, cb.from_user.username or "")
    if user["tcoins"] < nft["price"]:
        await cb.answer(f"❌ Нужно {nft['price']}, у тебя {user['tcoins']}", show_alert=True)
        return
    ok = await spend_tcoins(cb.from_user.id, nft["price"], f"Покупка NFT #{nft_id}")
    if not ok:
        await cb.answer("❌ Ошибка списания", show_alert=True)
        return
    await add_nft_to_inventory(cb.from_user.id, nft_id)
    user = await get_user(cb.from_user.id)
    await cb.message.edit_text(
        f"🎉 <b>NFT куплен!</b>\n\n<b>{nft['name']}</b> ({nft['rarity']})\n\n"
        f"🪙 Остаток: <b>{user['tcoins']} {COIN_NAME}</b>",
        reply_markup=main_menu_kb(),
        parse_mode="HTML"
    )

# ── ИНВЕНТАРЬ ─────────────────────────────────────────────────
@dp.callback_query(F.data == "inventory")
async def cb_inventory(cb: CallbackQuery):
    inv = await get_user_inventory(cb.from_user.id)
    if not inv:
        await cb.message.edit_text(
            "🎒 <b>Инвентарь пустой</b>",
            reply_markup=main_menu_kb(), parse_mode="HTML"
        )
        return
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    from aiogram.types import InlineKeyboardButton as IKB
    kb = InlineKeyboardBuilder()
    for item in inv[:20]:
        nft = get_nft(item["nft_id"])
        if nft:
            kb.button(
                text=f"{nft['name']} [{nft['rarity']}]",
                callback_data=f"inv_{item['id']}"
            )
    kb.adjust(1)
    kb.row(IKB(text="🏠 Главное меню", callback_data="main_menu"))
    await cb.message.edit_text(
        f"🎒 <b>Инвентарь</b> — {len(inv)} NFT",
        reply_markup=kb.as_markup(), parse_mode="HTML"
    )

@dp.callback_query(F.data.startswith("inv_"))
async def cb_inv_item(cb: CallbackQuery):
    inv_id = int(cb.data.split("_")[1])
    item   = await get_inv_item(inv_id, cb.from_user.id)
    if not item:
        await cb.answer("NFT не найден", show_alert=True)
        return
    nft = get_nft(item["nft_id"])
    can_upgrade = bool(nft.get("upgrade_to"))
    upgrade_text = ""
    if can_upgrade:
        up = get_nft(nft["upgrade_to"])
        if up:
            upgrade_text = (
                f"\n\n⬆️ <b>Апгрейд</b> до {up['name']} ({up['rarity']})\n"
                f"Стоимость: {nft['upgrade_cost']} {COIN_EMOJI}"
            )
    await cb.message.edit_text(
        f"<b>{nft['name']}</b>\n{rarity_badge(nft['rarity'])}\n\n"
        f"📝 {nft['description']}\n💸 <b>Вывод:</b> {nft['sell_price']} ⭐{upgrade_text}",
        reply_markup=inventory_item_kb(inv_id, item["nft_id"], can_upgrade),
        parse_mode="HTML"
    )

# ── ВЫВОД NFT ─────────────────────────────────────────────────
@dp.callback_query(F.data.startswith("sell_"))
async def cb_sell_nft(cb: CallbackQuery):
    inv_id = int(cb.data.split("_")[1])
    item   = await get_inv_item(inv_id, cb.from_user.id)
    if not item:
        await cb.answer("NFT не найден", show_alert=True)
        return
    nft = get_nft(item["nft_id"])
    await cb.message.edit_text(
        f"💸 <b>Вывод NFT</b>\n\n{nft['name']}\n\n"
        f"Ты получишь: <b>{nft['sell_price']} ⭐ Stars</b>\n\n⚠️ NFT будет удалён. Подтвердить?",
        reply_markup=confirm_kb("sell", inv_id), parse_mode="HTML"
    )

@dp.callback_query(F.data.startswith("confirm_sell_"))
async def cb_confirm_sell(cb: CallbackQuery):
    inv_id = int(cb.data.split("_")[2])
    item   = await get_inv_item(inv_id, cb.from_user.id)
    if not item:
        await cb.answer("NFT не найден", show_alert=True)
        return
    nft = get_nft(item["nft_id"])
    bot_stars = await get_bot_stars()
    if bot_stars < nft["sell_price"]:
        await cb.message.edit_text(
            f"⏳ <b>Ожидайте пополнения звёзд в боте</b>\n\nНа данный момент нет звёзд для выплаты.",
            reply_markup=back_main_kb(), parse_mode="HTML"
        )
        return
    ok = await spend_bot_stars(nft["sell_price"])
    if not ok:
        await cb.message.edit_text(
            "⏳ <b>Нет звёзд в боте для выплаты</b>",
            reply_markup=back_main_kb(), parse_mode="HTML"
        )
        return
    await remove_nft_from_inventory(inv_id, cb.from_user.id)
    await cb.message.edit_text(
        f"✅ <b>NFT выведен!</b>\n\n{nft['name']} продан за <b>{nft['sell_price']} ⭐ Stars</b>",
        reply_markup=main_menu_kb(), parse_mode="HTML"
    )

# ── АПГРЕЙД ───────────────────────────────────────────────────
@dp.callback_query(F.data.startswith("upgrade_"))
async def cb_upgrade_nft(cb: CallbackQuery):
    inv_id = int(cb.data.split("_")[1])
    item   = await get_inv_item(inv_id, cb.from_user.id)
    if not item:
        await cb.answer("NFT не найден", show_alert=True)
        return
    nft = get_nft(item["nft_id"])
    if not nft.get("upgrade_to"):
        await cb.answer("Нельзя апгрейдить", show_alert=True)
        return
    up   = get_nft(nft["upgrade_to"])
    user = await get_user(cb.from_user.id)
    await cb.message.edit_text(
        f"⬆️ <b>Апгрейд</b>\n\n{nft['name']} → <b>{up['name']}</b>\n\n"
        f"💰 Стоимость: <b>{nft['upgrade_cost']} {COIN_EMOJI}</b>\n"
        f"🪙 Баланс: <b>{user['tcoins']} {COIN_NAME}</b>\n\n⚠️ Подтвердить?",
        reply_markup=confirm_kb("upgrade", inv_id), parse_mode="HTML"
    )

@dp.callback_query(F.data.startswith("confirm_upgrade_"))
async def cb_confirm_upgrade(cb: CallbackQuery):
    inv_id = int(cb.data.split("_")[2])
    item   = await get_inv_item(inv_id, cb.from_user.id)
    if not item:
        await cb.answer("NFT не найден", show_alert=True)
        return
    nft  = get_nft(item["nft_id"])
    user = await get_user(cb.from_user.id)
    if user["tcoins"] < nft["upgrade_cost"]:
        await cb.answer(f"❌ Нужно {nft['upgrade_cost']}, у тебя {user['tcoins']}", show_alert=True)
        return
    ok = await spend_tcoins(cb.from_user.id, nft["upgrade_cost"], f"Апгрейд NFT #{item['nft_id']}")
    if not ok:
        await cb.answer("❌ Ошибка", show_alert=True)
        return
    await remove_nft_from_inventory(inv_id, cb.from_user.id)
    new_nft_id = nft["upgrade_to"]
    await add_nft_to_inventory(cb.from_user.id, new_nft_id)
    new_nft = get_nft(new_nft_id)
    user    = await get_user(cb.from_user.id)
    await cb.message.edit_text(
        f"🎉 <b>Апгрейд успешен!</b>\n\n{nft['name']} → <b>{new_nft['name']}</b>\n"
        f"Редкость: <b>{new_nft['rarity']}</b>\n\n🪙 Остаток: <b>{user['tcoins']} {COIN_NAME}</b>",
        reply_markup=main_menu_kb(), parse_mode="HTML"
    )

# ── ADMIN ─────────────────────────────────────────────────────

def admin_kb():
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    from aiogram.types import InlineKeyboardButton as IKB
    kb = InlineKeyboardBuilder()
    kb.row(IKB(text="🎁 Выдать NFT",      callback_data="admin_give_nft"))
    kb.row(IKB(text="🪙 Выдать монеты",   callback_data="admin_give_coin"))
    kb.row(IKB(text="⭐ Задать звёзды бота", callback_data="admin_set_stars"))
    kb.row(IKB(text="📊 Статистика",       callback_data="admin_stats"))
    return kb.as_markup()

@dp.message(Command("admin"))
async def cmd_admin(msg: Message):
    if msg.from_user.id != ADMIN_ID:
        return
    bot_stars = await get_bot_stars()
    users     = await get_all_users_count()
    nfts_out  = await get_total_nfts_issued()
    await msg.answer(
        f"👑 <b>Панель администратора</b>\n\n"
        f"👥 Пользователей: <b>{users}</b>\n"
        f"🎒 NFT выдано: <b>{nfts_out}</b>\n"
        f"⭐ Звёзд в боте: <b>{bot_stars}</b>",
        reply_markup=admin_kb(),
        parse_mode="HTML"
    )

@dp.callback_query(F.data == "admin_stats")
async def cb_admin_stats(cb: CallbackQuery):
    if cb.from_user.id != ADMIN_ID:
        return
    bot_stars = await get_bot_stars()
    users     = await get_all_users_count()
    nfts_out  = await get_total_nfts_issued()
    await cb.message.edit_text(
        f"📊 <b>Статистика</b>\n\n"
        f"👥 Пользователей: <b>{users}</b>\n"
        f"🎒 NFT выдано: <b>{nfts_out}</b>\n"
        f"⭐ Звёзд в боте: <b>{bot_stars}</b>",
        reply_markup=admin_kb(),
        parse_mode="HTML"
    )

# ── ВЫДАТЬ NFT ────────────────────────────────────────────────
@dp.callback_query(F.data == "admin_give_nft")
async def cb_admin_give_nft(cb: CallbackQuery, state: FSMContext):
    if cb.from_user.id != ADMIN_ID:
        return
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    from aiogram.types import InlineKeyboardButton as IKB
    kb = InlineKeyboardBuilder()
    for nft_id, nft in list(NFTS.items())[:30]:
        kb.button(text=f"{nft['name']} ({nft['rarity']})", callback_data=f"adm_nft_{nft_id}")
    kb.adjust(1)
    kb.row(IKB(text="◀ Назад", callback_data="admin_back"))
    await cb.message.edit_text(
        "🎁 <b>Выдать NFT</b>\n\nВыбери NFT:",
        reply_markup=kb.as_markup(),
        parse_mode="HTML"
    )
    await state.set_state(AdminGift.waiting_nft_id)

@dp.callback_query(F.data.startswith("adm_nft_"))
async def cb_adm_nft_selected(cb: CallbackQuery, state: FSMContext):
    if cb.from_user.id != ADMIN_ID:
        return
    nft_id = int(cb.data.split("_")[2])
    nft    = get_nft(nft_id)
    await state.update_data(nft_id=nft_id)
    await cb.message.edit_text(
        f"🎁 Выдаём: <b>{nft['name']}</b> ({nft['rarity']})\n\n"
        f"Введи @username или ID пользователя:",
        parse_mode="HTML"
    )
    await state.set_state(AdminGift.waiting_username)

@dp.message(AdminGift.waiting_username)
async def adm_gift_username(msg: Message, state: FSMContext):
    if msg.from_user.id != ADMIN_ID:
        return
    data   = await state.get_data()
    nft_id = data.get("nft_id")
    uid    = await resolve_user(msg.text)
    if not uid:
        await msg.answer("❌ Пользователь не найден. Он должен был писать боту хотя бы раз.")
        return
    nft = get_nft(nft_id)
    await add_nft_to_inventory(uid, nft_id)
    await state.clear()
    await msg.answer(
        f"✅ NFT <b>{nft['name']}</b> выдан пользователю <code>{uid}</code>",
        reply_markup=admin_kb(),
        parse_mode="HTML"
    )
    # Уведомляем пользователя
    try:
        await bot.send_message(
            uid,
            f"🎁 Вам выдан NFT <b>{nft['name']}</b> ({nft['rarity']})!\n"
            f"Посмотри в инвентаре.",
            parse_mode="HTML"
        )
    except Exception:
        pass

# ── ВЫДАТЬ МОНЕТЫ ─────────────────────────────────────────────
@dp.callback_query(F.data == "admin_give_coin")
async def cb_admin_give_coin(cb: CallbackQuery, state: FSMContext):
    if cb.from_user.id != ADMIN_ID:
        return
    await cb.message.edit_text(
        "🪙 <b>Выдать монеты</b>\n\nВведи @username или ID пользователя:",
        parse_mode="HTML"
    )
    await state.set_state(AdminCoin.waiting_username)

@dp.message(AdminCoin.waiting_username)
async def adm_coin_username(msg: Message, state: FSMContext):
    if msg.from_user.id != ADMIN_ID:
        return
    uid = await resolve_user(msg.text)
    if not uid:
        await msg.answer("❌ Пользователь не найден.")
        return
    await state.update_data(uid=uid)
    await msg.answer(
        f"🪙 Пользователь: <code>{uid}</code>\n\nВведи количество T Coins:",
        parse_mode="HTML"
    )
    await state.set_state(AdminCoin.waiting_amount)

@dp.message(AdminCoin.waiting_amount)
async def adm_coin_amount(msg: Message, state: FSMContext):
    if msg.from_user.id != ADMIN_ID:
        return
    if not msg.text.isdigit():
        await msg.answer("❌ Введи число")
        return
    data   = await state.get_data()
    uid    = data.get("uid")
    amount = int(msg.text)
    await add_tcoins(uid, amount, "Подарок от администратора")
    user = await get_user(uid)
    await state.clear()
    await msg.answer(
        f"✅ Выдано <b>{amount} T Coins</b> пользователю <code>{uid}</code>\n"
        f"Новый баланс: <b>{user['tcoins']} T Coins</b>",
        reply_markup=admin_kb(),
        parse_mode="HTML"
    )
    try:
        await bot.send_message(
            uid,
            f"🎁 Вам начислено <b>{amount} T Coins</b>!\n"
            f"Текущий баланс: <b>{user['tcoins']} T Coins</b>",
            parse_mode="HTML"
        )
    except Exception:
        pass

# ── ЗАДАТЬ ЗВЁЗДЫ ─────────────────────────────────────────────
@dp.callback_query(F.data == "admin_set_stars")
async def cb_admin_set_stars(cb: CallbackQuery):
    if cb.from_user.id != ADMIN_ID:
        return
    current = await get_bot_stars()
    await cb.message.edit_text(
        f"⭐ <b>Звёзды бота</b>\n\nТекущий баланс: <b>{current} ⭐</b>\n\n"
        f"Используй команды:\n"
        f"/setbalance [кол-во] — установить\n"
        f"/addbalance [кол-во] — добавить",
        reply_markup=admin_kb(),
        parse_mode="HTML"
    )

@dp.callback_query(F.data == "admin_back")
async def cb_admin_back(cb: CallbackQuery, state: FSMContext):
    if cb.from_user.id != ADMIN_ID:
        return
    await state.clear()
    bot_stars = await get_bot_stars()
    users     = await get_all_users_count()
    nfts_out  = await get_total_nfts_issued()
    await cb.message.edit_text(
        f"👑 <b>Панель администратора</b>\n\n"
        f"👥 Пользователей: <b>{users}</b>\n"
        f"🎒 NFT выдано: <b>{nfts_out}</b>\n"
        f"⭐ Звёзд в боте: <b>{bot_stars}</b>",
        reply_markup=admin_kb(),
        parse_mode="HTML"
    )

@dp.message(Command("setbalance"))
async def cmd_setbalance(msg: Message):
    if msg.from_user.id != ADMIN_ID:
        return
    args = msg.text.split()
    if len(args) < 2:
        await msg.answer("Использование: /setbalance [кол-во]")
        return
    await set_bot_stars(int(args[1]))
    await msg.answer(f"✅ Баланс звёзд бота: {args[1]} ⭐")

@dp.message(Command("addbalance"))
async def cmd_addbalance(msg: Message):
    if msg.from_user.id != ADMIN_ID:
        return
    args = msg.text.split()
    if len(args) < 2:
        await msg.answer("Использование: /addbalance [кол-во]")
        return
    await add_bot_stars(int(args[1]))
    total = await get_bot_stars()
    await msg.answer(f"✅ Добавлено {args[1]} ⭐. Итого: {total} ⭐")

# ── MAIN ──────────────────────────────────────────────────────
async def main():
    await init_db()
    print("✅ TIDE BOT запущен!")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
