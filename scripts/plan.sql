-- EXPLAIN ANALYZE before adding indexes
EXPLAIN ANALYZE SELECT * FROM tasks WHERE user_id = 'USER_ID' AND status = 'PENDING' ORDER BY created_at DESC LIMIT 10 OFFSET 0;

-- EXPLAIN ANALYZE after adding indexes
EXPLAIN ANALYZE SELECT * FROM tasks WHERE user_id = 'USER_ID' AND status = 'PENDING' ORDER BY created_at DESC LIMIT 10 OFFSET 0;
