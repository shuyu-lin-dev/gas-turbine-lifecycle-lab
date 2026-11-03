set -eu
review_root=$(cd "$(dirname "$0")" && pwd)
source_root=$(cd "$review_root/../.." && pwd)
export TMPDIR="$review_root/tmp"
export TMP="$TMPDIR" TEMP="$TMPDIR"
export GH_CONFIG_DIR=/home/lsy/.config/gh-dsh-superagent-bot
unset GH_TOKEN GITHUB_TOKEN GH_ENTERPRISE_TOKEN GITHUB_ENTERPRISE_TOKEN
export PATH="/home/lsy/.local/node/bin:/home/lsy/.local/bin:$PATH"
cd "$source_root"
gh-agent-bot api repos/shuyu-lin-dev/gas-turbine-lifecycle-lab/commits/01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432/check-runs > "$review_root/ci-check-runs.json"
gh-agent-bot api repos/shuyu-lin-dev/gas-turbine-lifecycle-lab/commits/01569c205a8d5e41e32d4ca5bc1cc1d41cd3a432/status > "$review_root/ci-status.json"
{
  date --iso-8601=seconds
  gh-agent-bot api user --jq .login
  git rev-parse HEAD
  git status --porcelain
  git ls-remote origin refs/heads/main refs/heads/agent/vue-python-runtime-810d967dfbff refs/tags/baseline/FE-BASE-ab07372aa223
  ss -ltnp
  docker ps --format '{{json .}}'
} > "$review_root/final-state.log" 2>&1
