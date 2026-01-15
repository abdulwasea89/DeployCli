---
name: code-review
description: Production-grade code review for enterprise systems. Evaluates correctness, security, performance, reliability, and maintainability. Use for PR reviews, security audits, and production readiness checks.
---

# Production-Grade Code Review Skill

A comprehensive framework for reviewing code destined for production environments where reliability, security, and maintainability are critical.

## Pre-Review Checklist

Before starting the review:
- [ ] Understand the business context and requirements
- [ ] Review linked tickets, design docs, and acceptance criteria
- [ ] Check CI/CD pipeline status (tests, linters, security scans)
- [ ] Identify critical paths and high-risk areas
- [ ] Note any breaking changes or migration requirements

## Core Review Dimensions

### 1. **Correctness & Logic**

**Critical checks:**
- Does the code implement all acceptance criteria?
- Are algorithms correct and edge cases handled?
- Do state transitions follow expected workflows?
- Are race conditions and concurrency issues addressed?
- Is the code idempotent where required (retries, replays)?

**Red flags:**
- Incomplete error handling paths
- Unvalidated assumptions about data state
- Missing null/undefined checks
- Off-by-one errors in loops or pagination
- Incorrect operator precedence

**Example review:**
> [blocker] Lines 145-152: Race condition detected
> When two requests update the same resource concurrently, the last write wins without validation. This can corrupt inventory counts.
> 
> Impact: Data integrity issue in production under load.
> 
> Solution: Implement optimistic locking with version checks:
> UPDATE inventory SET quantity = ?, version = version + 1 WHERE id = ? AND version = ?

### 2. **Security & Data Protection**

**Critical checks:**
- Input validation and sanitization (prevent injection attacks)
- Authentication and authorization at all entry points
- Sensitive data handling (PII, credentials, tokens)
- Secure cryptographic practices (no weak algorithms)
- Dependency vulnerabilities (check CVE databases)
- API rate limiting and abuse prevention
- Secure defaults and principle of least privilege

**Common vulnerabilities:**
- SQL injection via string concatenation
- XSS via unescaped user input
- CSRF missing tokens
- Exposed secrets in code/logs
- Insecure direct object references
- Mass assignment vulnerabilities
- Insufficient logging for security events

### 3. **Performance & Scalability**

**Critical checks:**
- Database query efficiency (N+1, missing indexes, full table scans)
- Caching strategy for expensive operations
- Memory usage and potential leaks
- API payload size and pagination
- Async operations and blocking calls
- Resource cleanup (connections, file handles, event listeners)
- Algorithm complexity for large datasets

**Performance patterns:**
- Use connection pooling for databases
- Implement caching layers (Redis, CDN)
- Paginate large result sets
- Use bulk operations instead of loops
- Lazy load expensive resources
- Index frequently queried columns
- Consider read replicas for heavy read workloads

### 4. **Reliability & Error Handling**

**Critical checks:**
- Comprehensive error handling with proper recovery
- Graceful degradation for service failures
- Retry logic with exponential backoff
- Circuit breakers for external dependencies
- Proper transaction management and rollbacks
- Logging with correlation IDs for debugging
- Health checks and readiness probes
- Timeout configuration for all external calls

### 5. **Testing & Quality Assurance**

**Critical checks:**
- Unit tests for business logic (>80% coverage for critical paths)
- Integration tests for API contracts
- E2E tests for critical user flows
- Edge case and error path testing
- Load/stress tests for performance-critical features
- Mocks properly isolated from implementation details
- Test data doesn't leak into production

### 6. **Observability & Debugging**

**Critical checks:**
- Structured logging with appropriate levels (Info, Warn, Error)
- Metrics and monitoring for key operations (Latency, Throughput, Errors)
- Distributed tracing for microservices (Correlation IDs)
- Error tracking with stack traces and relevant context
- Audit logs for compliance requirements
- Feature flags for controlled rollouts and easy rollbacks


### 7. **Maintainability & Clean Code**

**Critical checks:**
- Does the code follow the **DRY (Don't Repeat Yourself)** principle?
- Are functions small and focused on a single responsibility?
- Is naming intuitive and descriptive?
- Is there any "dead code" (unused variables, imports)?
- Are complex business rules documented explaining the "why"?

### 8. **Deployment & Infrastructure**

**Critical checks:**
- Are database migrations additive and backward-compatible?
- Are environment variables properly defined for all stages?
- Does the service handle graceful shutdowns (SIGTERM)?
- Is there a "Circuit Breaker" for high-latency dependencies?


---

## The ROI of Production Reviews

* **Defect Detection:** Catch **60% to 90%** of defects before production.
* **Cost Savings:** Fixing a bug in production is **100x more expensive** than in development.
* **Team Velocity:** Reduces unplanned work by **20% to 30%** in the long term.