#!/usr/bin/env bash
# 启动脚本：随机挑选一个可用端口启动后端，并让前端对接同一端口
# 用法：
#   ./run.sh            同时启动后端 + 前端（默认）
#   ./run.sh backend    只启动后端
#   ./run.sh frontend   只启动前端（使用已生成的端口文件）

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
PORT_FILE="$ROOT_DIR/.dev_port"

# 随机扫描一个可用端口：在 8100~8999 之间找一个未被监听的端口
pick_free_port() {
  local lo=8100 hi=8999
  for _ in $(seq 1 200); do
    local port=$(( lo + RANDOM % (hi - lo + 1) ))
    if (exec 3<>/dev/tcp/127.0.0.1/$port) 2>/dev/null; then
      exec 3>&- 3<&-
    else
      echo "$port"
      return 0
    fi
  done
  echo "无法在 $lo~$hi 范围内找到可用端口" >&2
  exit 1
}

start_backend() {
  local port="$1"
  echo "启动后端于端口 $port ..."
  ( cd "$BACKEND_DIR" && uv run fastapi dev app/main.py --port "$port" ) &
  echo $! > "$ROOT_DIR/.backend.pid"
}

start_frontend() {
  local port="$1"
  # 把端口写入前端开发环境文件，供 VITE_API_URL 读取
  # 联调后端模式：关闭前端本地缓存优先逻辑，强制以后端数据为准
  {
    echo "VITE_API_URL=http://localhost:${port}/api"
    echo "VITE_DISABLE_LOCAL_CACHE=true"
  } > "$FRONTEND_DIR/.env.development"
  echo "前端将通过 http://localhost:${port}/api 对接后端"
  ( cd "$FRONTEND_DIR" && npm run dev ) &
  echo $! > "$ROOT_DIR/.frontend.pid"
}

stop_all() {
  echo
  echo "收到退出信号，正在关闭服务 ..."
  [ -f "$ROOT_DIR/.backend.pid" ] && kill "$(cat "$ROOT_DIR/.backend.pid")" 2>/dev/null || true
  [ -f "$ROOT_DIR/.frontend.pid" ] && kill "$(cat "$ROOT_DIR/.frontend.pid")" 2>/dev/null || true
  rm -f "$ROOT_DIR/.backend.pid" "$ROOT_DIR/.frontend.pid" "$PORT_FILE"
  exit 0
}
trap stop_all INT TERM

CMD="${1:-all}"

if [ "$CMD" = "frontend" ]; then
  if [ ! -f "$PORT_FILE" ]; then
    echo "未找到端口文件 $PORT_FILE，请先运行 ./run.sh backend 或 ./run.sh" >&2
    exit 1
  fi
  PORT="$(cat "$PORT_FILE")"
  start_frontend "$PORT"
  wait
  exit 0
fi

PORT="$(pick_free_port)"
echo "$PORT" > "$PORT_FILE"
echo "本次分配端口：$PORT"

if [ "$CMD" = "backend" ]; then
  start_backend "$PORT"
  wait
elif [ "$CMD" = "all" ]; then
  start_backend "$PORT"
  start_frontend "$PORT"
  echo
  echo "后端: http://localhost:${PORT}/docs"
  echo "前端: http://localhost:5173 (自动对接后端端口 $PORT)"
  wait
else
  echo "未知参数：$CMD (可用: all | backend | frontend)" >&2
  exit 1
fi
