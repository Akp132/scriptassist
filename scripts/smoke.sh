# 11. Batch complete test
if command -v jq &> /dev/null; then
  echo "\n🧪 Batch complete test (POST /tasks/batch):"
  curl -s -X POST "$BASE/tasks/batch" \
    -H "Authorization: Bearer $AT" \
    -H "Content-Type: application/json" \
    -d '{"tasks": ["'$TASK_ID'"], "action": "complete"}' | jq
else
  echo "\n🧪 Batch complete test (POST /tasks/batch):"
  curl -s -X POST "$BASE/tasks/batch" \
    -H "Authorization: Bearer $AT" \
    -H "Content-Type: application/json" \
    -d '{"tasks": ["'$TASK_ID'"], "action": "complete"}'
fi