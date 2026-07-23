#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8080}"
HOST="${HOST:-127.0.0.1}"

cd "$APP_DIR"

if ! command -v python >/dev/null 2>&1; then
  echo "Установите Python в Termux: pkg install python"
  exit 1
fi

echo "vuePlantUML — локальный сервер"
echo "Папка: $APP_DIR"
echo ""
echo "1. Откройте Chrome на этом телефоне"
echo "2. Перейдите по адресу: http://${HOST}:${PORT}/install.html"
echo "3. Следуйте инструкции на странице установки PWA"
echo ""
echo "Для остановки нажмите Ctrl+C"
echo ""

exec python -m http.server "$PORT" --bind "$HOST"
