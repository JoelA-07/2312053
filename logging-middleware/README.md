# Logging Middleware

Simple Express-style middleware for logging request method, URL, status code, response time, and errors.

The main logger function follows this format:

```js
Log(stack, level, packageName, message);
```

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
