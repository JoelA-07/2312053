# Logging Middleware

Simple Express-style middleware for logging request method, URL, status code, response time, and errors.

The main logger function follows this format:

```js
Log(stack, level, packageName, message);
```

Use `packageName` in JavaScript because `package` is a reserved word in some JavaScript modes. The request body still sends the key as `package`.

It sends this body to the log API:

```json
{
  "stack": "backend",
  "level": "info",
  "package": "middleware",
  "message": "GET /notifications 200 - 12ms"
}
```

Logs are sent to:

```text
http://4.224.186.213/evaluation-service/logs
```

Set the access token in an environment variable before starting the app:

```bash
LOG_ACCESS_TOKEN=your_token_here
```

For Windows PowerShell:

```powershell
$env:LOG_ACCESS_TOKEN="your_token_here"
```

The log API URL can also be changed if needed:

```bash
LOG_API_URL=http://4.224.186.213/evaluation-service/logs
```

Example:

```js
const {
  Log,
  loggingMiddleware,
  errorLoggingMiddleware,
} = require("./logging-middleware");

Log("backend", "info", "service", "Notification service started");
app.use(loggingMiddleware);
app.use(errorLoggingMiddleware);
```

The token should not be written directly in the code or committed to Git.

Allowed values:

```text
stack: backend, frontend
level: debug, info, warn, error, fatal
package: api, component, hook, page, state, style, auth, config, middleware, utils, cache, controller, cron_job, db, domain, handler, repository, route, service
```
