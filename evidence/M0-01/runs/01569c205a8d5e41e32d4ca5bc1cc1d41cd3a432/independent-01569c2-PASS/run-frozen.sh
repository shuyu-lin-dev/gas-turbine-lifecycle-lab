set -eu
review_root=$(cd "$(dirname "$0")" && pwd)
source_root=$(cd "$review_root/../.." && pwd)
clean_root="$review_root/clean-01569c2"
mkdir -p "$review_root/tmp" "$review_root/cache"
exec 3< "$review_root/tmp"
export TMPDIR="/proc/$$/fd/3"
export TMP="$TMPDIR" TEMP="$TMPDIR"
export UV_CACHE_DIR="$review_root/cache/uv"
export UV_PYTHON_INSTALL_DIR="$review_root/cache/python"
export UV_PYTHON_DOWNLOADS=never
export npm_config_cache="$review_root/cache/npm"
export XDG_CACHE_HOME="$review_root/cache/xdg"
export M0_01_UV="$source_root/.scratch-runtime/m0-01/discovery/uv-x86_64-unknown-linux-gnu/uv"
export M0_01_CHROME=/home/lsy/.agent-browser/browsers/chrome-156.0.8078.80/chrome
export LD_LIBRARY_PATH="$source_root/.scratch-runtime/m0-01/browser-deps/usr/lib/x86_64-linux-gnu"
export GH_CONFIG_DIR=/home/lsy/.config/gh-dsh-superagent-bot
unset GH_TOKEN GITHUB_TOKEN GH_ENTERPRISE_TOKEN GITHUB_ENTERPRISE_TOKEN
export PATH="/home/lsy/.local/node/bin:/home/lsy/.local/bin:$PATH"
export PYTHONDONTWRITEBYTECODE=1
{
  date --iso-8601=seconds
  ss -ltnp
  docker ps --format '{{json .}}'
  /home/lsy/.local/bin/gh-agent-bot api user --jq .login
  git -C "$source_root" status --porcelain
  git -C "$source_root" rev-parse HEAD
  git clone --no-local --no-checkout "$source_root" "$clean_root"
  git -C "$clean_root" switch --detach 01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432
  git -C "$clean_root" remote set-url origin https://github.com/shuyu-lin-dev/gas-turbine-lifecycle-lab.git
} > "$review_root/preflight-clone.log" 2>&1
cd "$clean_root"
run_scratch="$clean_root/.scratch-runtime/coordinator-m001-origin-review"
mkdir -p "$run_scratch/tmp" "$run_scratch/cache"
exec 4< "$run_scratch/tmp"
export TMPDIR="/proc/$$/fd/4"
export TMP="$TMPDIR" TEMP="$TMPDIR"
export UV_CACHE_DIR="$run_scratch/cache/uv"
export UV_PYTHON_INSTALL_DIR="$run_scratch/cache/python"
export npm_config_cache="$run_scratch/cache/npm"
export XDG_CACHE_HOME="$run_scratch/cache/xdg"
set +e
python3 scripts/verify_m0_01.py \
  --criteria 18a9210947e0114a8bbc6a10c8864701dfb8539e \
  --candidate 01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432 \
  --output .scratch-runtime/coordinator-m001-origin-review/frozen-clean --clean \
  > "$review_root/frozen-clean.log" 2>&1
run_status=$?
printf '%s\n' "$run_status" > "$review_root/frozen-clean.exit"
exit "$run_status"
