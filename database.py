import aiosqlite
import json

DB_PATH = "tide_bot.db"

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id     INTEGER PRIMARY KEY,
                username    TEXT,
                tcoins      INTEGER DEFAULT 0,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS inventory (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id          INTEGER,
                nft_id           INTEGER,
                pending_withdraw INTEGER DEFAULT 0,
                obtained_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER,
                type        TEXT,
                amount      INTEGER,
                description TEXT,
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS bot_settings (
                key   TEXT PRIMARY KEY,
                value TEXT
            )
        """)
        # Листинги пользователей
        await db.execute("""
            CREATE TABLE IF NOT EXISTS listings (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER,
                inv_id      INTEGER,
                nft_id      INTEGER,
                price       INTEGER,
                status      TEXT DEFAULT 'active',
                listed_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sold_at     TIMESTAMP
            )
        """)
        # Сток (NFT от бота/овнера)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS stock (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                nft_id      INTEGER,
                price       INTEGER,
                seller_name TEXT DEFAULT 'STOCK',
                listed_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                active      INTEGER DEFAULT 1
            )
        """)
        await db.execute("""
            INSERT OR IGNORE INTO bot_settings (key, value) VALUES ('stars_balance', '0')
        """)
        await db.commit()

# ── ПОЛЬЗОВАТЕЛИ ─────────────────────────────────────────────────────────────

async def get_user(user_id: int) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM users WHERE user_id = ?", (user_id,)
        ) as cur:
            row = await cur.fetchone()
            return dict(row) if row else None

async def create_user(user_id: int, username: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT OR IGNORE INTO users (user_id, username) VALUES (?, ?)",
            (user_id, username)
        )
        await db.commit()

async def get_or_create_user(user_id: int, username: str) -> dict:
    user = await get_user(user_id)
    if not user:
        await create_user(user_id, username)
        user = await get_user(user_id)
    return user

async def add_tcoins(user_id: int, amount: int, description: str = ""):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE users SET tcoins = tcoins + ? WHERE user_id = ?",
            (amount, user_id)
        )
        await db.execute(
            "INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'credit', ?, ?)",
            (user_id, amount, description)
        )
        await db.commit()

async def spend_tcoins(user_id: int, amount: int, description: str = "") -> bool:
    user = await get_user(user_id)
    if not user or user["tcoins"] < amount:
        return False
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE users SET tcoins = tcoins - ? WHERE user_id = ?",
            (amount, user_id)
        )
        await db.execute(
            "INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'debit', ?, ?)",
            (user_id, amount, description)
        )
        await db.commit()
    return True

# ── ИНВЕНТАРЬ ─────────────────────────────────────────────────────────────────

async def add_nft_to_inventory(user_id: int, nft_id: int) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            "INSERT INTO inventory (user_id, nft_id) VALUES (?, ?)",
            (user_id, nft_id)
        )
        await db.commit()
        return cur.lastrowid

async def remove_nft_from_inventory(inv_id: int, user_id: int) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            "DELETE FROM inventory WHERE id = ? AND user_id = ?",
            (inv_id, user_id)
        )
        await db.commit()
        return cur.rowcount > 0

async def get_user_inventory(user_id: int) -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM inventory WHERE user_id = ? ORDER BY obtained_at DESC",
            (user_id,)
        ) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]

async def get_inv_item(inv_id: int, user_id: int) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM inventory WHERE id = ? AND user_id = ?",
            (inv_id, user_id)
        ) as cur:
            row = await cur.fetchone()
            return dict(row) if row else None

# ── ЛИСТИНГИ ──────────────────────────────────────────────────────────────────

async def create_listing(user_id: int, inv_id: int, nft_id: int, price: int) -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            "INSERT INTO listings (user_id, inv_id, nft_id, price) VALUES (?,?,?,?)",
            (user_id, inv_id, nft_id, price)
        )
        await db.commit()
        return cur.lastrowid

async def cancel_listing(listing_id: int, user_id: int) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            "UPDATE listings SET status='cancelled' WHERE id=? AND user_id=?",
            (listing_id, user_id)
        )
        await db.commit()
        return cur.rowcount > 0

async def get_user_listings(user_id: int) -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM listings WHERE user_id=? ORDER BY listed_at DESC",
            (user_id,)
        ) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]

# ── СТОК (от бота) ────────────────────────────────────────────────────────────

async def add_stock(nft_id: int, price: int, seller_name: str = "STOCK") -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            "INSERT INTO stock (nft_id, price, seller_name) VALUES (?,?,?)",
            (nft_id, price, seller_name)
        )
        await db.commit()
        return cur.lastrowid

async def get_stock() -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM stock WHERE active=1 ORDER BY listed_at DESC"
        ) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]

async def remove_stock(stock_id: int) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            "UPDATE stock SET active=0 WHERE id=?", (stock_id,)
        )
        await db.commit()
        return cur.rowcount > 0

# ── БОТ НАСТРОЙКИ ─────────────────────────────────────────────────────────────

async def get_bot_stars() -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT value FROM bot_settings WHERE key = 'stars_balance'"
        ) as cur:
            row = await cur.fetchone()
            return int(row[0]) if row else 0

async def set_bot_stars(amount: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE bot_settings SET value = ? WHERE key = 'stars_balance'",
            (str(amount),)
        )
        await db.commit()

async def add_bot_stars(amount: int):
    current = await get_bot_stars()
    await set_bot_stars(current + amount)

async def spend_bot_stars(amount: int) -> bool:
    current = await get_bot_stars()
    if current < amount:
        return False
    await set_bot_stars(current - amount)
    return True

# ── СТАТИСТИКА ────────────────────────────────────────────────────────────────

async def get_all_users_count() -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT COUNT(*) FROM users") as cur:
            row = await cur.fetchone()
            return row[0] if row else 0

async def get_total_nfts_issued() -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT COUNT(*) FROM inventory") as cur:
            row = await cur.fetchone()
            return row[0] if row else 0

async def get_all_users() -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT user_id, username, tcoins, created_at FROM users ORDER BY tcoins DESC LIMIT 100"
        ) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]

async def get_all_listings() -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            """SELECT l.*, u.username FROM listings l
               LEFT JOIN users u ON l.user_id = u.user_id
               WHERE l.status = 'active'
               ORDER BY l.listed_at DESC"""
        ) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]


# ── ПОЛЬЗОВАТЕЛИ ─────────────────────────────────────────────────────────────

async def get_user(user_id: int) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM users WHERE user_id = ?", (user_id,)
        ) as cur:
            row = await cur.fetchone()
            return dict(row) if row else None

async def create_user(user_id: int, username: str):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT OR IGNORE INTO users (user_id, username) VALUES (?, ?)",
            (user_id, username)
        )
        await db.commit()

async def get_or_create_user(user_id: int, username: str) -> dict:
    user = await get_user(user_id)
    if not user:
        await create_user(user_id, username)
        user = await get_user(user_id)
    return user

async def add_tcoins(user_id: int, amount: int, description: str = ""):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE users SET tcoins = tcoins + ? WHERE user_id = ?",
            (amount, user_id)
        )
        await db.execute(
            "INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'credit', ?, ?)",
            (user_id, amount, description)
        )
        await db.commit()

async def spend_tcoins(user_id: int, amount: int, description: str = "") -> bool:
    user = await get_user(user_id)
    if not user or user["tcoins"] < amount:
        return False
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE users SET tcoins = tcoins - ? WHERE user_id = ?",
            (amount, user_id)
        )
        await db.execute(
            "INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'debit', ?, ?)",
            (user_id, amount, description)
        )
        await db.commit()
    return True

# ── ИНВЕНТАРЬ ─────────────────────────────────────────────────────────────────

async def add_nft_to_inventory(user_id: int, nft_id: int) -> int:
    """Добавляет NFT в инвентарь, возвращает inventory.id"""
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            "INSERT INTO inventory (user_id, nft_id) VALUES (?, ?)",
            (user_id, nft_id)
        )
        await db.commit()
        return cur.lastrowid

async def remove_nft_from_inventory(inv_id: int, user_id: int) -> bool:
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute(
            "DELETE FROM inventory WHERE id = ? AND user_id = ?",
            (inv_id, user_id)
        )
        await db.commit()
        return cur.rowcount > 0

async def get_user_inventory(user_id: int) -> list:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM inventory WHERE user_id = ? ORDER BY obtained_at DESC",
            (user_id,)
        ) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]

async def get_inv_item(inv_id: int, user_id: int) -> dict | None:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM inventory WHERE id = ? AND user_id = ?",
            (inv_id, user_id)
        ) as cur:
            row = await cur.fetchone()
            return dict(row) if row else None

# ── БОТ НАСТРОЙКИ ─────────────────────────────────────────────────────────────

async def get_bot_stars() -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT value FROM bot_settings WHERE key = 'stars_balance'"
        ) as cur:
            row = await cur.fetchone()
            return int(row[0]) if row else 0

async def set_bot_stars(amount: int):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE bot_settings SET value = ? WHERE key = 'stars_balance'",
            (str(amount),)
        )
        await db.commit()

async def add_bot_stars(amount: int):
    current = await get_bot_stars()
    await set_bot_stars(current + amount)

async def spend_bot_stars(amount: int) -> bool:
    current = await get_bot_stars()
    if current < amount:
        return False
    await set_bot_stars(current - amount)
    return True

# ── СТАТИСТИКА ────────────────────────────────────────────────────────────────

async def get_all_users_count() -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT COUNT(*) FROM users") as cur:
            row = await cur.fetchone()
            return row[0] if row else 0

async def get_total_nfts_issued() -> int:
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT COUNT(*) FROM inventory") as cur:
            row = await cur.fetchone()
            return row[0] if row else 0
