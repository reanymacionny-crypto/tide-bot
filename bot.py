import asyncio
import logging
from aiogram import Bot, Dispatcher, F
from aiogram.types import (
    Message, CallbackQuery,
    LabeledPrice, PreCheckoutQuery, SuccessfulPayment
)
from aiogram.filters import Command, CommandStart
from aiogram.utils.markdown import hbold

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
dp  = Dispatcher()

RARITY_ORDER = ["Common", "Rare", "Epic", "Legendary"]

# ── HELPERS ──────────────────────────────────────────────────────────────────

def rarity_badge(rarity: str) -> str:
    return RARITY_COLORS.get(rarity, "▪️") + " " + rarity

def nft_card(nft: dict) -> str:
    upgrade_text = ""
    if nft.get("upgrade_to"):
        up = get_nft(nft["upgrade_to"])
        if up:
            upgrade_text = f"\n⬆️ <b>Апгрейд</b> → {up['emoji']} {up['name']} ({up['rarity']}) за {nft['upgrade_cost']} {COIN_EMOJI}"
    return (
        f"{nft['emoji']} <b>{nft['name']}</b>\n"
        f"{rarity_badge(nft['rarity'])}\n\n"
        f"📝 {nft['description']}\n\n"
        f"💰 <b>Цена:</b> {nft['price']} {COIN_EMOJI} {COIN_NAME}\n"
        f"💸 <b>Вывод:</b> {nft['sell_price']} ⭐ Stars"
        f"{upgrade_text}"
    )

# ── START ─────────────────────────────────────────────────────────────────────

@dp.message(CommandStart())
async def cmd_start(msg: Message):
    user = await get_or_create_user(msg.from_user.id, msg.from_user.username or "")
    await msg.answer(
        f"👋 Добро пожаловать в <b>TIDE BOT</b>!\n\n"
        f"🪙 Твой баланс: <b>{user['tcoins']} {COIN_NAME}</b>\n\n"
        f"Здесь ты можешь:\n"
        f"🛍 Покупать NFT за {COIN_NAME}\n"
        f"⬆️ Апгрейдить NFT до более редких\n"
        f"💸 Выводить NFT за Telegram Stars ⭐\n"
        f"💰 Пополнять баланс через Stars",
        reply_markup=main_menu_kb(),
        parse_mode="HTML"
    )

@dp.callback_query(F.data == "main_menu")
async def cb_main_menu(cb: CallbackQuery):
    user = await get_or_create_user(cb.from_user.id, cb.from_user.username or "")
    await cb.message.edit_text(
        f"🏠 <b>TIDE BOT</b>\n\n"
        f"🪙 Баланс: <b>{user['tcoins']} {COIN_NAME}</b>",
        reply_markup=main_menu_kb(),
        parse_mode="HTML"
    )

# ── ПРОФИЛЬ ───────────────────────────────────────────────────────────────────

@dp.callback_query(F.data == "profile")
async def cb_profile(cb: CallbackQuery):
    user  = await get_or_create_user(cb.from_user.id, cb.from_user.username or "")
    inv   = await get_user_inventory(cb.from_user.id)
    name  = cb.from_user.full_name
    await cb.message.edit_text(
        f"👤 <b>Профиль</b>\n\n"
        f"Имя: {name}\n"
        f"ID: <code>{cb.from_user.id}</code>\n\n"
        f"🪙 <b>Баланс:</b> {user['tcoins']} {COIN_NAME}\n"
        f"🎒 <b>NFT в инвентаре:</b> {len(inv)} шт.",
        reply_markup=back_main_kb(),
        parse_mode="HTML"
    )

# ── ПОПОЛНЕНИЕ ────────────────────────────────────────────────────────────────

@dp.callback_query(F.data == "deposit")
async def cb_deposit(cb: CallbackQuery):
    await cb.message.edit_text(
        f"💰 <b>Пополнение баланса</b>\n\n"
        f"Выбери количество ⭐ Stars для пополнения.\n"
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
        # Добавляем звёзды в баланс бота для выплат
        await add_bot_stars(stars)
        user = await get_user(msg.from_user.id)
        await msg.answer(
            f"✅ <b>Баланс пополнен!</b>\n\n"
            f"Получено: <b>{tcoins} {COIN_EMOJI} {COIN_NAME}</b>\n"
            f"Текущий баланс: <b>{user['tcoins']} {COIN_NAME}</b>",
            reply_markup=main_menu_kb(),
            parse_mode="HTML"
        )

# ── МАРКЕТ ────────────────────────────────────────────────────────────────────

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
    from aiogram.types import InlineKeyboardButton

    if rarity == "All":
        items = list(NFTS.items())
    else:
        items = [(nid, nft) for nid, nft in NFTS.items() if nft["rarity"] == rarity]

    if not items:
        await cb.answer("Нет NFT в этой категории", show_alert=True)
        return

    kb = InlineKeyboardBuilder()
    for nft_id, nft in items[:20]:  # Показываем по 20
        kb.button(
            text=f"{nft['emoji']} {nft['name']} — {nft['price']} {COIN_EMOJI}",
            callback_data=f"nft_{nft_id}"
        )
    kb.adjust(1)
    kb.row(InlineKeyboardButton(text="◀ Назад", callback_data="market"))
    await cb.message.edit_text(
        f"🛍 <b>NFT — {rarity if rarity != 'All' else 'Все'}</b>\n\nВыбери NFT:",
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
    await cb.message.edit_text(
        nft_card(nft),
        reply_markup=nft_buy_kb(nft_id),
        parse_mode="HTML"
    )

@dp.callback_query(F.data.startswith("buy_"))
async def cb_buy_nft(cb: CallbackQuery):
    nft_id = int(cb.data.split("_")[1])
    nft    = get_nft(nft_id)
    if not nft:
        await cb.answer("NFT не найден", show_alert=True)
        return
    user = await get_or_create_user(cb.from_user.id, cb.from_user.username or "")
    if user["tcoins"] < nft["price"]:
        await cb.answer(
            f"❌ Недостаточно {COIN_NAME}!\nНужно: {nft['price']}, у тебя: {user['tcoins']}",
            show_alert=True
        )
        return
    # Списываем и выдаём
    ok = await spend_tcoins(cb.from_user.id, nft["price"], f"Покупка NFT #{nft_id} {nft['name']}")
    if not ok:
        await cb.answer("❌ Ошибка списания", show_alert=True)
        return
    inv_id = await add_nft_to_inventory(cb.from_user.id, nft_id)
    user   = await get_user(cb.from_user.id)
    await cb.message.edit_text(
        f"🎉 <b>NFT куплен!</b>\n\n"
        f"{nft['emoji']} <b>{nft['name']}</b> ({nft['rarity']})\n\n"
        f"🪙 Остаток: <b>{user['tcoins']} {COIN_NAME}</b>\n\n"
        f"Посмотри в 🎒 Инвентаре!",
        reply_markup=main_menu_kb(),
        parse_mode="HTML"
    )

# ── ИНВЕНТАРЬ ─────────────────────────────────────────────────────────────────

@dp.callback_query(F.data == "inventory")
async def cb_inventory(cb: CallbackQuery):
    inv = await get_user_inventory(cb.from_user.id)
    if not inv:
        await cb.message.edit_text(
            "🎒 <b>Инвентарь пустой</b>\n\nКупи NFT в маркете!",
            reply_markup=main_menu_kb(),
            parse_mode="HTML"
        )
        return

    from aiogram.utils.keyboard import InlineKeyboardBuilder
    from aiogram.types import InlineKeyboardButton

    kb = InlineKeyboardBuilder()
    for item in inv[:20]:
        nft = get_nft(item["nft_id"])
        if nft:
            kb.button(
                text=f"{nft['emoji']} {nft['name']} [{nft['rarity']}]",
                callback_data=f"inv_{item['id']}"
            )
    kb.adjust(1)
    kb.row(InlineKeyboardButton(text="🏠 Главное меню", callback_data="main_menu"))

    await cb.message.edit_text(
        f"🎒 <b>Инвентарь</b> — {len(inv)} NFT",
        reply_markup=kb.as_markup(),
        parse_mode="HTML"
    )

@dp.callback_query(F.data.startswith("inv_"))
async def cb_inv_item(cb: CallbackQuery):
    inv_id  = int(cb.data.split("_")[1])
    item    = await get_inv_item(inv_id, cb.from_user.id)
    if not item:
        await cb.answer("NFT не найден", show_alert=True)
        return
    nft = get_nft(item["nft_id"])
    if not nft:
        await cb.answer("Ошибка данных NFT", show_alert=True)
        return

    can_upgrade = bool(nft.get("upgrade_to"))
    upgrade_text = ""
    if can_upgrade:
        up = get_nft(nft["upgrade_to"])
        if up:
            upgrade_text = (
                f"\n\n⬆️ <b>Апгрейд</b> до {up['emoji']} {up['name']} ({up['rarity']})\n"
                f"Стоимость: {nft['upgrade_cost']} {COIN_EMOJI} {COIN_NAME}"
            )

    await cb.message.edit_text(
        f"{nft['emoji']} <b>{nft['name']}</b>\n"
        f"{rarity_badge(nft['rarity'])}\n\n"
        f"📝 {nft['description']}\n\n"
        f"💸 <b>Вывод:</b> {nft['sell_price']} ⭐ Stars"
        f"{upgrade_text}",
        reply_markup=inventory_item_kb(inv_id, item["nft_id"], can_upgrade),
        parse_mode="HTML"
    )

# ── ВЫВОД NFT ─────────────────────────────────────────────────────────────────

@dp.callback_query(F.data.startswith("sell_"))
async def cb_sell_nft(cb: CallbackQuery):
    inv_id = int(cb.data.split("_")[1])
    item   = await get_inv_item(inv_id, cb.from_user.id)
    if not item:
        await cb.answer("NFT не найден", show_alert=True)
        return
    nft = get_nft(item["nft_id"])
    await cb.message.edit_text(
        f"💸 <b>Вывод NFT</b>\n\n"
        f"{nft['emoji']} {nft['name']}\n\n"
        f"Ты получишь: <b>{nft['sell_price']} ⭐ Stars</b>\n\n"
        f"⚠️ NFT будет удалён из инвентаря.\nПодтвердить?",
        reply_markup=confirm_kb("sell", inv_id),
        parse_mode="HTML"
    )

@dp.callback_query(F.data.startswith("confirm_sell_"))
async def cb_confirm_sell(cb: CallbackQuery):
    inv_id = int(cb.data.split("_")[2])
    item   = await get_inv_item(inv_id, cb.from_user.id)
    if not item:
        await cb.answer("NFT не найден", show_alert=True)
        return
    nft = get_nft(item["nft_id"])

    # Проверяем звёзды бота
    bot_stars = await get_bot_stars()
    if bot_stars < nft["sell_price"]:
        await cb.message.edit_text(
            f"⏳ <b>Ожидайте пополнения звёзд в боте</b>\n\n"
            f"На данный момент нет звёзд в боте для выплаты.\n"
            f"Обратитесь к администратору или попробуйте позже.",
            reply_markup=back_main_kb(),
            parse_mode="HTML"
        )
        return

    # Списываем звёзды бота и удаляем NFT
    ok = await spend_bot_stars(nft["sell_price"])
    if not ok:
        await cb.message.edit_text(
            f"⏳ <b>Ожидайте пополнения звёзд в боте</b>\n\n"
            f"На данный момент нет звёзд в боте для выплаты.",
            reply_markup=back_main_kb(),
            parse_mode="HTML"
        )
        return

    await remove_nft_from_inventory(inv_id, cb.from_user.id)

    # Отправляем Stars пользователю через Telegram
    try:
        await bot.send_invoice(
            chat_id=cb.from_user.id,
            title="Возврат Stars",
            description=f"Вывод NFT {nft['name']}",
            payload=f"payout_{cb.from_user.id}_{inv_id}",
            currency="XTR",
            prices=[LabeledPrice(label="Stars", amount=nft["sell_price"])],
        )
        await cb.message.edit_text(
            f"✅ <b>NFT выведен!</b>\n\n"
            f"{nft['emoji']} {nft['name']} продан за <b>{nft['sell_price']} ⭐ Stars</b>",
            reply_markup=main_menu_kb(),
            parse_mode="HTML"
        )
    except Exception as e:
        # Если не удалось отправить Stars — возвращаем NFT и звёзды
        await add_nft_to_inventory(cb.from_user.id, item["nft_id"])
        await add_bot_stars(nft["sell_price"])
        await cb.message.edit_text(
            f"❌ Ошибка выплаты. NFT возвращён в инвентарь.\nОбратитесь к администратору.",
            reply_markup=back_main_kb(),
            parse_mode="HTML"
        )

# ── АПГРЕЙД ───────────────────────────────────────────────────────────────────

@dp.callback_query(F.data.startswith("upgrade_"))
async def cb_upgrade_nft(cb: CallbackQuery):
    inv_id = int(cb.data.split("_")[1])
    item   = await get_inv_item(inv_id, cb.from_user.id)
    if not item:
        await cb.answer("NFT не найден", show_alert=True)
        return
    nft = get_nft(item["nft_id"])
    if not nft.get("upgrade_to"):
        await cb.answer("Этот NFT нельзя апгрейдить", show_alert=True)
        return
    up = get_nft(nft["upgrade_to"])
    user = await get_user(cb.from_user.id)

    await cb.message.edit_text(
        f"⬆️ <b>Апгрейд NFT</b>\n\n"
        f"{nft['emoji']} {nft['name']} ({nft['rarity']})\n"
        f"       ↓\n"
        f"{up['emoji']} {up['name']} ({up['rarity']})\n\n"
        f"💰 Стоимость: <b>{nft['upgrade_cost']} {COIN_EMOJI} {COIN_NAME}</b>\n"
        f"🪙 Твой баланс: <b>{user['tcoins']} {COIN_NAME}</b>\n\n"
        f"⚠️ Текущий NFT будет заменён. Подтвердить?",
        reply_markup=confirm_kb("upgrade", inv_id),
        parse_mode="HTML"
    )

@dp.callback_query(F.data.startswith("confirm_upgrade_"))
async def cb_confirm_upgrade(cb: CallbackQuery):
    inv_id = int(cb.data.split("_")[2])
    item   = await get_inv_item(inv_id, cb.from_user.id)
    if not item:
        await cb.answer("NFT не найден", show_alert=True)
        return
    nft = get_nft(item["nft_id"])
    if not nft.get("upgrade_to"):
        await cb.answer("Нельзя апгрейдить", show_alert=True)
        return

    user = await get_user(cb.from_user.id)
    if user["tcoins"] < nft["upgrade_cost"]:
        await cb.answer(
            f"❌ Недостаточно {COIN_NAME}!\nНужно: {nft['upgrade_cost']}, у тебя: {user['tcoins']}",
            show_alert=True
        )
        return

    ok = await spend_tcoins(cb.from_user.id, nft["upgrade_cost"], f"Апгрейд NFT #{item['nft_id']}")
    if not ok:
        await cb.answer("❌ Ошибка списания", show_alert=True)
        return

    # Удаляем старый NFT, добавляем новый
    await remove_nft_from_inventory(inv_id, cb.from_user.id)
    new_nft_id = nft["upgrade_to"]
    await add_nft_to_inventory(cb.from_user.id, new_nft_id)
    new_nft = get_nft(new_nft_id)
    user    = await get_user(cb.from_user.id)

    await cb.message.edit_text(
        f"🎉 <b>Апгрейд успешен!</b>\n\n"
        f"{nft['emoji']} {nft['name']} → {new_nft['emoji']} <b>{new_nft['name']}</b>\n"
        f"Редкость: <b>{new_nft['rarity']}</b>\n\n"
        f"🪙 Остаток: <b>{user['tcoins']} {COIN_NAME}</b>",
        reply_markup=main_menu_kb(),
        parse_mode="HTML"
    )

# ── ADMIN ─────────────────────────────────────────────────────────────────────

@dp.message(Command("admin"))
async def cmd_admin(msg: Message):
    if msg.from_user.id != ADMIN_ID:
        return
    bot_stars = await get_bot_stars()
    users     = await get_all_users_count()
    nfts_out  = await get_total_nfts_issued()
    await msg.answer(
        f"👑 <b>Панель администратора</b>\n\n"
        f"👥 Пользователей: {users}\n"
        f"🎒 NFT выдано: {nfts_out}\n"
        f"⭐ Звёзд в боте: {bot_stars}\n\n"
        f"<b>Команды:</b>\n"
        f"/setbalance [stars] — установить звёзды бота\n"
        f"/addbalance [stars] — добавить звёзды боту\n"
        f"/givecoin [user_id] [amount] — дать монеты\n"
        f"/users — список пользователей",
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
    amount = int(args[1])
    await set_bot_stars(amount)
    await msg.answer(f"✅ Баланс звёзд бота установлен: {amount} ⭐")

@dp.message(Command("addbalance"))
async def cmd_addbalance(msg: Message):
    if msg.from_user.id != ADMIN_ID:
        return
    args = msg.text.split()
    if len(args) < 2:
        await msg.answer("Использование: /addbalance [кол-во]")
        return
    amount = int(args[1])
    await add_bot_stars(amount)
    total = await get_bot_stars()
    await msg.answer(f"✅ Добавлено {amount} ⭐. Итого: {total} ⭐")

@dp.message(Command("givecoin"))
async def cmd_givecoin(msg: Message):
    if msg.from_user.id != ADMIN_ID:
        return
    args = msg.text.split()
    if len(args) < 3:
        await msg.answer("Использование: /givecoin [user_id] [amount]")
        return
    uid    = int(args[1])
    amount = int(args[2])
    await add_tcoins(uid, amount, "Подарок от администратора")
    await msg.answer(f"✅ Выдано {amount} T Coins пользователю {uid}")

# ── MAIN ──────────────────────────────────────────────────────────────────────

async def main():
    await init_db()
    print("✅ TIDE BOT запущен!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
