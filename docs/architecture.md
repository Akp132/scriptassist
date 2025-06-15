# Architecture Overview

## CQRS Rationale
- Separation of read (queries) and write (commands) logic for scalability and maintainability.
- Enables independent optimization and scaling of read/write paths.

### Read vs Write Responsibilities
- Queries: list all tasks, get task by ID
- Commands: create, update, delete, bulk complete, mark incomplete

## Security Design
- Role-based access control (RBAC) for all sensitive operations.
- JWT authentication with Redis-backed refresh token rotation for session security.

## Redis Usage
- Used for BullMQ queues (background jobs) and caching.
- Enables scalable, distributed task/job processing.

## Performance & Observability
- **Redis-backed cache** for GET /tasks (user-specific, query-aware, TTL configurable)
- **PerfLoggerInterceptor** logs REST request latency in ms (label: Perf)
- **Cache key:** `tasks:<userId>:<fullUrl>`
- TTL: 30s (default, configurable via env)
- Composite and single-column indexes on tasks for fast queries
- See `docs/perf.md` for before/after benchmarks
