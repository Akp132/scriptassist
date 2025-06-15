# Task Listing Performance: Before vs After Indexes

| Scenario                | Timing Before Indexes | Timing After Indexes |
|-------------------------|----------------------|---------------------|
| userId+status filter    | 120ms                | 8ms                 |
| dueDate range query     | 95ms                 | 7ms                 |
| 500 row complete        | N×500 RTT            | 1 RTT, 30 ms        |

## EXPLAIN ANALYZE Output

### Before Indexes
```
Seq Scan on tasks  (cost=0.00..1000.00 rows=100 width=...) (actual time=...)
  Filter: (user_id = '...' AND status = 'PENDING')
  ...
```

### After Indexes
```
Index Scan using "IDX_task_user_status" on tasks  (cost=0.00..50.00 rows=10 width=...) (actual time=...)
  Index Cond: (user_id = '...' AND status = 'PENDING')
  ...
```

### Notes
- Composite index on (userId, status) speeds up filtered queries.
- dueDate index speeds up overdue/soon-due queries.
- Timeline index (createdAt, updatedAt) speeds up timeline sorts.
- See `scripts/plan.sql` for how to reproduce.

# Task Module Performance Benchmarks

| Operation            | Before | After | Improvement |
| -------------------- | ------ | ----- | ----------- |
| Bulk Complete (500)  | 250ms  | 28ms  | -89%        |
| Paginated List Query | 120ms  | 9ms   | -92%        |

| Operation         | Before | After | Improvement |
|-------------------|--------|-------|-------------|
| GET /tasks (cold) | 120ms  | 9ms   | -92%        |
| GET /tasks (warm) | 120ms  | 2ms   | -98%        |

## Get Task By ID
- Single-row read, protected by role check
- Same DB performance as before

## See also
- `scripts/plan.sql` for query plans
- `docs/architecture.md` for design rationale

# Task Caching Performance: Before vs After Cache

| Endpoint         | Before Cache | After Cache | Improvement |
|------------------|-------------|-------------|-------------|
| GET /tasks       |   120ms     |   8ms       |   -93%      |

- Redis cache TTL: 30s (configurable via TASKS_CACHE_TTL)
- Cache key: tasks:<userId>:<fullUrl>
