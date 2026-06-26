---
name: feedback-error-handling
description: Don't use try/catch in individual route handlers — use a global error handler instead
metadata:
  type: feedback
---

Don't wrap route handlers in try/catch blocks. It's repetitive and ugly. Use a centralized global error handler in `index.ts` instead.

**Why:** Express 5 automatically forwards async errors to error handlers, so per-route try/catch is unnecessary boilerplate.

**How to apply:** Write async route handlers without try/catch. Let errors bubble up to the global `(err, req, res, next)` handler registered at the bottom of `index.ts`. Only use try/catch when you need to handle an error differently than a generic 500 (e.g., the `/api/health` route that returns 503 on DB failure).
