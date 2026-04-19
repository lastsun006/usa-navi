import getpass

env_path = "/Users/sugishimanaoki/Desktop/Claude Code/usa-navi-app/.env.local"

print("\n=== Access Token 設定 ===\n")
token = getpass.getpass("Access Token を貼ってください: ")
print(f"取得した文字数: {len(token)}")
print(f"最初の5文字: {token[:5]}")  # セキュリティのため5文字だけ表示

with open(env_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.startswith("LINE_CHANNEL_ACCESS_TOKEN="):
        new_lines.append(f"LINE_CHANNEL_ACCESS_TOKEN={token}\n")
    else:
        new_lines.append(line)

with open(env_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("✅ 書き込み完了！\n")
