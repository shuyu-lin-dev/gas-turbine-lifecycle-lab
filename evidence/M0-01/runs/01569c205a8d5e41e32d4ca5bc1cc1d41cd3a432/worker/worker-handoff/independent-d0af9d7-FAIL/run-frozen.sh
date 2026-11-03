set -eu
review_root=$(cd "$(dirname "$0")" && pwd)
run_root=$1
run_name=$2
shift 2
cd "$run_root"
run_scratch="$PWD/.scratch-runtime/coordinator-m001-rereview/env-$run_name"
mkdir -p "$run_scratch/tmp" "$run_scratch/cache"
exec 3< "$run_scratch/tmp"
export TMPDIR="/proc/$$/fd/3"
export TMP="$TMPDIR" TEMP="$TMPDIR"
export UV_CACHE_DIR="$run_scratch/cache/uv"
export UV_PYTHON_INSTALL_DIR="$run_scratch/cache/python"
export UV_PYTHON_DOWNLOADS=never
export npm_config_cache="$run_scratch/cache/npm"
export XDG_CACHE_HOME="$run_scratch/cache/xdg"
export M0_01_UV="$review_root/../m0-01/discovery/uv-x86_64-unknown-linux-gnu/uv"
export M0_01_CHROME=/home/lsy/.agent-browser/browsers/chrome-156.0.8078.80/chrome
export LD_LIBRARY_PATH="$review_root/../m0-01/browser-deps/usr/lib/x86_64-linux-gnu"
export GH_CONFIG_DIR=/home/lsy/.config/gh-dsh-superagent-bot
unset GH_TOKEN GITHUB_TOKEN GH_ENTERPRISE_TOKEN GITHUB_ENTERPRISE_TOKEN
export PATH="/home/lsy/.local/node/bin:/home/lsy/.local/bin:$PATH"
export PYTHONDONTWRITEBYTECODE=1
{
  date --iso-8601=seconds
  pwd
  readlink -f "$TMPDIR"
  ss -ltnp
  docker ps --format '{{json .}}'
} > "$review_root/$run_name-preflight.log" 2>&1
set +e
python3 scripts/verify_m0_01.py \
  --criteria 18a9210947e0114a8bbc6a10c8864701dfb8539e \
  --candidate d0af9d76a459f838f6f8fb8ee656a7b60fc6c790 \
  --output ".scratch-runtime/coordinator-m001-rereview/$run_name" "$@" \
  > "$review_root/$run_name.log" 2>&1
run_status=$?
printf '%s\n' "$run_status" > "$review_root/$run_name.exit"
exit "$run_status"
