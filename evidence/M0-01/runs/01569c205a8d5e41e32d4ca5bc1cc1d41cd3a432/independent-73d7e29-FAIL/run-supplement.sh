set -eu
review_root=$(cd "$(dirname "$0")" && pwd)
run_root="$review_root/clean-73d7e29-review"
run_scratch="$review_root/env-supplement"
mkdir -p "$run_scratch/tmp" "$run_scratch/cache"
exec 3< "$run_scratch/tmp"
export TMPDIR="/proc/$$/fd/3"
export TMP="$TMPDIR" TEMP="$TMPDIR"
export XDG_CACHE_HOME="$run_scratch/cache"
export M0_01_CHROME=/home/lsy/.agent-browser/browsers/chrome-156.0.8078.80/chrome
export LD_LIBRARY_PATH="$review_root/../m0-01/browser-deps/usr/lib/x86_64-linux-gnu"
export PATH="/home/lsy/.local/node/bin:/home/lsy/.local/bin:$PATH"
export PYTHONDONTWRITEBYTECODE=1
ss -ltnp > "$review_root/supplement-preflight.log"
set +e
node "$review_root/supplement.mjs" "$run_root" \
  "$run_root/.scratch-runtime/coordinator-m001-review/clean-01/wheel-env" \
  "$review_root/supplement" > "$review_root/supplement.log" 2>&1
run_status=$?
printf '%s\n' "$run_status" > "$review_root/supplement.exit"
exit "$run_status"
