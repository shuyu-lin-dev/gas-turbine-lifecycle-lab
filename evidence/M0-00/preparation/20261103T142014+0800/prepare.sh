set -eu
gt_main=/home/lsy/workspace/lab/gas-turbine-lifecycle-lab
gt_root=/home/lsy/workspace/lab/gas-turbine-lifecycle-lab-worktrees
: "${DSH_SUPERAGENT_DIR:?missing ticket directory}"
: "${DSH_SUPERAGENT_NAME:?missing framework ticket name}"
: "${DSH_SUPERAGENT_TICKET:?missing ticket id}"
[ "${DSH_SUPERAGENT_GITHUB_REPOSITORY:-}" = shuyu-lin-dev/gas-turbine-lifecycle-lab ] || exit 60
[ "${DSH_SUPERAGENT_GITHUB_ACCOUNT:-}" = lucy-assistant ] || exit 61
[ "$(realpath "$gt_main")" = "$gt_main" ] || exit 62
[ "$(realpath "$gt_root")" = "$gt_root" ] || exit 63
[ "$(git -C "$gt_main" rev-parse --show-toplevel)" = "$gt_main" ] || exit 64
[ "$(git -C "$gt_main" remote get-url origin)" = https://github.com/shuyu-lin-dev/gas-turbine-lifecycle-lab.git ] || exit 65
case "$DSH_SUPERAGENT_NAME" in ''|.|..|*/*) exit 66;; esac
[ "$DSH_SUPERAGENT_DIR" = "$gt_root/$DSH_SUPERAGENT_NAME" ] || exit 67
[ ! -e "$DSH_SUPERAGENT_DIR" ] && [ ! -L "$DSH_SUPERAGENT_DIR" ] || exit 68
gt_ref="refs/dsh-superagent/$DSH_SUPERAGENT_TICKET"
gt_branch="agent/$DSH_SUPERAGENT_NAME"
git check-ref-format "$gt_ref"
git check-ref-format "refs/heads/$gt_branch"
gt_start="${DSH_SUPERAGENT_GITHUB_PR_HEAD:-refs/heads/main}"
git -C "$gt_main" fetch --no-tags origin "$gt_start:$gt_ref"
gt_base=$(git -C "$gt_main" rev-parse --verify "${gt_ref}^{commit}")
git -C "$gt_main" merge-base --is-ancestor dad14da1561ac609a5d14076629d1698c53b3627 "$gt_base"
git -C "$gt_main" worktree add -b "$gt_branch" "$DSH_SUPERAGENT_DIR" "$gt_base"
[ "$(git -C "$DSH_SUPERAGENT_DIR" rev-parse --show-toplevel)" = "$DSH_SUPERAGENT_DIR" ] || exit 69
[ "$(git -C "$DSH_SUPERAGENT_DIR" config user.name)" = lucy-assistant ] || exit 70
[ "$(git -C "$DSH_SUPERAGENT_DIR" config user.email)" = 162398512+lucy-assistant@users.noreply.github.com ] || exit 71
printf 'Prepared independent worktree %s on %s at committed base %s\n' "$DSH_SUPERAGENT_DIR" "$gt_branch" "$gt_base"
