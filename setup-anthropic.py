import getpass

env_path = "/Users/sugishimanaoki/Desktop/Claude Code/usa-navi-app/.env.local"

print("\n=== Anthropic APIキー設定 ===\n")
key = getpass.getpass("Anthropic API Keyを貼ってください: ")
print(f"取得した文字数: {len(key)}")
print(f"最初の5文字: {key[:5]}")

with open(env_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.startswith("ANTHROPIC_API_KEY="):
        new_lines.append(f"ANTHROPIC_API_KEY={key}\n")
    else:
        new_lines.append(line)

with open(env_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("✅ 設定完了！\n")
