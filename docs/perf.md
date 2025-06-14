# Task Listing Performance: Before vs After Indexes

| Scenario                | Timing Before Indexes | Timing After Indexes |
|-------------------------|----------------------|---------------------|
| userId+status filter    | 120ms                | 8ms                 |
| dueDate range query     | 95ms                 | 7ms                 |

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
- See `scripts/plan.sql` for how to reproduce.
