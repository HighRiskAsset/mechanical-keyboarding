#!/usr/bin/env bash
# Waits for the deploy triggered by a commit and reports it in one line.
#
#   bash deploy/watch-deploy.sh [sha]      # defaults to HEAD
#
# On success it prints a single line. On failure it prints every step and its
# result, because that is the only case where the detail earns the space — a
# green run's step table says "success" eleven times and tells you nothing.
#
# Exit: 0 deployed, 1 failed or skipped, 2 gave up waiting.

set -u

REPO="HighRiskAsset/mechanical-keyboarding"
SITE="https://mechanical-keyboarding.digitalis.tech"
# Expanded, not taken as given: the head_sha filter matches only the full forty
# characters, and an abbreviated one returns zero runs rather than an error —
# which reads exactly like a deploy that has not started yet, and waits forever.
SHA="$(git rev-parse "${1:-HEAD}")"
TIMEOUT="${WATCH_TIMEOUT:-300}"
APPEAR_TIMEOUT=60
INTERVAL=10

# Unauthenticated the API allows 60 requests an hour, which one stuck watch can
# nearly exhaust. gh, if it is installed, is authenticated and allows 5000 — so
# use it when it is there without requiring it.
api() {
  if command -v gh >/dev/null 2>&1; then
    gh api "repos/$REPO/actions/$1" 2>/dev/null
  else
    curl -s "https://api.github.com/repos/$REPO/actions/$1"
  fi
}

field() { grep -m1 "\"$1\"" | sed -E 's/.*: *"?([^",]*)"?.*/\1/'; }

started=$(date +%s)
elapsed() { echo $(( $(date +%s) - started )); }

# The run does not exist the moment a push returns; wait for it to appear.
run=""
while [ -z "$run" ]; do
  run=$(api "runs?head_sha=$SHA&per_page=1" | field id)
  case "$run" in ''|*[!0-9]*) run="" ;; esac
  [ -n "$run" ] && break
  # A run appears within seconds of a push. Waiting the full timeout for one
  # that is never coming just delays the useful answer, which is usually that
  # the commit did not go anywhere a deploy watches.
  if [ "$(elapsed)" -ge "$APPEAR_TIMEOUT" ]; then
    echo "DEPLOY ? — no run for ${SHA:0:7} after ${APPEAR_TIMEOUT}s."
    echo "  Was it pushed? Only pushes to main deploy — a branch will never start one."
    exit 2
  fi
  sleep "$INTERVAL"
done

while :; do
  status=$(api "runs/$run" | field status)
  [ "$status" = "completed" ] && break
  if [ "$(elapsed)" -ge "$TIMEOUT" ]; then
    echo "DEPLOY ? — still '$status' after ${TIMEOUT}s — https://github.com/$REPO/actions/runs/$run"
    exit 2
  fi
  sleep "$INTERVAL"
done

conclusion=$(api "runs/$run" | field conclusion)

case "$conclusion" in
  success)
    echo "DEPLOY ok — $(elapsed)s — $SITE"
    ;;
  skipped)
    echo "DEPLOY skipped — the REMOTE_DIR repository variable is unset, so the job never ran"
    exit 1
    ;;
  *)
    echo "DEPLOY $conclusion — https://github.com/$REPO/actions/runs/$run"
    # The job object lists conclusion before name and the steps list name before
    # conclusion, so both orders are matched; the second substitution only runs
    # where the first did not.
    steps=$(api "runs/$run/jobs" \
      | grep -E '"(name|conclusion)":' \
      | paste - - \
      | sed -E 's/.*"name": *"([^"]+)".*"conclusion": *"?([a-z]+)"?.*/\2|\1/; t
                 s/.*"conclusion": *"?([a-z]+)"?.*"name": *"([^"]+)".*/\1|\2/')
    printf '%s\n' "$steps" | awk -F'|' 'NF==2 {printf "  %-8s %s\n", $1, $2}'
    # Named outright. Every step after the first failure reads "skipped", and
    # scanning a column for the one that is not is work the script can do.
    first=$(printf '%s\n' "$steps" | awk -F'|' '$1=="failure" && $2!="deploy" {print $2; exit}')
    [ -n "$first" ] && echo "first failure: $first"
    exit 1
    ;;
esac
