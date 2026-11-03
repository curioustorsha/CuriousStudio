#!/bin/bash
# Runs the tracker in the background on macOS, starting automatically at login.
#
#   npm run service:install    build + register + start   → http://localhost:3000
#   npm run service:restart    rebuild after code changes + restart
#   npm run service:status     is it running?
#   npm run service:logs       follow the server log
#   npm run service:uninstall  stop and remove auto-start
set -euo pipefail

LABEL="com.curiously.tracker"
PORT="${PORT:-3000}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/curiously-tracker.log"
NODE="$(command -v node)"
DOMAIN="gui/$(id -u)"

build() {
  echo "→ Building…"
  (cd "$APP_DIR" && npm run build >/dev/null)
}

write_plist() {
  mkdir -p "$(dirname "$PLIST")" "$(dirname "$LOG")"
  cat >"$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE</string>
    <string>$APP_DIR/node_modules/next/dist/bin/next</string>
    <string>start</string>
    <string>-p</string><string>$PORT</string>
  </array>
  <key>WorkingDirectory</key><string>$APP_DIR</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>$(dirname "$NODE"):/usr/bin:/bin:/usr/sbin:/sbin</string>
    <key>NODE_ENV</key><string>production</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
EOF
}

wait_until_up() {
  for _ in $(seq 1 30); do
    if curl -s -o /dev/null "http://localhost:$PORT/login"; then
      echo "✓ Running at http://localhost:$PORT"
      return 0
    fi
    sleep 1
  done
  echo "✗ Didn't come up. Check: npm run service:logs" >&2
  return 1
}

case "${1:-}" in
  install)
    build
    write_plist
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    launchctl bootstrap "$DOMAIN" "$PLIST"
    wait_until_up
    ;;
  restart)
    build
    launchctl kickstart -k "$DOMAIN/$LABEL"
    wait_until_up
    ;;
  status)
    if launchctl print "$DOMAIN/$LABEL" >/dev/null 2>&1; then
      launchctl print "$DOMAIN/$LABEL" | grep -E "^\s*(state|pid) =" || true
      curl -s -o /dev/null -w "HTTP %{http_code} at http://localhost:$PORT\n" "http://localhost:$PORT/login" || echo "Not responding"
    else
      echo "Not installed. Run: npm run service:install"
    fi
    ;;
  logs)
    tail -n 50 -f "$LOG"
    ;;
  uninstall)
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    rm -f "$PLIST"
    echo "✓ Stopped and removed auto-start"
    ;;
  *)
    echo "Usage: $0 {install|restart|status|logs|uninstall}" >&2
    exit 1
    ;;
esac
