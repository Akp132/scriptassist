#!/bin/bash
set -e

BASE="http://localhost:3000"
echo "ℹ️  Using base URL $BASE"

EMAIL="smoke1@example.com"
PASS="p4ss123"
NAME="Smoke User"

echo "✅  Register status:" \
$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"name\":\"$NAME\"}")

LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")

AT=$(echo "$LOGIN" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
RT=$(echo "$LOGIN" | sed -n 's/.*"refresh_token":"\([^"]*\)".*/\1/p')
USER_ID=$(echo "$LOGIN" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')

echo "✅  Logged in (user_id=$USER_ID)"

echo "✅  Refresh status:" \
$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/refresh" \
  -H "Authorization: Bearer $RT")

echo "⚡  Rate-limit burst:"
for i in {1..6}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$BASE/tasks" \
    -H "Authorization: Bearer $AT")
  echo "  Attempt $i -> $STATUS"
done

CREATE=$(curl -s -X POST "$BASE/tasks" \
  -H "Authorization: Bearer $AT" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke Test Task"}')

TASK_ID=$(echo "$CREATE" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
echo "✅  Task created ($TASK_ID)"

PATCH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/tasks/$TASK_ID" \
  -H "Authorization: Bearer $AT" \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}')
echo "✅  Owner patch status: $PATCH_STATUS"

NON_OWNER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/tasks/$TASK_ID" \
  -H "Authorization: Bearer fake-token" \
  -H "Content-Type: application/json" \
  -d '{"status":"COMPLETED"}')
echo "✅  Non-owner patch (403 expected): $NON_OWNER_STATUS"

ADM=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

AAT=$(echo "$ADM" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
echo "🔐 Admin Token: $AAT"

if [ -z "$AAT" ]; then
  echo "❌ Failed to extract admin token. Raw response:"
  echo "$ADM"
  exit 1
fi

DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/tasks/$TASK_ID" \
  -H "Authorization: Bearer $AAT")
echo "✅  Admin delete status: $DELETE_STATUS"

if command -v jq &> /dev/null; then
  echo "📖  Pagination test:"
  curl -s -X GET "$BASE/tasks?page=1&limit=2" -H "Authorization: Bearer $AT" | jq
else
  echo "⚠️  jq not installed – skipping pagination check"
fi

echo ""
echo "🎉  Smoke suite finished."
