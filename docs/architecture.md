# Architecture Overview

## CQRS Rationale
- Separation of read (queries) and write (commands) logic for scalability and maintainability.
- Enables independent optimization and scaling of read/write paths.

## Security Design
- Role-based access control (RBAC) for all sensitive operations.
- JWT authentication with Redis-backed refresh token rotation for session security.

## Redis Usage
- Used for BullMQ queues (background jobs) and caching.
- Enables scalable, distributed task/job processing.

## Performance Tuning
- Composite and single-column indexes on tasks for fast queries.
- See `docs/perf.md` for before/after benchmarks.
