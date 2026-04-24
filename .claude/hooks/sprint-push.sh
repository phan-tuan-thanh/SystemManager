#!/bin/bash
# Hook: Stop
# Tự động push sprint branch sau khi Claude hoàn thành /build-sprint
# Chỉ chạy nếu sprint-branch-create.sh đã set flag file

set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || { exit 0; }
FLAG_FILE="/tmp/.sprint_build_$(basename "$REPO_ROOT")"

# Không phải session sprint — bỏ qua
if [ ! -f "$FLAG_FILE" ]; then
  exit 0
fi

SPRINT_NUM=$(cat "$FLAG_FILE")
BRANCH="sprint/$SPRINT_NUM"
cd "$REPO_ROOT"
CURRENT=$(git branch --show-current)

# Không còn trên branch sprint — xóa flag và bỏ qua
if [ "$CURRENT" != "$BRANCH" ]; then
  rm -f "$FLAG_FILE"
  exit 0
fi

# Commit các thay đổi chưa commit (nếu có)
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "📦 [Sprint Hook] Uncommitted changes detected — staging and committing..."
  git add -A
  git commit -m "feat(sprint-$SPRINT_NUM): implement sprint $SPRINT_NUM tasks

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>" --quiet
fi

# Kiểm tra có commits cần push không
UPSTREAM_EXISTS=$(git ls-remote --exit-code --heads origin "$BRANCH" &>/dev/null && echo "yes" || echo "no")

if [ "$UPSTREAM_EXISTS" = "no" ]; then
  echo "📤 [Sprint Hook] Pushing new branch $BRANCH to origin..."
  git push -u origin "$BRANCH"
  echo "✅ [Sprint Hook] Branch $BRANCH pushed successfully"
else
  AHEAD=$(git rev-list --count "origin/$BRANCH..HEAD" 2>/dev/null || echo "0")
  if [ "$AHEAD" -gt 0 ]; then
    echo "📤 [Sprint Hook] Pushing $AHEAD commit(s) on $BRANCH to origin..."
    git push origin "$BRANCH"
    echo "✅ [Sprint Hook] $BRANCH pushed successfully"
  else
    echo "ℹ️  [Sprint Hook] $BRANCH is up-to-date with origin — nothing to push"
  fi
fi

rm -f "$FLAG_FILE"
