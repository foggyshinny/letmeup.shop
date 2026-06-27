#!/bin/bash
# Claude Code on the web — SessionStart hook
# 의존성을 설치해 빌드/타입체크가 세션 시작 시 바로 동작하도록 준비합니다.
set -euo pipefail

# 원격(웹) 세션에서만 실행. 로컬 CLI 세션은 건드리지 않음.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# 컨테이너 캐시를 활용하도록 npm ci 대신 npm install 사용 (idempotent)
npm install --no-audit --no-fund
