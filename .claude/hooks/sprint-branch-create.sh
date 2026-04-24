#!/bin/bash
# Hook: UserPromptSubmit
# Tự động tạo branch sprint/N từ main khi user chạy /build-sprint N
# Stdin nhận JSON: { "prompt": "...", "session_id": "...", ... }

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || { exit 0; }
FLAG_FILE="/tmp/.sprint_build_$(basename "$REPO_ROOT")"

# Parse prompt từ JSON stdin
INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // ""' 2>/dev/null) || PROMPT="$INPUT"

# Chỉ xử lý lệnh /build-sprint
SPRINT_NUM=$(echo "$PROMPT" | grep -oE '/build-sprint[[:space:]]+([0-9]+)' | grep -oE '[0-9]+' | head -1)
if [ -z "$SPRINT_NUM" ]; then
  exit 0
fi

BRANCH="sprint/$SPRINT_NUM"
cd "$REPO_ROOT"
CURRENT=$(git branch --show-current)

# Lưu flag để sprint-push.sh biết cần push
echo "$SPRINT_NUM" > "$FLAG_FILE"

if [ "$CURRENT" = "$BRANCH" ]; then
  echo "ℹ️  Already on $BRANCH — skipping branch creation"
  exit 0
fi

echo "🚀 [Sprint Hook] Creating branch $BRANCH from main..."

# Stash uncommitted changes nếu có
HAS_CHANGES=$(git status --porcelain | wc -l | tr -d ' ')
if [ "$HAS_CHANGES" -gt 0 ]; then
  git stash push -m "auto-stash before sprint/$SPRINT_NUM" --quiet
  echo "   Stashed $HAS_CHANGES uncommitted change(s)"
fi

git checkout main --quiet
git pull origin main --quiet 2>/dev/null || true

# Tạo branch mới hoặc checkout nếu đã tồn tại
if git ls-remote --exit-code --heads origin "$BRANCH" &>/dev/null; then
  echo "   Branch $BRANCH already exists on remote — checking out"
  git checkout "$BRANCH" --quiet
  git pull origin "$BRANCH" --quiet 2>/dev/null || true
elif git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echo "   Branch $BRANCH exists locally — checking out"
  git checkout "$BRANCH" --quiet
else
  git checkout -b "$BRANCH" --quiet
  git push -u origin "$BRANCH" --quiet 2>/dev/null || true
  echo "   Created and pushed $BRANCH"
fi

echo "✅ [Sprint Hook] Now on branch $BRANCH"
