from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder


def main_menu_kb() -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.row(
        InlineKeyboardButton(text="🛍 Маркет", callback_data="market"),
        InlineKeyboardButton(text="🎒 Инвентарь", callback_data="inventory"),
    )
    kb.row(
        InlineKeyboardButton(text="💰 Пополнить баланс", callback_data="deposit"),
        InlineKeyboardButton(text="👤 Профиль", callback_data="profile"),
    )
    return kb.as_markup()


def market_filter_kb() -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.row(
        InlineKeyboardButton(text="⬜ Common",    callback_data="market_Common"),
        InlineKeyboardButton(text="🟦 Rare",      callback_data="market_Rare"),
    )
    kb.row(
        InlineKeyboardButton(text="🟪 Epic",      callback_data="market_Epic"),
        InlineKeyboardButton(text="🟨 Legendary", callback_data="market_Legendary"),
    )
    kb.row(InlineKeyboardButton(text="📋 Все NFT", callback_data="market_All"))
    kb.row(InlineKeyboardButton(text="🏠 Главное меню", callback_data="main_menu"))
    return kb.as_markup()


def nft_buy_kb(nft_id: int) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.row(InlineKeyboardButton(text="💳 Купить", callback_data=f"buy_{nft_id}"))
    kb.row(InlineKeyboardButton(text="◀ Назад к маркету", callback_data="market"))
    return kb.as_markup()


def inventory_item_kb(inv_id: int, nft_id: int, can_upgrade: bool) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    if can_upgrade:
        kb.row(InlineKeyboardButton(text="⬆️ Апгрейд", callback_data=f"upgrade_{inv_id}"))
    kb.row(InlineKeyboardButton(text="💸 Вывести (получить ⭐)", callback_data=f"sell_{inv_id}"))
    kb.row(InlineKeyboardButton(text="◀ Назад к инвентарю", callback_data="inventory"))
    return kb.as_markup()


def confirm_kb(action: str, item_id: int) -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.row(
        InlineKeyboardButton(text="✅ Подтвердить", callback_data=f"confirm_{action}_{item_id}"),
        InlineKeyboardButton(text="❌ Отмена",       callback_data="inventory"),
    )
    return kb.as_markup()


def deposit_kb() -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    for stars in [10, 50, 100, 250, 500, 1000]:
        kb.button(text=f"⭐ {stars} Stars", callback_data=f"deposit_{stars}")
    kb.adjust(2)
    kb.row(InlineKeyboardButton(text="🏠 Главное меню", callback_data="main_menu"))
    return kb.as_markup()


def back_main_kb() -> InlineKeyboardMarkup:
    kb = InlineKeyboardBuilder()
    kb.row(InlineKeyboardButton(text="🏠 Главное меню", callback_data="main_menu"))
    return kb.as_markup()
