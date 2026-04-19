#!/bin/bash

ENV_FILE="/Users/sugishimanaoki/Desktop/Claude Code/usa-navi-app/.env.local"

echo ""
echo "=== Access Token 設定 ==="
echo ""

read -s -p "Access Token を貼ってください（画面には表示されません）: " TOKEN
echo ""

sed -i '' "s|LINE_CHANNEL_ACCESS_TOKEN=.*|LINE_CHANNEL_ACCESS_TOKEN=$TOKEN|" "$ENV_FILE"

echo "✅ 設定完了！"
echo ""
