const LOG_API_URL =
  process.env.LOG_API_URL || "http://4.224.186.213/evaluation-service/logs";

async function Log(stack, level, packageName, message) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (process.env.LOG_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.LOG_ACCESS_TOKEN}`;
  }

  try {
    const response = await fetch(LOG_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        stack,
        level,
        package: packageName,
        message,
      }),
    });

    if (!response.ok) {
      console.error(`Log API failed with status ${response.status}`);
    }
  } catch (error) {
    console.error(`Log API error - ${error.message}`);
  }
}

function loggingMiddleware(req, res, next) {
  const startedAt = Date.now();
  const method = req.method;
  const url = req.originalUrl || req.url;

  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    const status = res.statusCode;
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
    const message = `${method} ${url} ${status} - ${duration}ms`;

    console.log(message);
    Log("backend", level, "middleware", message);
  });

  next();
}

function errorLoggingMiddleware(err, req, res, next) {
  const method = req.method;
  const url = req.originalUrl || req.url;
  const message = err && err.message ? err.message : "Unknown error";
  const logMessage = `${method} ${url} failed - ${message}`;

  console.error(logMessage);
  Log("backend", "error", "middleware", logMessage);
  next(err);
}

module.exports = {
  Log,
  loggingMiddleware,
  errorLoggingMiddleware,
};
