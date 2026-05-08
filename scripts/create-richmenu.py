"""
USA Navi LINE リッチメニュー 作成スクリプト（絵文字なし・テキストのみ）
"""

import os, sys, requests
from PIL import Image, ImageDraw, ImageFont

def load_env():
    env = {}
    base = os.path.dirname(__file__)
    for fname in [".env.local", ".env.production"]:
        fpath = os.path.join(base, "..", fname)
        if not os.path.exists(fpath):
            continue
        with open(fpath) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    key = k.strip()
                    val = v.strip().strip('"').strip("'")
                    if key not in env:  # .env.local を優先
                        env[key] = val
    return env

env = load_env()
TOKEN = env.get("LINE_CHANNEL_ACCESS_TOKEN", "")
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

# ──────────────────────────────────────
# 1. 画像生成
# ──────────────────────────────────────
W, H = 2500, 1686  # 3行×3列 (高さ2倍)
COL, ROW = 3, 3
CW, CH = W // COL, H // ROW

# [アイコン文字, メインテキスト, 背景色]
BUTTONS = [
    ("MOVE",    "移動・行き方",    "#1A73E8"),
    ("FOOD",    "食事・チップ",    "#E67E22"),
    ("SPOT",    "人気スポット",    "#8E44AD"),
    ("HOTEL",   "ホテル案内",      "#27AE60"),
    ("SAFETY",  "治安チェック",    "#2C3E50"),
    ("EVENT",   "試合・お得情報",  "#C41E3A"),
    ("CALL",    "予約代行",        "#16A085"),
    ("STAFF",   "スタッフ相談",    "#2980B9"),
    ("OMIYAGE", "お土産代行",      "#D35400"),
]

img = Image.new("RGB", (W, H), "#FFFFFF")
draw = ImageDraw.Draw(img)

def get_font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc",
        "/System/Library/Fonts/ヒラギノ角ゴ ProN W6.ttc",
        "/Library/Fonts/ヒラギノ角ゴ ProN W6.otf",
        "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
        "/System/Library/Fonts/Supplemental/Arial Unicode MS.ttf",
        "/Library/Fonts/Arial Unicode MS.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()

font_icon = get_font(72, bold=True)
font_main = get_font(56, bold=True)
font_sub  = get_font(38)

for i, (icon, main, color) in enumerate(BUTTONS):
    col = i % COL
    row = i // COL
    x0, y0 = col * CW, row * CH
    x1, y1 = x0 + CW, y0 + CH
    cx, cy = x0 + CW // 2, y0 + CH // 2

    # 背景
    draw.rectangle([x0, y0, x1 - 1, y1 - 1], fill=color)

    # アイコンテキスト（上部）
    draw.text((cx, cy - 55), icon, font=font_icon, fill="white", anchor="mm")
    # メインテキスト（下部）
    draw.text((cx, cy + 45), main, font=font_main, fill="white", anchor="mm")

    # 区切り線
    if col > 0:
        draw.line([(x0, y0+10), (x0, y1-10)], fill="rgba(255,255,255,80)", width=2)
    if row > 0:
        draw.line([(x0+10, y0), (x1-10, y0)], fill="rgba(255,255,255,80)", width=2)

out_path = os.path.join(os.path.dirname(__file__), "richmenu.png")
img.save(out_path, "PNG")
print(f"✅ 画像生成: {out_path}")

# ──────────────────────────────────────
# 2. リッチメニュー作成
# ──────────────────────────────────────
ACTIONS = [
    {"type": "message",  "text": "移動・行き方"},           # MOVE
    {"type": "message",  "text": "食事・チップ"},           # FOOD
    {"type": "message",  "text": "人気スポット"},           # SPOT
    {"type": "message",  "text": "__hotel_menu"},           # HOTEL
    {"type": "location"},                                   # SAFETY → 位置情報ピッカー
    {"type": "message",  "text": "試合・お得情報"},         # INFO
    {"type": "message",  "text": "予約代行"},               # RESERVE
    {"type": "message",  "text": "スタッフに相談"},         # STAFF
    {"type": "message",  "text": "お土産代行"},             # OMIYAGE
]

areas = []
for i, action in enumerate(ACTIONS):
    col = i % COL
    row = i // COL
    areas.append({
        "bounds": {"x": col * CW, "y": row * CH, "width": CW, "height": CH},
        "action": action,
    })

menu_body = {
    "size": {"width": W, "height": H},
    "selected": True,
    "name": "SoCal Navi メインメニュー",
    "chatBarText": "SoCal Navi",
    "areas": areas,
}

res = requests.post("https://api.line.me/v2/bot/richmenu", headers=HEADERS, json=menu_body)
if res.status_code != 200:
    print(f"❌ メニュー作成失敗: {res.status_code} {res.text}")
    sys.exit(1)

rich_menu_id = res.json()["richMenuId"]
print(f"✅ リッチメニュー作成: {rich_menu_id}")

# ──────────────────────────────────────
# 3. 画像アップロード
# ──────────────────────────────────────
with open(out_path, "rb") as f:
    img_data = f.read()

upload_res = requests.post(
    f"https://api-data.line.me/v2/bot/richmenu/{rich_menu_id}/content",
    headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "image/png"},
    data=img_data,
)
if upload_res.status_code != 200:
    print(f"❌ 画像アップロード失敗: {upload_res.status_code} {upload_res.text}")
    sys.exit(1)
print("✅ 画像アップロード完了")

# ──────────────────────────────────────
# 4. デフォルト設定
# ──────────────────────────────────────
default_res = requests.post(
    f"https://api.line.me/v2/bot/user/all/richmenu/{rich_menu_id}",
    headers=HEADERS,
)
if default_res.status_code != 200:
    print(f"❌ デフォルト設定失敗: {default_res.status_code} {default_res.text}")
    sys.exit(1)

print("✅ デフォルト設定完了")
print(f"\n🎉 完成！ richMenuId: {rich_menu_id}")
